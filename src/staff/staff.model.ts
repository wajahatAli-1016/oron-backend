import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

export interface StaffCreationAttributes {
  id?: string;
  branchId: string;
  facilityId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  role: string;
  status: string;
  lastActive?: Date | null;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Staff',
  timestamps: true,
  underscored: false,
})
export class Staff extends Model<Staff, StaffCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare branchId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare facilityId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare firstName: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare middleName?: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare lastName: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare role: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastActive?: Date | null;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare permissions: string[];

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
