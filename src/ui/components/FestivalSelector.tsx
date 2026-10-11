import type { Festival } from '../../core/types';
import { useLanguage } from '../i18n';

interface FestivalSelectorProps {
  festival: Festival | 'All';
  onChange: (f: Festival | 'All') => void;
}

export function FestivalSelector({ festival, onChange }: FestivalSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="festival-selector-panel" role="region" aria-label={t('festival.label')}>
      <div className="selector-row">
        <span className="selector-lbl">{t('festival.label')}</span>
        <div className="seg-group" role="group" aria-label={t('festival.label')}>
          {(['Durga', 'Ganesh', 'All'] as const).map(f => (
            <button
              key={f}
              type="button"
              className={`seg-btn ${festival === f ? 'on' : ''}`}
              aria-pressed={festival === f}
              onClick={() => onChange(f)}
            >
              {f === 'All' ? t('festival.all') : f === 'Durga' ? t('festival.durga') : t('festival.ganesh')}
            </button>
          ))}
        </div>
      </div>
      <div className="recalculated-note" role="status" aria-live="polite">
        ℹ️ {t('festival.recalculatedNote', {
          festival: fName(festival, t),
        })}
      </div>
    </div>
  );
}

function fName(festival: Festival | 'All', t: (key: any) => string): string {
  if (festival === 'All') return t('festival.all');
  if (festival === 'Durga') return t('festival.durga');
  return t('festival.ganesh');
}
