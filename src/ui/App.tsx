import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Festival, Reading } from '../core/types';
import { rankStability } from '../core/score';
import { profile, carryOver } from '../core/insights';
import { computeAllGhatCoverage } from '../core/coverage';
import { computeTopActions } from '../core/actions';
import { buildBriefFacts, INITIAL_BLIND_SPOTS } from '../core/facts';
import { getRawCsv, parseAllReadings } from './data';
import { AuthProvider } from './auth';
import { LanguageProvider, useLanguage } from './i18n';

import { AppHeader } from './components/AppHeader';
import { Glossary } from './components/Glossary';
import { TopActions } from './components/TopActions';
import { CarryOverNotice } from './components/CarryOverNotice';
import { FestivalSelector } from './components/FestivalSelector';
import { RiskTierSection } from './components/RiskTierSection';
import { DataGapGrid } from './components/DataGapGrid';
import { BlindSpotPanel } from './components/BlindSpotPanel';
import { NewReadingForm } from './components/NewReadingForm';
import { BilingualBrief } from './components/BilingualBrief';
import { TrustAndLimits } from './components/TrustAndLimits';
import { OfficerDashboard } from './components/officer/OfficerDashboard';

function DashboardApp() {
  const { t } = useLanguage();
  const [loadState, setLoadState] = useState<{
    status: 'loading' | 'ready' | 'error';
    readings: Reading[];
    error?: string;
  }>({ status: 'loading', readings: [] });

  const [festival, setFestival] = useState<Festival | 'All'>('Durga');
  const [blindSpots, setBlindSpots] = useState<string[]>(INITIAL_BLIND_SPOTS);
  const [uploadedReadings, setUploadedReadings] = useState<Reading[]>([]);
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash || '#/' : '#/'));

  useEffect(() => {
    const handleHash = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const loadData = useCallback(() => {
    setLoadState({ status: 'loading', readings: [] });
    try {
      const raw = getRawCsv();
      if (!raw || !raw.trim()) {
        throw new Error('Water quality CSV dataset is empty.');
      }
      const data = parseAllReadings(raw);
      if (!data || data.length === 0) {
        setLoadState({
          status: 'error',
          readings: [],
          error: '0 rows parsed from water quality dataset.',
        });
        return;
      }
      setLoadState({ status: 'ready', readings: data });
    } catch (err) {
      setLoadState({
        status: 'error',
        readings: [],
        error: err instanceof Error ? err.message : 'Failed to parse CSV dataset.',
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rs = loadState.status === 'ready' ? loadState.readings : null;

  // Baseline bundled view & stability
  const bundledView = useMemo(
    () => (rs ? (festival === 'All' ? rs : rs.filter(r => r.festival === festival)) : []),
    [rs, festival],
  );

  const bundledStability = useMemo(
    () => (bundledView.length ? rankStability(bundledView, { B: 2000, seed: 7 }) : []),
    [bundledView],
  );

  // Effective readings: merged in-memory session dataset
  const effectiveReadings = useMemo(
    () => (rs ? (uploadedReadings.length ? [...rs, ...uploadedReadings] : rs) : []),
    [rs, uploadedReadings],
  );

  // Filtered view based on festival selection
  const view = useMemo(
    () => (effectiveReadings.length ? (festival === 'All' ? effectiveReadings : effectiveReadings.filter(r => r.festival === festival)) : []),
    [effectiveReadings, festival],
  );

  // Match verify.ts exactly: B=2000, seed=7
  const stability = useMemo(
    () => (view.length ? rankStability(view, { B: 2000, seed: 7 }) : []),
    [view],
  );

  const ghats = useMemo(
    () => (effectiveReadings.length ? [...new Set(effectiveReadings.map(r => r.ghat))].sort() : []),
    [effectiveReadings],
  );

  const coverages = useMemo(
    () => (effectiveReadings.length ? computeAllGhatCoverage(effectiveReadings, festival) : {}),
    [effectiveReadings, festival],
  );

  const profiles = useMemo(() => {
    if (!effectiveReadings.length || !stability.length) return {};
    const map: Record<string, ReturnType<typeof profile>> = {};
    for (const s of stability) {
      map[s.ghat] = profile(view, s.ghat);
    }
    return map;
  }, [effectiveReadings, stability, view]);

  const carryOverDO = useMemo(() => (effectiveReadings.length ? carryOver(effectiveReadings, 'Dissolved oxygen') : null), [effectiveReadings]);
  const carryOverBOD = useMemo(() => (effectiveReadings.length ? carryOver(effectiveReadings, 'BOD') : null), [effectiveReadings]);

  const topActions = useMemo(() => {
    if (!effectiveReadings.length || !stability.length) return [];
    return computeTopActions(effectiveReadings, stability, profiles, coverages, blindSpots);
  }, [effectiveReadings, stability, profiles, coverages, blindSpots]);

  const briefFacts = useMemo(() => {
    if (!effectiveReadings.length) return null;
    return buildBriefFacts(effectiveReadings, festival, blindSpots);
  }, [effectiveReadings, festival, blindSpots]);

  // Blind spots management with deduplication and trimming
  const handleAddBlindSpot = (newSite: string): { success: boolean; error?: string } => {
    const trimmed = newSite.trim();
    if (!trimmed) {
      return { success: false, error: 'Site name cannot be empty.' };
    }
    const lower = trimmed.toLowerCase();
    if (blindSpots.some(s => s.toLowerCase() === lower)) {
      return { success: false, error: `Site "${trimmed}" already exists in the provisional list.` };
    }
    setBlindSpots([...blindSpots, trimmed]);
    return { success: true };
  };

  const handleEditBlindSpot = (oldSite: string, newSite: string): { success: boolean; error?: string } => {
    const trimmed = newSite.trim();
    if (!trimmed) {
      return { success: false, error: 'Site name cannot be empty.' };
    }
    const lower = trimmed.toLowerCase();
    if (
      blindSpots.some(
        s => s.toLowerCase() === lower && s.toLowerCase() !== oldSite.toLowerCase(),
      )
    ) {
      return { success: false, error: `Another site named "${trimmed}" already exists.` };
    }
    setBlindSpots(blindSpots.map(s => (s === oldSite ? trimmed : s)));
    return { success: true };
  };

  const handleRemoveBlindSpot = (siteToRemove: string) => {
    setBlindSpots(blindSpots.filter(s => s !== siteToRemove));
  };

  if (loadState.status === 'loading') {
    return (
      <main className="wrap app-container" role="status" aria-live="polite">
        <div className="card loading-card">
          <h2>{t('app.loadingTitle')}</h2>
          <p className="mute">{t('app.loadingDesc')}</p>
        </div>
      </main>
    );
  }

  if (loadState.status === 'error' || !rs || !carryOverDO || !carryOverBOD || !briefFacts) {
    return (
      <main className="wrap app-container" role="alert" aria-live="assertive">
        <div className="card error-card">
          <h2>{t('app.errorTitle')}</h2>
          <p>{loadState.error ?? 'An unexpected error occurred while processing water quality records.'}</p>
          <button type="button" className="btn-primary" onClick={loadData}>
            {t('app.retryBtn')}
          </button>
        </div>
      </main>
    );
  }

  // Hash Switch for Officer Dashboard (#/officer)
  if (hash.startsWith('#/officer')) {
    return (
      <OfficerDashboard
        bundledReadings={rs}
        uploadedReadings={uploadedReadings}
        bundledStability={bundledStability}
        mergedStability={stability}
        profiles={profiles}
        coverages={coverages}
        unmonitoredSites={blindSpots}
        festival={festival}
        onAddUploadedReadings={newReadings => setUploadedReadings(prev => [...prev, ...newReadings])}
        onRemoveUploadedReadings={() => setUploadedReadings([])}
      />
    );
  }

  // Public Dashboard (#/)
  return (
    <div className="app-layout">
      {uploadedReadings.length > 0 && (
        <div className="officer-demo-banner" role="status">
          <span className="banner-icon" aria-hidden="true">⚠️</span>
          <span>
            {t('officer.activeSessionPublic', { count: uploadedReadings.length })}{' '}
            <a href="#/officer" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
              {t('officer.manageInArea')}
            </a>
          </span>
        </div>
      )}

      <main className="wrap app-container">
        {/* 1. Hero Section (Top Bar with search & login, Bhopal Leaflet Map, Executive Overview) */}
        <AppHeader
          totalRows={effectiveReadings.length}
          ghatsCount={ghats.length}
          unmonitoredCount={blindSpots.length}
          stability={stability}
          profiles={profiles}
          blindSpots={blindSpots}
        />

        {/* Small anchor-link sticky nav */}
        <nav className="sticky-section-nav" aria-label="Section Quick Navigation">
          <div className="sticky-nav-scroll">
            <a href="#hero-map" className="nav-anchor-link">{t('quickNav.map')}</a>
            <a href="#top-actions" className="nav-anchor-link">{t('quickNav.actions')}</a>
            <a href="#ghat-tiers" className="nav-anchor-link">{t('quickNav.tiers')}</a>
            <a href="#data-gaps" className="nav-anchor-link">{t('quickNav.gaps')}</a>
            <a href="#blind-spots" className="nav-anchor-link">{t('quickNav.blindSpots')}</a>
            <a href="#check-reading" className="nav-anchor-link">{t('quickNav.reading')}</a>
            <a href="#bilingual-brief" className="nav-anchor-link">{t('quickNav.brief')}</a>
            <a href="#trust-limits" className="nav-anchor-link">{t('quickNav.trust')}</a>
          </div>
        </nav>

        {/* Compact always-visible glossary */}
        <Glossary />

        {/* 2. Top 3 Priority Actions */}
        <div id="top-actions">
          <TopActions actions={topActions} />
        </div>

        {/* 3. Carry-over notice (14 of 19 DO, 14 of 18 BOD from carryOver()) */}
        <CarryOverNotice carryOverDO={carryOverDO} carryOverBOD={carryOverBOD} />

        {/* 4. Festival selector */}
        <FestivalSelector festival={festival} onChange={setFestival} />

        {/* 5. Tiers and Ghat risk cards with Evidence Drawers */}
        <div id="ghat-tiers">
          <RiskTierSection
            festival={festival}
            stability={stability}
            profiles={profiles}
            coverages={coverages}
            readings={view}
          />
        </div>

        {/* 6. Comprehensive Monitoring & Data Gap Grid */}
        <div id="data-gaps">
          <DataGapGrid readings={effectiveReadings} ghats={ghats} />
        </div>

        {/* 7 & 8. Operational Dual Grid: Blind Spots & Check a Reading */}
        <div className="operational-dual-grid">
          <div id="blind-spots">
            <BlindSpotPanel
              sites={blindSpots}
              onAddSite={handleAddBlindSpot}
              onEditSite={handleEditBlindSpot}
              onRemoveSite={handleRemoveBlindSpot}
            />
          </div>

          <div id="check-reading">
            <NewReadingForm ghats={ghats} readings={effectiveReadings} />
          </div>
        </div>

        {/* 9. Bilingual Brief (English, Hindi, WhatsApp copy, Print / PDF) */}
        <div id="bilingual-brief">
          <BilingualBrief facts={briefFacts} />
        </div>

        {/* 10. Trust & Technical Limits */}
        <div id="trust-limits">
          <TrustAndLimits stats={briefFacts.stats} />
        </div>
      </main>

      <footer className="app-footer">
        <div className="wrap footer-content">
          <p>
            <strong>{t('app.footerTitle')}</strong>
          </p>
          <p className="mute">
            {t('app.footerDesc')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DashboardApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
