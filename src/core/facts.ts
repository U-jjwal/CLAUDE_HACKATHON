import type { Festival, Reading } from './types';
import { cite, num } from './clean';
import { rankStability, type Stability, type Tier } from './score';
import { profile, carryOver, type GhatProfile } from './insights';
import { computeAllGhatCoverage, type ConfidenceLevel, type GhatCoverage } from './coverage';
import { computeTopActions, type ActionItem } from './actions';

export interface GhatFact {
  ghat: string;
  waterBody: string;
  tier: Tier;
  score: number;
  pTop2: number;
  pBottom2: number;
  tags: string[];
  confidence: ConfidenceLevel;
  confidenceReason: string;
  doPreFail: number;
  doEvents: number;
  doTriggered: number;
  doAfterFail: number;
  keyReadings: {
    parameter: string;
    phase: string;
    year: number;
    festival: Festival;
    displayValue: string;
    citation: string;
  }[];
}

export interface BriefFacts {
  targetDate: string;
  targetFestival: Festival | 'All';
  totalRows: number;
  ghatsCount: number;
  ghats: GhatFact[];
  carryOverDO: { n: number; durgaWorse: number };
  carryOverBOD: { n: number; durgaWorse: number };
  unmonitoredSites: string[];
  topActions: ActionItem[];
  stats: {
    doBelow5: number;
    doTotal: number;
    bodAbove3: number;
    bodTotal: number;
    phOutside: number;
    phTotal: number;
    likelyBdlCount: number;
    chromiumCount: number;
    leadCount: number;
    copperCount: number;
    zincCount: number;
    missingDurga2025Ghats: string[];
  };
}

export const INITIAL_BLIND_SPOTS = [
  'Arch Bridge ghat',
  'Barkatullah University campus ghat',
  'Sanjeev Nagar ghat',
  'Neelbagh ghat',
  'Malikhadi',
];

export function buildBriefFacts(
  readings: Reading[],
  festival: Festival | 'All' = 'Durga',
  blindSpotSites: string[] = INITIAL_BLIND_SPOTS,
): BriefFacts {
  const targetReadings = festival === 'All' ? readings : readings.filter(r => r.festival === festival);
  // Match verify.ts parameters: B=2000, seed=7
  const stability = rankStability(targetReadings, { B: 2000, seed: 7 });

  const coverages = computeAllGhatCoverage(readings, festival);
  const profiles: Record<string, GhatProfile> = {};
  for (const s of stability) {
    profiles[s.ghat] = profile(targetReadings, s.ghat);
  }

  const cDO = carryOver(readings, 'Dissolved oxygen');
  const cBOD = carryOver(readings, 'BOD');

  const doReadings = readings.filter(r => r.parameter === 'Dissolved oxygen').map(num).filter((v): v is number => v !== null);
  const bodReadings = readings.filter(r => r.parameter === 'BOD').map(num).filter((v): v is number => v !== null);
  const phReadings = readings.filter(r => r.parameter === 'pH').map(num).filter((v): v is number => v !== null);

  const likelyBdl = readings.filter(r => r.state.kind === 'likely_bdl');

  const ghatFacts: GhatFact[] = stability.map(s => {
    const p = profiles[s.ghat];
    const cov = coverages[s.ghat];
    const ghatRows = targetReadings.filter(r => r.ghat === s.ghat);

    // Pick 2-3 key indicative readings
    const keyRows = ghatRows
      .filter(r => r.parameter === 'Dissolved oxygen' || r.parameter === 'BOD')
      .slice(0, 3);

    const keyReadings = keyRows.map(r => ({
      parameter: r.parameter,
      phase: r.phase,
      year: r.year,
      festival: r.festival,
      displayValue: r.state.kind === 'value' ? `${r.state.value} mg/L` : r.state.kind === 'bdl' ? 'BDL' : r.state.kind === 'likely_bdl' ? `Likely BDL (${r.valueAsPrinted})` : 'Not sampled',
      citation: cite(r),
    }));

    return {
      ghat: s.ghat,
      waterBody: p?.waterBody ?? '',
      tier: s.tier,
      score: +(s.score ?? 0).toFixed(2),
      pTop2: +(s.pTop2).toFixed(3),
      pBottom2: +(s.pBottom2).toFixed(3),
      tags: p?.tags ?? [],
      confidence: cov?.confidence ?? 'Medium',
      confidenceReason: cov?.confidenceReason ?? '',
      doPreFail: p?.doPreFail ?? 0,
      doEvents: p?.doEvents ?? 0,
      doTriggered: p?.doTriggered ?? 0,
      doAfterFail: p?.doAfterFail ?? 0,
      keyReadings,
    };
  });

  const actions = computeTopActions(readings, stability, profiles, coverages, blindSpotSites);

  const missingDurga = Object.values(coverages)
    .filter(c => c.missingEvents.includes('2025-Durga'))
    .map(c => c.ghat.split(' ')[0]);

  return {
    targetDate: '20 October 2026',
    targetFestival: festival,
    totalRows: readings.length,
    ghatsCount: stability.length,
    ghats: ghatFacts,
    carryOverDO: { n: cDO.n, durgaWorse: cDO.durgaWorse },
    carryOverBOD: { n: cBOD.n, durgaWorse: cBOD.durgaWorse },
    unmonitoredSites: [...blindSpotSites],
    topActions: actions,
    stats: {
      doBelow5: doReadings.filter(v => v < 5).length,
      doTotal: doReadings.length,
      bodAbove3: bodReadings.filter(v => v > 3).length,
      bodTotal: bodReadings.length,
      phOutside: phReadings.filter(v => v < 6.5 || v > 8.5).length,
      phTotal: phReadings.length,
      likelyBdlCount: likelyBdl.length,
      chromiumCount: likelyBdl.filter(r => r.parameter === 'Chromium').length,
      leadCount: likelyBdl.filter(r => r.parameter === 'Lead').length,
      copperCount: likelyBdl.filter(r => r.parameter === 'Copper').length,
      zincCount: likelyBdl.filter(r => r.parameter === 'Zinc').length,
      missingDurga2025Ghats: missingDurga,
    },
  };
}
