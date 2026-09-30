import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface PreferenceCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  sleepPattern: string; // encrypted at rest
  mealPref: string; // encrypted at rest
  communication: string; // encrypted at rest
  socialPref: string; // encrypted at rest
  familyEngagement: string; // encrypted at rest
  isNA: boolean;
  author: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'preferences',
  timestamps: true,
  paranoid: false,
})
export class Preference extends Model<Preference, PreferenceCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'resident_id',
  })
  declare residentId: string;

  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'branch_id',
  })
  declare branchId: string;

  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'facility_id',
  })
  declare facilityId: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'sleep_pattern',
    defaultValue: '',
  })
  declare sleepPattern: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'meal_pref',
    defaultValue: '',
  })
  declare mealPref: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    defaultValue: '',
  })
  declare communication: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'social_pref',
    defaultValue: '',
  })
  declare socialPref: string;

  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'family_engagement',
    defaultValue: '',
  })
  declare familyEngagement: string;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    field: 'is_na',
    defaultValue: false,
  })
  declare isNA: boolean;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare author: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'updated_by',
  })
  declare updatedBy: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}

