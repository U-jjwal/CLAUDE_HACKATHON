import type { BriefFacts } from '../../core/facts';

interface TrustAndLimitsProps {
  stats: BriefFacts['stats'];
}

export function TrustAndLimits({ stats }: TrustAndLimitsProps) {
  return (
    <section className="trust-limits-section" aria-labelledby="trust-limits-heading">
      <div className="section-header-row">
        <div>
          <h2 id="trust-limits-heading">Trust, Governance &amp; Technical Limitations</h2>
          <p className="mute">
            Essential transparency constraints for municipal executive decision-making.
          </p>
        </div>
      </div>

      <div className="card trust-card">
        <ul className="trust-rules-list">
          <li>
            <strong>Missing Data Rule:</strong> Missing data is <em>never zero, never clean, and never green</em>. An unmonitored site or absent test phase denotes complete absence of evidence, not safety.
          </li>
          <li>
            <strong>Detection Limits (BDL vs Likely BDL):</strong> True BDL (Below Detection Limit) indicates trace concentrations below analytical instrument thresholds—it is neither zero nor missing. Furthermore, exactly <strong>{stats.likelyBdlCount} numeric readings</strong> in the 2025 dataset (Chromium: {stats.chromiumCount}, Lead: {stats.leadCount}, Copper: {stats.copperCount}, Zinc: {stats.zincCount}) equal known laboratory detection limits where the "&lt;" prefix was omitted in published tables. These are conservatively flagged as <code>Likely BDL</code> and require formal MPPCB confirmation.
          </li>
          <li>
            <strong>Assumed Units:</strong> Official MPPCB reports do not print measurement units in published tables. Standard units (mg/L for DO and BOD; standard logarithmic scale for pH) are assumed across all calculations.
          </li>
          <li>
            <strong>Unstated BOD Incubation Methodology:</strong> MPPCB lake monitoring publications reference 3 days at 27°C, whereas national CPCB Class B criteria specify 5 days at 20°C. Published ghat visarjan tables omit incubation conditions entirely.
          </li>
          <li>
            <strong>Total Coliform Omission:</strong> National CPCB Class B standards for outdoor bathing include a strict total coliform limit of 500 MPN/100ml. The MPPCB visarjan dataset contains zero microbial/coliform tests.
          </li>
          <li>
            <strong>Benchmark Scope:</strong> CPCB Class B (outdoor bathing) is adopted as a transparent civic benchmark, not a statutory immersion-specific water standard.
          </li>
          <li>
            <strong>Meaning of Tier C:</strong> Tier C denotes <em>"lowest relative concern under this composite index"</em>, NOT "clean" or "safe". Biochemical Oxygen Demand (BOD) exceeded 3.0 mg/L in {stats.bodAbove3} of {stats.bodTotal} historical tests across all ghats.
          </li>
          <li>
            <strong>No Epidemiological Conclusions:</strong> This system assesses physical and chemical environmental indicators. It does not infer waterborne disease incidence or public health risks.
          </li>
          <li>
            <strong>Weighting &amp; Cutoff Subjectivity:</strong> Composite weights (Dissolved Oxygen: 0.45, BOD: 0.40, pH: 0.15) and tier boundaries (pTop2 ≥ 0.80 for Tier A; pBottom2 ≥ 0.80 for Tier C) are deliberate operational policy judgements, not physical laws.
          </li>
          <li>
            <strong>Ghat Identification Ambiguity:</strong> Site designations such as <em>"Rani Kamlapati ghat / Kamla Park kund"</em> may refer to distinct adjacent water access points across reporting years.
          </li>
        </ul>
      </div>
    </section>
  );
}
