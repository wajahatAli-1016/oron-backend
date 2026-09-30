import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { decryptText, encryptText } from '../common/utils/encryption.util';
import { Role } from '../common/enums/role.enum';
import { Resident } from '../residents/resident.model';
import { User } from '../users/user.model';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { Intervention } from './intervention.model';

@Injectable()
export class InterventionsService {
  constructor(
    @InjectModel(Intervention)
    private readonly interventionModel: typeof Intervention,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreateInterventionDto, currentUser: User): Promise<Intervention> {
    this.ensureCanManage(currentUser);

    const resident = await this.residentModel.findByPk(dto.residentId);
    if (!resident) {
      throw new BadRequestException('Resident not found');
    }
    this.ensureResidentInManageScope(resident, currentUser);

    const author = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeAuthor = author.trim() || (currentUser as any).email || currentUser.id;

    const created = await this.interventionModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      description: this.encryptValue(dto.description ?? ''),
      responsibleStaffRole: this.encryptValue(dto.responsibleStaffRole ?? ''),
      frequency: this.encryptValue(dto.frequency ?? ''),
      triggerConditions: this.encryptValue(dto.triggerConditions ?? ''),
      effectivenessMetric: this.encryptValue(dto.effectivenessMetric ?? ''),
      author: safeAuthor,
      updatedBy: safeAuthor,
    });

    return this.attachDecryptedPayload(created);
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<Intervention[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) whereClause.residentId = filters.residentId;
    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.facilityId) whereClause.facilityId = filters.facilityId;

    const rows = await this.interventionModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<Intervention[]> {
    const scope = this.buildWhereClause(currentUser);
    const rows = await this.interventionModel.findAll({
      where: { ...scope, residentId },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findOne(id: string, currentUser: User): Promise<Intervention> {
    const row = await this.interventionModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Intervention not found');
    }

    this.ensureInViewScope(row, currentUser);
    return this.attachDecryptedPayload(row);
  }

  async update(
    id: string,
    dto: UpdateInterventionDto,
    currentUser: User,
  ): Promise<Intervention> {
    this.ensureCanManage(currentUser);

    const row = await this.interventionModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Intervention not found');
    }

    this.ensureInManageScope(row, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeActorName = actorName.trim() || (currentUser as any).email || currentUser.id;

    await row.update({
      description: dto.description !== undefined ? this.encryptValue(dto.description) : row.description,
      responsibleStaffRole:
        dto.responsibleStaffRole !== undefined
          ? this.encryptValue(dto.responsibleStaffRole)
          : row.responsibleStaffRole,
      frequency: dto.frequency !== undefined ? this.encryptValue(dto.frequency) : row.frequency,
      triggerConditions:
        dto.triggerConditions !== undefined
          ? this.encryptValue(dto.triggerConditions)
          : row.triggerConditions,
      effectivenessMetric:
        dto.effectivenessMetric !== undefined
          ? this.encryptValue(dto.effectivenessMetric)
          : row.effectivenessMetric,
      updatedBy: safeActorName,
    });

    return this.attachDecryptedPayload(row);
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const row = await this.interventionModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Intervention not found');
    }

    this.ensureInManageScope(row, currentUser);
    const deleted = await this.interventionModel.destroy({ where: { id } });
    return deleted > 0;
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

  private ensureCanManage(currentUser: User): void {
    if (currentUser.role !== Role.FACILITY_ADMIN && currentUser.role !== Role.BRANCH_ADMIN) {
      throw new ForbiddenException('Insufficient permissions to manage interventions');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage interventions outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage interventions outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(row: Intervention, currentUser: User): void {
    if (currentUser.role === Role.OWNER) return;
    if (currentUser.role === Role.FACILITY_ADMIN && row.facilityId === currentUser.facilityId) return;
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      row.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access intervention outside your scope');
  }

  private ensureInManageScope(row: Intervention, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (row.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage interventions outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (row.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage interventions outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage interventions');
  }

  private encryptValue(value: string): string {
    const trimmed = (value ?? '').toString();
    if (!trimmed) return '';
    return encryptText(trimmed);
  }

  private decryptValue(value: string): string {
    if (!value) return '';
    try {
      return decryptText(value);
    } catch {
      // legacy plaintext row
      return value;
    }
  }

  private attachDecryptedPayload(row: Intervention): Intervention {
    row.setDataValue('description', this.decryptValue(row.description ?? ''));
    row.setDataValue('responsibleStaffRole', this.decryptValue(row.responsibleStaffRole ?? ''));
    row.setDataValue('frequency', this.decryptValue(row.frequency ?? ''));
    row.setDataValue('triggerConditions', this.decryptValue(row.triggerConditions ?? ''));
    row.setDataValue('effectivenessMetric', this.decryptValue(row.effectivenessMetric ?? ''));
    return row;
  }
}

