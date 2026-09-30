import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyInviteDto {
  @ApiProperty({ description: 'Invite code from the account setup email link' })
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;
}