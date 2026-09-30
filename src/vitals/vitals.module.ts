import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { VitalsController } from './vitals.controller';
import { VitalsService } from './vitals.service';
import { Vital } from './vital.model';
import { Resident } from '../residents/resident.model';
import { Rule } from '../rules/rule.model';
import { Task } from '../task/task.model';
import { User } from '../users/user.model';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Vital, Resident, Rule, Task, User]),
    AlertsModule,
  ],
  controllers: [VitalsController],
  providers: [VitalsService],
})
export class VitalsModule {}
