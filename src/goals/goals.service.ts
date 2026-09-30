import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Goal } from './goal.model';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Resident } from '../residents/resident.model';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';
import { decryptText, encryptText } from '../common/utils/encryption.util';

@Injectable()
export class GoalsService {
  constructor(
    @InjectModel(Goal)
    private readonly goalModel: typeof Goal,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreateGoalDto, currentUser: User): Promise<Goal> {
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

    const created = await this.goalModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      description: this.encryptValue(dto.description ?? ''),
      targetMetric: this.encryptValue(dto.targetMetric ?? ''),
      timeframe: dto.timeframe ?? '',
      responsibleRole: dto.responsibleRole ?? '',
      status: dto.status ?? 'Active',
      author: safeAuthor,
      updatedBy: safeAuthor,
    });

    return this.attachDecryptedPayload(created);
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<Goal[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) whereClause.residentId = filters.residentId;
    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.facilityId) whereClause.facilityId = filters.facilityId;

    const rows = await this.goalModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<Goal[]> {
    const scope = this.buildWhereClause(currentUser);
    const rows = await this.goalModel.findAll({
      where: { ...scope, residentId },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findOne(id: string, currentUser: User): Promise<Goal> {
    const row = await this.goalModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Goal not found');
    }

    this.ensureInViewScope(row, currentUser);
    return this.attachDecryptedPayload(row);
  }

  async update(id: string, dto: UpdateGoalDto, currentUser: User): Promise<Goal> {
    this.ensureCanManage(currentUser);

    const row = await this.goalModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Goal not found');
    }

    this.ensureInManageScope(row, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeActorName = actorName.trim() || (currentUser as any).email || currentUser.id;

    await row.update({
      description: dto.description !== undefined ? this.encryptValue(dto.description) : row.description,
      targetMetric:
        dto.targetMetric !== undefined ? this.encryptValue(dto.targetMetric) : row.targetMetric,
      timeframe: dto.timeframe ?? row.timeframe,
      responsibleRole: dto.responsibleRole ?? row.responsibleRole,
      status: dto.status ?? row.status,
      updatedBy: safeActorName,
    });

    return this.attachDecryptedPayload(row);
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const row = await this.goalModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('Goal not found');
    }

    this.ensureInManageScope(row, currentUser);
    const deleted = await this.goalModel.destroy({ where: { id } });
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
      throw new ForbiddenException('Insufficient permissions to manage goals');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage goals outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage goals outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(row: Goal, currentUser: User): void {
    if (currentUser.role === Role.OWNER) return;
    if (currentUser.role === Role.FACILITY_ADMIN && row.facilityId === currentUser.facilityId) return;
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      row.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access goal outside your scope');
  }

  private ensureInManageScope(row: Goal, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (row.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage goals outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (row.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage goals outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage goals');
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

  private attachDecryptedPayload(row: Goal): Goal {
    row.setDataValue('description', this.decryptValue(row.description ?? ''));
    row.setDataValue('targetMetric', this.decryptValue(row.targetMetric ?? ''));
    return row;
  }
}

