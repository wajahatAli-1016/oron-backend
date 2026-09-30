import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface BranchCreationAttributes {
  id?: string;
  facilityId: string;
  name: string;
  address: string;
  phone: string;
  type: string;
  status: string;
  residentLimit: number;
  currentResidents?: number;
  branchAdminId?: string | null;
  branchAdminName?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Branch',
  timestamps: true,
  underscored: false,
})
export class Branch extends Model<Branch, BranchCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare facilityId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare address: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare phone: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare residentLimit: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare currentResidents: number;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare branchAdminId?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare branchAdminName?: string | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
