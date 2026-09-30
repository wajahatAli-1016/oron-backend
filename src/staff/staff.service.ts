import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.model';
import { Branch } from '../branch/branch.model';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { buildSetPasswordUrl } from '../common/config/frontend-url.config';
import { EmailService } from '../common/services/email.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Op, WhereOptions } from 'sequelize';
import { GetStaffQueryDto } from './dto/get-staff-query.dto';
import { PaginatedStaffResult } from './dto/paginated-staff.dto';


@Injectable()
export class StaffService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Branch)
    private readonly branchModel: typeof Branch,
    private readonly auditLogsService: AuditLogsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,

  ) {}

  private mapStaffUser(user: User) {
    return {
      id: user.id,
      branchId: user.branchId || '',
      facilityId: user.facilityId || '',
      firstName: user.firstName,
      middleName: user.middleName || '',
      lastName: user.lastName,
      email: user.email,
      role: user.staffRole || 'Caregiver',
      status: user.staffStatus || 'Active',
      lastActive: user.lastActive ? new Date(user.lastActive).toISOString() : null,
      permissions: user.permissions || [],
    };
  }

  async create(
    createStaffDto: CreateStaffDto,
    currentUser: User,
    ipAddress?: string,
  ): Promise<any> {
    if (
      currentUser.role !== Role.FACILITY_ADMIN &&
      currentUser.role !== Role.BRANCH_ADMIN
    ) {
      throw new ForbiddenException(
        'Only facility admin and branch admin can create staff',
      );
    }

    const targetBranchId =
      currentUser.role === Role.BRANCH_ADMIN
        ? currentUser.branchId
        : createStaffDto.branchId;

    if (!targetBranchId) {
      throw new BadRequestException('branchId is required');
    }

    const branch = await this.branchModel.findByPk(targetBranchId);
    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId) {
        throw new ForbiddenException('Facility admin is not assigned to a facility');
      }
      if (branch.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException(
          'Facility admin can only create staff within their facility branches',
        );
      }
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId) {
        throw new ForbiddenException('Branch admin is not assigned to a branch');
      }
      if (branch.id !== currentUser.branchId) {
        throw new ForbiddenException(
          'Branch admin can only create staff in their own branch',
        );
      }
    }

    if (
      createStaffDto.facilityId &&
      createStaffDto.facilityId !== branch.facilityId
    ) {
      throw new BadRequestException(
        'Provided facilityId does not match selected branch facility',
      );
    }

    const existingStaff = await this.userModel.findOne({
      where: { email: createStaffDto.email },
    });
    if (existingStaff) {
      throw new BadRequestException('Staff email already exists');
    }

    const randomPassword = crypto.randomBytes(24).toString('base64url');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    const createdStaff = await this.userModel.create({
      firstName: createStaffDto.firstName,
      middleName: createStaffDto.middleName ?? null,
      lastName: createStaffDto.lastName,
      email: createStaffDto.email,
      password: hashedPassword,
      role: Role.STAFF,
      branchId: targetBranchId,
      facilityId: branch.facilityId,
      staffRole: createStaffDto.role,
      staffStatus: createStaffDto.status,
      lastActive: createStaffDto.lastActive ? new Date(createStaffDto.lastActive) : null,
      permissions: createStaffDto.permissions,
    });

    const { rawInviteCode } = await this.usersService.issuePasswordInviteCode(createdStaff.id);

    const setPasswordUrl = buildSetPasswordUrl(rawInviteCode);
    await this.emailService.sendSetPasswordLink(
      createdStaff.email,
      createdStaff.firstName,
      setPasswordUrl,
      branch.name,
    );

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const staffName = [createdStaff.firstName, createdStaff.middleName, createdStaff.lastName]
      .filter(Boolean)
      .join(' ');
    await this.auditLogsService.create({
      facilityId: createdStaff.facilityId,
      branchId: createdStaff.branchId,
      user: actorName,
      action: 'Staff Created',
      details: `Created account for ${staffName}`,
      ipAddress: ipAddress ?? null,
    });

    return this.mapStaffUser(createdStaff);
  }

  private buildScopeWhere(currentUser: User): WhereOptions<User> | null {
    const baseWhere: WhereOptions<User> = { role: Role.STAFF };

    switch (currentUser.role) {
      case Role.OWNER:
        return baseWhere;
      case Role.FACILITY_ADMIN:
        if (!currentUser.facilityId) {
          return null;
        }
        return { ...baseWhere, facilityId: currentUser.facilityId };
      case Role.BRANCH_ADMIN:
      case Role.STAFF:
        if (!currentUser.branchId) {
          return null;
        }
        return { ...baseWhere, branchId: currentUser.branchId };
      default:
        return null;
    }
  }

  private buildFilterWhere(
    scopeWhere: WhereOptions<User>,
    query: GetStaffQueryDto,
  ): WhereOptions<User> {
    const conditions: WhereOptions<User>[] = [scopeWhere];

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        [Op.or]: [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { staffRole: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const branchId = query.branchId?.trim();
    if (branchId && branchId !== 'All') {
      conditions.push({ branchId });
    }

    return conditions.length === 1 ? conditions[0] : { [Op.and]: conditions };
  }

  async findAll(
    currentUser: User,
    query: GetStaffQueryDto = {},
  ): Promise<PaginatedStaffResult> {
    const scopeWhere = this.buildScopeWhere(currentUser);
    if (!scopeWhere) {
      return {
        data: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: 0,
      };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildFilterWhere(scopeWhere, query);
    const offset = (page - 1) * limit;

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const total = count;
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: rows.map((user) => this.mapStaffUser(user)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string, currentUser: User): Promise<any | null> {
    const staff = await this.userModel.findOne({ where: { id, role: Role.STAFF } });
    if (!staff) {
      return null;
    }

    if (currentUser.role === Role.OWNER) {
      return this.mapStaffUser(staff);
    }

    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (staff.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot access staff outside your facility');
      }
      return this.mapStaffUser(staff);
    }

    if (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) {
      if (staff.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot access staff outside your branch');
      }
      return this.mapStaffUser(staff);
    }

    throw new ForbiddenException('Insufficient permissions to access staff');
  }

  async updateStaff(
    id: string,
    updateStaffDto: UpdateStaffDto,
    currentUser: User,
  ): Promise<any | null> {
    if (
      currentUser.role !== Role.FACILITY_ADMIN &&
      currentUser.role !== Role.BRANCH_ADMIN
    ) {
      throw new ForbiddenException(
        'Only facility admin and branch admin can update staff',
      );
    }

    const staff = await this.userModel.findOne({ where: { id, role: Role.STAFF } });
    if (!staff) {
      return null;
    }

    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || staff.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot update staff outside your facility');
      }
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || staff.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot update staff outside your branch');
      }
    }

    const updatePayload: Partial<User> = {
      firstName: updateStaffDto.firstName ?? staff.firstName,
      middleName:
        updateStaffDto.middleName !== undefined
          ? updateStaffDto.middleName
          : staff.middleName,
      lastName: updateStaffDto.lastName ?? staff.lastName,
      staffRole: updateStaffDto.role ?? staff.staffRole,
      staffStatus: updateStaffDto.status ?? staff.staffStatus,
      permissions: updateStaffDto.permissions ?? staff.permissions,
    };

    if (updateStaffDto.lastActive !== undefined) {
      updatePayload.lastActive = new Date(updateStaffDto.lastActive);
    }

    await staff.update(updatePayload);
    return this.mapStaffUser(staff);
  }
}
