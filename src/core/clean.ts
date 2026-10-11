import Papa from 'papaparse';
import type { Festival, Phase, Reading, ValueState } from './types';

/**
 * 2025 metal values that equal the detection limits MPPCB prints as "<0.03", "<0.031", "<0.018", "<0.009"
 * in its 2025-26 lake report. In the 2025 visarjan tables the "<" is missing, so a detection limit looks
 * like a measurement. We flag these as likely_bdl instead of counting them as detections. Verify with MPPCB.
 */
const DETECTION_LIMITS_2025: Record<string, number[]> = {
  Chromium: [0.03], Lead: [0.031, 0.03], Copper: [0.018], Zinc: [0.009],
};

export function toState(parameter: string, year: number, raw: string, flag: string): ValueState {
  if (flag === 'BDL' || flag === 'ND') return { kind: 'bdl' };
  if (flag) return { kind: 'not_sampled' };               // 'not sampled', '*', '**'
  if (raw === '' || raw == null) return { kind: 'not_sampled' }; // a blank is never "clean"
  const v = Number(raw);
  if (!Number.isFinite(v)) return { kind: 'not_sampled' };
  if (year === 2025 && DETECTION_LIMITS_2025[parameter]?.some(d => Math.abs(d - v) < 1e-9)) {
    return { kind: 'likely_bdl', value: v, note: `equals a known detection limit (${v}); probably "below detection limit", verify` };
  }
  return { kind: 'value', value: v };
}

export function parseReadings(csv: string): Reading[] {
  const { data } = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  return data.map(r => ({
    year: Number(r.year),
    festival: r.festival as Festival,
    ghat: r.site,
    waterBody: r.water_body,
    phase: r.phase as Phase,
    parameter: r.parameter,
    state: toState(r.parameter, Number(r.year), r.value, r.flag),
    valueAsPrinted: r.value_as_printed,
    sourcePage: Number(r.source_page),
    siteMatchConfidence: r.site_match_confidence,
  }));
}

/** Numeric value only when it is a real measurement. BDL, likely_bdl and not_sampled return null. */
export const num = (r: Reading): number | null => (r.state.kind === 'value' ? r.state.value : null);

export const REPORT_FILE: Record<number, string> = {
  2023: 'Idol_immer._Report_23_CPCB.pdf',
  2024: 'Ganesh_and_Durga_visarjan_report-2024.pdf',
  2025: 'Ganesh_and_Durga_visarjan_report-2025.pdf',
};
export const cite = (r: Reading) => `MPPCB ${r.year} report, ${r.festival}, p.${r.sourcePage}`;
