import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum NoteType {
  OBSERVATION = 'Observation',
  CLINICAL = 'Clinical',
  GENERAL = 'General',
}

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  residentId: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsDateString()
  @IsOptional()
  timestamp?: string;

  @IsEnum(NoteType)
  @IsNotEmpty()
  type: NoteType;
}