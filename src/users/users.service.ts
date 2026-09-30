import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { User } from './user.model';
import { Role } from '../common/enums/role.enum';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { INVITE_EXPIRED_MESSAGE, INVITE_INVALID_MESSAGE } from './invite-messages';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { email } });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { id } });
  }

  /** Record successful login time (used for staff "last login" in admin UI). */
  async updateLastActive(userId: string): Promise<void> {
    await this.userModel.update({ lastActive: new Date() }, { where: { id: userId } });
  }

  /**
   * Create a new user with role-based permissions
   */
  async create(userData: CreateUserDto, creator?: User, transaction?: Transaction): Promise<User> {
    const user = await this.createInternal(userData, creator, transaction);

    // Remove password from response
    const { password, ...userWithoutPassword } = user.toJSON();
    return userWithoutPassword as User;
  }

  private async createInternal(userData: CreateUserDto, creator?: User, transaction?: Transaction): Promise<User> {
    // Validate role-based permissions
    await this.validateUserCreationPermissions(userData.role, creator);

    // Validate required fields based on role
    this.validateUserData(userData);

    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const createPayload = {
      ...userData,
      lastActive: userData.lastActive ? new Date(userData.lastActive) : undefined,
      password: hashedPassword,
    };

    const user = await this.userModel.create(
      {
        ...createPayload,
      },
      { transaction },
    );
    return user;
  }

  private getInviteTtlMinutes(explicit?: number): number {
    if (explicit != null && Number.isFinite(explicit) && explicit > 0) {
      return explicit;
    }
    const fromEnv = parseInt(process.env.INVITE_TTL_MINUTES || '60', 10);
    return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : 60;
  }

  async createWithSetPasswordToken(
    userData: CreateUserDto,
    creator: User | undefined,
    transaction: Transaction,
    ttlMinutes?: number,
  ): Promise<{ user: User; rawToken: string }> {
    const user = await this.createInternal(userData, creator, transaction);
    const ttl = this.getInviteTtlMinutes(ttlMinutes);

    const rawToken = this.generateRawToken();
    user.inviteToken = this.hashToken(rawToken);
    user.inviteExpires = new Date(Date.now() + ttl * 60 * 1000);
    await user.save({ transaction });

    const { password, ...userWithoutPassword } = user.toJSON();
    return { user: userWithoutPassword as User, rawToken };
  }

  /**
   * Issue a new password-invite for an existing user (e.g. staff created outside UsersService).
   */
  async issuePasswordInviteCode(
    userId: string,
    transaction?: Transaction,
    ttlMinutes?: number,
  ): Promise<{ rawInviteCode: string }> {
    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const ttl = this.getInviteTtlMinutes(ttlMinutes);
    const rawInviteCode = this.generateRawToken();
    user.inviteToken = this.hashToken(rawInviteCode);
    user.inviteExpires = new Date(Date.now() + ttl * 60 * 1000);
    await user.save({ transaction });
    return { rawInviteCode };
  }

  /**
   * Update user
   */
  async update(id: string, userData: UpdateUserDto, updater?: User): Promise<User> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate update permissions
    if (updater && userData.role) {
      await this.validateUserUpdatePermissions(userData.role, updater, user);
    }

    const updatePayload: Partial<User> = {
      ...userData,
      lastActive: userData.lastActive ? new Date(userData.lastActive) : undefined,
    };

    // Hash password if being updated
    if (updatePayload.password) {
      updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
    }

    const updatedUser = await user.update(updatePayload);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser.toJSON();
    return userWithoutPassword as User;
  }

  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  generateRawToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  async createSetPasswordToken(userId: string, ttlMinutes?: number): Promise<{ rawToken: string }> {
    const { rawInviteCode } = await this.issuePasswordInviteCode(userId, undefined, ttlMinutes);
    return { rawToken: rawInviteCode };
  }

  async verifyInviteCode(
    rawInviteCode: string,
  ): Promise<
    | { valid: true }
    | { valid: false; reason: 'expired' | 'invalid'; message: string }
  > {
    if (!rawInviteCode?.trim()) {
      return { valid: false, reason: 'invalid', message: INVITE_INVALID_MESSAGE };
    }
    const tokenHash = this.hashToken(rawInviteCode);
    const user = await this.userModel.findOne({ where: { inviteToken: tokenHash } });
    if (!user) {
      return { valid: false, reason: 'invalid', message: INVITE_INVALID_MESSAGE };
    }
    if (!user.inviteExpires || user.inviteExpires.getTime() < Date.now()) {
      return { valid: false, reason: 'expired', message: INVITE_EXPIRED_MESSAGE };
    }
    return { valid: true };
  }

  async setPasswordWithInviteCode(rawInviteCode: string, plainPassword: string): Promise<void> {
    if (!rawInviteCode?.trim()) {
      throw new BadRequestException(INVITE_INVALID_MESSAGE);
    }
    const tokenHash = this.hashToken(rawInviteCode);
    const user = await this.userModel.findOne({ where: { inviteToken: tokenHash } });
    if (!user) {
      throw new BadRequestException(INVITE_INVALID_MESSAGE);
    }
    if (!user.inviteExpires || user.inviteExpires.getTime() < Date.now()) {
      throw new BadRequestException(INVITE_EXPIRED_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    await user.update({
      password: hashedPassword,
      inviteToken: null,
      inviteExpires: null,
    });
  }

  /**
   * Delete user
   */
  async delete(id: string, deleter?: User): Promise<boolean> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only owner can delete facility admins, facility admin can delete branch admins, etc.
    if (deleter) {
      this.validateUserDeletionPermissions(user, deleter);
    }

    const result = await this.userModel.destroy({ where: { id } });
    return result > 0;
  }

  /**
   * Get all users (with role-based filtering)
   */
  async findAll(currentUser?: User): Promise<User[]> {
    let whereClause = {};

    if (currentUser) {
      // Filter users based on current user's role and permissions
      switch (currentUser.role) {
        case Role.OWNER:
          // Owner can see all users
          break;
        case Role.FACILITY_ADMIN:
          // Facility admin can see users in their facility
          whereClause = { facilityId: currentUser.facilityId };
          break;
        case Role.BRANCH_ADMIN:
          // Branch admin can see users in their branch
          whereClause = { branchId: currentUser.branchId };
          break;
        case Role.STAFF:
          // Staff can only see themselves (for profile purposes)
          whereClause = { id: currentUser.id };
          break;
      }
    }

    const users = await this.userModel.findAll({ where: whereClause });

    // Remove passwords from response
    return users.map(user => {
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword as User;
    });
  }

  /**
   * Get users by facility
   */
  async findByFacility(facilityId: string): Promise<User[]> {
    const users = await this.userModel.findAll({ where: { facilityId } });
    return users.map(user => {
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword as User;
    });
  }

  /**
   * Get users by branch
   */
  async findByBranch(branchId: string): Promise<User[]> {
    const users = await this.userModel.findAll({ where: { branchId } });
    return users.map(user => {
      const { password, ...userWithoutPassword } = user.toJSON();
      return userWithoutPassword as User;
    });
  }

  /**
   * Validate user creation permissions based on creator's role
   */
  private async validateUserCreationPermissions(targetRole: Role, creator?: User): Promise<void> {
    if (!creator) {
      // Only allow creating owner during initial setup (no creator)
      if (targetRole !== Role.OWNER) {
        throw new ForbiddenException('Only owner can create initial users');
      }
      return;
    }

    switch (creator.role) {
      case Role.OWNER:
        // Owner can create facility admins and branch admins
        if (targetRole !== Role.FACILITY_ADMIN && targetRole !== Role.BRANCH_ADMIN) {
          throw new ForbiddenException('Owner can only create facility admins and branch admins');
        }
        break;
      case Role.FACILITY_ADMIN:
        // Facility admin can create branch admins and staff
        if (targetRole !== Role.BRANCH_ADMIN && targetRole !== Role.STAFF) {
          throw new ForbiddenException('Facility admin can only create branch admins and staff');
        }
        break;
      case Role.BRANCH_ADMIN:
        // Branch admin can create staff in their branch
        if (targetRole !== Role.STAFF) {
          throw new ForbiddenException('Branch admin can only create staff');
        }
        break;
      case Role.STAFF:
        throw new ForbiddenException('Staff cannot create users');
    }
  }

  /**
   * Validate user update permissions
   */
  private async validateUserUpdatePermissions(targetRole: Role, updater: User, targetUser: User): Promise<void> {
    // Users can update their own profile (except role)
    if (updater.id === targetUser.id && targetRole === targetUser.role) {
      return;
    }

    // Check role hierarchy for updating others
    switch (updater.role) {
      case Role.OWNER:
        if (targetRole !== Role.FACILITY_ADMIN) {
          throw new ForbiddenException('Owner can only promote to facility admin');
        }
        break;
      case Role.FACILITY_ADMIN:
        if (targetRole !== Role.BRANCH_ADMIN && targetRole !== Role.STAFF) {
          throw new ForbiddenException('Facility admin can only change roles to branch admin or staff');
        }
        // Ensure target user is in the same facility
        if (targetUser.facilityId !== updater.facilityId) {
          throw new ForbiddenException('Cannot modify users outside your facility');
        }
        break;
      case Role.BRANCH_ADMIN:
        if (targetRole !== Role.STAFF) {
          throw new ForbiddenException('Branch admin can only change roles to staff');
        }
        // Ensure target user is in the same branch
        if (targetUser.branchId !== updater.branchId) {
          throw new ForbiddenException('Cannot modify users outside your branch');
        }
        break;
      default:
        throw new ForbiddenException('Insufficient permissions to update user roles');
    }
  }

  /**
   * Validate user deletion permissions
   */
  private validateUserDeletionPermissions(targetUser: User, deleter: User): void {
    switch (deleter.role) {
      case Role.OWNER:
        // Owner can delete facility admins
        if (targetUser.role !== Role.FACILITY_ADMIN) {
          throw new ForbiddenException('Owner can only delete facility admins');
        }
        break;
      case Role.FACILITY_ADMIN:
        // Facility admin can delete branch admins and staff in their facility
        if ((targetUser.role !== Role.BRANCH_ADMIN && targetUser.role !== Role.STAFF) ||
            targetUser.facilityId !== deleter.facilityId) {
          throw new ForbiddenException('Facility admin can only delete branch admins and staff in their facility');
        }
        break;
      case Role.BRANCH_ADMIN:
        // Branch admin can delete staff in their branch
        if (targetUser.role !== Role.STAFF || targetUser.branchId !== deleter.branchId) {
          throw new ForbiddenException('Branch admin can only delete staff in their branch');
        }
        break;
      default:
        throw new ForbiddenException('Insufficient permissions to delete users');
    }
  }

  /**
   * Validate user data based on role requirements
   */
  private validateUserData(userData: CreateUserDto): void {
    switch (userData.role) {
      case Role.OWNER:
        // Owner doesn't need facility or branch
        break;
      case Role.FACILITY_ADMIN:
        if (!userData.facilityId) {
          throw new BadRequestException('Facility admin must be assigned to a facility');
        }
        break;
      case Role.BRANCH_ADMIN:
      case Role.STAFF:
        if (!userData.facilityId || !userData.branchId) {
          throw new BadRequestException('Branch admin and staff must be assigned to a facility and branch');
        }
        break;
    }
  }
}
