import { BadRequestException, Injectable,  UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { EmailService } from '../../common/services/email.service';
import { UsersService } from '../../users/users.service';
import { PasswordResetOtp } from './password-reset-otp.model';

type RequestOtpResult =
  | { status: 'no_user'; message: string }
  | { status: 'already_sent'; message: string; expiresAt: string }
  | { status: 'sent'; message: string; expiresAt: string };

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    @InjectModel(PasswordResetOtp)
    private readonly passwordResetOtpModel: typeof PasswordResetOtp,
  ) {}

  private otpTtlMinutes(): number {
    const raw = parseInt(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || '3', 10);
    return Number.isFinite(raw) && raw > 0 ? raw : 3;
  }

  private async cleanupExpired(): Promise<void> {
    await this.passwordResetOtpModel.destroy({
      where: {
        expiresAt: { [Op.lt]: new Date() },
      },
    });
  }

  private hashOtp(rawOtp: string): string {
    return crypto.createHash('sha256').update(rawOtp).digest('hex');
  }

  private generateOtp(): string {
    // 6-digit numeric OTP
    return (Math.floor(100000 + Math.random() * 900000)).toString();
  }

  async requestOtp(email: string): Promise<RequestOtpResult> {
    await this.cleanupExpired();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { status: 'no_user', message: 'User not found. Please login first.' };
    }

    const existing = await this.passwordResetOtpModel.findOne({ where: { userId: user.id } });
    const now = Date.now();
    if (existing && existing.expiresAt?.getTime() > now) {
      return {
        status: 'already_sent',
        message: 'OTP already sent to your email. Please check your inbox.',
        expiresAt: existing.expiresAt.toISOString(),
      };
    }

    if (existing) {
      await existing.destroy();
    }

    const rawOtp = this.generateOtp();
    const ttlMinutes = this.otpTtlMinutes();
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.passwordResetOtpModel.create({
      userId: user.id,
      otpHash: this.hashOtp(rawOtp),
      expiresAt,
    });

    await this.emailService.sendPasswordResetOtp(user.email, user.firstName, rawOtp, ttlMinutes);

    return {
      status: 'sent',
      message: 'OTP sent to your email.',
      expiresAt: expiresAt.toISOString(),
    };
  }

  async verifyOtp(email: string, otp: string): Promise<{ valid: boolean; message: string; expiresAt?: string }> {
    await this.cleanupExpired();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { valid: false, message: 'User not found. Please login first.' };
    }

    const record = await this.passwordResetOtpModel.findOne({ where: { userId: user.id } });
    if (!record) {
      return { valid: false, message: 'OTP not found. Please request a new OTP.' };
    }

    if (!record.expiresAt || record.expiresAt.getTime() < Date.now()) {
      await record.destroy();
      return { valid: false, message: 'OTP expired. Please request a new OTP.' };
    }

    const matches = this.hashOtp(otp) === record.otpHash;
    if (!matches) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    return { valid: true, message: 'OTP verified.', expiresAt: record.expiresAt.toISOString() };
  }

  async resetPassword(email: string, otp: string, password: string, confirmPassword: string): Promise<{ message: string }> {
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    await this.cleanupExpired();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found. Please login first.');
    }

    const record = await this.passwordResetOtpModel.findOne({ where: { userId: user.id } });
    if (!record) {
      throw new BadRequestException('OTP not found. Please request a new OTP.');
    }
    if (!record.expiresAt || record.expiresAt.getTime() < Date.now()) {
      await record.destroy();
      throw new BadRequestException('OTP expired. Please request a new OTP.');
    }
    if (this.hashOtp(otp) !== record.otpHash) {
      throw new BadRequestException('Invalid OTP.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });
    await record.destroy();

    return { message: 'Password reset successfully' };
  }
}

