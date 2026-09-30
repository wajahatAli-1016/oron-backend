import { Module } from '@nestjs/common';
import { FacilityModule } from '../facility/facility.module';
import { BranchModule } from '../branch/branch.module';
import { ResidentsModule } from '../residents/residents.module';
import { AlertsModule } from '../alerts/alerts.module';
import { UsersModule } from '../users/users.module';
import { OwnerDashboardController } from './owner/owner-dashboard.controller';
import { OwnerDashboardService } from './owner/owner-dashboard.service';
import { FacilityDashboardController } from './facility/facility-dashboard.controller';
import { FacilityDashboardService } from './facility/facility-dashboard.service';
import { BranchDashboardController } from './branch/branch-dashboard.controller';
import { BranchDashboardService } from './branch/branch-dashboard.service';
import { StaffDashboardController } from './staff/staff-dashboard.controller';
import { StaffDashboardService } from './staff/staff-dashboard.service';
import { TaskModule } from '../task/task.module';
import { StaffModule } from '../staff/staff.module';

/**
 * Role-scoped dashboard aggregates under `dashboards/*`.
 */
@Module({
  imports: [
    FacilityModule,
    BranchModule,
    ResidentsModule,
    AlertsModule,
    UsersModule,
    TaskModule,
    StaffModule,
  ],
  controllers: [
    OwnerDashboardController,
    FacilityDashboardController,
    BranchDashboardController,
    StaffDashboardController,
  ],
  providers: [
    OwnerDashboardService,
    FacilityDashboardService,
    BranchDashboardService,
    StaffDashboardService,
  ],
})
export class DashboardsModule {}
