import type { BriefFacts } from '../../core/facts';
import { useLanguage } from '../i18n';

interface TrustAndLimitsProps {
  stats: BriefFacts['stats'];
}

export function TrustAndLimits({ stats }: TrustAndLimitsProps) {
  const { t } = useLanguage();

  return (
    <section className="trust-limits-section" aria-labelledby="trust-limits-heading">
      <div className="section-header-row">
        <div>
          <h2 id="trust-limits-heading">{t('trust.heading')}</h2>
          <p className="mute">
            {t('trust.subtitle')}
          </p>
        </div>
      </div>

      <div className="card trust-card">
        <ul className="trust-rules-list">
          <li>
            <strong>{t('trust.rule1Title')}</strong> {t('trust.rule1Text')}
          </li>
          <li>
            <strong>{t('trust.rule2Title')}</strong> {t('trust.rule2Text', {
              likelyBdlCount: stats.likelyBdlCount,
              chromiumCount: stats.chromiumCount,
              leadCount: stats.leadCount,
              copperCount: stats.copperCount,
              zincCount: stats.zincCount,
            })}
          </li>
          <li>
            <strong>{t('trust.rule3Title')}</strong> {t('trust.rule3Text')}
          </li>
          <li>
            <strong>{t('trust.rule4Title')}</strong> {t('trust.rule4Text')}
          </li>
          <li>
            <strong>{t('trust.rule5Title')}</strong> {t('trust.rule5Text')}
          </li>
          <li>
            <strong>{t('trust.rule6Title')}</strong> {t('trust.rule6Text')}
          </li>
          <li>
            <strong>{t('trust.rule7Title')}</strong> {t('trust.rule7Text', {
              bodAbove3: stats.bodAbove3,
              bodTotal: stats.bodTotal,
            })}
          </li>
          <li>
            <strong>{t('trust.rule8Title')}</strong> {t('trust.rule8Text')}
          </li>
          <li>
            <strong>{t('trust.rule9Title')}</strong> {t('trust.rule9Text')}
          </li>
          <li>
            <strong>{t('trust.rule10Title')}</strong> {t('trust.rule10Text')}
          </li>
        </ul>
      </div>
    </section>
  );
}
