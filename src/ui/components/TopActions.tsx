import type { ActionItem } from '../../core/actions';
import { useLanguage } from '../i18n';

interface TopActionsProps {
  actions: ActionItem[];
}

export function TopActions({ actions }: TopActionsProps) {
  const { t } = useLanguage();

  return (
    <section className="top-actions-section" aria-labelledby="top-actions-heading">
      <div className="section-header-row">
        <div>
          <h2 id="top-actions-heading">{t('actions.heading')}</h2>
          <p className="mute">
            {t('actions.subtitle')}
          </p>
        </div>
        <span className="live-disclaimer-badge">{t('actions.disclaimerBadge')}</span>
      </div>

      <div className="action-cards-grid">
        {actions.map(action => (
          <article key={action.id} className={`action-card category-${action.category}`}>
            <div className="action-card-header">
              <span className="action-rank-badge">{t('actions.actionPrefix', { rank: action.rank })}</span>
              <span className="action-category-tag">{action.category}</span>
            </div>
            <h3 className="action-title">{action.title}</h3>
            <p className="action-desc">{action.description}</p>
            <div className="action-evidence-box">
              <div className="evidence-line">
                <span className="evidence-lbl">{t('actions.triggerRule')}</span>
                <span className="evidence-val">{action.triggerRule}</span>
              </div>
              <div className="evidence-line">
                <span className="evidence-lbl">{t('actions.supportingEvidence')}</span>
                <span className="evidence-val">{action.evidence}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
