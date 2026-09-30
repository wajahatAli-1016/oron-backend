import { Facility } from '../facility.model';

export interface CreateFacilityResponse {
  facility: Facility;
  facilityAdminTemporaryPassword?: string;
}
