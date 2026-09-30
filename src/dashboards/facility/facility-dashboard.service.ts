import { Injectable } from '@nestjs/common';
import { BranchService } from '../../branch/branch.service';
import { ResidentsService } from '../../residents/residents.service';
import { UsersService } from '../../users/users.service';
import { AlertsService } from '../../alerts/alerts.service';
import { User } from '../../users/user.model';
import { Role } from '../../common/enums/role.enum';

const DASHBOARD_LIST_LIMIT = 10_000;

@Injectable()
export class FacilityDashboardService {
  constructor(
    private readonly branchService: BranchService,
    private readonly residentsService: ResidentsService,
    private readonly usersService: UsersService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Aggregates facility-admin-scoped lists in one round trip.
   */
  async getSnapshot(currentUser: User) {
    const listQuery = { page: 1, limit: DASHBOARD_LIST_LIMIT };

    const [branchesResult, residentsResult, users, alerts] = await Promise.all([
      this.branchService.findAll(currentUser, listQuery),
      this.residentsService.findAll(currentUser, listQuery),
      this.usersService.findAll(currentUser),
      this.alertsService.findAll(currentUser),
    ]);

    const branches = branchesResult.data;
    const branchIds = new Set(branches.map((branch) => branch.id));
    const staff = users.filter(
      (user) =>
        (user.role === Role.BRANCH_ADMIN || user.role === Role.STAFF) &&
        user.branchId &&
        branchIds.has(user.branchId),
    );

    return {
      facilityId: currentUser.facilityId ?? null,
      branches,
      residents: residentsResult.data,
      staff,
      alerts,
      totals: {
        branches: branchesResult.total,
        residents: residentsResult.total,
        staff: staff.length,
      },
    };
  }
}
