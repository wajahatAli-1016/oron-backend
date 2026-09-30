// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginResponse } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async login(email: string, password: string, ipAddress?: string): Promise<LoginResponse> {
    const user = await this.usersService.findByEmail(email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      id: user.id,
      role: user.role,
      facilityId: user.facilityId ?? undefined,
      branchId: user.branchId ?? undefined,
    };

    const access_token = this.jwt.sign(payload);

    if (user.role === Role.STAFF) {
      await this.usersService.updateLastActive(user.id);
    }

    const userFullName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean)
      .join(' ');
    if (user.role !== Role.OWNER) {
      await this.auditLogsService.create({
        facilityId: user.facilityId ?? null,
        branchId: user.branchId ?? null,
        user: userFullName,
        action: 'Login',
        details: `Successful login by ${user.role}`,
        ipAddress: ipAddress ?? null,
      });
    }

    return {
      access_token,
      message: `welcome ${user.role.toLowerCase()}`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName ?? undefined,
        lastName: user.lastName,
        role: user.role,
        facilityId: user.facilityId ?? undefined,
        branchId: user.branchId ?? undefined,
      },
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) return null;

    return user;
  }
}