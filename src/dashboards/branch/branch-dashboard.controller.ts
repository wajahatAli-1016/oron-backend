import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/user.model';
import { BranchDashboardService } from './branch-dashboard.service';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchDashboardController {
  constructor(private readonly branchDashboardService: BranchDashboardService) {}

  @Get('branch')
  @Roles(Role.BRANCH_ADMIN)
  @ApiOperation({
    summary: 'Branch admin overview (residents, tasks, alerts, staff)',
  })
  @ApiResponse({ status: 200, description: 'Dashboard payload' })
  getBranch(@CurrentUser() currentUser: User) {
    return this.branchDashboardService.getSnapshot(currentUser);
  }
}
