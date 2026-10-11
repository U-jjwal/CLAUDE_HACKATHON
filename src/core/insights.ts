import type { Festival, Reading } from './types';
import { num, cite } from './clean';
import { exceeds, LIMITS } from './limits';

export interface Triple { ghat: string; year: number; festival: Festival; pre: number; during: number; after: number }

/** Events where pre, during and after all have a real number. Only these can show an immersion effect. */
export function triples(rs: Reading[], parameter: string): Triple[] {
  const m = new Map<string, Partial<Triple> & { ghat: string; year: number; festival: Festival }>();
  for (const r of rs) {
    if (r.parameter !== parameter) continue;
    const v = num(r); if (v === null) continue;
    const k = `${r.ghat}|${r.year}|${r.festival}`;
    const t = m.get(k) ?? { ghat: r.ghat, year: r.year, festival: r.festival };
    t[r.phase] = v; m.set(k, t);
  }
  return [...m.values()].filter(t => t.pre !== undefined && t.during !== undefined && t.after !== undefined) as Triple[];
}

export interface GhatProfile {
  ghat: string; waterBody: string;
  doEvents: number; doPreFail: number; doTriggered: number; doAfterFail: number;
  bodRiseDuring: number | null;
  missingEvents: string[]; partialEvents: string[];
  tags: string[];
}

/** Tags are derived from visible counts; thresholds are explicit so the officer can challenge them. */
export function profile(rs: Reading[], ghat: string): GhatProfile {
  const mine = rs.filter(r => r.ghat === ghat);
  const allEvents = [...new Set(rs.map(r => `${r.year}-${r.festival}`))].sort();
  const withData = (ev: string) => mine.some(r => `${r.year}-${r.festival}` === ev && (r.parameter === 'Dissolved oxygen' || r.parameter === 'BOD') && num(r) !== null);
  const missingEvents = allEvents.filter(ev => !withData(ev));
  const partialEvents = allEvents.filter(ev => withData(ev) && ['pre', 'after'].some(ph =>
    !mine.some(r => `${r.year}-${r.festival}` === ev && r.parameter === 'Dissolved oxygen' && r.phase === ph && num(r) !== null)));
  const dt = triples(mine, 'Dissolved oxygen');
  const bt = triples(mine, 'BOD');
  const doPreFail = dt.filter(t => t.pre < 5).length;
  const doTriggered = dt.filter(t => t.pre >= 5 && t.during < 5).length;
  const doAfterFail = dt.filter(t => t.after < 5).length;
  const bodRiseDuring = bt.length ? bt.reduce((s, t) => s + (t.during - t.pre), 0) / bt.length : null;
  const tags: string[] = [];
  if (doPreFail >= 2) tags.push('recurring_baseline');      // below the DO limit before any idol arrives, in 2+ events
  if (doTriggered >= 1) tags.push('immersion_triggered');   // passed before, failed during
  if (doAfterFail >= 2) tags.push('slow_recovery');         // still below the DO limit a week later, in 2+ events
  if (bodRiseDuring !== null && bodRiseDuring >= 2) tags.push('organic_load_spike'); // BOD rises 2+ mg/l on average during immersion
  if (missingEvents.length || partialEvents.length) tags.push('data_gap');
  return { ghat, waterBody: mine[0]?.waterBody ?? '', doEvents: dt.length, doPreFail, doTriggered, doAfterFail, bodRiseDuring, missingEvents, partialEvents, tags };
}

export interface CarryOver { parameter: string; n: number; meanGaneshPre: number; meanGaneshAfter: number; meanDurgaPre: number; durgaWorse: number }

/** Does water start Durga worse than it started Ganesh in the same year? Needs all three readings. */
export function carryOver(rs: Reading[], parameter: string): CarryOver {
  const get = (g: string, y: number, f: Festival, ph: string) => {
    const r = rs.find(x => x.ghat === g && x.year === y && x.festival === f && x.parameter === parameter && x.phase === ph);
    return r ? num(r) : null;
  };
  const keys = [...new Set(rs.map(r => `${r.ghat}|${r.year}`))];
  const rows: { gp: number; ga: number; dp: number }[] = [];
  for (const k of keys) {
    const [g, y] = k.split('|'); const yr = Number(y);
    const gp = get(g, yr, 'Ganesh', 'pre'), ga = get(g, yr, 'Ganesh', 'after'), dp = get(g, yr, 'Durga', 'pre');
    if (gp !== null && ga !== null && dp !== null) rows.push({ gp, ga, dp });
  }
  const m = (f: (r: typeof rows[number]) => number) => rows.reduce((s, r) => s + f(r), 0) / rows.length;
  const lowerIsWorse = parameter === 'Dissolved oxygen';
  return {
    parameter, n: rows.length,
    meanGaneshPre: m(r => r.gp), meanGaneshAfter: m(r => r.ga), meanDurgaPre: m(r => r.dp),
    durgaWorse: rows.filter(r => (lowerIsWorse ? r.dp < r.gp : r.dp > r.gp)).length,
  };
}

/** "Add today's reading": compare a new pre-immersion test with CPCB class B and with this ghat's own history. */
export function assessReading(rs: Reading[], ghat: string, parameter: string, value: number, phase: 'pre' | 'during' | 'after' = 'pre') {
  const past = rs.filter(r => r.ghat === ghat && r.parameter === parameter && r.phase === phase)
    .map(r => ({ v: num(r), r })).filter((x): x is { v: number; r: Reading } => x.v !== null);
  const lowerIsWorse = parameter === 'Dissolved oxygen';
  const worseThanShare = past.length
    ? past.filter(p => (lowerIsWorse ? value < p.v : value > p.v)).length / past.length : null;
  const outside = exceeds(parameter, value);
  const limit = (LIMITS as Record<string, { rule: string }>)[parameter]?.rule ?? 'no class B limit';
  return {
    ghat, parameter, phase, value, limit,
    outsideClassB: outside, pastReadings: past.length,
    worseThanShareOfPast: worseThanShare, // share of past readings (same phase) that this one is worse than
    evidence: past.map(p => ({ value: p.v, source: cite(p.r) })),
  };
}
