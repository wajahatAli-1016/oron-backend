import { Injectable } from '@nestjs/common';
import { FacilityService } from '../../facility/facility.service';
import { BranchService } from '../../branch/branch.service';
import { ResidentsService } from '../../residents/residents.service';
import { AlertsService } from '../../alerts/alerts.service';
import { User } from '../../users/user.model';

/** Fetch full owner-scoped lists for dashboard aggregates (not table page size). */
const DASHBOARD_LIST_LIMIT = 10_000;

@Injectable()
export class OwnerDashboardService {
  constructor(
    private readonly facilityService: FacilityService,
    private readonly branchService: BranchService,
    private readonly residentsService: ResidentsService,
    private readonly alertsService: AlertsService,
  ) {}

  /**
   * Aggregates owner-scoped lists for the platform overview in one round trip.
   * Facility / branch / staff dashboards can follow the same pattern under `dashboards/`.
   */
  async getSnapshot(currentUser: User) {
    const listQuery = { page: 1, limit: DASHBOARD_LIST_LIMIT };

    const [facilitiesResult, branchesResult, residentsResult, alerts] =
      await Promise.all([
        this.facilityService.findAll(listQuery),
        this.branchService.findAll(currentUser, listQuery),
        this.residentsService.findAll(currentUser, listQuery),
        this.alertsService.findAll(currentUser),
      ]);

    return {
      facilities: facilitiesResult.data,
      branches: branchesResult.data,
      residents: residentsResult.data,
      totals: {
        facilities: facilitiesResult.total,
        branches: branchesResult.total,
        residents: residentsResult.total,
      },
      alerts,
    };
  }
}
