import type { Stability } from '../../../core/score';
import type { GhatCoverage } from '../../../core/coverage';
import type { Festival } from '../../../core/types';

interface OverviewTabProps {
  stability: Stability[];
  coverages: Record<string, GhatCoverage>;
  unmonitoredSites: string[];
  totalRows: number;
  uploadedCount: number;
  festival: Festival | 'All';
  onNavigateTab: (tab: 'upload' | 'alerts') => void;
}

export function OverviewTab({
  stability,
  coverages,
  unmonitoredSites,
  totalRows,
  uploadedCount,
  festival,
  onNavigateTab,
}: OverviewTabProps) {
  const tierA = stability.filter(s => s.tier === 'A');
  const tierB = stability.filter(s => s.tier === 'B');
  const tierC = stability.filter(s => s.tier === 'C');

  const gapsCount = Object.values(coverages).filter(
    c => c.missingEvents.length > 0 || c.confidence === 'Low',
  ).length;

  return (
    <div className="officer-overview-content" role="tabpanel" id="panel-overview" aria-labelledby="tab-overview">
      <div className="overview-header-row">
        <div>
          <h3>Municipal Ghat Triage Status ({festival} Immersion)</h3>
          <p className="mute">
            Live working session metrics combining MPPCB historical baseline records with in-memory officer adjustments.
          </p>
        </div>
        <div className="overview-actions-quick">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onNavigateTab('upload')}
          >
            📂 Upload New Data
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => onNavigateTab('alerts')}
          >
            🔔 Manage Alerts
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="officer-tiles-grid">
        <div className="officer-summary-tile tile-tier-a">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-a">Tier A · Act First</span>
            <span className="tile-count">{tierA.length}</span>
          </div>
          <div className="tile-title">High Priority Intervention</div>
          <div className="tile-detail">
            {tierA.length > 0 ? tierA.map(s => s.ghat.split(' ')[0]).join(', ') : 'None'}
          </div>
          <p className="tile-subtext">Persistent hypoxia / delayed oxygen recovery. Deploy aeration early.</p>
        </div>

        <div className="officer-summary-tile tile-tier-b">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-b">Tier B · Close Group</span>
            <span className="tile-count">{tierB.length}</span>
          </div>
          <div className="tile-title">Intermediate Fluctuating Risk</div>
          <div className="tile-detail">
            {tierB.length > 0 ? tierB.map(s => s.ghat.split(' ')[0]).join(', ') : 'None'}
          </div>
          <p className="tile-subtext">Resampling proves rank order is not reliable. Standard vigilance required.</p>
        </div>

        <div className="officer-summary-tile tile-tier-c">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-c">Tier C · Lowest Concern</span>
            <span className="tile-count">{tierC.length}</span>
          </div>
          <div className="tile-title">Lowest Relative Concern</div>
          <div className="tile-detail">
            {tierC.length > 0 ? tierC.map(s => s.ghat.split(' ')[0]).join(', ') : 'None'}
          </div>
          <p className="tile-subtext">Lowest score under model, but BOD remains &gt; 3.0 mg/L; not certified safe.</p>
        </div>

        <div className="officer-summary-tile tile-gaps">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-gap">Data Gaps</span>
            <span className="tile-count">{gapsCount}</span>
          </div>
          <div className="tile-title">Ghats with Missing Event Records</div>
          <div className="tile-detail">
            {Object.values(coverages)
              .filter(c => c.missingEvents.length > 0)
              .map(c => c.ghat.split(' ')[0])
              .join(', ') || 'No complete gaps'}
          </div>
          <p className="tile-subtext">Missing whole 2025 Durga tables. Requires priority field testing.</p>
        </div>

        <div className="officer-summary-tile tile-unmonitored">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-unmonitored">Unmonitored</span>
            <span className="tile-count">{unmonitoredSites.length}</span>
          </div>
          <div className="tile-title">Provisional Immersion Sites</div>
          <div className="tile-detail">
            {unmonitoredSites.slice(0, 3).join(', ')}
            {unmonitoredSites.length > 3 ? ` +${unmonitoredSites.length - 3} more` : ''}
          </div>
          <p className="tile-subtext">0 historical MPPCB testing records. Condition unknown, never assume clean.</p>
        </div>

        <div className="officer-summary-tile tile-records">
          <div className="tile-badge-line">
            <span className="tile-tier-tag tag-records">Session Dataset</span>
            <span className="tile-count">{totalRows}</span>
          </div>
          <div className="tile-title">Active Analytical Rows</div>
          <div className="tile-detail">
            {uploadedCount > 0 ? (
              <span className="text-uploaded-highlight">
                1,524 Bundled + <strong>{uploadedCount} Uploaded (unverified)</strong>
              </span>
            ) : (
              '1,524 Bundled MPPCB Records'
            )}
          </div>
          <p className="tile-subtext">Benchmarked against CPCB Class B (outdoor bathing).</p>
        </div>
      </div>

      {/* Officer Directive Box */}
      <div className="officer-directive-box">
        <h4>Officer Operational Protocol for Durga Visarjan</h4>
        <ul>
          <li>
            <strong>1. Mandatory Pre-Immersion Inspection:</strong> Deploy mobile water sampling vans 48 hours prior to idol arrival at both Tier A ghats and provisional unmonitored sites.
          </li>
          <li>
            <strong>2. Immediate Cascade Aeration:</strong> Run mechanical fountain aerators at Bairagarh and Shahpura continuously during the immersion period.
          </li>
          <li>
            <strong>3. In-Memory Session Analysis:</strong> Use the <em>"Upload new data"</em> tab to test newly received laboratory CSV test runs before publishing official bulletins.
          </li>
        </ul>
      </div>
    </div>
  );
}
