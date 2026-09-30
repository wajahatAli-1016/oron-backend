import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  residentLimit?: number;

  @IsOptional()
  @IsString()
  branchAdminFirstName?: string;

  @IsOptional()
  @IsString()
  branchAdminLastName?: string;

  @IsOptional()
  @IsEmail()
  branchAdminEmail?: string;
}
