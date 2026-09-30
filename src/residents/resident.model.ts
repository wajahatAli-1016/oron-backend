import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface ResidentCreationAttributes {
  id?: string;
  branchId: string;
  facilityId: string;
  encryptedData: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Resident',
  timestamps: true,
  underscored: false,
})
export class Resident extends Model<Resident, ResidentCreationAttributes> {
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
  @Column(DataType.TEXT)
  declare encryptedData: string;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
