import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { VitalsService } from './vitals.service';
import { CreateVitalDto } from './dto/create-vital.dto';

@ApiTags('Vitals')
@ApiBearerAuth()
@Controller('vitals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VitalsController {
  constructor(private readonly vitalsService: VitalsService) {}

  @Post()
  @Roles(Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a vital record' })
  @ApiResponse({ status: 201, description: 'Vital created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() createVitalDto: CreateVitalDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.vitalsService.create(createVitalDto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all vitals in user scope' })
  @ApiResponse({ status: 200, description: 'Vitals retrieved successfully' })
  async findAll(@CurrentUser() currentUser: User) {
    return this.vitalsService.findAll(currentUser);
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get vitals by resident' })
  @ApiResponse({ status: 200, description: 'Resident vitals retrieved successfully' })
  async findByResident(
    @Param('residentId') residentId: string,
    @CurrentUser() currentUser: User,
  ) {
    return this.vitalsService.findByResident(residentId, currentUser);
  }
}
