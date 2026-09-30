import {
  ArrayNotEmpty,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'Emma', description: 'Staff first name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'R.', description: 'Staff middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiPropertyOptional({ example: 'Wilson', description: 'Staff last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Caregiver', description: 'Staff job role/title' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ example: 'Active', description: 'Staff current status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    example: '2026-04-08T10:30:00Z',
    description: 'Last active date-time',
  })
  @IsOptional()
  @IsISO8601()
  lastActive?: string;

  @ApiPropertyOptional({
    example: ['View Residents', 'Edit Vitals', 'Manage Tasks'],
    description: 'Staff permissions list',
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions?: string[];
}
