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
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { Preference } from './preference.model';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectModel(Preference)
    private readonly preferenceModel: typeof Preference,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreatePreferenceDto, currentUser: User): Promise<Preference> {
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

    const created = await this.preferenceModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      sleepPattern: this.encryptValue(dto.sleepPattern ?? ''),
      mealPref: this.encryptValue(dto.mealPref ?? ''),
      communication: this.encryptValue(dto.communication ?? ''),
      socialPref: this.encryptValue(dto.socialPref ?? ''),
      familyEngagement: this.encryptValue(dto.familyEngagement ?? ''),
      isNA: dto.isNA ?? false,
      author: safeAuthor,
      updatedBy: safeAuthor,
    });

    return this.attachDecryptedPayload(created);
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<Preference[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) whereClause.residentId = filters.residentId;
    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.facilityId) whereClause.facilityId = filters.facilityId;

    const rows = await this.preferenceModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<Preference[]> {
    const scope = this.buildWhereClause(currentUser);
    const rows = await this.preferenceModel.findAll({
      where: { ...scope, residentId },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findOne(id: string, currentUser: User): Promise<Preference> {
    const row = await this.preferenceModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Preferences not found');
    }

    this.ensureInViewScope(row, currentUser);
    return this.attachDecryptedPayload(row);
  }

  async update(id: string, dto: UpdatePreferenceDto, currentUser: User): Promise<Preference> {
    this.ensureCanManage(currentUser);

    const row = await this.preferenceModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Preferences not found');
    }

    this.ensureInManageScope(row, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeActorName = actorName.trim() || (currentUser as any).email || currentUser.id;

    await row.update({
      sleepPattern:
        dto.sleepPattern !== undefined ? this.encryptValue(dto.sleepPattern) : row.sleepPattern,
      mealPref: dto.mealPref !== undefined ? this.encryptValue(dto.mealPref) : row.mealPref,
      communication:
        dto.communication !== undefined ? this.encryptValue(dto.communication) : row.communication,
      socialPref: dto.socialPref !== undefined ? this.encryptValue(dto.socialPref) : row.socialPref,
      familyEngagement:
        dto.familyEngagement !== undefined
          ? this.encryptValue(dto.familyEngagement)
          : row.familyEngagement,
      isNA: dto.isNA ?? row.isNA,
      updatedBy: safeActorName,
    });

    return this.attachDecryptedPayload(row);
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const row = await this.preferenceModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Preferences not found');
    }

    this.ensureInManageScope(row, currentUser);
    const deleted = await this.preferenceModel.destroy({ where: { id } });
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
      throw new ForbiddenException('Insufficient permissions to manage preferences');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage preferences outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage preferences outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(row: Preference, currentUser: User): void {
    if (currentUser.role === Role.OWNER) return;
    if (currentUser.role === Role.FACILITY_ADMIN && row.facilityId === currentUser.facilityId) return;
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      row.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access preferences outside your scope');
  }

  private ensureInManageScope(row: Preference, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (row.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage preferences outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (row.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage preferences outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage preferences');
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

  private attachDecryptedPayload(row: Preference): Preference {
    row.setDataValue('sleepPattern', this.decryptValue(row.sleepPattern ?? ''));
    row.setDataValue('mealPref', this.decryptValue(row.mealPref ?? ''));
    row.setDataValue('communication', this.decryptValue(row.communication ?? ''));
    row.setDataValue('socialPref', this.decryptValue(row.socialPref ?? ''));
    row.setDataValue('familyEngagement', this.decryptValue(row.familyEngagement ?? ''));
    return row;
  }
}

