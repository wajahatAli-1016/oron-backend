import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/user.model';
import { StaffDashboardService } from './staff-dashboard.service';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffDashboardController {
  constructor(private readonly staffDashboardService: StaffDashboardService) {}

  @Get('staff')
  @Roles(Role.STAFF)
  @ApiOperation({
    summary: 'Staff overview (assigned tasks, alerts, linked residents)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard payload' })
  getStaff(@CurrentUser() currentUser: User) {
    return this.staffDashboardService.getSnapshot(currentUser);
  }
}
