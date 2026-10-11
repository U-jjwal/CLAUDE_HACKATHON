import { useState } from 'react';
import type { Stability, Tier } from '../../core/score';
import type { GhatProfile } from '../../core/insights';
import type { GhatCoverage } from '../../core/coverage';
import type { Reading, Festival } from '../../core/types';
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
          <h2 id="triage-tiers-heading">Ghat Attention Tiers ({festival} Events)</h2>
          <p className="mute">
            Only the extreme tiers (Tier A and Tier C) are statistically stable. With approximately 6 events per ghat,
            the middle ghats share Tier B because bootstrap resampling reveals significant rank overlap.
          </p>
        </div>
      </div>

      <div className="tier-groups-wrapper">
        {renderTierGroup(
          'A',
          tierA,
          'Tier A · Act First (Highest Triage Priority)',
          'Consistently ranks in top-2 risk in >80% of resamples. Suffers from pre-immersion hypoxia, severe organic surges, or delayed recovery.',
        )}

        {renderTierGroup(
          'B',
          tierB,
          'Tier B · Close Group (Order Within Tier Is Not Reliable)',
          'Intermediate risk sites. Resampling proves rank order within this group fluctuates across events; do not treat positions 3–6 as a linear hierarchy.',
        )}

        {renderTierGroup(
          'C',
          tierC,
          'Tier C · Lowest Concern ("Lowest Concern" ≠ Safe or Clean)',
          'Lowest relative concern under this composite index. NOT clean or drinking quality: BOD remains above 3 mg/L in historical samples.',
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
