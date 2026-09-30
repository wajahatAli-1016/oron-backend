import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Alert, AlertStatus, AlertSeverity } from './alert.model';
import { Facility } from '../facility/facility.model';
import { Branch } from '../branch/branch.model';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';
import { ThresholdResult } from '../vitals/clinical-status.util';
import { OneSignalService } from '../notifications/one-signal.service';
import { AlertsRealtimeService } from './alerts-realtime.service';
import { AlertCreationAttributes } from './alert.model';

interface VitalAlertContext {
  vitalId: string;
  facilityId: string;
  branchId: string;
  residentId: string;
  residentName: string;
  measuredAt: Date;
  thresholdEvaluation: Record<string, ThresholdResult>;
  healthState?: string;
}

interface TaskAssignedAlertContext {
  facilityId: string;
  branchId: string;
  residentId: string;
  assignedToUserId: string;
  title: string;
  dueDate?: string | Date;
  category?: string;
  description?: string;
  createdAt?: Date;
}

interface BranchUtilizationAlertContext {
  facilityId: string;
  branchId: string;
  branchName: string;
  residentLimit: number;
  currentResidents: number;
  utilizationPercent: number;
  createdAt?: Date;
}

const CONTRACT_EXPIRING_TITLE_PREFIX = 'Contract expiring soon';
const CONTRACT_EXPIRY_WARNING_DAYS = 5;
const BRANCH_HIGH_UTILIZATION_PERCENT = 90;
const HIGH_BRANCH_UTILIZATION_TITLE = 'High branch utilization';

@Injectable()
export class AlertsService {
  constructor(
    @InjectModel(Alert)
    private readonly alertModel: typeof Alert,
    @InjectModel(Facility)
    private readonly facilityModel: typeof Facility,
    @InjectModel(Branch)
    private readonly branchModel: typeof Branch,
    private readonly oneSignalService: OneSignalService,
    private readonly alertsRealtime: AlertsRealtimeService,
  ) {}

  private scheduleRealtimeCreated(alert: Alert, transaction?: Transaction): void {
    const emit = () => {
      void this.alertModel.findByPk(alert.id).then((fresh) => {
        if (fresh) {
          this.alertsRealtime.emitCreated(fresh);
        }
      });
    };
    if (transaction) {
      transaction.afterCommit(emit);
    } else {
      emit();
    }
  }

  private async createAlertRecord(
    alertPayload: AlertCreationAttributes,
    transaction?: Transaction,
  ): Promise<Alert> {
    const alert = await this.alertModel.create(alertPayload, { transaction });
    this.scheduleRealtimeCreated(alert, transaction);
    return alert;
  }

  private startOfTodayUtc(): Date {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return start;
  }

  private computeUtilizationPercent(currentResidents: number, residentLimit: number): number {
    if (!residentLimit || residentLimit <= 0) {
      return 0;
    }
    return Math.round((currentResidents / residentLimit) * 100);
  }

  private async hasBranchUtilizationAlertToday(
    branchId: string,
    startOfTodayUtc: Date,
  ): Promise<boolean> {
    const existing = await this.alertModel.findOne({
      where: {
        branchId,
        title: HIGH_BRANCH_UTILIZATION_TITLE,
        createdAt: { [Op.gte]: startOfTodayUtc },
      },
    });
    return Boolean(existing);
  }

  async createFromBranchHighUtilization(
    context: BranchUtilizationAlertContext,
    transaction?: Transaction,
  ): Promise<void> {
    const utilization = Math.round(context.utilizationPercent);
    if (utilization < BRANCH_HIGH_UTILIZATION_PERCENT) {
      return;
    }

    const startOfTodayUtc = this.startOfTodayUtc();
    if (await this.hasBranchUtilizationAlertToday(context.branchId, startOfTodayUtc)) {
      return;
    }

    const severity: AlertSeverity = utilization >= 100 ? 'Critical' : 'Warning';

    const alertPayload = {
      facilityId: context.facilityId,
      branchId: context.branchId,
      residentId: null,
      title: HIGH_BRANCH_UTILIZATION_TITLE,
      message: `${context.branchName} is at ${utilization}% capacity (${context.currentResidents}/${context.residentLimit}).`,
      severity,
      status: 'Unread' as AlertStatus,
      date: context.createdAt ?? new Date(),
      targetRoles: ['owner'],
      healthState: null,
      sourceVitalId: null,
    };

    await this.createAlertRecord(alertPayload, transaction);

    const pushItems = [
      {
        title: alertPayload.title,
        message: alertPayload.message,
        severity: alertPayload.severity,
      },
    ];

    const schedulePush = () => {
      void this.oneSignalService.notifyOwners(pushItems);
    };
    if (transaction) {
      transaction.afterCommit(schedulePush);
    } else {
      schedulePush();
    }
  }

  async createFromTaskAssignment(
    context: TaskAssignedAlertContext,
    transaction?: Transaction,
  ): Promise<void> {
    const due =
      context.dueDate !== undefined && context.dueDate !== null
        ? new Date(context.dueDate).toLocaleString()
        : undefined;

    const lines = [
      context.category ? `Category: ${context.category}` : undefined,
      due ? `Due: ${due}` : undefined,
      context.description ? context.description : undefined,
    ].filter(Boolean) as string[];

    const message = lines.length
      ? `${context.title} — ${lines.join(' • ')}`
      : context.title;

    await this.createAlertRecord(
      {
        facilityId: context.facilityId,
        branchId: context.branchId,
        residentId: context.residentId,
        title: 'Task assigned',
        message,
        severity: 'Info',
        status: 'Unread',
        date: context.createdAt ?? new Date(),
        // Staff should see it in the header bell (/alerts).
        targetRoles: ['staff'],
        healthState: null,
        sourceVitalId: null,
      },
      transaction,
    );
  }

  async createFromVitalAbnormalities(
    context: VitalAlertContext,
    transaction?: Transaction,
  ): Promise<void> {
    const abnormalities = Object.values(context.thresholdEvaluation).filter(
      (evaluation) => evaluation.level !== 'NORMAL',
    );

    if (abnormalities.length === 0) {
      return;
    }

    const hasCritical = abnormalities.some(
      (e) => e.level === 'CRITICAL_HIGH' || e.level === 'CRITICAL_LOW',
    );
    const severity: AlertSeverity = hasCritical ? 'Critical' : 'Warning';
    const status: AlertStatus = 'Unread';

    const messageLines = abnormalities
      .map((e) => this.formatAbnormality(e))
      .filter(Boolean);

    const title = `Vitals alert (${abnormalities.length})`;
    const message = `${context.residentName} recorded vitals outside the normal range: ${messageLines.join(
      '; ',
    )}.`;

    const alertPayload = {
      facilityId: context.facilityId,
      branchId: context.branchId,
      residentId: context.residentId,
      title,
      message,
      severity,
      status,
      date: context.measuredAt,
      targetRoles: ['admin', 'staff', 'facility_admin'],
      healthState: context.healthState ?? null,
      sourceVitalId: context.vitalId,
    };

    await this.createAlertRecord(alertPayload, transaction);

    const pushItems = [
      {
        title: alertPayload.title,
        message: alertPayload.message,
        severity: alertPayload.severity,
      },
    ];
    const facilityId = context.facilityId;
    const branchId = context.branchId;
    const schedulePush = () => {
      void this.oneSignalService.notifyNewAlerts(facilityId, branchId, pushItems);
    };
    if (transaction) {
      transaction.afterCommit(schedulePush);
    } else {
      schedulePush();
    }
  }

  async syncContractExpiryOwnerAlerts(): Promise<void> {
    const startOfTodayUtc = this.startOfTodayUtc();

    const facilities = await this.facilityModel.findAll({
      where: {
        contractEnd: { [Op.gte]: startOfTodayUtc },
      },
    });

    for (const facility of facilities) {
      await this.createContractExpiringOwnerAlertIfNeededForToday(facility, startOfTodayUtc);
    }
  }

  async evaluateContractExpiryForFacility(facilityId: string): Promise<void> {
    const facility = await this.facilityModel.findByPk(facilityId);
    if (!facility) {
      return;
    }
    await this.createContractExpiringOwnerAlertIfNeededForToday(
      facility,
      this.startOfTodayUtc(),
    );
  }

  async syncBranchUtilizationOwnerAlerts(): Promise<void> {
    const startOfTodayUtc = this.startOfTodayUtc();
    const branches = await this.branchModel.findAll();

    for (const branch of branches) {
      const utilization = this.computeUtilizationPercent(
        branch.currentResidents,
        branch.residentLimit,
      );
      if (utilization < BRANCH_HIGH_UTILIZATION_PERCENT) {
        continue;
      }
      if (await this.hasBranchUtilizationAlertToday(branch.id, startOfTodayUtc)) {
        continue;
      }

      await this.createFromBranchHighUtilization({
        facilityId: branch.facilityId,
        branchId: branch.id,
        branchName: branch.name,
        residentLimit: branch.residentLimit,
        currentResidents: branch.currentResidents,
        utilizationPercent: utilization,
      });
    }
  }

  /** Runs contract-expiry + branch-utilization checks (scheduler + manual hooks). */
  async syncOwnerOperationalAlerts(): Promise<void> {
    await this.syncContractExpiryOwnerAlerts();
    await this.syncBranchUtilizationOwnerAlerts();
  }

  private async createContractExpiringOwnerAlertIfNeededForToday(
    facility: Facility,
    startOfTodayUtc: Date,
  ): Promise<void> {
    const existing = await this.alertModel.findOne({
      where: {
        facilityId: facility.id,
        title: { [Op.like]: `${CONTRACT_EXPIRING_TITLE_PREFIX}%` },
        createdAt: { [Op.gte]: startOfTodayUtc },
      },
    });
    if (existing) {
      return;
    }

    const todayUtc = new Date(startOfTodayUtc);
    const endUtc = new Date(facility.contractEnd);
    endUtc.setUTCHours(0, 0, 0, 0);
    const msPerDay = 86_400_000;
    const daysRemaining = Math.round((endUtc.getTime() - todayUtc.getTime()) / msPerDay);
    if (daysRemaining < 0 || daysRemaining > CONTRACT_EXPIRY_WARNING_DAYS) {
      return;
    }

    const title = `${CONTRACT_EXPIRING_TITLE_PREFIX}: ${facility.name}`;
    const endLabel = endUtc.toLocaleDateString('en-US');
    const message = `The contract for ${facility.name} ends on ${endLabel}. ${daysRemaining} day(s) remaining.`;
    const severity: AlertSeverity = daysRemaining <= 1 ? 'Critical' : 'Warning';

    await this.createAlertRecord({
      facilityId: facility.id,
      branchId: null,
      residentId: null,
      title,
      message,
      severity,
      status: 'Unread',
      date: new Date(),
      targetRoles: ['owner'],
      healthState: null,
      sourceVitalId: null,
    });

    void this.oneSignalService.notifyOwners([{ title, message, severity }]);
  }

  async findAll(currentUser: User): Promise<Alert[]> {
    const whereClause = this.buildWhereClause(currentUser);
    const roleFilter = this.toTargetRole(currentUser.role);

    return this.alertModel.findAll({
      where: whereClause,
      order: [['date', 'DESC']],
    }).then((alerts) => alerts.filter((alert) => alert.targetRoles.includes(roleFilter)));
  }

  async updateStatus(
    id: string,
    status: AlertStatus,
    currentUser: User,
  ): Promise<Alert> {
    const alert = await this.alertModel.findByPk(id);
    if (!alert) {
      throw new NotFoundException('Alert not found');
    }

    const scoped = this.isAlertInScope(alert, currentUser);
    if (!scoped) {
      throw new ForbiddenException('Cannot update alerts outside your scope');
    }

    await alert.update({ status });
    await alert.reload();
    this.alertsRealtime.emitUpdated(alert);
    return alert;
  }

  private buildWhereClause(currentUser: User): Record<string, unknown> {
    switch (currentUser.role) {
      case Role.OWNER:
        return {};
      case Role.FACILITY_ADMIN:
        return { facilityId: currentUser.facilityId };
      case Role.BRANCH_ADMIN:
      case Role.STAFF:
        return { branchId: currentUser.branchId };
      default:
        return {};
    }
  }

  private isAlertInScope(alert: Alert, currentUser: User): boolean {
    if (currentUser.role === Role.OWNER) {
      return true;
    }
    if (currentUser.role === Role.FACILITY_ADMIN) {
      return alert.facilityId === currentUser.facilityId;
    }
    return alert.branchId === currentUser.branchId;
  }

  private toTargetRole(role: Role): string {
    switch (role) {
      case Role.OWNER:
        return 'owner';
      case Role.FACILITY_ADMIN:
        return 'facility_admin';
      case Role.BRANCH_ADMIN:
        return 'admin';
      case Role.STAFF:
        return 'staff';
      default:
        return 'staff';
    }
  }

  private buildAlertTitle(evaluation: ThresholdResult): string {
    const vitalLabel = this.formatVitalName(evaluation.vitalType);
    if (evaluation.level === 'CRITICAL_HIGH' || evaluation.level === 'HIGH') {
      return `High ${vitalLabel}`;
    }
    return `Low ${vitalLabel}`;
  }

  private buildAlertMessage(residentName: string, evaluation: ThresholdResult): string {
    const relation =
      evaluation.level === 'CRITICAL_HIGH' || evaluation.level === 'HIGH'
        ? 'above'
        : 'below';

    return `${residentName} recorded ${this.formatVitalName(evaluation.vitalType)} of ${
      evaluation.value
    } ${evaluation.unit}, ${relation} threshold (${evaluation.ruleName}).`;
  }

  private formatVitalName(vitalType: string): string {
    const labels: Record<string, string> = {
      systolicBP: 'Systolic BP',
      diastolicBP: 'Diastolic BP',
      heartRate: 'Heart Rate',
      temperature: 'Temperature',
      oxygenSaturation: 'Oxygen Saturation',
      bloodSugar: 'Blood Sugar',
      respiratoryRate: 'Respiratory Rate',
    };
    return labels[vitalType] ?? vitalType;
  }

  private formatAbnormality(evaluation: ThresholdResult): string {
    const vitalLabel = this.formatVitalName(evaluation.vitalType);
    const direction =
      evaluation.level === 'LOW' || evaluation.level === 'CRITICAL_LOW' ? 'low' : 'high';
    const criticalPrefix =
      evaluation.level === 'CRITICAL_HIGH' || evaluation.level === 'CRITICAL_LOW'
        ? 'CRITICAL '
        : '';
    const ruleSuffix = evaluation.ruleName ? ` (${evaluation.ruleName})` : '';
    return `${vitalLabel}: ${criticalPrefix}${direction} (${evaluation.value} ${evaluation.unit})${ruleSuffix}`;
  }
}
