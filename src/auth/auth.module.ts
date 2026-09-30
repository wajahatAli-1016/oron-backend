// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategies';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './guards/roles.guard';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { PasswordController } from './password/password.controller';
import { PasswordResetOtp } from './password/password-reset-otp.model';
import { PasswordResetService } from './password/password-reset.service';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [
    UsersModule,
    AuditLogsModule,
    SequelizeModule.forFeature([PasswordResetOtp]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, PasswordController],
  providers: [AuthService, JwtStrategy, LocalStrategy, RolesGuard, PasswordResetService, EmailService],
  exports: [AuthService, RolesGuard],
})
export class AuthModule {}