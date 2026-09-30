// auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'SECRET_KEY',
    });
  }

  async validate(payload: any) {
    const id = payload.id ?? payload.sub;

    const dbUser = id ? await this.usersService.findById(id).catch(() => null) : null;

    return {
      ...payload,
      id,
      // Enrich request.user so audit logs can record "who" performed an action.
      firstName: dbUser?.firstName,
      middleName: dbUser?.middleName,
      lastName: dbUser?.lastName,
      email: dbUser?.email,
      facilityId: payload.facilityId ?? dbUser?.facilityId ?? undefined,
      branchId: payload.branchId ?? dbUser?.branchId ?? undefined,
      role: payload.role ?? dbUser?.role,
    };
  }
}