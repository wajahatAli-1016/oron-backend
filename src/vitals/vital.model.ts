import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface VitalCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  recordedById: string;
  date: string | Date;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  oxygenSaturation?: number | null;
  bloodSugar?: number | null;
  weight?: number | null;
  respiratoryRate?: number | null;
  notes?: string | null;
  thresholdEvaluation?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Vital',
  timestamps: true,
  underscored: false,
})
export class Vital extends Model<Vital, VitalCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare residentId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare branchId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare facilityId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare recordedById: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare date: Date;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare systolicBP?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare diastolicBP?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare heartRate?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare temperature?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare oxygenSaturation?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare bloodSugar?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare weight?: number | null;

  @AllowNull(true)
  @Column(DataType.FLOAT)
  declare respiratoryRate?: number | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare notes?: string | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare thresholdEvaluation?: Record<string, unknown> | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
