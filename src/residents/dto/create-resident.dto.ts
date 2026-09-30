import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Min,
} from 'class-validator';

class EmergencyContactDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  relation: string;

  @IsOptional()
  @IsString()
  email?: string;
}

export class CreateResidentDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  facilityId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  healthState: string;

  @IsDateString()
  @IsNotEmpty()
  admissionDate: string;

@Transform(({ value }) => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
})
@IsNumber()
@Min(0)
weight: number;

  @IsString()
  @IsNotEmpty()
  height: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return JSON.parse(value);
    }
    return value;
  })
@IsArray()
@ValidateNested({ each: true })
@Type(() => EmergencyContactDto)
emergencyContacts: EmergencyContactDto[];

  @IsString()
  @IsNotEmpty()
  medicalHistory: string;

  @IsString()
  @IsNotEmpty()
  allergies: string;

  @IsString()
  @IsNotEmpty()
  primaryDiagnosis: string;

  @IsOptional()
  @IsDateString()
  lastVitalsDate?: string;
}
