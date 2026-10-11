import { useState } from 'react';

export function Glossary() {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className="glossary-card" aria-label="Water Quality Parameters Glossary">
      <div className="glossary-header">
        <h3 className="glossary-title">Key Standards & Parameters Glossary</h3>
        <button
          type="button"
          className="toggle-link"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls="glossary-content"
        >
          {expanded ? 'Collapse Glossary' : 'Expand Details'}
        </button>
      </div>

      <div id="glossary-content" className={`glossary-content ${expanded ? 'open' : ''}`}>
        <dl className="glossary-grid">
          <div>
            <dt><strong>DO (Dissolved Oxygen)</strong></dt>
            <dd>Class B requires <strong>≥ 5.0 mg/L</strong>. Critical for aquatic life. Levels &lt; 5 mg/L indicate hypoxia / oxygen depletion.</dd>
          </div>
          <div>
            <dt><strong>BOD (Biochemical Oxygen Demand)</strong></dt>
            <dd>Class B requires <strong>≤ 3.0 mg/L</strong>. Measures organic pollution load. High values indicate decomposing organic matter (flowers, food, sewage).</dd>
          </div>
          <div>
            <dt><strong>pH</strong></dt>
            <dd>Class B standard is <strong>6.5 to 8.5</strong>. Measures acidity or alkalinity. Neutral is ~7.0.</dd>
          </div>
          <div>
            <dt><strong>BDL (Below Detection Limit)</strong></dt>
            <dd>True laboratory reading below instrument measurement threshold. Very low concentration; <strong>not zero and not missing</strong>.</dd>
          </div>
          <div>
            <dt><strong>Likely BDL (Detection Limit Match)</strong></dt>
            <dd>63 values in 2025 match detection limits without the "&lt;" prefix. Treated conservatively as BDL; requires MPPCB verification.</dd>
          </div>
          <div>
            <dt><strong>CPCB Class B</strong></dt>
            <dd>National standard for "Outdoor Bathing". Used here as a consistent comparison benchmark, not an immersion-specific classification.</dd>
          </div>
        </dl>
      </div>
    </aside>
  );
}
