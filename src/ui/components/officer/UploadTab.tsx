import { useState, useRef } from 'react';
import type { Reading } from '../../../core/types';
import type { Stability } from '../../../core/score';
import { parseReadings } from '../../../core/clean';
import { displayReading } from '../../readingDisplay';

interface UploadTabProps {
  bundledReadings: Reading[];
  uploadedReadings: Reading[];
  bundledStability: Stability[];
  mergedStability: Stability[];
  onAddUploadedReadings: (readings: Reading[]) => void;
  onRemoveUploadedReadings: () => void;
}

const CANONICAL_GHATS = [
  'Bairagarh (Sant Hirdaram) kund',
  'Hathaikheda dam / kund',
  'Khatlapura ghat',
  'Malikhedi kund',
  'Prempura ghat',
  'Rani Kamlapati ghat / Kamla Park kund',
  'Shahpura lake ghat',
] as const;

const REQUIRED_HEADERS = [
  'year',
  'festival',
  'site',
  'phase',
  'parameter',
  'value',
];

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

interface ParsedSummary {
  rowCount: number;
  years: number[];
  ghats: string[];
  unrecognisedSites: string[];
  duplicateCount: number;
  stateCounts: {
    value: number;
    bdl: number;
    likely_bdl: number;
    not_sampled: number;
  };
  parsedRows: Reading[];
}

export function UploadTab({
  bundledReadings,
  uploadedReadings,
  bundledStability,
  mergedStability,
  onAddUploadedReadings,
  onRemoveUploadedReadings,
}: UploadTabProps) {
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedSummary, setParsedSummary] = useState<ParsedSummary | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Template generator client-side
  const handleDownloadTemplate = () => {
    const csvContent =
      'year,festival,site,water_body,phase,parameter,value,unit_assumed,flag,value_as_printed,parameter_as_printed,site_as_printed,site_match_confidence,source_page\n' +
      '2026,Durga,Khatlapura ghat,Lower Lake,pre,Dissolved oxygen,6.50,mg/L,,6.50,Dissolved oxygen,Khatlapura ghat (Example Row),high,1\n' +
      '2026,Durga,Khatlapura ghat,Lower Lake,pre,BOD,2.80,mg/L,,2.80,BOD,Khatlapura ghat (Example Row),high,1\n' +
      '2026,Durga,Khatlapura ghat,Lower Lake,pre,pH,7.40,,,7.40,pH,Khatlapura ghat (Example Row),high,1\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ghat_water_quality_template_2026.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const processCsvFile = (file: File) => {
    setErrorMessage(null);
    setParsedSummary(null);

    // 1. File Type Check
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      setErrorMessage('Invalid file format. Please upload a plain CSV (.csv) file.');
      return;
    }

    // 2. File Size Check (2MB limit)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 2 MB size limit (Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result;
      if (typeof text !== 'string' || !text.trim()) {
        setErrorMessage('Uploaded file is completely empty.');
        return;
      }

      // Check Header Columns
      const firstLine = text.trim().split(/\r?\n/)[0].toLowerCase();
      const missingColumns = REQUIRED_HEADERS.filter(h => !firstLine.includes(h));
      if (missingColumns.length > 0) {
        setErrorMessage(
          `Missing required CSV header columns: ${missingColumns.join(', ')}. Use the provided template.`,
        );
        return;
      }

      // Parse Readings with clean.ts
      let parsed: Reading[] = [];
      try {
        parsed = parseReadings(text);
      } catch (err) {
        setErrorMessage(`Failed to parse CSV records: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }

      if (parsed.length === 0) {
        setErrorMessage('0 rows parsed from water quality dataset.');
        return;
      }

      // Detect Unrecognised Sites
      const canonicalSet = new Set<string>(CANONICAL_GHATS);
      const unrecognisedSites = [
        ...new Set(parsed.filter(r => !canonicalSet.has(r.ghat)).map(r => r.ghat)),
      ];

      // Detect Duplicates against Bundled Records
      const bundledKeySet = new Set(
        bundledReadings.map(r => `${r.year}|${r.festival}|${r.ghat}|${r.phase}|${r.parameter}`),
      );
      let duplicateCount = 0;
      for (const r of parsed) {
        if (bundledKeySet.has(`${r.year}|${r.festival}|${r.ghat}|${r.phase}|${r.parameter}`)) {
          duplicateCount++;
        }
      }

      // Count Value States
      const stateCounts = {
        value: parsed.filter(r => r.state.kind === 'value').length,
        bdl: parsed.filter(r => r.state.kind === 'bdl').length,
        likely_bdl: parsed.filter(r => r.state.kind === 'likely_bdl').length,
        not_sampled: parsed.filter(r => r.state.kind === 'not_sampled').length,
      };

      const years = [...new Set(parsed.map(r => r.year))].sort();
      const ghats = [...new Set(parsed.map(r => r.ghat))].sort();

      setParsedSummary({
        rowCount: parsed.length,
        years,
        ghats,
        unrecognisedSites,
        duplicateCount,
        stateCounts,
        parsedRows: parsed,
      });
    };

    reader.onerror = () => {
      setErrorMessage('Error reading uploaded CSV file from disk.');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCsvFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleAddData = () => {
    if (!parsedSummary) return;
    onAddUploadedReadings(parsedSummary.parsedRows);
  };

  return (
    <div className="officer-upload-content" role="tabpanel" id="panel-upload" aria-labelledby="tab-upload">
      <div className="upload-header-row">
        <div>
          <h3>Upload Field Water Quality Data</h3>
          <p className="mute">
            Upload on-site laboratory testing results to update this working session's triage calculation in memory.
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary btn-template"
          onClick={handleDownloadTemplate}
        >
          📥 Download CSV Template
        </button>
      </div>

      {/* Mandatory Disclaimer */}
      <div className="upload-disclaimer-banner" role="note">
        ⚠️ <strong>Notice:</strong> Uploaded data is unverified, is not an MPPCB-published report, and only affects this browser session. Never written to disk or the historical dataset.
      </div>

      {/* Drag & Drop Zone */}
      <div
        className={`csv-drop-zone ${dragActive ? 'active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <span className="drop-icon" aria-hidden="true">📄</span>
        <h4>Drag &amp; drop a CSV file here</h4>
        <p className="mute">Supports comma-separated .csv up to 2 MB</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="file-hidden-input"
          onChange={e => {
            if (e.target.files && e.target.files[0]) {
              processCsvFile(e.target.files[0]);
            }
          }}
          aria-label="Upload CSV water quality file"
        />

        <button
          type="button"
          className="btn-primary btn-browse"
          onClick={() => fileInputRef.current?.click()}
        >
          Select File from Device
        </button>

        {fileName && <div className="selected-filename">Selected: <strong>{fileName}</strong></div>}
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="upload-error-banner" role="alert" aria-live="assertive">
          ❌ <strong>Upload Validation Error:</strong> {errorMessage}
        </div>
      )}

      {/* Parsed Summary & Validation Feedback */}
      {parsedSummary && (
        <div className="parsed-preview-section">
          <h4>Parsed Data Summary ({parsedSummary.rowCount} Records Found)</h4>

          <div className="preview-metrics-grid">
            <div className="metric-box">
              <span className="m-val">{parsedSummary.rowCount}</span>
              <span className="m-lbl">Total Rows</span>
            </div>
            <div className="metric-box">
              <span className="m-val">{parsedSummary.years.join(', ')}</span>
              <span className="m-lbl">Years</span>
            </div>
            <div className="metric-box">
              <span className="m-val">{parsedSummary.ghats.length}</span>
              <span className="m-lbl">Ghats Cited</span>
            </div>
            <div className="metric-box">
              <span className="m-val">{parsedSummary.stateCounts.value}</span>
              <span className="m-lbl">Numeric Readings</span>
            </div>
            <div className="metric-box">
              <span className="m-val">{parsedSummary.stateCounts.bdl}</span>
              <span className="m-lbl">BDL States</span>
            </div>
            <div className="metric-box">
              <span className="m-val">{parsedSummary.stateCounts.likely_bdl}</span>
              <span className="m-lbl">Likely BDL</span>
            </div>
          </div>

          {/* Validation Warnings */}
          {parsedSummary.unrecognisedSites.length > 0 && (
            <div className="validation-warning-banner" role="status">
              ⚠️ <strong>Unrecognised Sites ({parsedSummary.unrecognisedSites.length}):</strong>{' '}
              {parsedSummary.unrecognisedSites.join(', ')}. These do not match any of the 7 canonical Bhopal ghats and will not contribute to official triage scoring.
            </div>
          )}

          {parsedSummary.duplicateCount > 0 && (
            <div className="validation-info-banner" role="status">
              ℹ️ <strong>Duplicate Rows ({parsedSummary.duplicateCount}):</strong> Records matching an existing (year, festival, ghat, phase, parameter) combination were detected.
            </div>
          )}

          {/* Action Button: Add to session */}
          <div className="merge-action-row">
            <button
              type="button"
              className="btn-primary btn-add-session"
              onClick={handleAddData}
            >
              ⚡ Add to this session's analysis ({parsedSummary.rowCount} rows)
            </button>
            <span className="mute">Recomputes tiers and gap grid in-memory for this tab only.</span>
          </div>

          {/* First 20 Rows Preview Table */}
          <div className="preview-table-wrapper" tabIndex={0} aria-label="First 20 parsed rows preview table">
            <h5>Preview: First 20 Rows</h5>
            <table className="officer-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Year / Festival</th>
                  <th scope="col">Ghat</th>
                  <th scope="col">Phase</th>
                  <th scope="col">Parameter</th>
                  <th scope="col">State / Value</th>
                  <th scope="col">Provenance</th>
                </tr>
              </thead>
              <tbody>
                {parsedSummary.parsedRows.slice(0, 20).map((r, idx) => {
                  const disp = displayReading(r);
                  return (
                    <tr key={`${r.year}-${r.ghat}-${r.phase}-${r.parameter}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td>
                        <strong>{r.year}</strong> {r.festival}
                      </td>
                      <td>{r.ghat}</td>
                      <td>
                        <span className={`phase-badge phase-${r.phase}`}>{r.phase}</span>
                      </td>
                      <td>{r.parameter}</td>
                      <td>
                        <span className={`cell-state-chip chip-${disp.kind}`}>{disp.label}</span>
                      </td>
                      <td>
                        <span className="provenance-chip unverified">Uploaded (unverified)</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Session Status & Before / After Comparison */}
      {uploadedReadings.length > 0 && (
        <div className="active-uploaded-section">
          <div className="active-banner-row">
            <div>
              <h4>Active Uploaded Data in Session ({uploadedReadings.length} Rows Merged)</h4>
              <p className="mute">All tiers and indicators below incorporate the uploaded readings.</p>
            </div>
            <button
              type="button"
              className="btn-danger btn-remove-upload"
              onClick={onRemoveUploadedReadings}
            >
              🗑️ Remove uploaded data (Restore baseline)
            </button>
          </div>

          <div className="comparison-table-wrapper" tabIndex={0} aria-label="Before and after tier comparison table">
            <h5>Before / After Triage Impact Comparison</h5>
            <table className="officer-table comparison-table">
              <thead>
                <tr>
                  <th scope="col">Ghat Name</th>
                  <th scope="col">Baseline Tier (Bundled Only)</th>
                  <th scope="col">Baseline Score</th>
                  <th scope="col">Session Tier (Merged)</th>
                  <th scope="col">Session Score</th>
                  <th scope="col">Tier Impact</th>
                </tr>
              </thead>
              <tbody>
                {bundledStability.map(base => {
                  const merged = mergedStability.find(m => m.ghat === base.ghat);
                  const isShifted = merged && merged.tier !== base.tier;
                  return (
                    <tr key={base.ghat} className={isShifted ? 'row-tier-shifted' : ''}>
                      <td>
                        <strong>{base.ghat}</strong>
                      </td>
                      <td>
                        <span className={`tier-letter-badge tier-${base.tier}`}>{base.tier}</span>
                      </td>
                      <td>{base.score != null ? base.score.toFixed(2) : 'N/A'}</td>
                      <td>
                        <span className={`tier-letter-badge tier-${merged?.tier || base.tier}`}>
                          {merged?.tier || base.tier}
                        </span>
                      </td>
                      <td>
                        {merged
                          ? merged.score != null
                            ? merged.score.toFixed(2)
                            : 'N/A'
                          : base.score != null
                          ? base.score.toFixed(2)
                          : 'N/A'}
                      </td>
                      <td>
                        {isShifted ? (
                          <span className="shift-badge-changed">
                            ⚠️ Shifted: Tier {base.tier} → Tier {merged?.tier}
                          </span>
                        ) : (
                          <span className="shift-badge-same">Unchanged (Tier {base.tier})</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
