import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClinicalAssessment } from './clinical-assessment.model';
import { CreateClinicalAssessmentDto } from './dto/create-clinical-assessment.dto';
import { UpdateClinicalAssessmentDto } from './dto/update-clinical-assessment.dto';
import { Resident } from '../residents/resident.model';
import { User } from '../users/user.model';
import { Role } from '../common/enums/role.enum';
import { decryptText, encryptText } from '../common/utils/encryption.util';

@Injectable()
export class ClinicalAssessmentsService {
  constructor(
    @InjectModel(ClinicalAssessment)
    private readonly clinicalAssessmentModel: typeof ClinicalAssessment,
    @InjectModel(Resident)
    private readonly residentModel: typeof Resident,
  ) {}

  async create(dto: CreateClinicalAssessmentDto, currentUser: User): Promise<ClinicalAssessment> {
    this.ensureCanManage(currentUser);

    const resident = await this.residentModel.findByPk(dto.residentId);
    if (!resident) {
      throw new BadRequestException('Resident not found');
    }

    this.ensureResidentInManageScope(resident, currentUser);

    const author = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');

    const created = await this.clinicalAssessmentModel.create({
      residentId: resident.id,
      branchId: resident.branchId,
      facilityId: resident.facilityId,
      conditions: this.encryptStringArray(dto.conditions ?? []),
      allergies: this.encryptStringArray(dto.allergies ?? []),
      adlScores: this.encryptAdlScores((dto.adlScores ?? {}) as unknown as ClinicalAssessment['adlScores']),
      mobility: this.encryptValue(dto.mobility ?? ''),
      cognitive: this.encryptValue(dto.cognitive ?? ''),
      author,
      updatedBy: author,
    });
    return this.attachDecryptedPayload(created);
  }

  async findAll(
    currentUser: User,
    filters?: { residentId?: string; branchId?: string; facilityId?: string },
  ): Promise<ClinicalAssessment[]> {
    const whereClause: Record<string, unknown> = {
      ...this.buildWhereClause(currentUser),
    };

    if (filters?.residentId) whereClause.residentId = filters.residentId;
    if (filters?.branchId) whereClause.branchId = filters.branchId;
    if (filters?.facilityId) whereClause.facilityId = filters.facilityId;

    const rows = await this.clinicalAssessmentModel.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findByResidentId(residentId: string, currentUser: User): Promise<ClinicalAssessment[]> {
    const scope = this.buildWhereClause(currentUser);
    const rows = await this.clinicalAssessmentModel.findAll({
      where: { ...scope, residentId },
      order: [['createdAt', 'DESC']],
    });
    return rows.map((r) => this.attachDecryptedPayload(r));
  }

  async findOne(id: string, currentUser: User): Promise<ClinicalAssessment> {
    const assessment = await this.clinicalAssessmentModel.findByPk(id);
    if (!assessment) {
      throw new NotFoundException('Clinical assessment not found');
    }

    this.ensureInViewScope(assessment, currentUser);
    return this.attachDecryptedPayload(assessment);
  }

  async update(
    id: string,
    dto: UpdateClinicalAssessmentDto,
    currentUser: User,
  ): Promise<ClinicalAssessment> {
    this.ensureCanManage(currentUser);

    const assessment = await this.clinicalAssessmentModel.findByPk(id);
    if (!assessment) {
      throw new NotFoundException('Clinical assessment not found');
    }

    this.ensureInManageScope(assessment, currentUser);

    const actorName = [currentUser.firstName, currentUser.middleName, currentUser.lastName]
      .filter(Boolean)
      .join(' ');

    await assessment.update({
      conditions: dto.conditions ? this.encryptStringArray(dto.conditions) : assessment.conditions,
      allergies: dto.allergies ? this.encryptStringArray(dto.allergies) : assessment.allergies,
      adlScores: dto.adlScores
        ? this.encryptAdlScores(dto.adlScores as unknown as ClinicalAssessment['adlScores'])
        : assessment.adlScores,
      mobility: dto.mobility !== undefined ? this.encryptValue(dto.mobility) : assessment.mobility,
      cognitive: dto.cognitive !== undefined ? this.encryptValue(dto.cognitive) : assessment.cognitive,
      updatedBy: actorName,
    });

    return this.attachDecryptedPayload(assessment);
  }

  async remove(id: string, currentUser: User): Promise<boolean> {
    this.ensureCanManage(currentUser);

    const assessment = await this.clinicalAssessmentModel.findByPk(id);
    if (!assessment) {
      throw new NotFoundException('Clinical assessment not found');
    }

    this.ensureInManageScope(assessment, currentUser);
    const deleted = await this.clinicalAssessmentModel.destroy({ where: { id } });
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
      throw new ForbiddenException('Insufficient permissions to manage clinical assessments');
    }
  }

  private ensureResidentInManageScope(resident: Resident, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (!currentUser.facilityId || resident.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage clinical assessments outside your facility');
      }
      return;
    }

    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (!currentUser.branchId || resident.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage clinical assessments outside your branch');
      }
      return;
    }
  }

  private ensureInViewScope(assessment: ClinicalAssessment, currentUser: User): void {
    if (currentUser.role === Role.OWNER) return;
    if (currentUser.role === Role.FACILITY_ADMIN && assessment.facilityId === currentUser.facilityId) return;
    if (
      (currentUser.role === Role.BRANCH_ADMIN || currentUser.role === Role.STAFF) &&
      assessment.branchId === currentUser.branchId
    ) {
      return;
    }
    throw new ForbiddenException('Cannot access clinical assessment outside your scope');
  }

  private ensureInManageScope(assessment: ClinicalAssessment, currentUser: User): void {
    if (currentUser.role === Role.FACILITY_ADMIN) {
      if (assessment.facilityId !== currentUser.facilityId) {
        throw new ForbiddenException('Cannot manage clinical assessments outside your facility');
      }
      return;
    }
    if (currentUser.role === Role.BRANCH_ADMIN) {
      if (assessment.branchId !== currentUser.branchId) {
        throw new ForbiddenException('Cannot manage clinical assessments outside your branch');
      }
      return;
    }
    throw new ForbiddenException('Insufficient permissions to manage clinical assessments');
  }

  private encryptValue(value: string): string {
    const trimmed = (value ?? '').toString();
    if (!trimmed) return '';
    return encryptText(trimmed);
  }

  private decryptValue(value: string): string {
    if (!value) return '';
    try {
      return decryptText(value);
    } catch {
      // already plaintext / legacy row
      return value;
    }
  }

  private encryptStringArray(items: string[]): string[] {
    return (items ?? []).map((item) => this.encryptValue(item));
  }

  private decryptStringArray(items: string[]): string[] {
    return (items ?? []).map((item) => this.decryptValue(item));
  }

  private encryptAdlScores(scores: ClinicalAssessment['adlScores']): ClinicalAssessment['adlScores'] {
    const result: Record<string, unknown> = {};
    const src = (scores ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(src)) {
      if (typeof value === 'string') {
        result[key] = this.encryptValue(value);
      } else {
        result[key] = value;
      }
    }
    return result as unknown as ClinicalAssessment['adlScores'];
  }

  private decryptAdlScores(scores: ClinicalAssessment['adlScores']): ClinicalAssessment['adlScores'] {
    const result: Record<string, unknown> = {};
    const src = (scores ?? {}) as Record<string, unknown>;
    for (const [key, value] of Object.entries(src)) {
      if (typeof value === 'string') {
        result[key] = this.decryptValue(value);
      } else {
        result[key] = value;
      }
    }
    return result as unknown as ClinicalAssessment['adlScores'];
  }

  private attachDecryptedPayload(assessment: ClinicalAssessment): ClinicalAssessment {
    assessment.setDataValue('conditions', this.decryptStringArray(assessment.conditions ?? []));
    assessment.setDataValue('allergies', this.decryptStringArray(assessment.allergies ?? []));
    assessment.setDataValue('adlScores', this.decryptAdlScores(assessment.adlScores));
    assessment.setDataValue('mobility', this.decryptValue(assessment.mobility ?? ''));
    assessment.setDataValue('cognitive', this.decryptValue(assessment.cognitive ?? ''));
    return assessment;
  }
}

