import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OwnerLoginDto {
  @ApiProperty({ 
    example: 'owner@oron.com', 
    description: 'Owner email address' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'owner123', 
    description: 'Owner password' 
  })
  @IsString()
  @MinLength(6)
  password: string;
}