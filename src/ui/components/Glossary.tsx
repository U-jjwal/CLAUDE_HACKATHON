import { useState } from 'react';
import { useLanguage } from '../i18n';

export function Glossary() {
  const [expanded, setExpanded] = useState(false);
  const { t } = useLanguage();

  return (
    <aside className="glossary-card" aria-label={t('glossary.title')}>
      <div className="glossary-header">
        <h3 className="glossary-title">{t('glossary.title')}</h3>
        <button
          type="button"
          className="toggle-link"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="glossary-content"
        >
          {expanded ? t('glossary.collapse') : t('glossary.expand')}
        </button>
      </div>

      <div id="glossary-content" className={`glossary-content ${expanded ? 'open' : ''}`}>
        <dl className="glossary-grid">
          <div>
            <dt><strong>{t('glossary.doTitle')}</strong></dt>
            <dd>{t('glossary.doDesc')}</dd>
          </div>
          <div>
            <dt><strong>{t('glossary.bodTitle')}</strong></dt>
            <dd>{t('glossary.bodDesc')}</dd>
          </div>
          <div>
            <dt><strong>{t('glossary.phTitle')}</strong></dt>
            <dd>{t('glossary.phDesc')}</dd>
          </div>
          <div>
            <dt><strong>{t('glossary.bdlTitle')}</strong></dt>
            <dd>{t('glossary.bdlDesc')}</dd>
          </div>
          <div>
            <dt><strong>{t('glossary.likelyBdlTitle')}</strong></dt>
            <dd>{t('glossary.likelyBdlDesc')}</dd>
          </div>
          <div>
            <dt><strong>{t('glossary.classBTitle')}</strong></dt>
            <dd>{t('glossary.classBDesc')}</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
