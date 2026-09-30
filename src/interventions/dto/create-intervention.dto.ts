import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInterventionDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

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

