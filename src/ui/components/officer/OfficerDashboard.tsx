import { useState, useRef, useId } from 'react';
import { useAuth } from '../../auth';
import { useLanguage } from '../../i18n';
import type { Stability } from '../../../core/score';
import type { GhatProfile } from '../../../core/insights';
import type { GhatCoverage } from '../../../core/coverage';
import type { Reading, Festival } from '../../../core/types';
import { generateAlertFeed } from '../../alerts';
import { OverviewTab } from './OverviewTab';
import { UploadTab } from './UploadTab';
import { AlertsTab } from './AlertsTab';

interface OfficerDashboardProps {
  bundledReadings: Reading[];
  uploadedReadings: Reading[];
  bundledStability: Stability[];
  mergedStability: Stability[];
  profiles: Record<string, GhatProfile>;
  coverages: Record<string, GhatCoverage>;
  unmonitoredSites: string[];
  festival: Festival | 'All';
  onAddUploadedReadings: (readings: Reading[]) => void;
  onRemoveUploadedReadings: () => void;
}

type TabKey = 'overview' | 'upload' | 'alerts';

export function OfficerDashboard({
  bundledReadings,
  uploadedReadings,
  bundledStability,
  mergedStability,
  profiles,
  coverages,
  unmonitoredSites,
  festival,
  onAddUploadedReadings,
  onRemoveUploadedReadings,
}: OfficerDashboardProps) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  if (!user) {
    return (
      <div className="officer-dashboard-layout">
        <div className="officer-demo-banner" role="status">
          <span className="banner-icon" aria-hidden="true">⚠️</span>
          <span><strong>Demo mode:</strong> {t('officer.demoNotice')}</span>
        </div>
        <div className="wrap officer-container" style={{ padding: '2rem 1rem' }}>
          <div className="card" style={{ maxWidth: 520, margin: '2rem auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{t('officer.loginRequired')}</h2>
            <p className="mute">{t('officer.restrictedWorkspace')}</p>
            <div className="modal-notice-banner" style={{ textAlign: 'left', margin: '1rem 0' }}>
              ℹ️ <strong>Demo mode:</strong> {t('officer.demoHint')}
            </div>
            <a href="#/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 20px' }}>
              {t('officer.returnPublic')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  const tabOverviewRef = useRef<HTMLButtonElement>(null);
  const tabUploadRef = useRef<HTMLButtonElement>(null);
  const tabAlertsRef = useRef<HTMLButtonElement>(null);

  const tabIdOverview = useId();
  const tabIdUpload = useId();
  const tabIdAlerts = useId();

  // Compute countdown to 20 Oct 2026 Durga Visarjan
  const targetDate = new Date('2026-10-20T00:00:00');
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Formatted current date
  const formattedToday = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate alerts feed
  const alertsFeed = generateAlertFeed(
    bundledReadings,
    uploadedReadings,
    festival,
    mergedStability,
    profiles,
    coverages,
  );

  // Keyboard navigation for tablist (ArrowLeft, ArrowRight, Home, End)
  const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: TabKey) => {
    const tabs: TabKey[] = ['overview', 'upload', 'alerts'];
    const tabRefs: Record<TabKey, React.RefObject<HTMLButtonElement | null>> = {
      overview: tabOverviewRef,
      upload: tabUploadRef,
      alerts: tabAlertsRef,
    };

    const currentIndex = tabs.indexOf(currentTab);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab);
    tabRefs[nextTab]?.current?.focus();
  };

  const totalAnalyzedRows = bundledReadings.length + uploadedReadings.length;

  return (
    <div className="officer-dashboard-layout">
      {/* 1. Persistent Amber Demo Mode Banner */}
      <div className="officer-demo-banner" role="status" aria-live="polite">
        <span className="banner-icon" aria-hidden="true">⚠️</span>
        <span>
          {t('officer.demoBanner')}
        </span>
      </div>

      <div className="wrap officer-container">
        {/* Officer Top Nav Row */}
        <div className="officer-nav-row">
          <a href="#/" className="btn-back-public" aria-label="Return to public immersion dashboard">
            {t('officer.backPublic')}
          </a>

          <div className="officer-session-user">
            <span className="officer-name-tag">👤 {user?.name ?? 'Demo Officer'}</span>
            <button
              type="button"
              className="btn-logout"
              onClick={logout}
              aria-label="Log out of officer area"
            >
              {t('nav.signOut')}
            </button>
          </div>
        </div>

        {/* 2. Welcome Header */}
        <header className="officer-welcome-header">
          <div className="welcome-text-group">
            <h2>{t('officer.welcome', { name: user?.name ?? 'Demo Officer' })}</h2>
            <div className="officer-meta-row">
              <span className="meta-dept">🏛️ {user?.department ?? 'Bhopal Municipal Corporation (demo)'}</span>
              <span className="meta-desig">📋 {user?.designation ?? 'Sanitation Officer (demo)'}</span>
              <span className="meta-date">📅 {formattedToday}</span>
            </div>
          </div>

          <div className="countdown-widget" role="status" aria-label="Countdown to Durga Visarjan">
            <div className="countdown-number">{daysRemaining}</div>
            <div className="countdown-label">{t('officer.daysRemaining')}</div>
          </div>
        </header>

        {/* 3. Keyboard-Accessible Tablist */}
        <div className="officer-tabs-container">
          <div
            className="officer-tablist"
            role="tablist"
            aria-label="Officer Workspace Tabs"
          >
            <button
              ref={tabOverviewRef}
              id={tabIdOverview}
              type="button"
              role="tab"
              aria-selected={activeTab === 'overview'}
              aria-controls="panel-overview"
              tabIndex={activeTab === 'overview' ? 0 : -1}
              className={`officer-tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
              onKeyDown={e => handleTabKeyDown(e, 'overview')}
            >
              {t('officer.tabOverview')}
            </button>

            <button
              ref={tabUploadRef}
              id={tabIdUpload}
              type="button"
              role="tab"
              aria-selected={activeTab === 'upload'}
              aria-controls="panel-upload"
              tabIndex={activeTab === 'upload' ? 0 : -1}
              className={`officer-tab ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
              onKeyDown={e => handleTabKeyDown(e, 'upload')}
            >
              {t('officer.tabUpload')} {uploadedReadings.length > 0 && `(${uploadedReadings.length})`}
            </button>

            <button
              ref={tabAlertsRef}
              id={tabIdAlerts}
              type="button"
              role="tab"
              aria-selected={activeTab === 'alerts'}
              aria-controls="panel-alerts"
              tabIndex={activeTab === 'alerts' ? 0 : -1}
              className={`officer-tab ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
              onKeyDown={e => handleTabKeyDown(e, 'alerts')}
            >
              {t('officer.tabAlerts')} {alertsFeed.length > 0 && `(${alertsFeed.length})`}
            </button>
          </div>
        </div>

        {/* Tab Panels */}
        <main className="officer-panels-wrapper">
          {activeTab === 'overview' && (
            <OverviewTab
              stability={mergedStability}
              coverages={coverages}
              unmonitoredSites={unmonitoredSites}
              totalRows={totalAnalyzedRows}
              uploadedCount={uploadedReadings.length}
              festival={festival}
              onNavigateTab={tab => setActiveTab(tab)}
            />
          )}

          {activeTab === 'upload' && (
            <UploadTab
              bundledReadings={bundledReadings}
              uploadedReadings={uploadedReadings}
              bundledStability={bundledStability}
              mergedStability={mergedStability}
              onAddUploadedReadings={onAddUploadedReadings}
              onRemoveUploadedReadings={onRemoveUploadedReadings}
            />
          )}

          {activeTab === 'alerts' && <AlertsTab alerts={alertsFeed} />}
        </main>
      </div>
    </div>
  );
}
