import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { Role } from '../common/enums/role.enum';
import { Alert } from './alert.model';
import { AlertsRealtimeService } from './alerts-realtime.service';

type SocketUser = {
  id: string;
  role: Role;
  facilityId?: string;
  branchId?: string;
};

@Injectable()
@WebSocketGateway({
  namespace: '/alerts',
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },
})
export class AlertsGateway
  implements
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    OnModuleDestroy
{
  private readonly logger = new Logger(AlertsGateway.name);
  private subscription?: Subscription;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly alertsRealtime: AlertsRealtimeService,
  ) {}

  /** Subscribe after Socket.IO server is ready (onModuleInit is too early). */
  afterInit(): void {
    this.subscription = this.alertsRealtime.onEvent().subscribe((event) => {
      if (event.type === 'created') {
        this.broadcastToTargetRoles(event.alert, 'alert:created');
      } else {
        this.broadcastToTargetRoles(event.alert, 'alert:updated');
      }
    });
  }

  onModuleDestroy(): void {
    this.subscription?.unsubscribe();
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        id?: string;
        sub?: string;
        role?: Role;
        facilityId?: string;
        branchId?: string;
      }>(token);

      const user: SocketUser = {
        id: (payload.id ?? payload.sub) as string,
        role: payload.role as Role,
        facilityId: payload.facilityId,
        branchId: payload.branchId,
      };

      if (!user.id || !user.role) {
        client.disconnect(true);
        return;
      }

      client.data.user = user;
      client.join(this.roleRoom(user.role));
      if (user.facilityId) {
        client.join(`facility:${user.facilityId}`);
      }
      if (user.branchId) {
        client.join(`branch:${user.branchId}`);
      }
      client.join(`user:${user.id}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // no-op
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }

  private roleRoom(role: Role | string): string {
    const key = String(role).toUpperCase();
    switch (key) {
      case Role.OWNER:
        return 'role:owner';
      case Role.FACILITY_ADMIN:
        return 'role:facility_admin';
      case Role.BRANCH_ADMIN:
        return 'role:admin';
      case Role.STAFF:
        return 'role:staff';
      default:
        return `role:${String(role).toLowerCase()}`;
    }
  }

  private getTargetRoles(alert: Alert): string[] {
    const raw = alert.targetRoles as unknown;
    if (Array.isArray(raw)) {
      return raw.map((role) => String(role).toLowerCase());
    }
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((role) => String(role).toLowerCase());
        }
      } catch {
        return [];
      }
    }
    return [];
  }

  private broadcastToTargetRoles(alert: Alert, eventName: 'alert:created' | 'alert:updated'): void {
    if (!this.server) {
      this.logger.warn(`${eventName} skipped — WebSocket server not ready`);
      return;
    }

    const payload = this.serializeAlert(alert);
    const rooms = new Set<string>();

    for (const targetRole of this.getTargetRoles(alert)) {
      if (targetRole === 'owner') {
        rooms.add('role:owner');
      }
      if (targetRole === 'facility_admin' && alert.facilityId) {
        rooms.add(`facility:${alert.facilityId}`);
      }
      if (targetRole === 'admin' || targetRole === 'staff') {
        if (alert.branchId) {
          rooms.add(`branch:${alert.branchId}`);
        }
        rooms.add(`role:${targetRole}`);
      }
    }

    for (const room of rooms) {
      this.server.to(room).emit(eventName, payload);
    }

    this.logger.debug(
      `${eventName} "${alert.title}" → ${[...rooms].join(', ') || '(no rooms)'}`,
    );
  }

  private serializeAlert(alert: Alert): Record<string, unknown> {
    const json = typeof alert.toJSON === 'function' ? alert.toJSON() : (alert as unknown as Record<string, unknown>);
    return {
      ...json,
      date:
        json.date instanceof Date
          ? json.date.toISOString()
          : json.date,
    };
  }
}
