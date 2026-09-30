import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { RiskProfilesService } from './risk-profiles.service';
import { CreateRiskProfileDto } from './dto/create-risk-profile.dto';
import { UpdateRiskProfileDto } from './dto/update-risk-profile.dto';

@ApiTags('Risk Profiles')
@ApiBearerAuth()
@Controller('risk-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RiskProfilesController {
  constructor(private readonly riskProfilesService: RiskProfilesService) {}

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Create a risk profile (admins only)' })
  @ApiResponse({ status: 201, description: 'Risk profile created successfully' })
  create(@Body() dto: CreateRiskProfileDto, @CurrentUser() currentUser: User) {
    return this.riskProfilesService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get risk profiles in user scope' })
  @ApiResponse({ status: 200, description: 'Risk profiles retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('residentId') residentId?: string,
    @Query('branchId') branchId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.riskProfilesService.findAll(currentUser, { residentId, branchId, facilityId });
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get risk profiles for a resident (scoped)' })
  @ApiResponse({ status: 200, description: 'Risk profiles retrieved successfully' })
  findByResident(@Param('residentId') residentId: string, @CurrentUser() currentUser: User) {
    return this.riskProfilesService.findByResidentId(residentId, currentUser);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a risk profile by id (scoped)' })
  @ApiResponse({ status: 200, description: 'Risk profile retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.riskProfilesService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update a risk profile (admins only)' })
  @ApiResponse({ status: 200, description: 'Risk profile updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdateRiskProfileDto, @CurrentUser() currentUser: User) {
    return this.riskProfilesService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete a risk profile (admins only)' })
  @ApiResponse({ status: 200, description: 'Risk profile deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.riskProfilesService.remove(id, currentUser);
  }
}

