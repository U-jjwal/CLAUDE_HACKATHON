import { readFileSync } from 'node:fs';
import { parseReadings, cite, num } from '../src/core/clean';
import { exceeds } from '../src/core/limits';
import { displayReading, getUnitForParam, ASSUMED_UNIT, PH_NO_UNIT } from '../src/ui/readingDisplay';
import { computeGhatCoverage, computeAllGhatCoverage } from '../src/core/coverage';
import { buildBriefFacts, INITIAL_BLIND_SPOTS } from '../src/core/facts';
import { generateEnglishBrief, generateHindiBrief, generateWhatsAppSummary } from '../src/core/briefText';
import { validateNumberLock } from '../src/core/numberLock';
import type { Reading } from '../src/core/types';

const rs = parseReadings(readFileSync(new URL('../data/bhopal_ghats_2023_2025.csv', import.meta.url), 'utf8'));

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${detail}`);
  if (!ok) failed++;
};

console.log('=== VERIFY UI & EXTENDED CORE LOGIC ===\n');

// 1. Reading display mapping for all four states
const valReading: Reading = {
  year: 2024, festival: 'Durga', ghat: 'Shahpura lake ghat', waterBody: 'Shahpura lake',
  phase: 'pre', parameter: 'Dissolved oxygen', state: { kind: 'value', value: 6.8 },
  valueAsPrinted: '6.8', sourcePage: 12, siteMatchConfidence: 'high',
};
const bdlReading: Reading = {
  year: 2024, festival: 'Ganesh', ghat: 'Khatlapura ghat', waterBody: 'Lower lake',
  phase: 'during', parameter: 'Lead', state: { kind: 'bdl' },
  valueAsPrinted: 'BDL', sourcePage: 15, siteMatchConfidence: 'high',
};
const likelyBdlReading: Reading = {
  year: 2025, festival: 'Durga', ghat: 'Prempura ghat', waterBody: 'Upper lake',
  phase: 'after', parameter: 'Chromium', state: { kind: 'likely_bdl', value: 0.03, note: 'equals detection limit' },
  valueAsPrinted: '0.03', sourcePage: 22, siteMatchConfidence: 'high',
};
const notSampledReading: Reading = {
  year: 2025, festival: 'Ganesh', ghat: 'Bairagarh (Sant Hirdaram) kund', waterBody: 'Upper lake',
  phase: 'pre', parameter: 'Dissolved oxygen', state: { kind: 'not_sampled' },
  valueAsPrinted: 'not sampled', sourcePage: 30, siteMatchConfidence: 'high',
};

const dVal = displayReading(valReading);
check('displayReading: value returns formatted number', dVal.kind === 'value' && dVal.label === '6.8');
check('displayReading: value includes assumed unit', dVal.unitLabel === ASSUMED_UNIT);

const dBdl = displayReading(bdlReading);
check('displayReading: bdl returns BDL label', dBdl.kind === 'bdl' && dBdl.label === 'BDL');

const dLikely = displayReading(likelyBdlReading);
check('displayReading: likely_bdl contains note and printed value', dLikely.kind === 'likely_bdl' && dLikely.label.includes('Likely BDL') && dLikely.label.includes('0.03'));

const dNotSampled = displayReading(notSampledReading);
check('displayReading: not_sampled returns Not sampled', dNotSampled.kind === 'not_sampled' && dNotSampled.label === 'Not sampled');

const dNoRecord = displayReading(null);
check('displayReading: null returns No record', dNoRecord.kind === 'no_record' && dNoRecord.label === 'No record');

check('Unit label helper distinguishes pH from standard parameters', getUnitForParam('pH') === PH_NO_UNIT && getUnitForParam('DO') === ASSUMED_UNIT);

// 2. Coverage calculation and confidence
const allCoverage = computeAllGhatCoverage(rs, 'All');
const bairagarhCov = allCoverage['Bairagarh (Sant Hirdaram) kund'];
const malikhediCov = allCoverage['Malikhedi kund'];
const hathaikhedaCov = allCoverage['Hathaikheda dam / kund'];
const shahpuraCov = allCoverage['Shahpura lake ghat'];

check('Coverage: Bairagarh missing 2025-Durga', bairagarhCov?.missingEvents.includes('2025-Durga') === true);
check('Coverage: Malikhedi missing 2025-Durga', malikhediCov?.missingEvents.includes('2025-Durga') === true);
check('Coverage: Hathaikheda does NOT claim 2025-Durga missing', hathaikhedaCov?.missingEvents.includes('2025-Durga') === false);
check('Coverage: Shahpura does NOT claim 2025-Durga missing', shahpuraCov?.missingEvents.includes('2025-Durga') === false);
check('Confidence: Bairagarh is Low confidence due to missing event', bairagarhCov?.confidence === 'Low');
check('Confidence: Shahpura is High confidence (100% complete)', shahpuraCov?.confidence === 'High');

// 3. Benchmark checks
check('Benchmark: DO 4.9 exceeds Class B', exceeds('Dissolved oxygen', 4.9) === true);
check('Benchmark: DO 5.0 within Class B', exceeds('Dissolved oxygen', 5.0) === false);
check('Benchmark: BOD 3.1 exceeds Class B', exceeds('BOD', 3.1) === true);
check('Benchmark: BOD 3.0 within Class B', exceeds('BOD', 3.0) === false);
check('Benchmark: pH 6.4 exceeds Class B', exceeds('pH', 6.4) === true);
check('Benchmark: pH 7.5 within Class B', exceeds('pH', 7.5) === false);
check('Benchmark: pH 8.6 exceeds Class B', exceeds('pH', 8.6) === true);

// 4. Citation format
check('Citation: cite() matches expected pattern', cite(valReading) === 'MPPCB 2024 report, Durga, p.12');

// 5. Brief facts & Top actions
const facts = buildBriefFacts(rs, 'Durga', INITIAL_BLIND_SPOTS);
check('Brief facts: exactly 7 ghats', facts.ghatsCount === 7 && facts.ghats.length === 7);
check('Brief facts: Durga Tier A has Bairagarh and Shahpura', facts.ghats.filter(g => g.tier === 'A').length === 2);
check('Top actions: exactly 3 actions generated', facts.topActions.length === 3);
check('Top actions: all actions have trigger rule and evidence', facts.topActions.every(a => a.triggerRule.length > 0 && a.evidence.length > 0));

// 6. Bilingual brief text generation
const enBrief = generateEnglishBrief(facts);
const hiBrief = generateHindiBrief(facts);
const waSummary = generateWhatsAppSummary(facts);

check('Brief generation: English brief contains required sections',
  enBrief.includes('HIGHEST ATTENTION TIER') &&
  enBrief.includes('CLOSE INTERMEDIATE GROUP') &&
  enBrief.includes('LOWEST CONCERN') &&
  enBrief.includes('CARRY-OVER EFFECT') &&
  enBrief.includes('TECHNICAL LIMITATIONS')
);

check('Brief generation: Hindi brief contains required sections',
  hiBrief.includes('सर्वोच्च प्राथमिकता वाले घाट') &&
  hiBrief.includes('मध्यम निकट समूह') &&
  hiBrief.includes('न्यूनतम चिंता वाले घाट') &&
  hiBrief.includes('कैरी-ओवर प्रभाव') &&
  hiBrief.includes('तकनीकी सीमाएं')
);

check('WhatsApp summary generated with both languages',
  waSummary.includes('VISARJAN GHAT WATCH') &&
  waSummary.includes('Tier A') &&
  waSummary.includes('Carry-over')
);

// 7. Number lock verification
const lockEn = validateNumberLock(enBrief, facts);
check('Number lock: English brief numbers authorized', lockEn.valid, lockEn.unauthorizedNumbers.join(', '));

const lockHi = validateNumberLock(hiBrief, facts);
check('Number lock: Hindi brief numbers authorized', lockHi.valid, lockHi.unauthorizedNumbers.join(', '));

// Negative test for number lock
const tamperedBrief = enBrief + '\nUnauthorized value: 88888.77';
const lockTampered = validateNumberLock(tamperedBrief, facts);
check('Number lock: detects unauthorized tampered number', !lockTampered.valid && lockTampered.unauthorizedNumbers.includes('88888.77'));

console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll UI & extended logic checks passed');
process.exit(failed ? 1 : 0);
