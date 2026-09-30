import { Injectable } from '@nestjs/common';
import { ResidentsService } from '../../residents/residents.service';
import { TaskService } from '../../task/task.service';
import { AlertsService } from '../../alerts/alerts.service';
import { StaffService } from '../../staff/staff.service';
import { User } from '../../users/user.model';

const DASHBOARD_LIST_LIMIT = 10_000;

@Injectable()
export class BranchDashboardService {
  constructor(
    private readonly residentsService: ResidentsService,
    private readonly taskService: TaskService,
    private readonly alertsService: AlertsService,
    private readonly staffService: StaffService,
  ) {}

  /**
   * Aggregates branch-admin-scoped lists in one round trip.
   */
  async getSnapshot(currentUser: User) {
    const listQuery = { page: 1, limit: DASHBOARD_LIST_LIMIT };

    const [residentsResult, tasks, alerts, staffResult] = await Promise.all([
      this.residentsService.findAll(currentUser, listQuery),
      this.taskService.findAll(currentUser),
      this.alertsService.findAll(currentUser),
      this.staffService.findAll(currentUser, listQuery),
    ]);

    const residents = residentsResult.data;
    const staff = staffResult.data;

    return {
      branchId: currentUser.branchId ?? null,
      residents,
      tasks,
      alerts,
      staff,
      totals: {
        residents: residentsResult.total,
        staff: staffResult.total,
        tasks: tasks.length,
        alerts: alerts.length,
      },
    };
  }
}
