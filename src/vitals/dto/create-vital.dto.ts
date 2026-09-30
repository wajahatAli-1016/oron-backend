import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateVitalDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  systolicBP?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  diastolicBP?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  heartRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  oxygenSaturation?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bloodSugar?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  weight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  respiratoryRate?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
