import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class OneSignalService {
  private readonly logger = new Logger(OneSignalService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async notifyOwners(
    items: Array<{ title: string; message: string; severity: string }>,
  ): Promise<void> {
    const externalIds = await this.resolveOwnerUserIds();
    if (externalIds.length === 0) {
      return;
    }
    for (const item of items) {
      const severityPrefix = item.severity === 'Critical' ? '[CRITICAL]' : '[ALERT]';
      await this.sendNotification({
        include_external_user_ids: externalIds,
        headings: { en: `${severityPrefix} ${item.title}` },
        contents: { en: item.message },
        data: { type: 'alert', severity: item.severity },
      });
    }
  }

  async notifyNewAlerts(
    facilityId: string,
    branchId: string,
    items: Array<{ title: string; message: string; severity: string }>,
  ): Promise<void> {
    const externalIds = await this.resolveAlertRecipientUserIds(facilityId, branchId);
    if (externalIds.length === 0) {
      return;
    }
    for (const item of items) {
      const severityPrefix = item.severity === 'Critical' ? '[CRITICAL]' : '[ALERT]';
      await this.sendNotification({
        include_external_user_ids: externalIds,
        headings: { en: `${severityPrefix} ${item.title}` },
        contents: { en: item.message },
        data: { type: 'alert', severity: item.severity },
      });
    }
  }

  async notifyTaskAssigned(params: {
    assignedToUserId: string;
    title: string;
    dueDate?: string | Date;
    category?: string;
    description?: string;
  }): Promise<void> {
    const due =
      params.dueDate !== undefined && params.dueDate !== null
        ? new Date(params.dueDate).toLocaleString()
        : undefined;
    const lines = [
      params.category ? `Category: ${params.category}` : undefined,
      due ? `Due: ${due}` : undefined,
      params.description ? params.description : undefined,
    ].filter(Boolean) as string[];

    await this.sendNotification({
      include_external_user_ids: [params.assignedToUserId],
      headings: { en: 'New task assigned' },
      contents: { en: lines.length ? `${params.title}\n${lines.join('\n')}` : params.title },
      data: {
        type: 'task_assigned',
        category: params.category,
        dueDate: due,
      },
    });
  }

  private async resolveAlertRecipientUserIds(
    facilityId: string,
    branchId: string,
  ): Promise<string[]> {
    const rows = await this.userModel.findAll({
      where: {
        [Op.or]: [
          { role: Role.FACILITY_ADMIN, facilityId },
          { role: Role.BRANCH_ADMIN, branchId },
          { role: Role.STAFF, branchId },
        ],
      },
      attributes: ['id'],
    });
    return [...new Set(rows.map((u) => u.id))];
  }

  private async resolveOwnerUserIds(): Promise<string[]> {
    const rows = await this.userModel.findAll({
      where: { role: Role.OWNER },
      attributes: ['id'],
    });
    return [...new Set(rows.map((u) => u.id))];
  }

  private async sendNotification(body: Record<string, unknown>): Promise<void> {
    const disable = (this.config.get<string>('DISABLE_BROWSER_NOTIFICATIONS') || '')
      .toLowerCase() === 'true';
    if (disable) {
      return;
    }

    const appId = this.config.get<string>('ONESIGNAL_APP_ID');
    const apiKey = this.config.get<string>('ONESIGNAL_REST_API_KEY');
    if (!appId || !apiKey) {
      return;
    }

    try {
      const res = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Authorization: `Key ${apiKey}`,
        },
        body: JSON.stringify({
          app_id: appId,
          target_channel: 'push',
          ...body,
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        this.logger.warn(`OneSignal notification failed: ${res.status} ${text}`);
        return;
      }
      this.logger.log(`OneSignal notification sent: ${text}`);
    } catch (err) {
      this.logger.warn(
        `OneSignal request error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
