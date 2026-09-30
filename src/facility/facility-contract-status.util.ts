import { FacilityStatus } from './facility-status.constants';

/** Calendar date at local midnight (contract comparisons use date only). */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** True when today is strictly after the contract end date. */
export function isContractExpired(
  contractEnd: Date,
  asOf: Date = new Date(),
): boolean {
  return startOfDay(asOf) > startOfDay(contractEnd);
}

/**
 * Derives facility status from contract end date.
 * - After contract end → Inactive (persisted in DB)
 * - Valid contract and was auto-Inactive → Active
 * - Otherwise keeps manual statuses (Pending, Suspended, Active)
 */
export function resolveStatusFromContract(
  currentStatus: string,
  contractEnd: Date,
  asOf: Date = new Date(),
): string {
  if (isContractExpired(contractEnd, asOf)) {
    return FacilityStatus.INACTIVE;
  }

  if (currentStatus === FacilityStatus.INACTIVE) {
    return FacilityStatus.ACTIVE;
  }

  return currentStatus;
}
