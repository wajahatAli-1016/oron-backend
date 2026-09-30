import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BranchController } from './branch.controller';
import { BranchService } from './branch.service';
import { Branch } from './branch.model';
import { Facility } from '../facility/facility.model';
import { UsersModule } from '../users/users.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EmailService } from '../common/services/email.service';

@Module({
  imports: [SequelizeModule.forFeature([Branch, Facility]), UsersModule, AuditLogsModule],
  controllers: [BranchController],
  providers: [BranchService, EmailService],
  exports: [BranchService],
})
export class BranchModule {}
