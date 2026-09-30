import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { Branch } from '../branch/branch.model';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { User } from '../users/user.model';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../common/services/email.service';


@Module({
  imports: [SequelizeModule.forFeature([User, Branch]), AuditLogsModule, UsersModule],
  controllers: [StaffController],
  providers: [StaffService, EmailService],
  exports: [StaffService],
})
export class StaffModule {}
