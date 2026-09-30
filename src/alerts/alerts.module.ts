import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { Alert } from './alert.model';
import { Facility } from '../facility/facility.model';
import { Branch } from '../branch/branch.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { ContractExpiryScheduler } from './contract-expiry.scheduler';
import { FacilityModule } from '../facility/facility.module';
import { AlertsGateway } from './alerts.gateway';
import { AlertsRealtimeService } from './alerts-realtime.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Alert, Facility, Branch]),
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SECRET_KEY',
      signOptions: { expiresIn: '1d' },
    }),
    forwardRef(() => FacilityModule),
  ],
  controllers: [AlertsController],
  providers: [AlertsService, ContractExpiryScheduler, AlertsGateway, AlertsRealtimeService],
  exports: [AlertsService],
})
export class AlertsModule {}
