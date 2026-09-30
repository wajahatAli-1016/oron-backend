import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export type GoalStatus = 'Active' | 'Completed' | 'Paused' | 'Cancelled' | string;

export interface GoalCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  description: string; // encrypted at rest
  targetMetric: string; // encrypted at rest
  timeframe: string;
  responsibleRole: string;
  status: GoalStatus;
  author: string;
  updatedBy?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'goals',
  timestamps: true,
  paranoid: false,
})
export class Goal extends Model<Goal, GoalCreationAttributes> {
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
    field: 'target_metric',
    defaultValue: '',
  })
  declare targetMetric: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    defaultValue: '',
  })
  declare timeframe: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'responsible_role',
    defaultValue: '',
  })
  declare responsibleRole: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    defaultValue: 'Active',
  })
  declare status: GoalStatus;

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

