import { useState } from 'react';
import type { Reading } from '../../core/types';
import { cite, REPORT_FILE } from '../../core/clean';
import { exceeds } from '../../core/limits';
import { displayReading, type DisplayReading } from '../readingDisplay';
import { useLanguage } from '../i18n';

interface DataGapGridProps {
  readings: Reading[];
  ghats: string[];
}

interface SelectedCell {
  ghat: string;
  year: number;
  festival: string;
  phase: string;
  parameter: string;
  reading?: Reading;
  display: DisplayReading;
  outsideLimit: boolean | null;
}

const PARAMS = ['Dissolved oxygen', 'BOD', 'pH'] as const;
const PHASES = ['pre', 'during', 'after'] as const;

export function DataGapGrid({ readings, ghats }: DataGapGridProps) {
  const { t } = useLanguage();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // All 6 distinct events in chronological order
  const events = [
    { year: 2023, festival: 'Ganesh' },
    { year: 2023, festival: 'Durga' },
    { year: 2024, festival: 'Ganesh' },
    { year: 2024, festival: 'Durga' },
    { year: 2025, festival: 'Ganesh' },
    { year: 2025, festival: 'Durga' },
  ];

  const handleCellClick = (
    ghat: string,
    year: number,
    festival: string,
    phase: string,
    parameter: string,
  ) => {
    const match = readings.find(
      r =>
        r.ghat === ghat &&
        r.year === year &&
        r.festival === festival &&
        r.phase === phase &&
        r.parameter === parameter,
    );

    const disp = displayReading(match);
    const outside = match && match.state.kind === 'value' ? exceeds(match.parameter, match.state.value) : null;

    setSelectedCell({
      ghat,
      year,
      festival,
      phase,
      parameter,
      reading: match,
      display: disp,
      outsideLimit: outside,
    });
  };

  return (
    <section className="gap-grid-section" aria-labelledby="gap-grid-heading">
      <div className="section-header-row">
        <div>
          <h2 id="gap-grid-heading">{t('gapGrid.heading')}</h2>
          <p className="mute">
            {t('gapGrid.subtitle')}
          </p>
        </div>
      </div>

      {/* Visible Legend */}
      <div className="grid-legend" role="region" aria-label="Grid status legend">
        <span className="legend-label">{t('gapGrid.legendLabel')}</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-swatch swatch-within">✓</span>
            <span>{t('gapGrid.within')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-outside">✗</span>
            <span>{t('gapGrid.outside')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-bdl">B</span>
            <span>{t('gapGrid.bdl')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-likely-bdl">L</span>
            <span>{t('gapGrid.likelyBdl')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-not-sampled">–</span>
            <span>{t('gapGrid.notSampled')}</span>
          </div>
          <div className="legend-item">
            <span className="legend-swatch swatch-no-record">∅</span>
            <span>{t('gapGrid.noRecord')}</span>
          </div>
        </div>
      </div>

      {/* Matrix Table with sticky first column */}
      <div className="matrix-scroll-wrapper" tabIndex={0} aria-label="Matrix table scrollable area">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="sticky-col header-ghat-col" rowSpan={2} scope="col">
                {t('gapGrid.colGhat')}
              </th>
              {events.map(ev => (
                <th key={`${ev.year}-${ev.festival}`} colSpan={3} scope="colgroup" className="ev-group-header">
                  {ev.year} {ev.festival}
                </th>
              ))}
            </tr>
            <tr>
              {events.flatMap(ev =>
                PHASES.map(ph => (
                  <th key={`${ev.year}-${ev.festival}-${ph}`} scope="col" className="phase-col-header">
                    {ph[0].toUpperCase()}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {ghats.map(ghat => (
              <tr key={ghat} className="matrix-ghat-block">
                <td className="sticky-col ghat-title-cell" colSpan={19}>
                  <strong>{ghat}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Individual Parameter Rows per Ghat */}
      <div className="matrix-scroll-wrapper sub-matrix-wrapper" tabIndex={0} aria-label="Parameter detail matrix">
        <table className="matrix-table detailed-table">
          <thead>
            <tr>
              <th className="sticky-col header-ghat-col" rowSpan={2} scope="col">
                Ghat / Parameter
              </th>
              {events.map(ev => (
                <th key={`${ev.year}-${ev.festival}`} colSpan={3} scope="colgroup" className="ev-group-header">
                  {ev.year} {ev.festival}
                </th>
              ))}
            </tr>
            <tr>
              {events.flatMap(ev =>
                PHASES.map(ph => (
                  <th key={`${ev.year}-${ev.festival}-${ph}`} scope="col" className="phase-col-header">
                    {ph.slice(0, 3)}
                  </th>
                )),
              )}
            </tr>
          </thead>
          <tbody>
            {ghats.map(ghat =>
              PARAMS.map(param => (
                <tr key={`${ghat}-${param}`}>
                  <td className="sticky-col param-label-cell">
                    <div className="param-label-content">
                      <span className="ghat-short-name">{ghat.split(' ')[0]}</span>
                      <span className="param-short-name">
                        {param === 'Dissolved oxygen' ? 'DO' : param}
                      </span>
                    </div>
                  </td>
                  {events.flatMap(ev =>
                    PHASES.map(ph => {
                      const match = readings.find(
                        r =>
                          r.ghat === ghat &&
                          r.year === ev.year &&
                          r.festival === ev.festival &&
                          r.phase === ph &&
                          r.parameter === param,
                      );

                      const disp = displayReading(match);
                      const isNum = match?.state.kind === 'value';
                      const outside = match && match.state.kind === 'value' ? exceeds(param, match.state.value) : null;

                      let cellType = 'no-record';
                      let symbol = '∅';

                      if (!match) {
                        cellType = 'no-record';
                        symbol = '∅';
                      } else if (match.state.kind === 'not_sampled') {
                        cellType = 'not-sampled';
                        symbol = '–';
                      } else if (match.state.kind === 'bdl') {
                        cellType = 'bdl';
                        symbol = 'B';
                      } else if (match.state.kind === 'likely_bdl') {
                        cellType = 'likely-bdl';
                        symbol = 'L';
                      } else if (isNum) {
                        if (outside) {
                          cellType = 'outside';
                          symbol = '✗';
                        } else {
                          cellType = 'within';
                          symbol = '✓';
                        }
                      }

                      const cellAria = `${ghat.split(' ')[0]}, ${ev.year} ${ev.festival} ${ph}, ${param}: ${disp.label}`;
                      const isSelected =
                        selectedCell?.ghat === ghat &&
                        selectedCell?.year === ev.year &&
                        selectedCell?.festival === ev.festival &&
                        selectedCell?.phase === ph &&
                        selectedCell?.parameter === param;

                      return (
                        <td key={`${ev.year}-${ev.festival}-${ph}`} className="cell-td">
                          <button
                            type="button"
                            className={`grid-cell cell-${cellType} ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleCellClick(ghat, ev.year, ev.festival, ph, param)}
                            title={cellAria}
                            aria-label={cellAria}
                          >
                            <span className="cell-symbol">{symbol}</span>
                          </button>
                        </td>
                      );
                    }),
                  )}
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Inspect Panel */}
      {selectedCell && (
        <div className="inspect-drawer" role="region" aria-label="Selected cell measurement details">
          <div className="inspect-header">
            <h4>
              {t('gapGrid.inspectTitle', {
                ghat: selectedCell.ghat,
                year: selectedCell.year,
                festival: selectedCell.festival,
                phase: selectedCell.phase,
              })}
            </h4>
            <button
              type="button"
              className="btn-close-inspect"
              onClick={() => setSelectedCell(null)}
              aria-label={t('gapGrid.closeInspect')}
            >
              ✕
            </button>
          </div>
          <div className="inspect-details-grid">
            <div className="inspect-field">
              <span className="inspect-lbl">{t('gapGrid.paramLabel')}</span>
              <span className="inspect-val">{selectedCell.parameter}</span>
            </div>
            <div className="inspect-field">
              <span className="inspect-lbl">{t('gapGrid.stateLabel')}</span>
              <span className="inspect-val">
                <span className={`cell-state-chip chip-${selectedCell.display.kind}`}>
                  {selectedCell.display.label}
                </span>
              </span>
            </div>
            <div className="inspect-field">
              <span className="inspect-lbl">{t('gapGrid.unitsLabel')}</span>
              <span className="inspect-val">{selectedCell.display.unitLabel || 'None'}</span>
            </div>
            <div className="inspect-field">
              <span className="inspect-lbl">{t('gapGrid.classBLabel')}</span>
              <span className="inspect-val">
                {selectedCell.outsideLimit === null
                  ? t('gapGrid.noBenchmark')
                  : selectedCell.outsideLimit
                  ? t('gapGrid.outsideLimit')
                  : t('gapGrid.withinLimit')}
              </span>
            </div>
            {selectedCell.reading && (
              <>
                <div className="inspect-field">
                  <span className="inspect-lbl">{t('gapGrid.sourceLabel')}</span>
                  <span className="inspect-val">{cite(selectedCell.reading)}</span>
                </div>
                <div className="inspect-field">
                  <span className="inspect-lbl">{t('gapGrid.docLabel')}</span>
                  <span className="inspect-val">
                    {REPORT_FILE[selectedCell.reading.year] ?? 'Official MPPCB Publication'}
                  </span>
                </div>
              </>
            )}
            {selectedCell.display.note && (
              <div className="inspect-field full-width">
                <span className="inspect-lbl">{t('gapGrid.techNote')}</span>
                <span className="inspect-val">{selectedCell.display.note}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
