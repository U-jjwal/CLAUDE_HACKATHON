import { readFileSync } from 'node:fs';
import { parseReadings, num } from '../src/core/clean';
import { rankStability, composite } from '../src/core/score';
import { profile, carryOver, assessReading } from '../src/core/insights';

const rs = parseReadings(readFileSync(new URL('../data/bhopal_ghats_2023_2025.csv', import.meta.url), 'utf8'));
let failed = 0;
const check = (name: string, ok: boolean, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${detail}`); if (!ok) failed++; };
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

// 1. Headline numbers from the participant guide
const doV = rs.filter(r => r.parameter === 'Dissolved oxygen').map(num).filter((v): v is number => v !== null);
const bodV = rs.filter(r => r.parameter === 'BOD').map(num).filter((v): v is number => v !== null);
const phV = rs.filter(r => r.parameter === 'pH').map(num).filter((v): v is number => v !== null);
check('rows', rs.length === 1524, String(rs.length));
check('DO below 5: 42 of 116', doV.length === 116 && doV.filter(v => v < 5).length === 42);
check('BOD above 3: 100 of 112', bodV.length === 112 && bodV.filter(v => v > 3).length === 100);
check('pH outside range: 6 of 115', phV.length === 115 && phV.filter(v => v < 6.5 || v > 8.5).length === 6);

// 2. Three states stay separate
const kinds = rs.reduce<Record<string, number>>((a, r) => ((a[r.state.kind] = (a[r.state.kind] ?? 0) + 1), a), {});
console.log('\nstates', kinds);
check('not_sampled kept apart from zero', rs.filter(r => r.state.kind === 'not_sampled').every(r => num(r) === null));
const lb = rs.filter(r => r.state.kind === 'likely_bdl');
const byParam = lb.reduce<Record<string, number>>((a, r) => ((a[r.parameter] = (a[r.parameter] ?? 0) + 1), a), {});
console.log('likely detection-limit placeholders (2025):', byParam);
check('all 29 numeric 2025 Chromium values flagged', byParam.Chromium === 29);

// 3. Scores and stability
const st = rankStability(rs);
console.log('\nALL EVENTS'); console.table(st.map(s => ({ ghat: s.ghat.split(' ')[0], score: +(s.score ?? 0).toFixed(2), medianRank: s.medianRank, pTop1: s.pTop1, pTop2: s.pTop2, pBottom2: s.pBottom2, tier: s.tier })));
const sc = (n: string) => st.find(s => s.ghat.startsWith(n))!;
check('Bairagarh score ~0.42', near(sc('Bairagarh').score!, 0.42, 0.01));
check('Prempura score ~0.07', near(sc('Prempura').score!, 0.07, 0.01));
check('Bairagarh tier A, top-1 in >90% of resamples', sc('Bairagarh').tier === 'A' && sc('Bairagarh').pTop1 > 0.9);
check('Prempura tier C', sc('Prempura').tier === 'C');
const stD = rankStability(rs.filter(r => r.festival === 'Durga'));
console.log('DURGA ONLY'); console.table(stD.map(s => ({ ghat: s.ghat.split(' ')[0], score: +(s.score ?? 0).toFixed(2), pTop2: s.pTop2, pBottom2: s.pBottom2, tier: s.tier })));

// 4. Profiles
const ghats = [...new Set(rs.map(r => r.ghat))].sort();
console.log('\nPROFILES'); console.table(ghats.map(g => { const p = profile(rs, g); return { ghat: g.split(' ')[0], doEvents: p.doEvents, preFail: p.doPreFail, triggered: p.doTriggered, afterFail: p.doAfterFail, bodRise: p.bodRiseDuring?.toFixed(1), missing: p.missingEvents.join(','), tags: p.tags.join(' ') }; }));
const bp = profile(rs, ghats.find(g => g.startsWith('Bairagarh'))!);
check('Bairagarh missing Durga 2025', bp.missingEvents.includes('2025-Durga'));
check('Bairagarh tagged recurring_baseline + slow_recovery + data_gap', ['recurring_baseline', 'slow_recovery', 'data_gap'].every(t => bp.tags.includes(t)));
const hp = profile(rs, ghats.find(g => g.startsWith('Hathaikheda'))!);
check('Hathaikheda: no DO failures but organic_load_spike', hp.doPreFail === 0 && hp.doAfterFail === 0 && hp.tags.includes('organic_load_spike'));

// 5. Carry-over
const cDO = carryOver(rs, 'Dissolved oxygen'), cBOD = carryOver(rs, 'BOD');
console.log('\ncarry-over', cDO, cBOD);
check('carry-over DO: 14 of 19 worse at Durga pre', cDO.n === 19 && cDO.durgaWorse === 14 && near(cDO.meanDurgaPre, 5.51, 0.01));
check('carry-over BOD: 14 of 18 worse at Durga pre', cBOD.n === 18 && cBOD.durgaWorse === 14 && near(cBOD.meanDurgaPre, 6.53, 0.01));

// 6. Add today's reading
const a = assessReading(rs, ghats.find(g => g.startsWith('Prempura'))!, 'Dissolved oxygen', 3.2);
console.log('\nassess Prempura DO 3.2 ->', { outsideClassB: a.outsideClassB, past: a.pastReadings, worseThanShareOfPast: a.worseThanShareOfPast });
check('3.2 mg/l DO is outside class B', a.outsideClassB === true && a.pastReadings > 0);

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll checks passed');
process.exit(failed ? 1 : 0);
