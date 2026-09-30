import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsISO8601,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStaffDto {
  @ApiPropertyOptional({
    example: 'b1',
    description:
      'Branch ID (required for facility admin; optional for branch admin)',
  })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({
    example: 'fac1',
    description: 'Facility ID (optional, inferred from branch)',
  })
  @IsOptional()
  @IsString()
  facilityId?: string;

  @ApiProperty({ example: 'Emma', description: 'Staff first name' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'R.', description: 'Staff middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Wilson', description: 'Staff last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'staff@sunrise-downtown.com', description: 'Staff email' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Caregiver', description: 'Staff job role/title' })
  @IsString()
  role: string;

  @ApiProperty({ example: 'Active', description: 'Staff current status' })
  @IsString()
  status: string;

  @ApiPropertyOptional({
    example: '2026-04-08T10:30:00Z',
    description: 'Last active date-time',
  })
  @IsOptional()
  @IsISO8601()
  lastActive?: string;

  @ApiProperty({
    example: ['View Residents', 'Edit Vitals', 'Manage Tasks'],
    description: 'Staff permissions list',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
