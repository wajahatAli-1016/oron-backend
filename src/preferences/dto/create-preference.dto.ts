import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePreferenceDto {
  @IsUUID()
  @IsNotEmpty()
  residentId: string;

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

