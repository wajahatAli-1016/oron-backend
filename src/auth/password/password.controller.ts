import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../decorators/public.decorator';
import { SetPasswordDto } from './dto/set-password.dto';
import { VerifyInviteDto } from './dto/verify-invite.dto';
import { UsersService } from '../../users/users.service';
import { RequestPasswordResetOtpDto } from './dto/request-password-reset-otp.dto';
import { VerifyPasswordResetOtpDto } from './dto/verify-password-reset-otp.dto';
import { ResetPasswordWithOtpDto } from './dto/reset-password-with-otp.dto';
import { PasswordResetService } from './password-reset.service';

@ApiTags('Password')
@Controller('auth/password')
export class PasswordController {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @Public()
  @Post('verify-invite')
  @ApiOperation({ summary: 'Check whether a password invite code is still valid (e.g. on set-password page load)' })
  @ApiResponse({ status: 200, description: 'Returns valid flag and optional reason/message' })
  async verifyInvite(@Body() dto: VerifyInviteDto) {
    return this.usersService.verifyInviteCode(dto.inviteCode);
  }

  @Public()
  @Post('set')
  @ApiOperation({ summary: 'Set password using emailed one-time invite code' })
  @ApiResponse({ status: 200, description: 'Password set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invite, or validation error' })
  async setPassword(@Body() dto: SetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    await this.usersService.setPasswordWithInviteCode(dto.inviteCode, dto.password);
    return { message: 'Password set successfully' };
  }

  @Public()
  @Post('forgot/request-otp')
  @ApiOperation({ summary: 'Request password reset OTP (3 min default)' })
  @ApiResponse({ status: 200, description: 'Returns status + message + optional expiresAt' })
  async requestForgotOtp(@Body() dto: RequestPasswordResetOtpDto) {
    return this.passwordResetService.requestOtp(dto.email);
  }

  @Public()
  @Post('forgot/verify-otp')
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({ status: 200, description: 'Returns valid flag + message + optional expiresAt' })
  async verifyForgotOtp(@Body() dto: VerifyPasswordResetOtpDto) {
    return this.passwordResetService.verifyOtp(dto.email, dto.otp);
  }

  @Public()
  @Post('forgot/reset')
  @ApiOperation({ summary: 'Reset password using OTP (OTP is deleted after success)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid/expired OTP or validation error' })
  async resetWithOtp(@Body() dto: ResetPasswordWithOtpDto) {
    return this.passwordResetService.resetPassword(dto.email, dto.otp, dto.password, dto.confirmPassword);
  }
}

