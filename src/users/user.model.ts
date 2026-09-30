import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
  CreatedAt,
  AllowNull,
  Unique,
  Index,
} from 'sequelize-typescript';
import { Role } from '../common/enums/role.enum';

export interface UserCreationAttributes {
  id?: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  password: string;
  role: Role;
  facilityId?: string | null;
  branchId?: string | null;
  staffRole?: string | null;
  staffStatus?: string | null;
  lastActive?: Date | null;
  permissions?: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'User',
  timestamps: true,
  underscored: false,
})
export class User extends Model<User, UserCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

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
  declare password: string;

  /** SHA-256 hash of the raw invite code sent by email (never store the raw code). */
  @AllowNull(true)
  @Index({ unique: true })
  @Column(DataType.STRING)
  declare inviteToken?: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare inviteExpires?: Date | null;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('OWNER', 'FACILITY_ADMIN', 'BRANCH_ADMIN', 'STAFF'),
    defaultValue: Role.STAFF,
  })
  declare role: Role;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare facilityId?: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare branchId?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare staffRole?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare staffStatus?: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare lastActive?: Date | null;

  @AllowNull(true)
  @Column(DataType.JSON)
  declare permissions?: string[] | null;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
