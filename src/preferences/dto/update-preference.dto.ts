import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsString()
  sleepPattern?: string;

  @IsOptional()
  @IsString()
  mealPref?: string;

  @IsOptional()
  @IsString()
  communication?: string;

  @IsOptional()
  @IsString()
  socialPref?: string;

  @IsOptional()
  @IsString()
  familyEngagement?: string;

  @IsOptional()
  @IsBoolean()
  isNA?: boolean;
}

