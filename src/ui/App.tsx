import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Festival, Reading } from '../core/types';
import { rankStability } from '../core/score';
import { profile, carryOver } from '../core/insights';
import { computeAllGhatCoverage } from '../core/coverage';
import { computeTopActions } from '../core/actions';
import { buildBriefFacts, INITIAL_BLIND_SPOTS } from '../core/facts';
import { getRawCsv, parseAllReadings } from './data';
import { AuthProvider } from './auth';

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
          <h2>Loading Historical Water Quality Data...</h2>
          <p className="mute">Parsing Bhopal Municipal Corporation visarjan records (2023–2025)...</p>
        </div>
      </main>
    );
  }

  if (loadState.status === 'error' || !rs || !carryOverDO || !carryOverBOD || !briefFacts) {
    return (
      <main className="wrap app-container" role="alert" aria-live="assertive">
        <div className="card error-card">
          <h2>Dataset Loading Failure</h2>
          <p>{loadState.error ?? 'An unexpected error occurred while processing water quality records.'}</p>
          <button type="button" className="btn-primary" onClick={loadData}>
            🔄 Retry Loading Dataset
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
            <strong>Active In-Memory Session:</strong> Showing analysis with {uploadedReadings.length} uploaded records.{' '}
            <a href="#/officer" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
              Manage in Officer Area →
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

        {/* Compact always-visible glossary */}
        <Glossary />

        {/* 2. Top 3 Priority Actions */}
        <TopActions actions={topActions} />

        {/* 3. Carry-over notice (14 of 19 DO, 14 of 18 BOD from carryOver()) */}
        <CarryOverNotice carryOverDO={carryOverDO} carryOverBOD={carryOverBOD} />

        {/* 4. Festival selector */}
        <FestivalSelector festival={festival} onChange={setFestival} />

        {/* 5. Tiers and Ghat risk cards with Evidence Drawers */}
        <RiskTierSection
          festival={festival}
          stability={stability}
          profiles={profiles}
          coverages={coverages}
          readings={view}
        />

        {/* 6. Comprehensive Monitoring & Data Gap Grid */}
        <DataGapGrid readings={effectiveReadings} ghats={ghats} />

        {/* 7. Provisional / Unmonitored Sites */}
        <BlindSpotPanel
          sites={blindSpots}
          onAddSite={handleAddBlindSpot}
          onEditSite={handleEditBlindSpot}
          onRemoveSite={handleRemoveBlindSpot}
        />

        {/* 8. Check an entered reading (preview only, not saved) */}
        <NewReadingForm ghats={ghats} readings={effectiveReadings} />

        {/* 9. Bilingual Brief (English, Hindi, WhatsApp copy, Print / PDF) */}
        <BilingualBrief facts={briefFacts} />

        {/* 10. Trust & Technical Limits */}
        <TrustAndLimits stats={briefFacts.stats} />
      </main>

      <footer className="app-footer">
        <div className="wrap footer-content">
          <p>
            <strong>Visarjan Ghat Watch</strong> · Bhopal Municipal Corporation Decision Support System.
          </p>
          <p className="mute">
            Source Data: Madhya Pradesh Pollution Control Board (MPPCB) Idol Immersion Reports (2023–2025).
            Benchmark: CPCB Class B Criteria (Outdoor Bathing). All reports cited by year and page.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardApp />
    </AuthProvider>
  );
}
