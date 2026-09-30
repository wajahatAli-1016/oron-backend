import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.model';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetResidentsQueryDto } from './dto/get-residents-query.dto';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMemoryMulterOptions } from '../common/utils/multer.util';

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

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
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @UseInterceptors(
    FileInterceptor(
      'residentPhoto',
      createMemoryMulterOptions(['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024),
    ),
  )
  @ApiOperation({ summary: 'Create a new resident record' })
  @ApiResponse({ status: 201, description: 'Resident created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(
    @Body() createResidentDto: CreateResidentDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
    @UploadedFile() residentPhoto?: Express.Multer.File,
  ) {
    const normalizedCreateDto = this.normalizeCreateDto(
      createResidentDto,
      (req.body as Record<string, unknown>)?.emergencyContacts,
    );
    return this.residentsService.create(
      normalizedCreateDto,
      currentUser,
      this.getClientIp(req),
      residentPhoto,
    );
  }

  private normalizeCreateDto(
    createResidentDto: CreateResidentDto,
    rawEmergencyContacts?: unknown,
  ): CreateResidentDto {
    const emergencyContacts = this.parseEmergencyContacts(
      rawEmergencyContacts ?? createResidentDto.emergencyContacts,
      true,
    );

    const normalizedWeight = Number(createResidentDto.weight);
    if (Number.isNaN(normalizedWeight) || normalizedWeight < 0) {
      throw new BadRequestException('Weight must be a valid positive number');
    }

    return {
      ...createResidentDto,
      weight: normalizedWeight,
      emergencyContacts,
    };
  }

  @Get()
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get paginated residents in scope' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'branchId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Residents retrieved successfully' })
  async findAll(
    @CurrentUser() currentUser: User,
    @Query() query: GetResidentsQueryDto,
  ) {
    return this.residentsService.findAll(currentUser, query);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a resident by ID' })
  @ApiResponse({ status: 200, description: 'Resident retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.residentsService.findOne(id, currentUser);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @UseInterceptors(
    FileInterceptor(
      'residentPhoto',
      createMemoryMulterOptions(['image/jpeg', 'image/png', 'image/webp'], 5 * 1024 * 1024),
    ),
  )
  @ApiOperation({ summary: 'Update a resident record' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async update(
    @Param('id') id: string,
    @Body() updateResidentDto: UpdateResidentDto,
    @CurrentUser() currentUser: User,
    @Req() req: Request,
    @UploadedFile() residentPhoto?: Express.Multer.File,
  ) {
    const normalizedUpdateDto = this.normalizeUpdateDto(
      updateResidentDto,
      (req.body as Record<string, unknown>)?.emergencyContacts,
    );
    return this.residentsService.update(
      id,
      normalizedUpdateDto,
      currentUser,
      residentPhoto,
    );
  }

  private normalizeUpdateDto(
    updateResidentDto: UpdateResidentDto,
    rawEmergencyContacts?: unknown,
  ): UpdateResidentDto {
    const normalizedWeight =
      updateResidentDto.weight === undefined ? undefined : Number(updateResidentDto.weight);
    if (normalizedWeight !== undefined && (Number.isNaN(normalizedWeight) || normalizedWeight < 0)) {
      throw new BadRequestException('Weight must be a valid positive number');
    }

    const rawContacts = rawEmergencyContacts ?? updateResidentDto.emergencyContacts;
    const emergencyContacts =
      rawContacts === undefined
        ? undefined
        : this.parseEmergencyContacts(rawContacts, true);

    return {
      ...updateResidentDto,
      ...(normalizedWeight !== undefined ? { weight: normalizedWeight } : {}),
      ...(emergencyContacts !== undefined ? { emergencyContacts } : {}),
    };
  }

  /** Parse multipart JSON before ValidationPipe whitelist can strip nested contact fields. */
  private parseEmergencyContacts(
    raw: unknown,
    requireAtLeastOne: boolean,
  ): CreateResidentDto['emergencyContacts'] {
    let parsed: unknown = raw;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        throw new BadRequestException('Emergency contacts must be valid JSON');
      }
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException('Emergency contacts must be an array');
    }

    const contacts = parsed
      .map((entry) => {
        if (!entry || typeof entry !== 'object') return null;
        const contact = entry as Record<string, unknown>;
        const firstName = String(contact.firstName ?? '').trim();
        const lastName = String(contact.lastName ?? '').trim();
        const phone = String(contact.phone ?? '').trim();
        const relation = String(contact.relation ?? '').trim();
        const id = String(contact.id ?? '').trim();
        const middleName = String(contact.middleName ?? '').trim() || undefined;
        const email = String(contact.email ?? '').trim() || undefined;

        if (!firstName || !lastName || !phone || !relation || !id) {
          return null;
        }

        return { id, firstName, middleName, lastName, phone, relation, email };
      })
      .filter((contact) => contact !== null);

    if (requireAtLeastOne && contacts.length === 0) {
      throw new BadRequestException(
        'At least one emergency contact with first name, last name, phone, and relationship is required',
      );
    }

    return contacts as CreateResidentDto['emergencyContacts'];
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.FACILITY_ADMIN, Role.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Delete a resident record' })
  @ApiResponse({ status: 200, description: 'Resident deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: User) {
    return this.residentsService.delete(id, currentUser);
  }
}
