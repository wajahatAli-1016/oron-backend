import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@ApiTags('Rules')
@ApiBearerAuth()
@Controller('rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Create a new rule (owner only)' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  create(@Body() createRuleDto: CreateRuleDto) {
    return this.rulesService.create(createRuleDto);
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get all rules' })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  findAll() {
    return this.rulesService.findAll();
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get rule by id' })
  @ApiResponse({ status: 200, description: 'Rule retrieved successfully' })
  findOne(@Param('id') id: string) {
    return this.rulesService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Update rule (owner only)' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  update(@Param('id') id: string, @Body() updateRuleDto: UpdateRuleDto) {
    return this.rulesService.update(id, updateRuleDto);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Delete rule (owner only)' })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id);
  }
}
