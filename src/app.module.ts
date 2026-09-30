import 'dotenv/config';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FacilityModule } from './facility/facility.module';
import { BranchModule } from './branch/branch.module';
import { ResidentsModule } from './residents/residents.module';
import { StaffModule } from './staff/staff.module';
import { RulesModule } from './rules/rules.module';
import { TaskModule } from './task/task.module';
import { VitalsModule } from './vitals/vitals.module';
import { NotesModule } from './notes/notes.module';
import { AlertsModule } from './alerts/alerts.module';
import { CarePlansModule } from './care-plans/care-plans.module';
import { ClinicalAssessmentsModule } from './clinical-assessments/clinical-assessments.module';
import { RiskProfilesModule } from './risk-profiles/risk-profiles.module';
import { GoalsModule } from './goals/goals.module';
import { InterventionsModule } from './interventions/interventions.module';
import { PreferencesModule } from './preferences/preferences.module';
import { DashboardsModule } from './dashboards/dashboards.module';
import { User } from './users/user.model';
import { Facility } from './facility/facility.model';
import { Branch } from './branch/branch.model';
import { Resident } from './residents/resident.model';
import { Staff } from './staff/staff.model';
import { PasswordResetOtp } from './auth/password/password-reset-otp.model';

// Import pg directly at module level — forces Vercel to bundle it
import * as pg from 'pg';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRootAsync({
      useFactory: () => ({
        dialect: 'postgres',
        dialectModule: pg,           // ← uses the top-level import
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        models: [User, Facility, Branch, Resident, Staff, PasswordResetOtp],
        autoLoadModels: true,
        synchronize: false,
        logging: false,
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        },
      }),
    }),
    AuthModule,
    UsersModule,
    FacilityModule,
    BranchModule,
    ResidentsModule,
    StaffModule,
    RulesModule,
    TaskModule,
    VitalsModule,
    NotesModule,
    AlertsModule,
    CarePlansModule,
    ClinicalAssessmentsModule,
    RiskProfilesModule,
    GoalsModule,
    InterventionsModule,
    PreferencesModule,
    DashboardsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
        whitelist: true,
      }),
    },
  ],
})
export class AppModule {}