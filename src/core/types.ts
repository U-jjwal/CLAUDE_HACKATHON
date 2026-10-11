export type Phase = 'pre' | 'during' | 'after';
export type Festival = 'Ganesh' | 'Durga';

/** A reading is never just a number. Blank and BDL are different from 0 and from each other. */
export type ValueState =
  | { kind: 'value'; value: number }
  | { kind: 'likely_bdl'; value: number; note: string } // number equals a known detection limit; treat as BDL, verify
  | { kind: 'bdl' }                                     // below detection limit: very low, not zero, not missing
  | { kind: 'not_sampled' };                            // missing. NEVER clean.

export interface Reading {
  year: number;
  festival: Festival;
  ghat: string;
  waterBody: string;
  phase: Phase;
  parameter: string;
  state: ValueState;
  valueAsPrinted: string;
  sourcePage: number; // page in that year's MPPCB report
  siteMatchConfidence: string;
}
