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
import { CarePlansService } from './care-plans.service';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';

@ApiTags('Care Plans')
@ApiBearerAuth()
@Controller('care-plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarePlansController {
  constructor(private readonly carePlansService: CarePlansService) {}

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Create a new care plan (admins only)' })
  @ApiResponse({ status: 201, description: 'Care plan created successfully' })
  create(@Body() dto: CreateCarePlanDto, @CurrentUser() currentUser: User) {
    return this.carePlansService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get care plans in user scope' })
  @ApiResponse({ status: 200, description: 'Care plans retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('residentId') residentId?: string,
    @Query('branchId') branchId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.carePlansService.findAll(currentUser, { residentId, branchId, facilityId });
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get care plans for a resident (scoped)' })
  @ApiResponse({ status: 200, description: 'Care plans retrieved successfully' })
  findByResident(@Param('residentId') residentId: string, @CurrentUser() currentUser: User) {
    return this.carePlansService.findByResidentId(residentId, currentUser);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a care plan by id (scoped)' })
  @ApiResponse({ status: 200, description: 'Care plan retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.carePlansService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update a care plan (admins only)' })
  @ApiResponse({ status: 200, description: 'Care plan updated successfully' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCarePlanDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.carePlansService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete a care plan (admins only)' })
  @ApiResponse({ status: 200, description: 'Care plan deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.carePlansService.remove(id, currentUser);
  }
}

