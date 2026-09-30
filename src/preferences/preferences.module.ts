import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Resident } from '../residents/resident.model';
import { Preference } from './preference.model';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [SequelizeModule.forFeature([Preference, Resident])],
  controllers: [PreferencesController],
  providers: [PreferencesService],
  exports: [PreferencesService],
})
export class PreferencesModule {}

