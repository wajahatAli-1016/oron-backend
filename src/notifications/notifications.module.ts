import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OneSignalService } from './one-signal.service';
import { User } from '../users/user.model';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  providers: [OneSignalService],
  exports: [OneSignalService],
})
export class NotificationsModule {}
