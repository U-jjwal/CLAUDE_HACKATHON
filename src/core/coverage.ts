import type { Festival, Phase, Reading } from './types';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface MissingCell {
  year: number;
  festival: Festival;
  phase: Phase;
  parameter: string;
  reason: 'not_sampled' | 'bdl' | 'likely_bdl' | 'no_row';
}

export interface GhatCoverage {
  ghat: string;
  festivalFilter: 'All' | Festival;
  expectedCells: number;
  usableCells: number;
  coverageRatio: number; // usableCells / expectedCells (0 to 1)
  coveragePct: number;   // 0 to 100
  confidence: ConfidenceLevel;
  confidenceReason: string;
  missingEvents: string[]; // e.g. ["2025-Durga"]
  partialEvents: string[]; // events with some missing/unusable cells
  missingCells: MissingCell[];
}

export const CORE_PARAMETERS = ['Dissolved oxygen', 'BOD', 'pH'] as const;
export const EXPECTED_YEARS = [2023, 2024, 2025] as const;
export const EXPECTED_FESTIVALS: Festival[] = ['Ganesh', 'Durga'];
export const EXPECTED_PHASES: Phase[] = ['pre', 'during', 'after'];

/**
 * Pure function: calculates expected vs usable cells per ghat.
 * Only state.kind === 'value' counts as usable numeric measurement.
 *
 * Confidence thresholds (judgement call):
 * - High: >= 90% usable readings AND no entirely missing events.
 * - Medium: 75% to 89% usable readings (e.g. minor parameters missing).
 * - Low: < 75% usable readings OR an entire event is unrecorded.
 */
export function computeGhatCoverage(
  readings: Reading[],
  ghat: string,
  festivalFilter: 'All' | Festival = 'All',
): GhatCoverage {
  const targetFestivals: Festival[] =
    festivalFilter === 'All' ? [...EXPECTED_FESTIVALS] : [festivalFilter];

  let expectedCells = 0;
  let usableCells = 0;
  const missingCells: MissingCell[] = [];

  const eventMap = new Map<string, { total: number; usable: number }>();

  for (const year of EXPECTED_YEARS) {
    for (const fest of targetFestivals) {
      const eventKey = `${year}-${fest}`;
      let evTotal = 0;
      let evUsable = 0;

      for (const phase of EXPECTED_PHASES) {
        for (const parameter of CORE_PARAMETERS) {
          expectedCells++;
          evTotal++;

          const match = readings.find(
            r =>
              r.ghat === ghat &&
              r.year === year &&
              r.festival === fest &&
              r.phase === phase &&
              r.parameter === parameter,
          );

          if (match && match.state.kind === 'value') {
            usableCells++;
            evUsable++;
          } else {
            const reason: MissingCell['reason'] = match
              ? match.state.kind === 'value'
                ? 'no_row'
                : match.state.kind
              : 'no_row';
            missingCells.push({
              year,
              festival: fest,
              phase,
              parameter,
              reason,
            });
          }
        }
      }

      eventMap.set(eventKey, { total: evTotal, usable: evUsable });
    }
  }

  const missingEvents: string[] = [];
  const partialEvents: string[] = [];

  for (const [ev, counts] of eventMap.entries()) {
    if (counts.usable === 0) {
      missingEvents.push(ev);
    } else if (counts.usable < counts.total) {
      partialEvents.push(ev);
    }
  }

  const coverageRatio = expectedCells > 0 ? usableCells / expectedCells : 0;
  const coveragePct = Math.round(coverageRatio * 100);

  // Derive confidence level
  let confidence: ConfidenceLevel;
  let confidenceReason: string;

  if (missingEvents.length > 0 || coveragePct < 75) {
    confidence = 'Low';
    confidenceReason = missingEvents.length > 0
      ? `Entirely missing event(s): ${missingEvents.join(', ')} (${coveragePct}% data complete)`
      : `Substantial data gaps: only ${coveragePct}% complete (${usableCells}/${expectedCells} cells)`;
  } else if (coveragePct < 90 || partialEvents.length > 0) {
    confidence = 'Medium';
    confidenceReason = `Partial parameter gaps in ${partialEvents.join(', ')} (${coveragePct}% complete, ${usableCells}/${expectedCells} cells)`;
  } else {
    confidence = 'High';
    confidenceReason = `Complete historical records across all monitored events (${coveragePct}% complete, ${usableCells}/${expectedCells} cells)`;
  }

  return {
    ghat,
    festivalFilter,
    expectedCells,
    usableCells,
    coverageRatio,
    coveragePct,
    confidence,
    confidenceReason,
    missingEvents,
    partialEvents,
    missingCells,
  };
}

/**
 * Compute coverage for all unique ghats in the readings.
 */
export function computeAllGhatCoverage(
  readings: Reading[],
  festivalFilter: 'All' | Festival = 'All',
): Record<string, GhatCoverage> {
  const ghats = [...new Set(readings.map(r => r.ghat))].sort();
  const map: Record<string, GhatCoverage> = {};
  for (const g of ghats) {
    map[g] = computeGhatCoverage(readings, g, festivalFilter);
  }
  return map;
}
