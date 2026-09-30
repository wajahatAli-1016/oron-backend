import { IsIn, IsNotEmpty } from 'class-validator';
import type { AlertStatus } from '../alert.model';

export class UpdateAlertStatusDto {
  @IsNotEmpty()
  @IsIn(['Unread', 'Read', 'Resolved'])
  status: AlertStatus;
}
