import { Injectable } from '@nestjs/common';
import { ResidentsService } from '../../residents/residents.service';
import { TaskService } from '../../task/task.service';
import { AlertsService } from '../../alerts/alerts.service';
import { User } from '../../users/user.model';

const DASHBOARD_LIST_LIMIT = 10_000;

@Injectable()
export class StaffDashboardService {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly taskService: TaskService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Staff overview: assigned tasks, branch alerts, residents linked via assignments.
   */
  async getSnapshot(currentUser: User) {
    const listQuery = { page: 1, limit: DASHBOARD_LIST_LIMIT };

    const [branchTasks, alerts, residentsResult] = await Promise.all([
      this.taskService.findAll(currentUser),
      this.alertsService.findAll(currentUser),
      this.residentsService.findAll(currentUser, listQuery),
    ]);

    const tasks = branchTasks.filter(
      (task) => task.assignedToId === currentUser.id,
    );

    const residentIds = new Set(
      tasks.map((task) => task.residentId).filter(Boolean),
    );
    const residents = residentsResult.data.filter((resident) =>
      residentIds.has(String(resident.id)),
    );

    const pendingTasks = tasks.filter(
      (task) => task.status === 'TODO' || task.status === 'IN_PROGRESS',
    );
    const completedTasks = tasks.filter((task) => task.status === 'DONE');
    const activeAlerts = alerts.filter((alert) => alert.status !== 'Resolved');

    return {
      staffId: currentUser.id,
      branchId: currentUser.branchId ?? null,
      tasks,
      alerts,
      residents,
      totals: {
        tasks: tasks.length,
        residents: residents.length,
        alerts: alerts.length,
        pendingTasks: pendingTasks.length,
        completedTasks: completedTasks.length,
        activeAlerts: activeAlerts.length,
      },
    };
  }
}
