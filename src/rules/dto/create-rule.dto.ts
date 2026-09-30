import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RuleThresholdDto {
  @ApiProperty({ example: 90 })
  @IsNumber()
  normalMin: number;

  @ApiProperty({ example: 140 })
  @IsNumber()
  normalMax: number;

  @ApiProperty({ example: 90 })
  @IsNumber()
  lowThreshold: number;

  @ApiProperty({ example: 140 })
  @IsNumber()
  highThreshold: number;

  @ApiProperty({ example: 80 })
  @IsNumber()
  criticalLow: number;

  @ApiProperty({ example: 180 })
  @IsNumber()
  criticalHigh: number;

  @ApiProperty({ example: 'mmHg' })
  @IsString()
  @IsNotEmpty()
  unit: string;
}

export class CreateRuleDto {
  @ApiProperty({ example: 'Systolic Blood Pressure' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'systolicBP' })
  @IsString()
  @IsNotEmpty()
  vitalType: string;

  @ApiProperty({ example: 'Vitals' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ type: RuleThresholdDto })
  @ValidateNested()
  @Type(() => RuleThresholdDto)
  thresholds: RuleThresholdDto;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 'Monitors systolic blood pressure. Alerts generated when readings fall outside normal range.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
