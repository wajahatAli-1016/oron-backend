import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FacilityService } from './facility.service';
import { CreateFacilityDto } from './dto/create-facility.dto';
import { UpdateFacilityDto } from './dto/update-facility.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMemoryMulterOptions } from '../common/utils/multer.util';
import { GetFacilitiesQueryDto } from './dto/get-facilities-query.dto';

@ApiTags('Facilities')
@ApiBearerAuth()
@Controller('facilities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @Roles(Role.OWNER)
  @UseInterceptors(
    FileInterceptor(
      'contractDocument',
      createMemoryMulterOptions(['application/pdf'], 10 * 1024 * 1024),
    ),
  )
  async create(
    @Body() createFacilityDto: CreateFacilityDto,
    @CurrentUser() owner: User,
    @UploadedFile() contractDocument?: Express.Multer.File,
  ) {
    const normalizedDto = this.normalizeCreateDto(createFacilityDto);
    return this.facilityService.create(normalizedDto, owner, contractDocument);
  }

  @Get()
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Get paginated facilities' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async findAll(@Query() query: GetFacilitiesQueryDto) {
    return this.facilityService.findAll(query);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.facilityService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateFacilityDto: UpdateFacilityDto,
    @CurrentUser() owner: User,
  ) {
    return this.facilityService.update(id, updateFacilityDto, owner);
  }

  private normalizeCreateDto(createFacilityDto: CreateFacilityDto): CreateFacilityDto {
    if (!createFacilityDto.contractStart || !createFacilityDto.contractEnd) {
      throw new BadRequestException('Contract dates are required');
    }
    return createFacilityDto;
  }
}
