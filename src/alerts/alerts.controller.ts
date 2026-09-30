import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { UpdateAlertStatusDto } from './dto/update-alert-status.dto';

@ApiTags('Alerts')
@ApiBearerAuth()
@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all alerts in user scope' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  findAll(@CurrentUser() currentUser: User) {
    return this.alertsService.findAll(currentUser);
  }

  @Patch(':id/status')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({ status: 200, description: 'Alert status updated successfully' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAlertStatusDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.alertsService.updateStatus(id, body.status, currentUser);
  }
}
