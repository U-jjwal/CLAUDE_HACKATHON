import type { Reading } from './types';
import type { Stability } from './score';
import type { GhatProfile } from './insights';
import type { GhatCoverage } from './coverage';

export interface ActionItem {
  id: string;
  rank: number;
  title: string;
  description: string;
  triggerRule: string;
  evidence: string;
  category: 'sampling' | 'remediation' | 'methodology';
}

/**
 * Pure function to derive Top 3 Priority Actions for BMC officers.
 * Based on transparent rules and historical water data.
 * All actions are historical assessments, not live readings.
 */
export function computeTopActions(
  readings: Reading[],
  stability: Stability[],
  profiles: Record<string, GhatProfile>,
  coverages: Record<string, GhatCoverage>,
  blindSpotSites: string[],
): ActionItem[] {
  const actions: ActionItem[] = [];

  // Rule 1: Proposed / operational immersion sites with zero historical testing records
  if (blindSpotSites.length > 0) {
    actions.push({
      id: 'action-unmonitored-sites',
      rank: 1,
      title: 'Prioritise Baseline Pre-Immersion Testing at Unmonitored Sites',
      description:
        'Deploy mobile sampling teams to capture baseline samples (DO, BOD, pH) before idol immersion commences. An unmonitored site is unknown, never safe or clean.',
      triggerRule: 'Operational sites identified with 0 historical MPPCB testing records in the 2023-2025 dataset.',
      evidence: `${blindSpotSites.length} unmonitored sites (${blindSpotSites.join(', ')}) have 0 historical rows in the official dataset.`,
      category: 'sampling',
    });
  }

  // Rule 2: Tier A ghats with persistent low oxygen or severe organic load rise
  const tierAGhats = stability.filter(s => s.tier === 'A').map(s => s.ghat);
  const severeGhats = tierAGhats.filter(g => {
    const prof = profiles[g];
    return prof && (prof.tags.includes('recurring_baseline') || prof.tags.includes('slow_recovery'));
  });

  const targetGhats = severeGhats.length > 0 ? severeGhats : tierAGhats;
  const targetNames = targetGhats.map(g => g.split(' ')[0]).join(' & ');
  const targetDetails = targetGhats
    .map(g => {
      const prof = profiles[g];
      return `${g.split(' ')[0]} (pre-immersion DO failures in ${prof?.doPreFail ?? 0}/${prof?.doEvents ?? 0} events, slow recovery in ${prof?.doAfterFail ?? 0}/${prof?.doEvents ?? 0})`;
    })
    .join('; ');

  actions.push({
    id: 'action-tier-a-remediation',
    rank: 2,
    title: `Pre-Deploy Aeration & Rapid DO Monitoring at High-Risk Ghats (${targetNames || 'Tier A'})`,
    description:
      'Install mechanical surface aerators or water cascades before idol arrivals. High-concern ghats suffer from depressed oxygen even prior to immersion and fail to recover a week later.',
    triggerRule: 'Tier A risk classification combined with recurring baseline DO failure or slow post-immersion recovery tags.',
    evidence: targetDetails || `Ghats classified in Tier A based on 2023-2025 resampled stability analysis.`,
    category: 'remediation',
  });

  // Rule 3: Data gaps, unconfirmed BOD methodology, and missing coliform
  const missingDurga2025 = Object.values(coverages)
    .filter(c => c.missingEvents.includes('2025-Durga'))
    .map(c => c.ghat.split(' ')[0]);

  const likelyBdlCount = readings.filter(r => r.state.kind === 'likely_bdl').length;

  actions.push({
    id: 'action-methodology-data-gaps',
    rank: 3,
    title: 'Resolve Critical Data Gaps, BOD Incubation Protocol & Coliform Testing',
    description:
      'Request MPPCB to verify missing 2025 Durga tables, clarify whether BOD was 3-day at 27°C or 5-day at 20°C, confirm 63 likely-BDL metal readings, and incorporate total coliform in immersion rounds.',
    triggerRule: 'Historical records lack entire event tables, omit Class B coliform parameters, and report ambiguous metal limits.',
    evidence: `${missingDurga2025.join(' and ') || 'Bairagarh and Malikhedi'} lack 2025 Durga immersion records entirely; 0 coliform records exist in 1,524 rows; ${likelyBdlCount} metal readings match detection limits and require MPPCB confirmation.`,
    category: 'methodology',
  });

  return actions;
}
