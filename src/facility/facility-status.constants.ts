export const FacilityStatus = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Inactive',
} as const;

export type FacilityStatusValue =
  (typeof FacilityStatus)[keyof typeof FacilityStatus];
