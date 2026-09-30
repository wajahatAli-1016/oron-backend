import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

export interface TaskCreationAttributes {
  id?: string;
  residentId: string;
  branchId: string;
  facilityId: string;
  title: string;
  description?: string;
  category: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate: string | Date;
  assignedToId: string;
  createdById: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: 'Task',
  timestamps: true,
  underscored: false,
})
export class Task extends Model<Task, TaskCreationAttributes> {
  @PrimaryKey
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare residentId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare branchId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare facilityId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare description?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare category: string;

  @AllowNull(false)
  @Column({
    type: DataType.ENUM('TODO', 'IN_PROGRESS', 'DONE'),
  })
  declare status: 'TODO' | 'IN_PROGRESS' | 'DONE';

  @AllowNull(false)
  @Column(DataType.DATE)
  declare dueDate: Date;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare assignedToId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare createdById: string;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'updatedAt',
  })
  declare updatedAt: Date;
}
