import type { Reading } from './types';
import { num } from './clean';

/**
 * Transparent composite. Each part is 0 (meets class B) to 1 (worst):
 *  - DO: how far below 5 mg/l, as a fraction of 5
 *  - BOD: how many times above 3 mg/l, scaled so 3x limit = 1/3 ... capped at 4x
 *  - pH: share of readings outside 6.5 to 8.5
 * The weights are a judgement call, not a law. Defend them by showing they do not change the
 * extreme ranks (see rankStability), not by claiming they are correct.
 */
export const DEFAULT_WEIGHTS = { do: 0.45, bod: 0.4, ph: 0.15 };
export type Weights = typeof DEFAULT_WEIGHTS;

const vals = (rs: Reading[], p: string) =>
  rs.filter(r => r.parameter === p).map(num).filter((v): v is number => v !== null);
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const clip = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** null when there is no DO or no BOD number at all. Missing data is never scored as clean. */
export function composite(rs: Reading[], w: Weights = DEFAULT_WEIGHTS): number | null {
  const d = vals(rs, 'Dissolved oxygen'), b = vals(rs, 'BOD'), p = vals(rs, 'pH');
  if (!d.length || !b.length) return null;
  const doS = mean(d.map(x => clip((5 - x) / 5, 0, 1)));
  const bodS = mean(b.map(x => clip(x / 3, 1, 4) - 1)) / 3;
  const phS = p.length ? p.filter(x => x < 6.5 || x > 8.5).length / p.length : 0;
  return w.do * doS + w.bod * bodS + w.ph * phS;
}

function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Tier = 'A' | 'B' | 'C'; // A = act first, B = close group, C = lowest concern
export interface Stability {
  ghat: string; score: number | null; medianRank: number;
  pTop1: number; pTop2: number; pBottom2: number; tier: Tier;
}

/**
 * With ~6 events per ghat, an exact 1..7 ranking is false precision. Resample whole events
 * (year + festival) with replacement and see how often each ghat lands in the top or bottom.
 */
export function rankStability(
  rs: Reading[],
  opts: { B?: number; seed?: number; weights?: Weights } = {},
): Stability[] {
  const { B = 2000, seed = 7, weights = DEFAULT_WEIGHTS } = opts;
  const rng = mulberry32(seed);
  const ghats = [...new Set(rs.map(r => r.ghat))].sort();
  const events = new Map<string, Reading[][]>();
  for (const g of ghats) {
    const byEvent = new Map<string, Reading[]>();
    for (const r of rs.filter(x => x.ghat === g)) {
      const k = `${r.year}-${r.festival}`;
      const list = byEvent.get(k) ?? [];
      list.push(r); byEvent.set(k, list);
    }
    events.set(g, [...byEvent.values()]);
  }
  const base = ghats.map(g => composite(rs.filter(r => r.ghat === g), weights));
  const ranks: number[][] = ghats.map(() => []);
  for (let i = 0; i < B; i++) {
    const sc = ghats.map((g, j) => {
      const evs = events.get(g)!;
      for (let t = 0; t < 10; t++) {
        const pick = Array.from({ length: evs.length }, () => evs[Math.floor(rng() * evs.length)]).flat();
        const c = composite(pick, weights);
        if (c !== null) return c;
      }
      return base[j] ?? 0;
    });
    sc.map((s, j) => [s, j] as const).sort((a, b) => b[0] - a[0]).forEach(([, j], pos) => ranks[j].push(pos + 1));
  }
  const n = ghats.length;
  return ghats.map((g, j) => {
    const r = [...ranks[j]].sort((a, b) => a - b);
    const pTop1 = r.filter(x => x === 1).length / B;
    const pTop2 = r.filter(x => x <= 2).length / B;
    const pBottom2 = r.filter(x => x >= n - 1).length / B;
    const tier: Tier = pTop2 >= 0.8 ? 'A' : pBottom2 >= 0.8 ? 'C' : 'B';
    return { ghat: g, score: base[j], medianRank: r[Math.floor(r.length / 2)], pTop1, pTop2, pBottom2, tier };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
