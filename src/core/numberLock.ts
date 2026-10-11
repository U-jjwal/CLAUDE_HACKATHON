import type { BriefFacts } from './facts';

/**
 * Collects all allowed numbers from BriefFacts, domain constants, and formatting indices.
 */
export function extractAllowedNumbers(facts: BriefFacts): Set<string> {
  const allowed = new Set<string>();

  // Add a number and common representations
  const add = (val: number | string | undefined | null) => {
    if (val === undefined || val === null) return;
    const s = String(val).trim();
    if (!s) return;
    allowed.add(s);
    const n = Number(s);
    if (!Number.isNaN(n)) {
      // Add integer representation if float ends in .0
      if (Number.isInteger(n)) allowed.add(String(Math.trunc(n)));
      // Add rounded percentage
      allowed.add(String(Math.round(n)));
      allowed.add(String(Math.round(n * 100)));
    }
  };

  // Target date & scope
  add('2026');
  add('20');
  add('2023');
  add('2024');
  add('2025');
  add(facts.totalRows);
  add(facts.ghatsCount);
  add(facts.unmonitoredSites.length);

  // Structural list numbers & section numbers
  for (let i = 1; i <= 20; i++) add(i);

  // Carry-over numbers
  add(facts.carryOverDO.n);
  add(facts.carryOverDO.durgaWorse);
  add(facts.carryOverBOD.n);
  add(facts.carryOverBOD.durgaWorse);

  // Stats & detection limits
  add(facts.stats.doBelow5);
  add(facts.stats.doTotal);
  add(facts.stats.bodAbove3);
  add(facts.stats.bodTotal);
  add(facts.stats.phOutside);
  add(facts.stats.phTotal);
  add(facts.stats.likelyBdlCount);
  add(facts.stats.chromiumCount);
  add(facts.stats.leadCount);
  add(facts.stats.copperCount);
  add(facts.stats.zincCount);

  // Domain standards & limits: DO >= 5, BOD <= 3, pH 6.5 to 8.5, coliform 500 MPN/100ml, temp 27, 20
  add(5);
  add(3);
  add('6.5');
  add('8.5');
  add(500);
  add(100);
  add(27);
  add(20);
  add('0.03');
  add('0.031');
  add('0.018');
  add('0.009');

  // Ghat specific facts
  for (const g of facts.ghats) {
    add(g.score);
    add(g.pTop2);
    add(Math.round(g.pTop2 * 100));
    add(g.pBottom2);
    add(Math.round(g.pBottom2 * 100));
    add(g.doPreFail);
    add(g.doEvents);
    add(g.doTriggered);
    add(g.doAfterFail);

    for (const kr of g.keyReadings) {
      add(kr.year);
      const match = kr.displayValue.match(/[\d.]+/);
      if (match) add(match[0]);
      // Extract page number from citation if present: "p.42"
      const pageMatch = kr.citation.match(/p\.(\d+)/);
      if (pageMatch) add(pageMatch[1]);
    }
  }

  // Action rank and numbers
  for (const a of facts.topActions) {
    add(a.rank);
  }

  return allowed;
}

/**
 * Pure function: Extracts every numeric token from text and verifies that each
 * token is supported by the numbers in BriefFacts.
 * Returns true if locked (all numbers authorized), false otherwise with unauthorized list.
 */
export function validateNumberLock(
  candidateText: string,
  facts: BriefFacts,
): { valid: boolean; unauthorizedNumbers: string[] } {
  const allowed = extractAllowedNumbers(facts);

  // Regex to extract numbers (including decimal numbers)
  const numberPattern = /\b\d+(?:\.\d+)?\b/g;
  const matches = candidateText.match(numberPattern) ?? [];

  const unauthorized: string[] = [];
  for (const token of matches) {
    if (!allowed.has(token)) {
      unauthorized.push(token);
    }
  }

  return {
    valid: unauthorized.length === 0,
    unauthorizedNumbers: [...new Set(unauthorized)],
  };
}
