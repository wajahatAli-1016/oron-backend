import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Note } from './notes.model';
import { CreateNoteDto } from './dto/create-note.dto';

@Injectable()
export class NotesService {
  constructor(
    @InjectModel(Note)
    private noteModel: typeof Note,
  ) {}

  async create(createNoteDto: CreateNoteDto): Promise<Note> {
    const note = await this.noteModel.create(createNoteDto as any);
    return note as Note;
  }

  async findAll(filters?: any): Promise<Note[]> {
    const where: any = {};

    if (filters?.residentId) {
      where.residentId = filters.residentId;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.author) {
      where.author = { [Op.iLike]: `%${filters.author}%` };
    }

    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp[Op.gte] = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp[Op.lte] = filters.endDate;
      }
    }

    return this.noteModel.findAll({
      where,
      order: [['timestamp', 'DESC']],
    });
  }

  async findOne(id: string): Promise<Note | null> {
    const note = await this.noteModel.findByPk(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async findByResidentId(residentId: string): Promise<Note[] | null> {
    return this.noteModel.findAll({
      where: { residentId },
      order: [['timestamp', 'DESC']],
    });
  }

  async remove(id: string): Promise<Note | null> {
    const note = await this.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    await note.destroy();
    return note as Note;
}
}