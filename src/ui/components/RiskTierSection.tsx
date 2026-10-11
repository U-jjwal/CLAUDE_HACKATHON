import { useState } from 'react';
import type { Stability, Tier } from '../../core/score';
import type { GhatProfile } from '../../core/insights';
import type { GhatCoverage } from '../../core/coverage';
import type { Reading, Festival } from '../../core/types';
import { useLanguage } from '../i18n';
import { GhatRiskCard } from './GhatRiskCard';
import { EvidenceDrawer } from './EvidenceDrawer';

interface RiskTierSectionProps {
  festival: Festival | 'All';
  stability: Stability[];
  profiles: Record<string, GhatProfile>;
  coverages: Record<string, GhatCoverage>;
  readings: Reading[];
}

export function RiskTierSection({
  festival,
  stability,
  profiles,
  coverages,
  readings,
}: RiskTierSectionProps) {
  const { t } = useLanguage();
  const [activeEvidenceGhat, setActiveEvidenceGhat] = useState<string | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);

  const tierA = stability.filter(s => s.tier === 'A');
  const tierB = stability.filter(s => s.tier === 'B');
  const tierC = stability.filter(s => s.tier === 'C');

  const handleOpenEvidence = (ghat: string, triggerBtn: HTMLElement) => {
    setActiveEvidenceGhat(ghat);
    setTriggerElement(triggerBtn);
  };

  const handleCloseEvidence = () => {
    setActiveEvidenceGhat(null);
  };

  const renderTierGroup = (tier: Tier, items: Stability[], title: string, subtitle: string) => {
    if (items.length === 0) return null;

    return (
      <div key={tier} className={`tier-group-container tier-group-${tier}`}>
        <div className="tier-group-header">
          <div className="tier-pill-title">
            <span className={`tier-letter-badge tier-${tier}`}>{tier}</span>
            <h3>{title}</h3>
          </div>
          <p className="tier-group-desc">{subtitle}</p>
        </div>

        <div className="tier-cards-stack">
          {items.map(s => {
            const prof = profiles[s.ghat];
            const cov = coverages[s.ghat];
            if (!prof || !cov) return null;

            return (
              <GhatRiskCard
                key={s.ghat}
                stability={s}
                profile={prof}
                coverage={cov}
                readings={readings.filter(r => r.ghat === s.ghat)}
                onOpenEvidence={handleOpenEvidence}
              />
            );
          })}
        </div>
      </div>
    );
  };

  const activeProfile = activeEvidenceGhat ? profiles[activeEvidenceGhat] : null;

  return (
    <section className="risk-tier-section" aria-labelledby="triage-tiers-heading">
      <div className="section-header-row">
        <div>
          <h2 id="triage-tiers-heading">
            {t('tiers.heading', {
              festival: festival === 'All' ? t('festival.all') : festival,
            })}
          </h2>
          <p className="mute">
            {t('tiers.subtitle')}
          </p>
        </div>
      </div>

      <div className="tier-groups-wrapper">
        {renderTierGroup(
          'A',
          tierA,
          t('tiers.tierATitle'),
          t('tiers.tierADesc'),
        )}

        {renderTierGroup(
          'B',
          tierB,
          t('tiers.tierBTitle'),
          t('tiers.tierBDesc'),
        )}

        {renderTierGroup(
          'C',
          tierC,
          t('tiers.tierCTitle'),
          t('tiers.tierCDesc'),
        )}
      </div>

      {activeEvidenceGhat && activeProfile && (
        <EvidenceDrawer
          ghat={activeEvidenceGhat}
          waterBody={activeProfile.waterBody}
          readings={readings.filter(r => r.ghat === activeEvidenceGhat)}
          onClose={handleCloseEvidence}
          triggerElement={triggerElement}
        />
      )}
    </section>
  );
}
