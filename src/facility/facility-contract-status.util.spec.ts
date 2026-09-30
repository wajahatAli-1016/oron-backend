import {
  isContractExpired,
  resolveStatusFromContract,
} from './facility-contract-status.util';
import { FacilityStatus } from './facility-status.constants';

describe('facility-contract-status.util', () => {
  const asOf = new Date(2026, 4, 19); // May 19, 2026 local

  it('marks facility inactive when contract ended before today', () => {
    const contractEnd = new Date(2026, 4, 18);
    expect(isContractExpired(contractEnd, asOf)).toBe(true);
    expect(
      resolveStatusFromContract(FacilityStatus.ACTIVE, contractEnd, asOf),
    ).toBe(FacilityStatus.INACTIVE);
  });

  it('keeps facility active on contract end date', () => {
    const contractEnd = new Date(2026, 4, 19);
    expect(isContractExpired(contractEnd, asOf)).toBe(false);
    expect(
      resolveStatusFromContract(FacilityStatus.ACTIVE, contractEnd, asOf),
    ).toBe(FacilityStatus.ACTIVE);
  });

  it('reactivates when contract is extended after auto-inactive', () => {
    const contractEnd = new Date(2026, 5, 1);
    expect(
      resolveStatusFromContract(FacilityStatus.INACTIVE, contractEnd, asOf),
    ).toBe(FacilityStatus.ACTIVE);
  });

  it('preserves manual pending status while contract is valid', () => {
    const contractEnd = new Date(2026, 11, 31);
    expect(
      resolveStatusFromContract(FacilityStatus.PENDING, contractEnd, asOf),
    ).toBe(FacilityStatus.PENDING);
  });
});
