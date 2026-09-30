import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface FacilityCreationAttributes {
  id?: string;
  name: string;
  phone: string;
  email: string;
  type: string;
  status: string;
  contractStart: Date;
  contractEnd: Date;
  /**
   * Legacy column kept for backwards compatibility (previously stored a local URL).
   * Do NOT store URLs anymore; use `contractDocumentPublicId` instead.
   */
  contractDocumentUrl?: string | null;
  /**
   * Cloud storage identifier (Cloudinary publicId today; S3 key later).
   */
  contractDocumentPublicId?: string | null;
  facilityAdminId?: string | null;
  facilityAdminName?: string | null;
  totalBranches?: number;
  totalResidents?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Facility',
  timestamps: true,
  underscored: false,
})
export class Facility extends Model<Facility, FacilityCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare phone: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare type: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare contractStart: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare contractEnd: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare contractDocumentUrl?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare contractDocumentPublicId?: string | null;

  @AllowNull(true)
  @Column(DataType.UUID)
  declare facilityAdminId?: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare facilityAdminName?: string | null;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare totalBranches: number;

  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare totalResidents: number;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
