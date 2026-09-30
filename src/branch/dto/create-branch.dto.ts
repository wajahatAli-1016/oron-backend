import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateBranchDto {
  @IsUUID()
  facilityId: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsInt()
  @Min(1)
  residentLimit: number;

  @IsString()
  @IsNotEmpty()
  branchAdminFirstName: string;

  @IsString()
  @IsNotEmpty()
  branchAdminLastName: string;

  @IsEmail()
  @IsNotEmpty()
  branchAdminEmail: string;

  /** Ignored — branch admin sets password via emailed invite link. */
  @IsOptional()
  @IsString()
  branchAdminPassword?: string;
}
