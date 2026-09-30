import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export type AdlSupportLevel =
  | 'Independent'
  | 'Supervision'
  | 'Moderate assist'
  | 'Total assist'
  | 'Continent'
  | 'Occasional accidents'
  | 'Incontinent'
  | string;

export interface AdlScores {
  bathing?: AdlSupportLevel;
  dressing?: AdlSupportLevel;
  toileting?: AdlSupportLevel;
  eating?: AdlSupportLevel;
  transferring?: AdlSupportLevel;
  continence?: AdlSupportLevel;
  [key: string]: unknown;
}

export interface ClinicalAssessmentCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  conditions: string[];
  allergies: string[];
  adlScores: AdlScores;
  mobility: string;
  cognitive: string;
  author: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'clinical_assessments',
  timestamps: true,
  paranoid: false,
})
export class ClinicalAssessment extends Model<
  ClinicalAssessment,
  ClinicalAssessmentCreationAttributes
> {
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
  @Column(DataType.JSON)
  declare conditions: string[];

  @AllowNull(false)
  @Column(DataType.JSON)
  declare allergies: string[];

  @AllowNull(false)
  @Column({
    type: DataType.JSON,
    field: 'adl_scores',
  })
  declare adlScores: AdlScores;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare mobility: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare cognitive: string;

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

