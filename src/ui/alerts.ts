import type { Reading, Festival } from '../core/types';
import type { Stability } from '../core/score';
import type { GhatProfile } from '../core/insights';
import type { GhatCoverage } from '../core/coverage';
import { exceeds, LIMITS } from '../core/limits';
import { cite } from '../core/clean';

export interface AlertItem {
  id: string;
  date: string;
  ghat: string;
  parameter: string;
  value: string;
  benchmark: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  sourceBadge: 'Historical MPPCB' | 'Uploaded (unverified)' | 'Simulated';
  citation?: string;
}

export function generateAlertFeed(
  bundledReadings: Reading[],
  uploadedReadings: Reading[],
  festival: Festival | 'All',
  stability: Stability[],
  profiles: Record<string, GhatProfile>,
  coverages: Record<string, GhatCoverage>,
): AlertItem[] {
  const alerts: AlertItem[] = [];
  const currentDate = '11 Oct 2026';

  // 1. Tier A Priority Alerts
  const tierAGhats = stability.filter(s => s.tier === 'A');
  for (const s of tierAGhats) {
    const prof = profiles[s.ghat];
    const keyReading = bundledReadings.find(
      r => r.ghat === s.ghat && (r.parameter === 'Dissolved oxygen' || r.parameter === 'BOD') && r.state.kind === 'value'
    );
    const citationStr = keyReading ? cite(keyReading) : 'MPPCB Historical Report';

    alerts.push({
      id: `alert-tier-a-${s.ghat}`,
      date: currentDate,
      ghat: s.ghat,
      parameter: 'Risk Classification',
      value: `Tier A (Score: ${s.score != null ? s.score.toFixed(2) : 'N/A'})`,
      benchmark: 'pTop2 ≥ 0.80 Resample Threshold',
      message: `Ghat classified as Tier A (Act First) under ${festival} event evaluation. Suffers from ${prof?.tags.join(', ') || 'hypoxia / slow recovery'}.`,
      severity: 'critical',
      sourceBadge: 'Historical MPPCB',
      citation: citationStr,
    });
  }

  // 2. Data Gap Alerts (Missing 2025 Durga Report)
  for (const [ghatName, cov] of Object.entries(coverages)) {
    if (cov.missingEvents.includes('2025-Durga')) {
      alerts.push({
        id: `alert-gap-${ghatName}`,
        date: currentDate,
        ghat: ghatName,
        parameter: '2025 Durga Visarjan',
        value: 'Missing Report Table',
        benchmark: 'Complete Monitoring Cycle',
        message: `Crucial data gap: 2025 Durga immersion records are entirely absent in MPPCB published report. Fresh pre-immersion sampling strongly required.`,
        severity: 'warning',
        sourceBadge: 'Historical MPPCB',
        citation: 'MPPCB 2025 report missing table',
      });
    }
  }

  // 3. Uploaded Readings Exceeding CPCB Benchmark
  for (const r of uploadedReadings) {
    if (r.state.kind === 'value') {
      const isExceeded = exceeds(r.parameter, r.state.value);
      if (isExceeded) {
        const limitInfo = (LIMITS as Record<string, { rule: string; unit: string }>)[r.parameter];
        alerts.push({
          id: `alert-uploaded-${r.year}-${r.ghat}-${r.phase}-${r.parameter}`,
          date: `${r.year} (${r.phase})`,
          ghat: r.ghat,
          parameter: r.parameter,
          value: `${r.state.value} ${limitInfo?.unit || ''}`.trim(),
          benchmark: limitInfo?.rule || 'CPCB Class B',
          message: `Uploaded measurement breaches CPCB Class B threshold (${r.phase}-immersion). Requires field re-verification.`,
          severity: 'critical',
          sourceBadge: 'Uploaded (unverified)',
        });
      }
    }
  }

  return alerts;
}
