import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];

export class CreateTaskDto {
  @IsString()
  residentId: string;

  @IsString()
  branchId: string;

  @IsString()
  facilityId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  category: string;

  @IsIn(TASK_STATUSES)
  status: TaskStatus;

  @IsDateString()
  dueDate: string;

  @IsString()
  assignedToId: string;
}