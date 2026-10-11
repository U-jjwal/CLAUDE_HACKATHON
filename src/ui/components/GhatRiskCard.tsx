import { useRef } from 'react';
import type { Stability } from '../../core/score';
import type { GhatProfile } from '../../core/insights';
import type { GhatCoverage } from '../../core/coverage';
import type { Reading } from '../../core/types';
import { cite } from '../../core/clean';
import { displayReading } from '../readingDisplay';

interface GhatRiskCardProps {
  stability: Stability;
  profile: GhatProfile;
  coverage: GhatCoverage;
  readings: Reading[];
  onOpenEvidence: (ghat: string, triggerBtn: HTMLElement) => void;
}

const TAG_EXPLANATIONS: Record<string, string> = {
  recurring_baseline: 'Pre-immersion hypoxia: DO < 5 mg/L before idols arrive in 2+ events',
  immersion_triggered: 'Direct immersion shock: passed before, failed during immersion',
  slow_recovery: 'Delayed oxygen recovery: still below 5 mg/L a week after immersion in 2+ events',
  organic_load_spike: 'Organic shock: BOD rises ≥ 2.0 mg/L during immersion',
  data_gap: 'Incomplete historical record (missing entire event or critical parameters)',
};

const TIER_DESCRIPTIONS = {
  A: 'Act First: Persistent baseline hypoxia or severe immersion degradation',
  B: 'Close Group: Indistinguishable intermediate risk; order within tier is not reliable',
  C: 'Lowest Concern: Lower relative risk under this model; NOT certified safe or clean',
} as const;

export function GhatRiskCard({
  stability,
  profile,
  coverage,
  readings,
  onOpenEvidence,
}: GhatRiskCardProps) {
  const triggerBtnRef = useRef<HTMLButtonElement>(null);

  const keyReadings = readings
    .filter(r => r.ghat === stability.ghat && (r.parameter === 'Dissolved oxygen' || r.parameter === 'BOD'))
    .slice(0, 3);

  // Recommended action derived from tags
  let recommendedAction = 'Routine pre-immersion sampling and crowd control.';
  if (stability.tier === 'A') {
    recommendedAction = 'Deploy continuous surface aeration 48h prior to visarjan; schedule daily DO testing.';
  } else if (profile.tags.includes('organic_load_spike')) {
    recommendedAction = 'Install immediate post-immersion surface skimming for floral/organic debris to curb BOD spike.';
  } else if (profile.tags.includes('slow_recovery')) {
    recommendedAction = 'Plan post-visarjan water flushing and aeration up to 7 days post-event.';
  } else if (coverage.confidence === 'Low') {
    recommendedAction = 'Urgent baseline sampling required to compensate for missing historical records.';
  }

  return (
    <article className={`ghat-card tier-border-${stability.tier}`} aria-labelledby={`ghat-title-${stability.ghat}`}>
      <div className="card-top-row">
        <div className="card-heading-group">
          <div className="badges-group">
            <span className={`badge-tier tier-${stability.tier}`}>
              Tier {stability.tier} · {stability.tier === 'A' ? 'Act First' : stability.tier === 'B' ? 'Close Group' : 'Lowest Concern'}
            </span>
            <span
              className={`badge-confidence confidence-${coverage.confidence}`}
              title={coverage.confidenceReason}
            >
              Confidence: {coverage.confidence} ({coverage.coveragePct}% data)
            </span>
          </div>
          <h3 id={`ghat-title-${stability.ghat}`} className="ghat-name">
            {stability.ghat}
          </h3>
          <span className="waterbody-sub">{profile.waterBody}</span>
        </div>

        <div className="score-box">
          <span className="score-val">{stability.score !== null ? stability.score.toFixed(2) : 'N/A'}</span>
          <span className="score-lbl">Risk Score</span>
        </div>
      </div>

      <p className="tier-explanation">{TIER_DESCRIPTIONS[stability.tier]}</p>

      {profile.tags.length > 0 && (
        <div className="tags-container" aria-label="Identified risk patterns">
          {profile.tags.map(tag => (
            <span key={tag} className="risk-tag" title={TAG_EXPLANATIONS[tag] ?? tag}>
              🏷️ {TAG_EXPLANATIONS[tag] ?? tag}
            </span>
          ))}
        </div>
      )}

      <div className="analysis-summary">
        <strong>Evidence-based Assessment:</strong>
        <p className="analysis-text">
          Dissolved oxygen dropped below 5 mg/L before immersion in{' '}
          <strong>{profile.doPreFail} of {profile.doEvents}</strong> complete events, crossed threshold during immersion in{' '}
          <strong>{profile.doTriggered}</strong> event(s), and remained below standard a week later in{' '}
          <strong>{profile.doAfterFail}</strong> event(s).
          {stability.tier === 'A' && ` Ranked in the top 2 highest-risk sites in ${Math.round(stability.pTop2 * 100)}% of bootstrap resamples.`}
          {stability.tier === 'C' && ` Ranked in the bottom 2 lowest-concern sites in ${Math.round(stability.pBottom2 * 100)}% of resamples.`}
        </p>
      </div>

      {keyReadings.length > 0 && (
        <div className="key-readings-list">
          <span className="key-readings-title">Key Historical Readings:</span>
          <ul>
            {keyReadings.map(r => {
              const disp = displayReading(r);
              return (
                <li key={`${r.year}-${r.festival}-${r.phase}-${r.parameter}`}>
                  <span>
                    <strong>{r.year} {r.festival}</strong> ({r.phase}) — {r.parameter}: <code>{disp.label}</code> {disp.unitLabel ? `(${disp.unitLabel})` : ''}
                  </span>
                  <span className="cite-text">[{cite(r)}]</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {coverage.missingEvents.length > 0 && (
        <div className="data-gap-alert">
          ⚠️ <strong>Historical Data Gap:</strong> Entire event unrecorded: <code>{coverage.missingEvents.join(', ')}</code>.
        </div>
      )}

      <div className="recommended-action-box">
        <span className="action-tag">Recommended Next Action:</span>
        <p>{recommendedAction}</p>
      </div>

      <div className="card-footer">
        <button
          type="button"
          ref={triggerBtnRef}
          className="btn-open-evidence"
          onClick={() => triggerBtnRef.current && onOpenEvidence(stability.ghat, triggerBtnRef.current)}
          aria-expanded={false}
          aria-haspopup="dialog"
        >
          🔍 View Complete Evidence Log (Every Report Page &amp; Reading)
        </button>
      </div>
    </article>
  );
}
