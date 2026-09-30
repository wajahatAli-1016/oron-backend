import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export interface PasswordResetOtpCreationAttributes {
  id?: string;
  userId: string;
  otpHash: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'PasswordResetOtp',
  timestamps: true,
  underscored: false,
})
export class PasswordResetOtp extends Model<PasswordResetOtp, PasswordResetOtpCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Index({ unique: true })
  @Column(DataType.UUID)
  declare userId: string;

  /** SHA-256 hash of the 6-digit OTP (never store the raw OTP). */
  @AllowNull(false)
  @Column(DataType.STRING)
  declare otpHash: string;

  @AllowNull(false)
  @Index
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @UpdatedAt
  @Column
  declare updatedAt: Date;
}

