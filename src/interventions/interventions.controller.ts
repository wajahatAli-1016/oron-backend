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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.model';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { UpdateInterventionDto } from './dto/update-intervention.dto';
import { InterventionsService } from './interventions.service';

@ApiTags('Interventions')
@ApiBearerAuth()
@Controller('interventions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterventionsController {
  constructor(private readonly interventionsService: InterventionsService) {}

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Create an intervention (admins only)' })
  @ApiResponse({ status: 201, description: 'Intervention created successfully' })
  create(@Body() dto: CreateInterventionDto, @CurrentUser() currentUser: User) {
    return this.interventionsService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get interventions in user scope' })
  @ApiResponse({ status: 200, description: 'Interventions retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('residentId') residentId?: string,
    @Query('branchId') branchId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.interventionsService.findAll(currentUser, { residentId, branchId, facilityId });
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get interventions for a resident (scoped)' })
  @ApiResponse({ status: 200, description: 'Interventions retrieved successfully' })
  findByResident(@Param('residentId') residentId: string, @CurrentUser() currentUser: User) {
    return this.interventionsService.findByResidentId(residentId, currentUser);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get an intervention by id (scoped)' })
  @ApiResponse({ status: 200, description: 'Intervention retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.interventionsService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update an intervention (admins only)' })
  @ApiResponse({ status: 200, description: 'Intervention updated successfully' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInterventionDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.interventionsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete an intervention (admins only)' })
  @ApiResponse({ status: 200, description: 'Intervention deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.interventionsService.remove(id, currentUser);
  }
}

