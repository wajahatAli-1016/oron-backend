import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RiskProfile } from './risk-profile.model';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';
import { Resident } from '../residents/resident.model';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';
import { decryptText, encryptText } from '../common/utils/encryption.util';

@Injectable()
export class RiskProfilesService {
  constructor(
    @InjectModel(RiskProfile)
    private readonly riskProfileModel: typeof RiskProfile,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreateRiskProfileDto, currentUser: User): Promise<RiskProfile> {
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

    const created = await this.riskProfileModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      fallRiskScore: dto.fallRiskScore,
      mobilityTrend: this.encryptValue(dto.mobilityTrend ?? ''),
      nearFallEvents: dto.nearFallEvents,
      vitalsTrend: this.encryptValue(dto.vitalsTrend ?? ''),
      narrativeInterpretation: this.encryptValue(dto.narrativeInterpretation ?? ''),
      author: safeAuthor,
      updatedBy: safeAuthor,
    });

    return this.attachDecryptedPayload(created);
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<RiskProfile[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) whereClause.residentId = filters.residentId;
    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.facilityId) whereClause.facilityId = filters.facilityId;

    const rows = await this.riskProfileModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<RiskProfile[]> {
    const scope = this.buildWhereClause(currentUser);
    const rows = await this.riskProfileModel.findAll({
      where: { ...scope, residentId },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findOne(id: string, currentUser: User): Promise<RiskProfile> {
    const row = await this.riskProfileModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Risk profile not found');
    }

    this.ensureInViewScope(row, currentUser);
    return this.attachDecryptedPayload(row);
  }

  async update(id: string, dto: UpdateRiskProfileDto, currentUser: User): Promise<RiskProfile> {
    this.ensureCanManage(currentUser);

    const row = await this.riskProfileModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Risk profile not found');
    }

    this.ensureInManageScope(row, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeActorName = actorName.trim() || (currentUser as any).email || currentUser.id;

    await row.update({
      fallRiskScore: dto.fallRiskScore ?? row.fallRiskScore,
      nearFallEvents: dto.nearFallEvents ?? row.nearFallEvents,
      mobilityTrend:
        dto.mobilityTrend !== undefined ? this.encryptValue(dto.mobilityTrend) : row.mobilityTrend,
      vitalsTrend: dto.vitalsTrend !== undefined ? this.encryptValue(dto.vitalsTrend) : row.vitalsTrend,
      narrativeInterpretation:
        dto.narrativeInterpretation !== undefined
          ? this.encryptValue(dto.narrativeInterpretation)
          : row.narrativeInterpretation,
      updatedBy: safeActorName,
    });

    return this.attachDecryptedPayload(row);
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const row = await this.riskProfileModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Risk profile not found');
    }

    this.ensureInManageScope(row, currentUser);
    const deleted = await this.riskProfileModel.destroy({ where: { id } });
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
      throw new ForbiddenException('Insufficient permissions to manage risk profiles');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage risk profiles outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage risk profiles outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(row: RiskProfile, currentUser: User): void {
    if (currentUser.role === Role.OWNER) return;
    if (currentUser.role === Role.FACILITY_ADMIN && row.facilityId === currentUser.facilityId) return;
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      row.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access risk profile outside your scope');
  }

  private ensureInManageScope(row: RiskProfile, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (row.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage risk profiles outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (row.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage risk profiles outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage risk profiles');
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

  private attachDecryptedPayload(row: RiskProfile): RiskProfile {
    row.setDataValue('mobilityTrend', this.decryptValue(row.mobilityTrend ?? ''));
    row.setDataValue('vitalsTrend', this.decryptValue(row.vitalsTrend ?? ''));
    row.setDataValue('narrativeInterpretation', this.decryptValue(row.narrativeInterpretation ?? ''));
    return row;
  }
}

