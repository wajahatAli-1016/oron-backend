export type ThresholdLevel =
  | 'NORMAL'
  | 'LOW'
  | 'HIGH'
  | 'CRITICAL_LOW'
  | 'CRITICAL_HIGH';

export type ClinicalHealthState =
  | 'Stable'
  | 'Slight Deviation'
  | 'Concerning Trend'
  | 'Early Deterioration'
  | 'Active Deterioration'
  | 'Recovery';

export type ThresholdResult = {
  vitalType: string;
  value: number;
  unit: string;
  level: ThresholdLevel;
  ruleId: string;
  ruleName: string;
};

const CLINICAL_ACTION: Record<ClinicalHealthState, string> = {
  Stable: 'none',
  'Slight Deviation': 'monitor',
  'Concerning Trend': 'internal_flag_closer_observation',
  'Early Deterioration': 'notify_caregiver_non_urgent',
  'Active Deterioration': 'urgent_alert',
  Recovery: 'de_escalate',
};

function isThresholdResultEntry(
  key: string,
  value: unknown,
): value is ThresholdResult {
  if (key === 'clinicalSummary') {
    return false;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  return typeof v.level === 'string' && typeof v.vitalType === 'string';
}

/**
 * Clinical state from how many vitals are outside rule thresholds (V1).
 * 0 → Stable, 1 → Slight Deviation, 2 → Concerning Trend, 3+ → Early Deterioration.
 */
export function computeResidentClinicalStatus(
  evaluation: Record<string, unknown>,
  _previousHealthState?: string | null,
): { state: ClinicalHealthState; action: string } {
  let abnormalCount = 0;

  for (const [key, raw] of Object.entries(evaluation)) {
    if (!isThresholdResultEntry(key, raw)) {
      continue;
    }
    if (raw.level !== 'NORMAL') {
      abnormalCount += 1;
    }
  }

  let state: ClinicalHealthState;
  if (abnormalCount === 0) {
    state = 'Stable';
  } else if (abnormalCount === 1) {
    state = 'Slight Deviation';
  } else if (abnormalCount === 2) {
    state = 'Concerning Trend';
  } else {
    state = 'Early Deterioration';
  }

  return { state, action: CLINICAL_ACTION[state] };
}
