import { Injectable, ForbiddenException, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.model';
import { User } from '../users/user.model';
import { Branch } from '../branch/branch.model';
import { Resident } from '../residents/resident.model';
import { Facility } from '../facility/facility.model';
import { Role } from '../common/enums/role.enum';
import { OneSignalService } from '../notifications/one-signal.service';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    @InjectModel(Task)
    private taskModel: typeof Task,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Branch)
    private branchModel: typeof Branch,
    @InjectModel(Resident)
    private residentModel: typeof Resident,
    @InjectModel(Facility)
    private facilityModel: typeof Facility,
    private readonly oneSignalService: OneSignalService,
    private readonly alertsService: AlertsService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Ensure Task table exists for environments where migrations were not applied yet.
    await this.taskModel.sync();
  }

  private getRequestUserId(user: User & { sub?: string; userId?: string }): string {
    return user.id ?? user.userId ?? user.sub ?? '';
  }

  async create(createTaskDto: CreateTaskDto, user: User) {
    const creatorId = this.getRequestUserId(user as User & { sub?: string; userId?: string });
    if (!creatorId) {
      throw new ForbiddenException('Authenticated user id is missing in token payload');
    }

    if (user.role !== Role.BRANCH_ADMIN) {
      throw new ForbiddenException('Only branch admins can create tasks');
    }

    if (createTaskDto.branchId !== user.branchId) {
      throw new ForbiddenException('You can only create tasks for your branch');
    }

    const assignedUser = await this.userModel.findOne({
      where: { id: createTaskDto.assignedToId },
    });
    if (!assignedUser || assignedUser.role !== Role.STAFF || assignedUser.branchId !== createTaskDto.branchId) {
      throw new ForbiddenException('Assigned user must be a staff member in your branch');
    }

    const resident = await this.residentModel.findOne({
      where: { id: createTaskDto.residentId },
    });
    if (!resident || resident.branchId !== createTaskDto.branchId) {
      throw new ForbiddenException('Resident must belong to the branch');
    }

    const branch = await this.branchModel.findOne({ where: { id: createTaskDto.branchId } });
    if (!branch || branch.facilityId !== createTaskDto.facilityId) {
      throw new BadRequestException('Branch and facility do not match');
    }

    const facility = await this.facilityModel.findOne({ where: { id: createTaskDto.facilityId } });
    if (!facility) {
      throw new BadRequestException('Facility not found');
    }

    const task = await this.taskModel.create({
      ...createTaskDto,
      createdById: creatorId,
      dueDate: new Date(createTaskDto.dueDate),
    } as any);

    await this.alertsService.createFromTaskAssignment({
      facilityId: createTaskDto.facilityId,
      branchId: createTaskDto.branchId,
      residentId: createTaskDto.residentId,
      assignedToUserId: createTaskDto.assignedToId,
      title: createTaskDto.title,
      dueDate: createTaskDto.dueDate,
      category: createTaskDto.category,
      description: createTaskDto.description,
      createdAt: new Date(),
    });

    void this.oneSignalService.notifyTaskAssigned({
      assignedToUserId: createTaskDto.assignedToId,
      title: createTaskDto.title,
      dueDate: createTaskDto.dueDate,
      category: createTaskDto.category,
      description: createTaskDto.description,
    });

    return task;
  }

  async findAll(user: User) {
    const whereClause: any = {};

    if (user.role === Role.STAFF) {
      whereClause.branchId = user.branchId;
    } else if (user.role === Role.BRANCH_ADMIN) {
      whereClause.branchId = user.branchId;
    } else if (user.role === Role.FACILITY_ADMIN) {
      whereClause.facilityId = user.facilityId;
    }

    return this.taskModel.findAll({ where: whereClause });
  }

  async findOne(id: string, user: User) {
    const task = await this.taskModel.findByPk(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (user.role === Role.STAFF && task.branchId !== user.branchId) {
      throw new ForbiddenException('You can only view tasks in your branch');
    }
    if (user.role === Role.BRANCH_ADMIN && task.branchId !== user.branchId) {
      throw new ForbiddenException('You can only view tasks in your branch');
    }
    if (user.role === Role.FACILITY_ADMIN && task.facilityId !== user.facilityId) {
      throw new ForbiddenException('You can only view tasks in your facility');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: User) {
    const task = await this.findOne(id, user);

    const isBranchAdmin = user.role === Role.BRANCH_ADMIN;
    const isAssignedStaff =
      user.role === Role.STAFF && task.assignedToId === user.id;

    if (!isBranchAdmin && !isAssignedStaff && task.createdById !== user.id) {
      throw new ForbiddenException('You can only update tasks you created');
    }

    // Staff can only move their assigned tasks between statuses.
    if (isAssignedStaff) {
      const allowedKeys = new Set(['status']);
      const keys = Object.keys(updateTaskDto ?? {});
      const hasDisallowed = keys.some((k) => !allowedKeys.has(k));
      if (hasDisallowed) {
        throw new ForbiddenException('Staff can only update task status');
      }
    }

    const updatePayload: any = { ...updateTaskDto };
    if (updatePayload.dueDate) {
      updatePayload.dueDate = new Date(updatePayload.dueDate);
    }

    const previousAssignee = task.assignedToId;
    await task.update(updatePayload);
    if (
      updatePayload.assignedToId &&
      updatePayload.assignedToId !== previousAssignee
    ) {
      const titleForPush =
        (updatePayload.title as string | undefined) ?? task.title;

      await this.alertsService.createFromTaskAssignment({
        facilityId: task.facilityId,
        branchId: task.branchId,
        residentId: task.residentId,
        assignedToUserId: updatePayload.assignedToId,
        title: titleForPush,
        dueDate: (updatePayload.dueDate as string | undefined) ?? task.dueDate,
        category: (updatePayload.category as string | undefined) ?? task.category,
        description:
          (updatePayload.description as string | undefined) ?? task.description,
        createdAt: new Date(),
      });

      void this.oneSignalService.notifyTaskAssigned({
        assignedToUserId: updatePayload.assignedToId,
        title: titleForPush,
        dueDate: (updatePayload.dueDate as string | undefined) ?? task.dueDate,
        category: (updatePayload.category as string | undefined) ?? task.category,
        description:
          (updatePayload.description as string | undefined) ?? task.description,
      });
    }
    return task;
  }

  async remove(id: string, user: User) {
    const task = await this.findOne(id, user);

    if (user.role !== Role.BRANCH_ADMIN && task.createdById !== user.id) {
      throw new ForbiddenException('You can only delete tasks you created');
    }

    await task.destroy();
    return { deleted: true };
  }
}