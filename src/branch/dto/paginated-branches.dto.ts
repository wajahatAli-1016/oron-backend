import { Branch } from '../branch.model';

export type PaginatedBranchesResult = {
  data: Branch[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
