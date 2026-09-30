import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface RuleCreationAttributes {
  id?: string;
  name: string;
  vitalType: string;
  category: string;
  thresholds: {
    normalMin: number;
    normalMax: number;
    lowThreshold: number;
    highThreshold: number;
    criticalLow: number;
    criticalHigh: number;
    unit: string;
  };
  isActive?: boolean;
  description: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Rule',
  timestamps: true,
  underscored: false,
})
export class Rule extends Model<Rule, RuleCreationAttributes> {
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
  declare vitalType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare category: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare thresholds: {
    normalMin: number;
    normalMax: number;
    lowThreshold: number;
    highThreshold: number;
    criticalLow: number;
    criticalHigh: number;
    unit: string;
  };

  @AllowNull(false)
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare isActive: boolean;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare description: string;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
