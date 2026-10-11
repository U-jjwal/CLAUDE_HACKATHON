import type { ActionItem } from '../../core/actions';

interface TopActionsProps {
  actions: ActionItem[];
}

export function TopActions({ actions }: TopActionsProps) {
  return (
    <section className="top-actions-section" aria-labelledby="top-actions-heading">
      <div className="section-header-row">
        <div>
          <h2 id="top-actions-heading">Top 3 Priority Actions for BMC Officers</h2>
          <p className="mute">
            Derived algorithmically from transparent rules applied to historical water records. Historical assessment only, not live water quality.
          </p>
        </div>
        <span className="live-disclaimer-badge">Historical Analysis · Not Live Data</span>
      </div>

      <div className="action-cards-grid">
        {actions.map(action => (
          <article key={action.id} className={`action-card category-${action.category}`}>
            <div className="action-card-header">
              <span className="action-rank-badge">Action #{action.rank}</span>
              <span className="action-category-tag">{action.category}</span>
            </div>
            <h3 className="action-title">{action.title}</h3>
            <p className="action-desc">{action.description}</p>
            <div className="action-evidence-box">
              <div className="evidence-line">
                <span className="evidence-lbl">Trigger Rule:</span>
                <span className="evidence-val">{action.triggerRule}</span>
              </div>
              <div className="evidence-line">
                <span className="evidence-lbl">Supporting Evidence:</span>
                <span className="evidence-val">{action.evidence}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
