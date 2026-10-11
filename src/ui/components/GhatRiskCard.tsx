import { useRef } from 'react';
import type { Stability } from '../../core/score';
import type { GhatProfile } from '../../core/insights';
import type { GhatCoverage } from '../../core/coverage';
import type { Reading } from '../../core/types';
import { cite } from '../../core/clean';
import { displayReading } from '../readingDisplay';
import { useLanguage } from '../i18n';
import type { TranslationKeys } from '../i18n/en';

interface GhatRiskCardProps {
  stability: Stability;
  profile: GhatProfile;
  coverage: GhatCoverage;
  readings: Reading[];
  onOpenEvidence: (ghat: string, triggerBtn: HTMLElement) => void;
}

export function GhatRiskCard({
  stability,
  profile,
  coverage,
  readings,
  onOpenEvidence,
}: GhatRiskCardProps) {
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();

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

  const tierDescription =
    stability.tier === 'A'
      ? t('card.tierDescA')
      : stability.tier === 'B'
        ? t('card.tierDescB')
        : t('card.tierDescC');

  const tierName =
    stability.tier === 'A'
      ? t('card.actFirst')
      : stability.tier === 'B'
        ? t('card.closeGroup')
        : t('card.lowestConcern');

  return (
    <article className={`ghat-card tier-border-${stability.tier}`} aria-labelledby={`ghat-title-${stability.ghat}`}>
      <div className="card-top-row">
        <div className="card-heading-group">
          <div className="badges-group">
            <span className={`badge-tier tier-${stability.tier}`}>
              Tier {stability.tier} · {tierName}
            </span>
            <span
              className={`badge-confidence confidence-${coverage.confidence}`}
              title={coverage.confidenceReason}
            >
              {t('card.confidence', { level: coverage.confidence, pct: coverage.coveragePct })}
            </span>
          </div>
          <h3 id={`ghat-title-${stability.ghat}`} className="ghat-name">
            {stability.ghat}
          </h3>
          <span className="waterbody-sub">{profile.waterBody}</span>
        </div>

        <div className="score-box">
          <span className="score-val">{stability.score !== null ? stability.score.toFixed(2) : 'N/A'}</span>
          <span className="score-lbl">{t('card.riskScore')}</span>
        </div>
      </div>

      <p className="tier-explanation">{tierDescription}</p>

      {profile.tags.length > 0 && (
        <div className="tags-container" aria-label="Identified risk patterns">
          {profile.tags.map(tag => {
            const tagKey = `tag.${tag}` as TranslationKeys;
            const tagText = t(tagKey) || tag;
            return (
              <span key={tag} className="risk-tag" title={tagText}>
                🏷️ {tagText}
              </span>
            );
          })}
        </div>
      )}

      <div className="analysis-summary">
        <strong>Evidence-based Assessment:</strong>
        <p className="analysis-text">
          {t('card.evidenceAssessment', {
            doPreFail: profile.doPreFail,
            doEvents: profile.doEvents,
            doTriggered: profile.doTriggered,
            doAfterFail: profile.doAfterFail,
          })}
          {stability.tier === 'A' &&
            t('card.assessmentTop2', { pct: Math.round(stability.pTop2 * 100) })}
          {stability.tier === 'C' &&
            t('card.assessmentBottom2', { pct: Math.round(stability.pBottom2 * 100) })}
        </p>
      </div>

      {keyReadings.length > 0 && (
        <div className="key-readings-list">
          <span className="key-readings-title">{t('card.keyReadings')}</span>
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
          {t('card.dataGapAlert', { events: coverage.missingEvents.join(', ') })}
        </div>
      )}

      <div className="recommended-action-box">
        <span className="action-tag">{t('card.recommendedNextAction')}</span>
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
          {t('card.viewEvidence')}
        </button>
      </div>
    </article>
  );
}
