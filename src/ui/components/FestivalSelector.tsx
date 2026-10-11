import type { Festival } from '../../core/types';

interface FestivalSelectorProps {
  festival: Festival | 'All';
  onChange: (f: Festival | 'All') => void;
}

export function FestivalSelector({ festival, onChange }: FestivalSelectorProps) {
  return (
    <div className="festival-selector-panel" role="region" aria-label="Festival Event Selector">
      <div className="selector-row">
        <span className="selector-lbl">Event Filter:</span>
        <div className="seg-group" role="group" aria-label="Filter by festival event">
          {(['Durga', 'Ganesh', 'All'] as const).map(f => (
            <button
              key={f}
              type="button"
              className={`seg-btn ${festival === f ? 'on' : ''}`}
              aria-pressed={festival === f}
              onClick={() => onChange(f)}
            >
              {f === 'All' ? 'All Events (2023–2025)' : `${f} Visarjan`}
            </button>
          ))}
        </div>
      </div>
      <div className="recalculated-note" role="status" aria-live="polite">
        ℹ️ Tiers recalculated for <strong>{festival === 'All' ? 'all historical' : festival}</strong> events only.
      </div>
    </div>
  );
}
