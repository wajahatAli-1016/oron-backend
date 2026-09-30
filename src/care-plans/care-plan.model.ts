import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export type CarePlanMedicationStatus = 'Active' | 'Inactive' | 'Discontinued';

export interface CarePlanMedication {
  name: string;
  dosage: string;
  schedule: string;
  status: CarePlanMedicationStatus | string;
}

export interface CarePlanCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  generatedDate: Date;
  reviewDate: Date;
  version: string;
  lastReviewDate: Date;
  nextReviewDate: Date;
  author: string;
  updatedBy?: string | null;
  signed: boolean;
  signedBy?: string | null;
  signedAt?: Date | null;
  medications?: CarePlanMedication[];
  medicationsEncrypted?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'care_plans',
  timestamps: true,
  paranoid: false,
})
export class CarePlan extends Model<CarePlan, CarePlanCreationAttributes> {
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
    type: DataType.DATE,
    field: 'generated_date',
  })
  declare generatedDate: Date;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'review_date',
  })
  declare reviewDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare version: string;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'last_review_date',
  })
  declare lastReviewDate: Date;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    field: 'next_review_date',
  })
  declare nextReviewDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare author: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'updated_by',
  })
  declare updatedBy: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare signed: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'signed_by',
  })
  declare signedBy: string | null;

  @AllowNull(true)
  @Column({
    type: DataType.DATE,
    field: 'signed_at',
  })
  declare signedAt: Date | null;

  @Column(DataType.VIRTUAL)
  declare medications: CarePlanMedication[];

  @AllowNull(true)
  @Column({
    type: DataType.TEXT,
    field: 'medications_encrypted',
  })
  declare medicationsEncrypted: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}

