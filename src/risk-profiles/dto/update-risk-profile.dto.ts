import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateRiskProfileDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  fallRiskScore?: number;

  @IsOptional()
  @IsString()
  mobilityTrend?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  nearFallEvents?: number;

  @IsOptional()
  @IsString()
  vitalsTrend?: string;

  @IsOptional()
  @IsString()
  narrativeInterpretation?: string;
}

