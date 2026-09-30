import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CarePlanMedicationDto } from './care-plan-medication.dto';

export class CreateCarePlanDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsDateString()
  @IsNotEmpty()
  generatedDate: string;

  @IsDateString()
  @IsNotEmpty()
  reviewDate: string;

  @IsString()
  @IsNotEmpty()
  version: string;

  @IsDateString()
  @IsNotEmpty()
  lastReviewDate: string;

  @IsDateString()
  @IsNotEmpty()
  nextReviewDate: string;

  @IsOptional()
  @IsBoolean()
  signed?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarePlanMedicationDto)
  medications: CarePlanMedicationDto[];
}

