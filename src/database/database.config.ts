import 'dotenv/config';
import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { User } from '../users/user.model';
import { Facility } from '../facility/facility.model';
import { Branch } from '../branch/branch.model';
import { Resident } from '../residents/resident.model';
import { Staff } from '../staff/staff.model';
import { PasswordResetOtp } from '../auth/password/password-reset-otp.model';

export const sequelizeConfig: SequelizeModuleOptions = {
  dialect: 'postgres',
  dialectModule: require('pg'),
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'oron_db',
  models: [User, Facility, Branch, Resident, Staff, PasswordResetOtp],
  autoLoadModels: true,
  synchronize: false, // Use migrations instead
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,               // ← Required for Supabase
      rejectUnauthorized: false,   // ← Required for Supabase
    },
  },
};
