import { useState } from 'react';
import type { Reading, Phase } from '../../core/types';
import { assessReading } from '../../core/insights';
import { LIMITS } from '../../core/limits';
import { useLanguage } from '../i18n';

interface NewReadingFormProps {
  ghats: string[];
  readings: Reading[];
}

export function NewReadingForm({ ghats, readings }: NewReadingFormProps) {
  const { t } = useLanguage();
  const [ghat, setGhat] = useState('');
  const [parameter, setParameter] = useState('Dissolved oxygen');
  const [phase, setPhase] = useState<Phase>('pre');
  const [valueStr, setValueStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Range limits with scientific justification
  // - pH: 0 to 14 standard logarithmic chemical scale
  // - Dissolved Oxygen: 0 to 25 mg/L (atmospheric equilibrium saturation is ~8-14 mg/L depending on temperature; 25 mg/L accounts for extreme algal bloom hyper-saturation)
  // - BOD: 0 to 200 mg/L (undiluted raw domestic sewage is ~150-300 mg/L; surface lake water rarely exceeds 50 mg/L, 200 mg/L provides a generous realistic ceiling)
  const validateInput = (param: string, rawVal: string): { valid: boolean; numVal?: number; error?: string } => {
    if (!ghat) {
      return { valid: false, error: 'Please select a monitored ghat.' };
    }
    if (rawVal.trim() === '') {
      return { valid: false, error: 'Please enter a numeric measurement.' };
    }
    const val = Number(rawVal);
    if (Number.isNaN(val)) {
      return { valid: false, error: 'Entered measurement must be a valid number.' };
    }
    if (val < 0) {
      return { valid: false, error: 'Concentration cannot be negative.' };
    }

    if (param === 'pH') {
      if (val < 0 || val > 14) {
        return { valid: false, error: 'pH must fall within the standard chemical scale of 0.0 to 14.0.' };
      }
    } else if (param === 'Dissolved oxygen') {
      if (val > 25) {
        return {
          valid: false,
          error: 'Dissolved oxygen cannot exceed 25 mg/L (hyper-saturation ceiling). Please verify decimal entry.',
        };
      }
    } else if (param === 'BOD') {
      if (val > 200) {
        return {
          valid: false,
          error: 'BOD cannot exceed 200 mg/L (exceeds typical municipal raw sewage). Please verify reading.',
        };
      }
    }

    return { valid: true, numVal: val };
  };

  const handleValueChange = (newVal: string) => {
    setValueStr(newVal);
    if (newVal === '') {
      setErrorMsg(null);
      return;
    }
    const validation = validateInput(parameter, newVal);
    setErrorMsg(validation.valid ? null : (validation.error ?? null));
  };

  const validation = validateInput(parameter, valueStr);
  const result = validation.valid && validation.numVal !== undefined && ghat
    ? assessReading(readings, ghat, parameter, validation.numVal, phase)
    : null;

  const limitObj = (LIMITS as Record<string, { rule: string; unit: string }>)[parameter];

  return (
    <section className="new-reading-section" aria-labelledby="form-heading">
      <div className="section-header-row">
        <div>
          <h2 id="form-heading">{t('readingForm.heading')}</h2>
          <p className="mute">
            <strong>{t('readingForm.subtitle')}</strong>
          </p>
        </div>
        <span className="preview-badge">{t('readingForm.badge')}</span>
      </div>

      <div className="card form-card">
        <p className="form-disclaimer">
          {t('readingForm.disclaimer')}
        </p>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="input-ghat" className="field-label">
              {t('readingForm.selectGhat')}
            </label>
            <select
              id="input-ghat"
              className="form-select"
              value={ghat}
              onChange={e => {
                setGhat(e.target.value);
                if (valueStr) {
                  const v = validateInput(parameter, valueStr);
                  setErrorMsg(v.valid ? null : (v.error ?? null));
                }
              }}
            >
              <option value="">{t('readingForm.selectGhatPlaceholder')}</option>
              {ghats.map(g => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="input-param" className="field-label">
              {t('readingForm.param')}
            </label>
            <select
              id="input-param"
              className="form-select"
              value={parameter}
              onChange={e => {
                const newP = e.target.value;
                setParameter(newP);
                if (valueStr) {
                  const v = validateInput(newP, valueStr);
                  setErrorMsg(v.valid ? null : (v.error ?? null));
                }
              }}
            >
              <option value="Dissolved oxygen">Dissolved oxygen (DO)</option>
              <option value="BOD">Biochemical Oxygen Demand (BOD)</option>
              <option value="pH">pH</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="input-phase" className="field-label">
              {t('readingForm.phase')}
            </label>
            <select
              id="input-phase"
              className="form-select"
              value={phase}
              onChange={e => setPhase(e.target.value as Phase)}
            >
              <option value="pre">{t('readingForm.phasePre')}</option>
              <option value="during">{t('readingForm.phaseDuring')}</option>
              <option value="after">{t('readingForm.phaseAfter')}</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="input-value" className="field-label">
              {t('readingForm.value', { unit: parameter === 'pH' ? '(pH units)' : '(mg/L assumed)' })}
            </label>
            <input
              id="input-value"
              type="number"
              step="0.01"
              className={`form-input ${errorMsg ? 'input-error' : ''}`}
              placeholder="e.g. 4.8"
              value={valueStr}
              onChange={e => handleValueChange(e.target.value)}
              aria-invalid={errorMsg !== null}
              aria-describedby={errorMsg ? 'input-error-msg' : 'input-help-msg'}
            />
            {errorMsg ? (
              <span id="input-error-msg" className="field-error-text" role="alert">
                {errorMsg}
              </span>
            ) : (
              <span id="input-help-msg" className="field-help-text">
                Benchmark: {limitObj?.rule ?? 'N/A'}
              </span>
            )}
          </div>
        </div>

        {result && (
          <div className="form-result-box" role="region" aria-live="polite" aria-label="Assessment result">
            <div className="result-header">
              <span className={`result-tag ${result.outsideClassB ? 'tag-failed' : 'tag-passed'}`}>
                {result.outsideClassB ? t('readingForm.outsideClassB') : t('readingForm.meetsClassB')}
              </span>
              <span className="benchmark-note">
                {t('readingForm.criterion', { param: result.parameter, limit: result.limit })}
              </span>
            </div>

            <div className="result-stats">
              <p>
                <strong>{t('readingForm.historicalComparison')}</strong>{' '}
                {result.pastReadings > 0 ? (
                  result.worseThanShareOfPast !== null ? (
                    t('readingForm.worseThan', {
                      pct: Math.round(result.worseThanShareOfPast * 100),
                      n: result.pastReadings,
                      phase: result.phase,
                    })
                  ) : (
                    t('readingForm.equalsMedian')
                  )
                ) : (
                  t('readingForm.noHistorical')
                )}
              </p>
            </div>

            <div className="result-limitations mute">
              {t('readingForm.limitations')}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
