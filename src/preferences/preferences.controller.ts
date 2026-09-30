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
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { PreferencesService } from './preferences.service';

@ApiTags('Preferences')
@ApiBearerAuth()
@Controller('preferences')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Create preferences (admins only)' })
  @ApiResponse({ status: 201, description: 'Preferences created successfully' })
  create(@Body() dto: CreatePreferenceDto, @CurrentUser() currentUser: User) {
    return this.preferencesService.create(dto, currentUser);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get preferences in user scope' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  findAll(
    @CurrentUser() currentUser: User,
    @Query('residentId') residentId?: string,
    @Query('branchId') branchId?: string,
    @Query('facilityId') facilityId?: string,
  ) {
    return this.preferencesService.findAll(currentUser, { residentId, branchId, facilityId });
  }

  @Get('resident/:residentId')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get preferences for a resident (scoped)' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  findByResident(@Param('residentId') residentId: string, @CurrentUser() currentUser: User) {
    return this.preferencesService.findByResidentId(residentId, currentUser);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get preferences by id (scoped)' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.preferencesService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Update preferences (admins only)' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  update(@Param('id') id: string, @Body() dto: UpdatePreferenceDto, @CurrentUser() currentUser: User) {
    return this.preferencesService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete preferences (admins only)' })
  @ApiResponse({ status: 200, description: 'Preferences deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.preferencesService.remove(id, currentUser);
  }
}

