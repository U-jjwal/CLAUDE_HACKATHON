// CPCB class B (outdoor bathing) from data/cpcb_water_quality_criteria.csv.
// Assumption to state in the README: class B is a reasonable benchmark for immersion ghats, not an official "immersion" class.
// Class B also limits total coliform (500 MPN/100ml), but the ghat reports contain no coliform data.
export const LIMITS = {
  'Dissolved oxygen': { rule: 'at least 5 mg/l', unit: 'mg/l' },
  BOD: { rule: 'at most 3 mg/l', unit: 'mg/l' },
  pH: { rule: '6.5 to 8.5', unit: '' },
} as const;

/** true = outside class B, false = within, null = no class B limit for this parameter. */
export function exceeds(parameter: string, v: number): boolean | null {
  switch (parameter) {
    case 'Dissolved oxygen': return v < 5;
    case 'BOD': return v > 3;
    case 'pH': return v < 6.5 || v > 8.5;
    default: return null;
  }
}
