import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/user.model';
import { FacilityDashboardService } from './facility-dashboard.service';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilityDashboardController {
  constructor(private readonly facilityDashboardService: FacilityDashboardService) {}

  @Get('facility')
  @Roles(Role.FACILITY_ADMIN)
  @ApiOperation({
    summary: 'Facility admin overview (branches, residents, staff, alerts)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard payload' })
  getFacility(@CurrentUser() currentUser: User) {
    return this.facilityDashboardService.getSnapshot(currentUser);
  }
}
