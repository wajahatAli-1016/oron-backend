import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGoalDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  targetMetric?: string;

  @IsOptional()
  @IsString()
  timeframe?: string;

  @IsOptional()
  @IsString()
  responsibleRole?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

