import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface AuditLogCreationAttributes {
  id?: string;
  facilityId?: string | null;
  branchId?: string | null;
  timestamp?: Date;
  user: string;
  action: string;
  details: string;
  ipAddress?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'AuditLog',
  timestamps: true,
  underscored: false,
})
export class AuditLog extends Model<AuditLog, AuditLogCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare facilityId?: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare branchId?: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  declare timestamp: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare user: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare action: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare details: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare ipAddress?: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
