import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ParseUUIDPipe,
  } from '@nestjs/common';
  import { NotesService } from './notes.service';
  import { CreateNoteDto } from './dto/create-note.dto';
  
  @Controller('notes')
  export class NotesController {
    constructor(private readonly notesService: NotesService) {}
  
    @Post()
    create(@Body() createNoteDto: CreateNoteDto) {
      return this.notesService.create(createNoteDto);
    }
  
    @Get()
    findAll(@Query() filters: any) {
      return this.notesService.findAll(filters);
    }
  
  
    @Get('resident/:residentId')
    findByResidentId(@Param('residentId') residentId: string) {
      return this.notesService.findByResidentId(residentId);
    }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.notesService.findOne(id);
    }
  
    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.notesService.remove(id);
    }
  }