import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const AUDIT_LOG_PERIOD_VALUES = ['7', '30', 'all'] as const;
export type AuditLogPeriod = (typeof AUDIT_LOG_PERIOD_VALUES)[number];

export class GetAuditLogsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  action?: string;

  /** Last N calendar days (`7`, `30`), or `all` for no date limit */
  @IsOptional()
  @IsIn(AUDIT_LOG_PERIOD_VALUES)
  period?: AuditLogPeriod;
}
