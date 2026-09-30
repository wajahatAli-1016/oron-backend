import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClinicalAssessment } from './clinical-assessment.model';
import { ClinicalAssessmentsController } from './clinical-assessments.controller';
import { ClinicalAssessmentsService } from './clinical-assessments.service';
import { Resident } from '../residents/resident.model';

@Module({
  imports: [SequelizeModule.forFeature([ClinicalAssessment, Resident])],
  controllers: [ClinicalAssessmentsController],
  providers: [ClinicalAssessmentsService],
  exports: [ClinicalAssessmentsService],
})
export class ClinicalAssessmentsModule {}

