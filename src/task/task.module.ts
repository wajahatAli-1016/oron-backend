import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { Task } from './task.model';
import { User } from '../users/user.model';
import { Branch } from '../branch/branch.model';
import { Resident } from '../residents/resident.model';
import { Facility } from '../facility/facility.model';
import { NotificationsModule } from '../notifications/notifications.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Task, User, Branch, Resident, Facility]),
    NotificationsModule,
    AlertsModule,
  ],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}