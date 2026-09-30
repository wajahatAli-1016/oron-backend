import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Resident } from '../residents/resident.model';
import { RiskProfile } from './risk-profile.model';
import { RiskProfilesController } from './risk-profiles.controller';
import { RiskProfilesService } from './risk-profiles.service';

@Module({
  imports: [SequelizeModule.forFeature([RiskProfile, Resident])],
  controllers: [RiskProfilesController],
  providers: [RiskProfilesService],
  exports: [RiskProfilesService],
})
export class RiskProfilesModule {}

