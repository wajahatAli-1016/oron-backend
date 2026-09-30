import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from '../users/users.module';
import { FacilityController } from './facility.controller';
import { FacilityService } from './facility.service';
import { Facility } from './facility.model';
import { EmailService } from '../common/services/email.service';
import { StorageModule } from '../storage/storage.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Facility]),
    UsersModule,
    StorageModule,
    forwardRef(() => AlertsModule),
  ],
  controllers: [FacilityController],
  providers: [FacilityService, EmailService],
  exports: [FacilityService],
})
export class FacilityModule {}
