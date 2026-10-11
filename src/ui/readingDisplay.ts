import type { Reading } from '../core/types';

export interface DisplayReading {
  label: string;
  kind: 'value' | 'bdl' | 'likely_bdl' | 'not_sampled' | 'no_record';
  note?: string;
  ariaLabel: string;
  unitLabel: string;
}

export const ASSUMED_UNIT = 'mg/L (assumed; reports print no units)';
export const PH_NO_UNIT = 'pH units (no unit)';

export function getUnitForParam(param: string): string {
  if (param === 'pH') return PH_NO_UNIT;
  return ASSUMED_UNIT;
}

export function displayReading(r: Reading | null | undefined): DisplayReading {
  if (!r) {
    return {
      label: 'No record',
      kind: 'no_record',
      note: 'No row present in report table for this combination',
      ariaLabel: 'No record available in report table',
      unitLabel: '',
    };
  }

  const unit = getUnitForParam(r.parameter);

  switch (r.state.kind) {
    case 'value':
      return {
        label: String(r.state.value),
        kind: 'value',
        ariaLabel: `${r.state.value} ${unit}`,
        unitLabel: unit,
      };
    case 'bdl':
      return {
        label: 'BDL',
        kind: 'bdl',
        note: 'Below Detection Limit: very low concentration, not zero, not missing',
        ariaLabel: 'Below Detection Limit (BDL)',
        unitLabel: unit,
      };
    case 'likely_bdl': {
      const orig = r.valueAsPrinted || String(r.state.value);
      const note = r.state.note || `equals detection limit (${orig})`;
      return {
        label: `Likely BDL - verify (${orig})`,
        kind: 'likely_bdl',
        note: `Printed as ${orig}; ${note}. Verify with MPPCB.`,
        ariaLabel: `Likely Below Detection Limit: printed as ${orig}, equals known detection limit. Verify with MPPCB.`,
        unitLabel: unit,
      };
    }
    case 'not_sampled':
      return {
        label: 'Not sampled',
        kind: 'not_sampled',
        note: r.valueAsPrinted ? `Report marked: ${r.valueAsPrinted}` : 'Not sampled or no table entry. Never treated as clean.',
        ariaLabel: 'Not sampled (missing data, never treated as clean)',
        unitLabel: unit,
      };
  }
}
