import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CarePlan } from './care-plan.model';
import { CreateCarePlanDto } from './dto/create-care-plan.dto';
import { UpdateCarePlanDto } from './dto/update-care-plan.dto';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.model';
import { Resident } from '../residents/resident.model';
import { decryptText, encryptText } from '../common/utils/encryption.util';

@Injectable()
export class CarePlansService {
  constructor(
    @InjectModel(CarePlan)
    private readonly carePlanModel: typeof CarePlan,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreateCarePlanDto, currentUser: User): Promise<CarePlan> {
    this.ensureCanManage(currentUser);

    const resident = await this.residentModel.findByPk(dto.residentId);
    if (!resident) {
      throw new BadRequestException('Resident not found');
    }

    if (dto.branchId !== resident.branchId) {
      throw new BadRequestException('Resident does not belong to provided branch');
    }

    this.ensureResidentInManageScope(resident, currentUser);

    const author = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeAuthor = author.trim() || (currentUser as any).email || currentUser.id;

    const medicationsEncrypted = encryptText(JSON.stringify(dto.medications ?? []));

    return this.carePlanModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      generatedDate: new Date(dto.generatedDate),
      reviewDate: new Date(dto.reviewDate),
      version: dto.version,
      lastReviewDate: new Date(dto.lastReviewDate),
      nextReviewDate: new Date(dto.nextReviewDate),
      author: safeAuthor,
      updatedBy: safeAuthor,
      signed: dto.signed ?? false,
      medicationsEncrypted,
    });
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<CarePlan[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) {
      whereClause.residentId = filters.residentId;
    }
    if (filters?.branchId) {
      whereClause.branchId = filters.branchId;
    }
    if (filters?.facilityId) {
      whereClause.facilityId = filters.facilityId;
    }

    const plans = await this.carePlanModel.findAll({
      where: whereClause,
      order: [['generatedDate', 'DESC']],
    });
    return plans.map((p) => this.attachDecryptedMedications(p));
  }

  async findOne(id: string, currentUser: User): Promise<CarePlan> {
    const carePlan = await this.carePlanModel.findByPk(id);
    if (!carePlan) {
      throw new NotFoundException('Care plan not found');
    }

    this.ensureInViewScope(carePlan, currentUser);
    return this.attachDecryptedMedications(carePlan);
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<CarePlan[]> {
    const scope = this.buildWhereClause(currentUser);
    const plans = await this.carePlanModel.findAll({
      where: {
        ...scope,
        residentId,
      },
      order: [['generatedDate', 'DESC']],
    });
    return plans.map((p) => this.attachDecryptedMedications(p));
  }

  async update(id: string, dto: UpdateCarePlanDto, currentUser: User): Promise<CarePlan> {
    this.ensureCanManage(currentUser);

    const carePlan = await this.carePlanModel.findByPk(id);
    if (!carePlan) {
      throw new NotFoundException('Care plan not found');
    }

    this.ensureInManageScope(carePlan, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');
    const safeActorName = actorName.trim() || (currentUser as any).email || currentUser.id;

    const wasSigned = carePlan.signed;
    const nextSigned = dto.signed ?? carePlan.signed;

    await carePlan.update({
      generatedDate: dto.generatedDate ? new Date(dto.generatedDate) : carePlan.generatedDate,
      reviewDate: dto.reviewDate ? new Date(dto.reviewDate) : carePlan.reviewDate,
      version: dto.version ?? carePlan.version,
      lastReviewDate: dto.lastReviewDate ? new Date(dto.lastReviewDate) : carePlan.lastReviewDate,
      nextReviewDate: dto.nextReviewDate ? new Date(dto.nextReviewDate) : carePlan.nextReviewDate,
      signed: dto.signed ?? carePlan.signed,
      medicationsEncrypted: dto.medications
        ? encryptText(JSON.stringify(dto.medications))
        : carePlan.medicationsEncrypted,
      updatedBy: safeActorName,
      ...(nextSigned && !wasSigned
        ? { signedBy: safeActorName, signedAt: new Date() }
        : {}),
    });

    return this.attachDecryptedMedications(carePlan);
  }

  private attachDecryptedMedications(plan: CarePlan): CarePlan {
    try {
      if (plan.medicationsEncrypted) {
        const decrypted = decryptText(plan.medicationsEncrypted);
        const parsed = JSON.parse(decrypted);
        if (Array.isArray(parsed)) {
          plan.setDataValue('medications', parsed);
        }
        return plan;
      }
    } catch {
      // fall back to plaintext JSON column if older data exists
    }
    return plan;
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const carePlan = await this.carePlanModel.findByPk(id);
    if (!carePlan) {
      throw new NotFoundException('Care plan not found');
    }

    this.ensureInManageScope(carePlan, currentUser);
    const deleted = await this.carePlanModel.destroy({ where: { id } });
    return deleted > 0;
  }

  private buildWhereClause(currentUser: User): Record<string, unknown> {
    switch (currentUser.role) {
      case Role.OWNER:
        return {};
      case Role.FACILITY_ADMIN:
        return { facilityId: currentUser.facilityId };
      case Role.BRANCH_ADMIN:
      case Role.STAFF:
        return { branchId: currentUser.branchId };
      default:
        return {};
    }
  }

  private ensureCanManage(currentUser: User): void {
    if (currentUser.role !== Role.FACILITY_ADMIN && currentUser.role !== Role.BRANCH_ADMIN) {
      throw new ForbiddenException('Insufficient permissions to manage care plans');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot create care plan outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot create care plan outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(carePlan: CarePlan, currentUser: User): void {
    if (currentUser.role === Role.OWNER) {
      return;
    }
    if (currentUser.role === Role.FACILITY_ADMIN && carePlan.facilityId === currentUser.facilityId) {
      return;
    }
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      carePlan.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access care plan outside your scope');
  }

  private ensureInManageScope(carePlan: CarePlan, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (carePlan.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage care plans outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (carePlan.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage care plans outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage care plans');
  }
}

