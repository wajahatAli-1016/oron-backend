export interface StaffRecord {
  id: string;
  branchId: string;
  facilityId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  lastActive: string | null;
  permissions: string[];
}
