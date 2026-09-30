import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
  sub: string;      // User ID
  role: Role;
  facilityId?: string;
  branchId?: string;
}

export interface LoginResponse {
  access_token: string;
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    role: Role;
    facilityId?: string;
    branchId?: string;
  };
}