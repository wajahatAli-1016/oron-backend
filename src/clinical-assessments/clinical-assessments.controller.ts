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
import { ClinicalAssessmentsService } from './clinical-assessments.service';
import { CreateClinicalAssessmentDto } from './dto/create-clinical-assessment.dto';
import { UpdateClinicalAssessmentDto } from './dto/update-clinical-assessment.dto';

@ApiTags('Clinical Assessments')
@ApiBearerAuth()
@Controller('clinical-assessments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalAssessmentsController {
  constructor(private readonly clinicalAssessmentsService: ClinicalAssessmentsService) {}

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Create a clinical assessment (admins only)' })
  @ApiResponse({ status: 201, description: 'Clinical assessment created successfully' })
  create(@Body() dto: CreateClinicalAssessmentDto, @CurrentUser() currentUser: User) {
    return this.clinicalAssessmentsService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get clinical assessments in user scope' })
  @ApiResponse({ status: 200, description: 'Clinical assessments retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('residentId') residentId?: string,
    @Query('branchId') branchId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.clinicalAssessmentsService.findAll(currentUser, { residentId, branchId, facilityId });
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get clinical assessments for a resident (scoped)' })
  @ApiResponse({ status: 200, description: 'Clinical assessments retrieved successfully' })
  findByResident(@Param('residentId') residentId: string, @CurrentUser() currentUser: User) {
    return this.clinicalAssessmentsService.findByResidentId(residentId, currentUser);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a clinical assessment by id (scoped)' })
  @ApiResponse({ status: 200, description: 'Clinical assessment retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.clinicalAssessmentsService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update a clinical assessment (admins only)' })
  @ApiResponse({ status: 200, description: 'Clinical assessment updated successfully' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicalAssessmentDto,
    @CurrentUser() currentUser: User,
  ) {
    return this.clinicalAssessmentsService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete a clinical assessment (admins only)' })
  @ApiResponse({ status: 200, description: 'Clinical assessment deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.clinicalAssessmentsService.remove(id, currentUser);
  }
}

