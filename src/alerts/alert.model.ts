import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export type AlertSeverity = 'Info' | 'Warning' | 'Critical';
export type AlertStatus = 'Unread' | 'Read' | 'Resolved';

export interface AlertCreationAttributes {
  id?: string;
  facilityId: string;
  branchId?: string | null;
  residentId?: string | null;
  title: string;
  message: string;
  severity: AlertSeverity;
  status?: AlertStatus;
  date: string | Date;
  targetRoles: string[];
  healthState?: string | null;
  sourceVitalId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Alert',
  timestamps: true,
  underscored: false,
})
export class Alert extends Model<Alert, AlertCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare facilityId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare branchId?: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare residentId?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare message: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('Info', 'Warning', 'Critical'),
    defaultValue: 'Info',
  })
  declare severity: AlertSeverity;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('Unread', 'Read', 'Resolved'),
    defaultValue: 'Unread',
  })
  declare status: AlertStatus;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare date: Date;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare targetRoles: string[];

  @AllowNull(true)
  @Column(DataType.STRING)
  declare healthState?: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare sourceVitalId?: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
