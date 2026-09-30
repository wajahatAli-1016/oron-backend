import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreateRiskProfileDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

  @IsInt()
  @Min(0)
  @Max(100)
  fallRiskScore: number;

  @IsOptional()
  @IsString()
  mobilityTrend?: string;

  @IsInt()
  @Min(0)
  nearFallEvents: number;

  @IsOptional()
  @IsString()
  vitalsTrend?: string;

  @IsOptional()
  @IsString()
  narrativeInterpretation?: string;
}

