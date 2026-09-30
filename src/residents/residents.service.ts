import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { Resident } from './resident.model';
import { Branch } from '../branch/branch.model';
import { Facility } from '../facility/facility.model';
import { User } from '../users/user.model';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { encryptText, decryptText } from '../common/utils/encryption.util';
import { ResidentData } from './interfaces/resident-data.interface';
import { Role } from '../common/enums/role.enum';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { STORAGE_SERVICE } from '../storage/storage.service';
import type { StorageService } from '../storage/storage.service';
import { getUploadsSignedUrlExpirySeconds } from '../common/config/uploads.config';
import { AlertsService } from '../alerts/alerts.service';
import { GetResidentsQueryDto } from './dto/get-residents-query.dto';
import { PaginatedResidentsResult } from './dto/paginated-residents.dto';

@Injectable()
export class ResidentsService {
  constructor(
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
    @InjectModel(Branch)
    private readonly branchModel: typeof Branch,
    @InjectModel(Facility)
    private readonly facilityModel: typeof Facility,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly auditLogsService: AuditLogsService,
    @Inject(STORAGE_SERVICE) private readonly storageService: StorageService,
    private readonly alertsService: AlertsService,
  ) {}

  async create(
    createResidentDto: CreateResidentDto,
    currentUser: User,
    ipAddress?: string,
    residentPhoto?: Express.Multer.File,
  ): Promise<any> {
    this.validateCreatePermissions(currentUser);

    const branch = await this.branchModel.findByPk(createResidentDto.branchId);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const facility = await this.facilityModel.findByPk(createResidentDto.facilityId);
    if (!facility) {
      throw new BadRequestException('Facility not found');
    }

    if (branch.facilityId !== facility.id) {
      throw new BadRequestException('Branch does not belong to the selected facility');
    }

    this.validateOwnershipForCreate(currentUser, branch, facility);

    const { lastVitalsDate: _omitLastVitals, ...createDtoWithoutLastVitals } =
      createResidentDto;
    const emergencyContacts = this.normalizeEmergencyContacts(
      createResidentDto.emergencyContacts,
    );
    let residentPayload: ResidentData & { branchId: string; facilityId: string } = {
      ...createDtoWithoutLastVitals,
      emergencyContacts,
    } as ResidentData & { branchId: string; facilityId: string };
    if (residentPhoto?.buffer) {
      const { publicId } = await this.storageService.upload(
        residentPhoto.buffer,
        residentPhoto.originalname,
        residentPhoto.mimetype,
      );
      residentPayload = { ...residentPayload, photoPublicId: publicId };
    }
    const encryptedData = encryptText(JSON.stringify(residentPayload));
    const resident = await this.sequelize.transaction(async (transaction: Transaction) => {
      const beforeUtilization = this.computeUtilizationPercent(
        branch.currentResidents,
        branch.residentLimit,
      );
      const resident = await this.residentModel.create(
        {
          branchId: createResidentDto.branchId,
          facilityId: createResidentDto.facilityId,
          encryptedData,
        },
        { transaction },
      );

      branch.currentResidents += 1;
      facility.totalResidents += 1;

      await Promise.all([
        branch.save({ transaction }),
        facility.save({ transaction }),
      ]);

      const afterUtilization = this.computeUtilizationPercent(
        branch.currentResidents,
        branch.residentLimit,
      );
      if (afterUtilization >= 90) {
        await this.alertsService.createFromBranchHighUtilization(
          {
            facilityId: branch.facilityId,
            branchId: branch.id,
            branchName: branch.name,
            residentLimit: branch.residentLimit,
            currentResidents: branch.currentResidents,
            utilizationPercent: afterUtilization,
          },
          transaction,
        );
      }

      return resident;
    });

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const residentName = [
      createResidentDto.firstName,
      createResidentDto.middleName,
      createResidentDto.lastName,
    ]
      .filter(Boolean)
      .join(' ');

    if (currentUser.role !== Role.OWNER) {
      await this.auditLogsService.create({
        facilityId: resident.facilityId,
        branchId: resident.branchId,
        user: actorName,
        action: 'Resident Added',
        details: `Added new resident ${residentName}`,
        ipAddress: ipAddress ?? null,
      });
    }

    return this.buildResidentResponse(resident);
  }

  async findAll(
    currentUser: User,
    query: GetResidentsQueryDto = {},
  ): Promise<PaginatedResidentsResult> {
    const whereClause = { ...this.buildWhereClause(currentUser) };

    const branchId = query.branchId?.trim();
    if (branchId && branchId !== 'All') {
      whereClause.branchId = branchId;
    }

    const residents = await this.residentModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    const allResidents = await Promise.all(
      residents.map((resident) => this.buildResidentResponse(resident)),
    );

    const filtered = this.applyResidentFilters(allResidents, query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  private applyResidentFilters(
    residents: Record<string, unknown>[],
    query: GetResidentsQueryDto,
  ): Record<string, unknown>[] {
    const search = query.search?.trim().toLowerCase();
    const status = query.status?.trim();
    const healthState = query.healthState?.trim();

    return residents.filter((resident) => {
      if (status && status !== 'All' && resident.status !== status) {
        return false;
      }

      if (
        healthState &&
        healthState !== 'All' &&
        resident.healthState !== healthState
      ) {
        return false;
      }

      if (!search) {
        return true;
      }

      const firstName = String(resident.firstName ?? '').toLowerCase();
      const middleName = String(resident.middleName ?? '').toLowerCase();
      const lastName = String(resident.lastName ?? '').toLowerCase();
      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
      const room = String(resident.room ?? '').toLowerCase();

      return fullName.includes(search) || room.includes(search);
    });
  }

  async findOne(id: string, currentUser: User): Promise<any> {
    const resident = await this.residentModel.findByPk(id);
    if (!resident) {
      return null;
    }

    this.ensureViewPermission(resident, currentUser);
    return this.buildResidentResponse(resident);
  }

  async update(
    id: string,
    updateResidentDto: UpdateResidentDto,
    currentUser: User,
    residentPhoto?: Express.Multer.File,
  ): Promise<any> {
    const resident = await this.residentModel.findByPk(id);
    if (!resident) {
      throw new BadRequestException('Resident not found');
    }

    if (!this.canManageResident(currentUser, resident)) {
      throw new ForbiddenException('Insufficient permissions to update resident');
    }

    const oldBranch = await this.branchModel.findByPk(resident.branchId);
    const oldFacility = await this.facilityModel.findByPk(resident.facilityId);

    let branch = oldBranch;
    let facility = oldFacility;

    if (updateResidentDto.branchId) {
      branch = await this.branchModel.findByPk(updateResidentDto.branchId);
      if (!branch) {
        throw new BadRequestException('Branch not found');
      }
    }

    if (updateResidentDto.facilityId) {
      facility = await this.facilityModel.findByPk(updateResidentDto.facilityId);
      if (!facility) {
        throw new BadRequestException('Facility not found');
      }
    }

    if (branch && facility && branch.facilityId !== facility.id) {
      throw new BadRequestException('Branch does not belong to the selected facility');
    }

    const currentData = this.decryptResidentData(resident.encryptedData);
    const updatePayload = Object.fromEntries(
      Object.entries(updateResidentDto as Record<string, unknown>).filter(([, value]) => value !== undefined),
    ) as Partial<ResidentData>;

    if (residentPhoto?.buffer) {
      const { publicId } = await this.storageService.upload(
        residentPhoto.buffer,
        residentPhoto.originalname,
        residentPhoto.mimetype,
      );
      updatePayload.photoPublicId = publicId;
    }
    const mergedData = {
      ...currentData,
      ...updatePayload,
      ...(updatePayload.emergencyContacts !== undefined
        ? {
            emergencyContacts: this.normalizeEmergencyContacts(
              updatePayload.emergencyContacts,
            ),
          }
        : {}),
    } as ResidentData;

    return this.sequelize.transaction(async (transaction: Transaction) => {
      const oldBeforeUtilization = oldBranch
        ? this.computeUtilizationPercent(oldBranch.currentResidents, oldBranch.residentLimit)
        : 0;
      const newBeforeUtilization =
        branch && (!oldBranch || branch.id !== oldBranch.id)
          ? this.computeUtilizationPercent(branch.currentResidents, branch.residentLimit)
          : 0;

      if (branch && oldBranch && branch.id !== oldBranch.id) {
        oldBranch.currentResidents = Math.max(0, oldBranch.currentResidents - 1);
        branch.currentResidents += 1;
      }

      if (facility && oldFacility && facility.id !== oldFacility.id) {
        oldFacility.totalResidents = Math.max(0, oldFacility.totalResidents - 1);
        facility.totalResidents += 1;
      }

      resident.branchId = updateResidentDto.branchId ?? resident.branchId;
      resident.facilityId = updateResidentDto.facilityId ?? resident.facilityId;
      resident.encryptedData = encryptText(JSON.stringify(mergedData));

      await Promise.all([
        oldBranch?.save({ transaction }),
        branch?.save({ transaction }),
        oldFacility?.save({ transaction }),
        facility?.save({ transaction }),
        resident.save({ transaction }),
      ]);

      if (oldBranch) {
        const oldAfterUtilization = this.computeUtilizationPercent(
          oldBranch.currentResidents,
          oldBranch.residentLimit,
        );
        // we only alert on crossing upwards, so moving OUT won't trigger
        void oldAfterUtilization;
      }

      if (branch && oldBranch && branch.id !== oldBranch.id) {
        const newAfterUtilization = this.computeUtilizationPercent(
          branch.currentResidents,
          branch.residentLimit,
        );
        if (newAfterUtilization >= 90) {
          await this.alertsService.createFromBranchHighUtilization(
            {
              facilityId: branch.facilityId,
              branchId: branch.id,
              branchName: branch.name,
              residentLimit: branch.residentLimit,
              currentResidents: branch.currentResidents,
              utilizationPercent: newAfterUtilization,
            },
            transaction,
          );
        }
      }

      return this.buildResidentResponse(resident);
    });
  }

  async delete(id: string, currentUser: User): Promise<boolean> {
    const resident = await this.residentModel.findByPk(id);
    if (!resident) {
      throw new BadRequestException('Resident not found');
    }

    if (!this.canManageResident(currentUser, resident)) {
      throw new ForbiddenException('Insufficient permissions to delete resident');
    }

    const branch = await this.branchModel.findByPk(resident.branchId);
    const facility = await this.facilityModel.findByPk(resident.facilityId);

    return this.sequelize.transaction(async (transaction: Transaction) => {
      const beforeUtilization = branch
        ? this.computeUtilizationPercent(branch.currentResidents, branch.residentLimit)
        : 0;
      const result = await this.residentModel.destroy({ where: { id }, transaction });

      if (result > 0) {
        if (branch) {
          branch.currentResidents = Math.max(0, branch.currentResidents - 1);
          await branch.save({ transaction });
        }

        if (facility) {
          facility.totalResidents = Math.max(0, facility.totalResidents - 1);
          await facility.save({ transaction });
        }
      }

      return result > 0;
    });
  }

  private async buildResidentResponse(resident: Resident): Promise<any> {
    const data = this.decryptResidentData(resident.encryptedData);
    const signedPhotoUrl = data.photoPublicId
      ? await this.storageService.getSignedUrl(data.photoPublicId, getUploadsSignedUrlExpirySeconds())
      : undefined;

    const { photoPublicId, ...rest } = data;

    return {
      id: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      ...rest,
      emergencyContacts: this.normalizeEmergencyContacts(data.emergencyContacts),
      ...(signedPhotoUrl ? { photoUrl: signedPhotoUrl } : {}),
      createdAt: resident.createdAt,
      updatedAt: resident.updatedAt,
    };
  }

  private normalizeEmergencyContacts(rawContacts: unknown): ResidentData['emergencyContacts'] {
    let parsed: unknown = rawContacts;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    if (!Array.isArray(parsed)) {
      return [];
    }

    const contacts: ResidentData['emergencyContacts'] = [];
    for (const contact of parsed) {
      if (!contact || typeof contact !== 'object') continue;
      const row = contact as Record<string, unknown>;
      const firstName = String(row.firstName ?? '').trim();
      const lastName = String(row.lastName ?? '').trim();
      const phone = String(row.phone ?? '').trim();
      const legacyName = String(row.name ?? '').trim();
      if (!firstName && !lastName && !phone && !legacyName) continue;

      const middleNameRaw = String(row.middleName ?? '').trim();
      const emailRaw = String(row.email ?? '').trim();

      contacts.push({
        id: String(row.id ?? ''),
        firstName: firstName || legacyName.split(/\s+/)[0] || '',
        middleName: middleNameRaw || null,
        lastName:
          lastName ||
          (legacyName.split(/\s+/).length > 1
            ? legacyName.split(/\s+/).slice(1).join(' ')
            : ''),
        phone,
        relation: String(row.relation ?? row.relationship ?? '').trim(),
        email: emailRaw || null,
      });
    }
    return contacts;
  }

  private decryptResidentData(encryptedData: string): ResidentData {
    return JSON.parse(decryptText(encryptedData)) as ResidentData;
  }

  private buildWhereClause(currentUser: User): Record<string, unknown> {
    switch (currentUser.role) {
      case Role.OWNER:
        return {};
      case Role.FACILITY_ADMIN:
        return { facilityId: currentUser.facilityId };
      case Role.BRANCH_ADMIN:
      case Role.STAFF:
        return { branchId: currentUser.branchId };
      default:
        return {};
    }
  }

  private ensureViewPermission(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.OWNER) {
      return;
    }

    if (currentUser.role === Role.FACILITY_ADMIN && resident.facilityId === currentUser.facilityId) {
      return;
    }

    if ((currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) && resident.branchId === currentUser.branchId) {
      return;
    }

    throw new ForbiddenException('Cannot access resident outside your scope');
  }

  private canManageResident(currentUser: User, resident: Resident): boolean {
    if (currentUser.role === Role.OWNER) {
      return true;
    }

    if (currentUser.role === Role.FACILITY_ADMIN) {
      return resident.facilityId === currentUser.facilityId;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      return resident.branchId === currentUser.branchId;
    }

    return false;
  }

  private validateCreatePermissions(currentUser: User): void {
    if (
      currentUser.role !== Role.OWNER &&
      currentUser.role !== Role.FACILITY_ADMIN &&
      currentUser.role !== Role.BRANCH_ADMIN
    ) {
      throw new ForbiddenException('Insufficient permissions to create resident');
    }
  }

  private validateOwnershipForCreate(currentUser: User, branch: Branch, facility: Facility): void {
    if (currentUser.role === Role.FACILITY_ADMIN && currentUser.facilityId !== facility.id) {
      throw new ForbiddenException('Cannot create resident outside your facility');
    }

    if (currentUser.role === Role.BRANCH_ADMIN && currentUser.branchId !== branch.id) {
      throw new ForbiddenException('Cannot create resident outside your branch');
    }
  }

  private computeUtilizationPercent(currentResidents: number, residentLimit: number): number {
    if (!residentLimit || residentLimit <= 0) return 0;
    return (currentResidents / residentLimit) * 100;
  }

}
