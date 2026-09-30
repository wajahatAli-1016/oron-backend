import { AuditLog } from '../audit-log.model';

export type PaginatedAuditLogsResult = {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  actions: string[];
};
