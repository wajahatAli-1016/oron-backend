import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import type { Request } from 'express';
import { GetBranchesQueryDto } from './dto/get-branches-query.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

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
  @Roles(Role.OWNER)
  async create(
    @Body() createBranchDto: CreateBranchDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    return this.branchService.create(
      createBranchDto,
      currentUser,
      this.getClientIp(req),
    );
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN)
  @ApiOperation({ summary: 'Get paginated branches in your scope' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() query: GetBranchesQueryDto,
  ) {
    return this.branchService.findAll(currentUser, query);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.branchService.findOne(id, currentUser);
  }

  @Patch(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
  ) {
    return this.branchService.update(
      id,
      updateBranchDto,
      currentUser,
      this.getClientIp(req),
    );
  }
}
