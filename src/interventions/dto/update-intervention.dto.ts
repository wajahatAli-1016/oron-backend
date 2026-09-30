import { IsOptional, IsString } from 'class-validator';

export class UpdateInterventionDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  responsibleStaffRole?: string;

  @IsOptional()
  @IsString()
  frequency?: string;

  @IsOptional()
  @IsString()
  triggerConditions?: string;

  @IsOptional()
  @IsString()
  effectivenessMetric?: string;
}

