import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface InterventionCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  description: string; // encrypted at rest
  responsibleStaffRole: string; // encrypted at rest
  frequency: string; // encrypted at rest
  triggerConditions: string; // encrypted at rest
  effectivenessMetric: string; // encrypted at rest
  author: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'interventions',
  timestamps: true,
  paranoid: false,
})
export class Intervention extends Model<Intervention, InterventionCreationAttributes> {
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

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    defaultValue: '',
  })
  declare description: string;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'responsible_staff_role',
    defaultValue: '',
  })
  declare responsibleStaffRole: string;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    defaultValue: '',
  })
  declare frequency: string;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'trigger_conditions',
    defaultValue: '',
  })
  declare triggerConditions: string;

  // Stored encrypted at rest
  @AllowNull(false)
  @Column({
    type: DataType.TEXT,
    field: 'effectiveness_metric',
    defaultValue: '',
  })
  declare effectivenessMetric: string;

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

