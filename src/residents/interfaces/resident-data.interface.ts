export interface EmergencyContact {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string;
  relation: string;
  email?: string | null;
}

export interface ResidentData {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dob: string;
  gender: string;
  room: string;
  status: string;
  healthState: string;
  admissionDate: string;
  weight: number;
  height: string;
  emergencyContacts: EmergencyContact[];
  medicalHistory: string;
  allergies: string;
  primaryDiagnosis: string;
  lastVitalsDate?: string;
  /**
   * Backwards-compatible response field.
   * This is returned as a short-lived signed URL (NOT stored in DB).
   */
  photoUrl?: string;
  /**
   * Stored in DB (inside encrypted payload) instead of a URL.
   * Used to generate signed URLs on demand.
   */
  photoPublicId?: string;
}
