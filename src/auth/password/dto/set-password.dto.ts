import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SetPasswordDto {
  @ApiProperty({ description: 'Invite code from the account setup email link (query: inviteCode)' })
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  @ApiProperty({ description: 'New password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ description: 'Confirm new password' })
  @IsString()
  @MinLength(8)
  confirmPassword!: string;
}

