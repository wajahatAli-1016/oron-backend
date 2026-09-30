import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';
import { Alert } from './alert.model';

export type AlertRealtimeEvent =
  | { type: 'created'; alert: Alert }
  | { type: 'updated'; alert: Alert };

@Injectable()
export class AlertsRealtimeService {
  private readonly events$ = new Subject<AlertRealtimeEvent>();

  emitCreated(alert: Alert): void {
    this.events$.next({ type: 'created', alert });
  }

  emitUpdated(alert: Alert): void {
    this.events$.next({ type: 'updated', alert });
  }

  onEvent() {
    return this.events$.asObservable();
  }
}
