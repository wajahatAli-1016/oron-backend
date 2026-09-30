import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class AdlScoresDto {
  @IsOptional()
  @IsString()
  bathing?: string;

  @IsOptional()
  @IsString()
  dressing?: string;

  @IsOptional()
  @IsString()
  toileting?: string;

  @IsOptional()
  @IsString()
  eating?: string;

  @IsOptional()
  @IsString()
  transferring?: string;

  @IsOptional()
  @IsString()
  continence?: string;
}

export class UpdateClinicalAssessmentDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conditions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AdlScoresDto)
  adlScores?: AdlScoresDto;

  @IsOptional()
  @IsString()
  mobility?: string;

  @IsOptional()
  @IsString()
  cognitive?: string;
}

