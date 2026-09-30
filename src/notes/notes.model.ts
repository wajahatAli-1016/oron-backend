import { Column, Model, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'notes',
  timestamps: true,
  paranoid: false,
})
export class Note extends Model<Note> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'resident_id',
  })
  declare residentId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare author: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare content: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare timestamp: Date;

  @Column({
    type: DataType.ENUM('Observation', 'Clinical', 'General'),
    allowNull: false,
  })
  declare type: string;
}