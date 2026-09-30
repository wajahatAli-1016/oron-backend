import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/user.model';
import { OwnerDashboardService } from './owner-dashboard.service';

@ApiTags('Dashboards')
@ApiBearerAuth()
@Controller('dashboards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnerDashboardController {
  constructor(private readonly ownerDashboardService: OwnerDashboardService) {}

  @Get('owner')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Owner platform overview (facilities, branches, residents, alerts)' })
  @ApiResponse({ status: 200, description: 'Dashboard payload' })
  getOwner(@CurrentUser() currentUser: User) {
    return this.ownerDashboardService.getSnapshot(currentUser);
  }
}
