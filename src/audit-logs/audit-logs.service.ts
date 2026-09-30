import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { AuditLog } from './audit-log.model';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';
import { GetAuditLogsQueryDto } from './dto/get-audit-logs-query.dto';
import { PaginatedAuditLogsResult } from './dto/paginated-audit-logs.dto';

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const periodStartDate = (period: string): Date | null => {
  if (period === '7' || period === '30') {
    const days = Number(period);
    const start = startOfDay(new Date());
    start.setDate(start.getDate() - (days - 1));
    return start;
  }
  return null;
};

type CreateAuditLogInput = {
  facilityId?: string | null;
  branchId?: string | null;
  user: string;
  action: string;
  details: string;
  ipAddress?: string | null;
  timestamp?: Date;
};

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog)
    private readonly auditLogModel: typeof AuditLog,
  ) {}

  async create(input: CreateAuditLogInput): Promise<AuditLog> {
    return this.auditLogModel.create({
      facilityId: input.facilityId ?? null,
      branchId: input.branchId ?? null,
      timestamp: input.timestamp ?? new Date(),
      user: input.user,
      action: input.action,
      details: input.details,
      ipAddress: input.ipAddress ?? null,
    });
  }

  private buildScopeWhere(currentUser: User): WhereOptions<AuditLog> | null {
    if (currentUser.role === Role.OWNER) {
      return {};
    }

    if (currentUser.role === Role.FACILITY_ADMIN && currentUser.facilityId) {
      return { facilityId: currentUser.facilityId };
    }

    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      currentUser.branchId
    ) {
      return { branchId: currentUser.branchId };
    }

    return null;
  }

  private buildFilterWhere(
    scopeWhere: WhereOptions<AuditLog>,
    query: GetAuditLogsQueryDto,
    options?: { includeAction?: boolean },
  ): WhereOptions<AuditLog> {
    const conditions: WhereOptions<AuditLog>[] = [scopeWhere];

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        [Op.or]: [
          { user: { [Op.iLike]: `%${search}%` } },
          { details: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const period = query.period?.trim() ?? 'all';
    const rangeStart = periodStartDate(period);
    if (rangeStart) {
      conditions.push({ timestamp: { [Op.gte]: rangeStart } });
    }

    if (options?.includeAction !== false) {
      const action = query.action?.trim();
      if (action && action !== 'All') {
        conditions.push({ action });
      }
    }

    return conditions.length === 1 ? conditions[0] : { [Op.and]: conditions };
  }

  async findAll(
    currentUser: User,
    query: GetAuditLogsQueryDto = {},
  ): Promise<PaginatedAuditLogsResult> {
    const scopeWhere = this.buildScopeWhere(currentUser);
    if (!scopeWhere) {
      return {
        data: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: 0,
        actions: [],
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildFilterWhere(scopeWhere, query);
    const offset = (page - 1) * limit;

    const { rows, count } = await this.auditLogModel.findAndCountAll({
      where,
      order: [['timestamp', 'DESC']],
      limit,
      offset,
    });

    const actionsWhere = this.buildFilterWhere(scopeWhere, query, {
      includeAction: false,
    });
    const actionRows = await this.auditLogModel.findAll({
      attributes: ['action'],
      where: actionsWhere,
      group: ['action'],
      order: [['action', 'ASC']],
    });

    const total = count;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: rows,
      total,
      page,
      limit,
      totalPages,
      actions: actionRows.map((row) => row.action),
    };
  }
}
