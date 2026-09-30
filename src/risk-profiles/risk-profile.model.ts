import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface RiskProfileCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  fallRiskScore: number;
  mobilityTrend: string;
  nearFallEvents: number;
  vitalsTrend: string;
  narrativeInterpretation: string;
  author: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'risk_profiles',
  timestamps: true,
  paranoid: false,
})
export class RiskProfile extends Model<RiskProfile, RiskProfileCreationAttributes> {
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
    type: DataType.INTEGER,
    field: 'fall_risk_score',
  })
  declare fallRiskScore: number;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'mobility_trend',
    defaultValue: '',
  })
  declare mobilityTrend: string;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    field: 'near_fall_events',
  })
  declare nearFallEvents: number;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'vitals_trend',
    defaultValue: '',
  })
  declare vitalsTrend: string;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'narrative_interpretation',
    defaultValue: '',
  })
  declare narrativeInterpretation: string;

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

