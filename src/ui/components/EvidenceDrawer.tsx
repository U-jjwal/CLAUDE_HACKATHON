import { useEffect, useRef } from 'react';
import type { Reading } from '../../core/types';
import { exceeds } from '../../core/limits';
import { cite, REPORT_FILE } from '../../core/clean';
import { displayReading } from '../readingDisplay';

interface EvidenceDrawerProps {
  ghat: string;
  waterBody: string;
  readings: Reading[];
  onClose: () => void;
  triggerElement?: HTMLElement | null;
}

export function EvidenceDrawer({
  ghat,
  waterBody,
  readings,
  onClose,
  triggerElement,
}: EvidenceDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus management: focus close button on open, return to trigger on close
  useEffect(() => {
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      triggerElement?.focus();
    };
  }, [onClose, triggerElement]);

  const phOrder = { pre: 0, during: 1, after: 2 };
  const sorted = [...readings].sort(
    (a, b) =>
      `${a.year}${a.festival}`.localeCompare(`${b.year}${b.festival}`) ||
      phOrder[a.phase] - phOrder[b.phase] ||
      a.parameter.localeCompare(b.parameter),
  );

  return (
    <div className="drawer-overlay" onClick={onClose} role="presentation">
      <div
        className="drawer-panel"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="drawer-header">
          <div>
            <h3 id="drawer-title" className="drawer-title">
              Evidence Log: {ghat}
            </h3>
            <p className="drawer-sub">{waterBody} · Verified MPPCB Report Rows</p>
          </div>
          <button
            type="button"
            ref={closeBtnRef}
            className="drawer-close-btn"
            onClick={onClose}
            aria-label={`Close evidence log for ${ghat}`}
          >
            ✕ Close
          </button>
        </div>

        <div className="drawer-body">
          <p className="mute">
            Every measurement with exact report publication, festival phase, and official page reference.
            Note: Units are assumed (reports print none). Missing entries and BDL are distinguished.
          </p>

          <div className="table-responsive">
            <table className="evidence-table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Parameter</th>
                  <th scope="col">State &amp; Value</th>
                  <th scope="col">Units</th>
                  <th scope="col">CPCB Class B</th>
                  <th scope="col">Official Source &amp; Page</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(r => {
                  const disp = displayReading(r);
                  const outside = r.state.kind === 'value' ? exceeds(r.parameter, r.state.value) : null;
                  const rowKey = `${r.year}-${r.festival}-${r.phase}-${r.parameter}-${r.sourcePage}`;

                  return (
                    <tr key={rowKey} className={`state-row-${disp.kind}`}>
                      <td>
                        <strong>{r.year}</strong> {r.festival}
                      </td>
                      <td>
                        <span className={`phase-badge phase-${r.phase}`}>{r.phase}</span>
                      </td>
                      <td>{r.parameter}</td>
                      <td>
                        <span className={`cell-state-chip chip-${disp.kind}`} title={disp.note}>
                          {disp.label}
                        </span>
                        {disp.note && <div className="cell-note">{disp.note}</div>}
                      </td>
                      <td className="unit-cell">{disp.unitLabel}</td>
                      <td>
                        {outside === null ? (
                          <span className="mute">-</span>
                        ) : outside ? (
                          <span className="badge-exceed">Outside Limit</span>
                        ) : (
                          <span className="badge-within">Within Limit</span>
                        )}
                      </td>
                      <td>
                        <span title={REPORT_FILE[r.year] ?? 'MPPCB Report'}>{cite(r)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
