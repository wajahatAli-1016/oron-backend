import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarePlan } from './care-plan.model';
import { CarePlansController } from './care-plans.controller';
import { CarePlansService } from './care-plans.service';
import { Resident } from '../residents/resident.model';

@Module({
  imports: [SequelizeModule.forFeature([CarePlan, Resident])],
  controllers: [CarePlansController],
  providers: [CarePlansService],
  exports: [CarePlansService],
})
export class CarePlansModule {}

