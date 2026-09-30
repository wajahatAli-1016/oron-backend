import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetStaffQueryDto } from './dto/get-staff-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { StaffService } from './staff.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import type { Request } from 'express';

@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
      return forwarded[0];
    }
    return req.ip ?? '';
  }

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({
    summary:
      'Create staff (facility admin can choose branch; branch admin can use own branch only)',
  })
  @ApiResponse({ status: 201, description: 'Staff created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  create(
    @Body() createStaffDto: CreateStaffDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    return this.staffService.create(
      createStaffDto,
      currentUser,
      this.getClientIp(req),
    );
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get paginated staff in your scope' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Staff list retrieved successfully' })
  findAll(@CurrentUser() currentUser: User, @Query() query: GetStaffQueryDto) {
    return this.staffService.findAll(currentUser, query);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    const staff = await this.staffService.findOne(id, currentUser);
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update staff member by ID' })
  @ApiResponse({ status: 200, description: 'Staff member updated successfully' })
  @ApiResponse({ status: 404, description: 'Staff member not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStaffDto: UpdateStaffDto,
    @CurrentUser() currentUser: User,
  ) {
    const staff = await this.staffService.updateStaff(id, updateStaffDto, currentUser);
    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }
    return staff;
  }
}
