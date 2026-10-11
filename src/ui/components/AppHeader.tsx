import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../auth';
import { useLanguage } from '../i18n';
import type { Stability, Tier } from '../../core/score';
import type { GhatProfile } from '../../core/insights';

interface AppHeaderProps {
  totalRows: number;
  ghatsCount: number;
  unmonitoredCount: number;
  stability?: Stability[];
  profiles?: Record<string, GhatProfile>;
  blindSpots?: string[];
}

interface GhatCoordinate {
  name: string;
  lat: number;
  lng: number;
  waterBody: string;
  isMonitored: boolean;
}

const MONITORED_COORDINATES: GhatCoordinate[] = [
  {
    name: 'Bairagarh (Sant Hirdaram) kund',
    lat: 23.2725,
    lng: 77.3375,
    waterBody: 'Upper Lake (Bada Talab)',
    isMonitored: true,
  },
  {
    name: 'Hathaikheda dam / kund',
    lat: 23.2530,
    lng: 77.4930,
    waterBody: 'Hathaikheda Dam',
    isMonitored: true,
  },
  {
    name: 'Khatlapura ghat',
    lat: 23.2435,
    lng: 77.4135,
    waterBody: 'Lower Lake (Chhota Talab)',
    isMonitored: true,
  },
  {
    name: 'Malikhedi kund',
    lat: 23.2410,
    lng: 77.4710,
    waterBody: 'Malikhedi Kund',
    isMonitored: true,
  },
  {
    name: 'Prempura ghat',
    lat: 23.2270,
    lng: 77.3750,
    waterBody: 'Upper Lake (Bada Talab)',
    isMonitored: true,
  },
  {
    name: 'Rani Kamlapati ghat / Kamla Park kund',
    lat: 23.2490,
    lng: 77.3970,
    waterBody: 'Upper Lake (Bada Talab)',
    isMonitored: true,
  },
  {
    name: 'Shahpura lake ghat',
    lat: 23.2110,
    lng: 77.4280,
    waterBody: 'Shahpura Lake',
    isMonitored: true,
  },
];

const UNMONITORED_COORDINATES: GhatCoordinate[] = [
  { name: 'Arch Bridge ghat', lat: 23.2530, lng: 77.3990, waterBody: 'Upper Lake VIP Road', isMonitored: false },
  { name: 'Barkatullah University campus ghat', lat: 23.1990, lng: 77.4480, waterBody: 'BU Lake', isMonitored: false },
  { name: 'Sanjeev Nagar ghat', lat: 23.2920, lng: 77.3940, waterBody: 'Sanjeev Nagar Pond', isMonitored: false },
  { name: 'Neelbagh ghat', lat: 23.2040, lng: 77.3520, waterBody: 'Neelbad Reservoir Area', isMonitored: false },
  { name: 'Malikhadi', lat: 23.2390, lng: 77.4690, waterBody: 'Malikhadi Drainage Channel', isMonitored: false },
];

export function AppHeader({
  totalRows,
  ghatsCount,
  unmonitoredCount,
  stability = [],
  profiles = {},
  blindSpots = [],
}: AppHeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const { user, login, logout } = useAuth();

  // 1. Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // 2. Login modal state & accessibility refs
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // 3. Leaflet map state & refs
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Map tier lookup
  const tierMap = useMemo(() => {
    const map = new Map<string, { tier: Tier; score: number | null }>();
    for (const s of stability) {
      map.set(s.ghat, { tier: s.tier, score: s.score });
    }
    return map;
  }, [stability]);

  // Combined site list for search
  const allSites = useMemo(() => {
    return [...MONITORED_COORDINATES, ...UNMONITORED_COORDINATES];
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return allSites.filter(
      s => s.name.toLowerCase().includes(q) || s.waterBody.toLowerCase().includes(q),
    );
  }, [searchQuery, allSites]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Bhopal lakes
    const map = L.map(mapContainerRef.current, {
      center: [23.245, 77.415],
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    // Controlled scroll wheel zoom to avoid page hijacking
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    const container = mapContainerRef.current;
    const handleMouseLeave = () => map.scrollWheelZoom.disable();
    container?.addEventListener('mouseleave', handleMouseLeave);

    mapInstanceRef.current = map;

    return () => {
      container?.removeEventListener('mouseleave', handleMouseLeave);
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Window resize & layout change listener
  useEffect(() => {
    const handleResize = () => {
      mapInstanceRef.current?.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fullscreen toggle size invalidation
  useEffect(() => {
    const timeout = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  // Esc key exits fullscreen map
  useEffect(() => {
    if (!isFullscreen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  // Update markers when stability/profiles/language change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    for (const marker of markersRef.current.values()) {
      marker.remove();
    }
    markersRef.current.clear();

    const createCustomDivIcon = (tierType: 'a' | 'b' | 'c' | 'unmonitored', badgeChar: string) => {
      return L.divIcon({
        className: 'leaflet-div-marker-wrapper',
        html: `<div class="ghat-pin-badge pin-${tierType}"><span>${badgeChar}</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -32],
      });
    };

    // 1. Add 7 Monitored Ghat Pins
    for (const loc of MONITORED_COORDINATES) {
      const stab = tierMap.get(loc.name);
      const tier = stab?.tier ?? 'B';
      const score = stab?.score;
      const prof = profiles[loc.name];

      const icon = createCustomDivIcon(tier.toLowerCase() as 'a' | 'b' | 'c', tier);
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);

      // Create DOM-based popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'bhopal-map-popup';

      const tierBadge = document.createElement('span');
      tierBadge.className = `popup-badge badge-tier-${tier.toLowerCase()}`;
      tierBadge.textContent = `Tier ${tier} · ${
        tier === 'A' ? t('card.actFirst') : tier === 'B' ? t('card.closeGroup') : t('card.lowestConcern')
      }`;
      popupDiv.appendChild(tierBadge);

      const title = document.createElement('h4');
      title.className = 'popup-title';
      title.textContent = loc.name;
      popupDiv.appendChild(title);

      const water = document.createElement('div');
      water.className = 'popup-sub';
      water.textContent = `Water body: ${prof?.waterBody || loc.waterBody}`;
      popupDiv.appendChild(water);

      const scoreRow = document.createElement('div');
      scoreRow.className = 'popup-score-row';
      scoreRow.innerHTML = `${t('card.riskScore')}: <strong>${score != null ? score.toFixed(2) : 'N/A'}</strong>`;
      popupDiv.appendChild(scoreRow);

      const jumpBtn = document.createElement('button');
      jumpBtn.type = 'button';
      jumpBtn.className = 'btn-popup-jump';
      jumpBtn.textContent = t('hero.popupJump');
      jumpBtn.onclick = () => {
        const el = document.getElementById(`ghat-title-${loc.name}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };
      popupDiv.appendChild(jumpBtn);

      marker.bindPopup(popupDiv);
      markersRef.current.set(loc.name, marker);
    }

    // 2. Add Unmonitored Provisional Pins
    for (const unmon of UNMONITORED_COORDINATES) {
      const icon = createCustomDivIcon('unmonitored', '?');
      const marker = L.marker([unmon.lat, unmon.lng], { icon }).addTo(map);

      const popupDiv = document.createElement('div');
      popupDiv.className = 'bhopal-map-popup';

      const unBadge = document.createElement('span');
      unBadge.className = 'popup-badge badge-unmonitored';
      unBadge.textContent = t('hero.legendUnmonitored');
      popupDiv.appendChild(unBadge);

      const title = document.createElement('h4');
      title.className = 'popup-title';
      title.textContent = unmon.name;
      popupDiv.appendChild(title);

      const water = document.createElement('div');
      water.className = 'popup-sub';
      water.textContent = `Location: ${unmon.waterBody}`;
      popupDiv.appendChild(water);

      const desc = document.createElement('p');
      desc.className = 'popup-desc';
      desc.textContent = t('hero.popupUnmonitoredDesc');
      popupDiv.appendChild(desc);

      marker.bindPopup(popupDiv);
      markersRef.current.set(unmon.name, marker);
    }
  }, [tierMap, profiles, lang, t]);

  // Navigate to site on map and scroll
  const handleSelectSite = (site: GhatCoordinate) => {
    setSearchQuery(site.name);
    setIsSearchFocused(false);

    const map = mapInstanceRef.current;
    if (map) {
      map.setView([site.lat, site.lng], 14, { animate: true });
      const marker = markersRef.current.get(site.name);
      if (marker) {
        marker.openPopup();
      }
    }

    // Smooth scroll down to monitored ghat card or blind spots panel
    if (site.isMonitored) {
      const el = document.getElementById(`ghat-title-${site.name}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      const blindSection = document.getElementById('blind-spot-heading');
      if (blindSection) {
        blindSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Login Modal Focus Trap & Esc Handling
  useEffect(() => {
    if (!isLoginOpen) return;

    emailInputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoginOpen]);

  const closeModal = () => {
    setIsLoginOpen(false);
    setLoginError(null);
    setTimeout(() => {
      loginBtnRef.current?.focus();
    }, 0);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const success = login(email, password);
    if (success) {
      closeModal();
      window.location.hash = '#/officer';
    } else {
      setLoginError(t('officer.invalidCreds'));
    }
  };

  return (
    <header className="hero-section" id="hero-map" aria-label="Visarjan Ghat Watch Hero">
      {/* 1. TOP BAR */}
      <div className="hero-top-bar" role="navigation" aria-label="Primary Navigation">
        <div className="brand-group">
          <span className="brand-emblem" aria-hidden="true">{t('brand.emblem')}</span>
          <span className="brand-title">{t('brand.title')}</span>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="topbar-search-input"
              placeholder={t('nav.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              aria-label={t('nav.searchAria')}
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label={t('nav.clearSearch')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && (
            <ul className="search-dropdown" role="listbox" aria-label="Search suggestions">
              {searchResults.length > 0 ? (
                searchResults.map(site => {
                  const stab = tierMap.get(site.name);
                  return (
                    <li
                      key={site.name}
                      role="option"
                      aria-selected="false"
                      className="search-result-item"
                      onMouseDown={() => handleSelectSite(site)}
                    >
                      <div className="result-name-row">
                        <span className="result-name">{site.name}</span>
                        {site.isMonitored ? (
                          <span className={`result-tier-pill tier-${stab?.tier || 'b'}`}>
                            Tier {stab?.tier || 'B'}
                          </span>
                        ) : (
                          <span className="result-tier-pill tier-unmonitored">{t('hero.legendUnmonitored')}</span>
                        )}
                      </div>
                      <span className="result-waterbody">{site.waterBody}</span>
                    </li>
                  );
                })
              ) : (
                <li className="search-no-match">{t('nav.noMatch')}</li>
              )}
            </ul>
          )}
        </div>

        <div className="topbar-actions">
          {/* Language Switcher */}
          <div className="lang-switcher-group">
            <div className="lang-segmented-control" role="group" aria-label={t('nav.langAria')}>
              <button
                type="button"
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                aria-pressed={lang === 'en'}
                onClick={() => setLang('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                aria-pressed={lang === 'hi'}
                onClick={() => setLang('hi')}
              >
                हिं
              </button>
            </div>
            {lang === 'hi' && (
              <span className="hindi-draft-pill">{t('lang.hindiDraftNotice')}</span>
            )}
          </div>

          {/* Account Menu or Login Trigger */}
          {user ? (
            <div className="officer-account-group">
              <a href="#/officer" className="btn-officer-area" aria-label={t('nav.officerArea')}>
                {t('nav.officerArea')}
              </a>
              <button
                type="button"
                className="btn-officer-logout"
                onClick={logout}
                aria-label={t('nav.signOut')}
              >
                {t('nav.signOut')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              ref={loginBtnRef}
              className="btn-login-trigger"
              onClick={() => {
                setEmail('');
                setPassword('');
                setLoginError(null);
                setIsLoginOpen(true);
              }}
              aria-haspopup="dialog"
              aria-expanded={isLoginOpen}
            >
              {t('nav.login')}
            </button>
          )}
        </div>
      </div>

      {/* 2 & 3. HERO CONTENT GRID: BIGGER MAP (65%) + EXECUTIVE OVERVIEW (35%) */}
      <div className="hero-main-grid">
        {/* PART 2: BIGGER MAP OF BHOPAL */}
        <section className={`hero-map-panel ${isFullscreen ? 'fullscreen-active' : ''}`} aria-labelledby="map-heading">
          <div className="map-panel-header">
            <div className="map-title-row">
              <h2 id="map-heading" className="panel-title">
                {t('hero.mapHeading')}
              </h2>
              <span className="map-live-tag">{t('hero.mapLiveTag')}</span>
            </div>

            <button
              type="button"
              className="btn-fullscreen-map"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-pressed={isFullscreen}
              aria-label={isFullscreen ? t('hero.exitFullscreen') : t('hero.fullscreenMap')}
            >
              {isFullscreen ? `✕ ${t('hero.exitFullscreen')}` : `⛶ ${t('hero.fullscreenMap')}`}
            </button>
          </div>

          <div
            ref={mapContainerRef}
            className="bhopal-leaflet-container"
            tabIndex={0}
            role="region"
            aria-label="Interactive Leaflet Map of Bhopal"
          />

          {isFullscreen && (
            <div className="map-legend-row" role="region" aria-label="Map color legend">
              <span className="legend-title">{t('hero.mapLegend')}</span>
              <div className="legend-chip chip-a">
                <span className="pin-sample pin-sample-a">A</span>
                <span>{t('hero.legendTierA')}</span>
              </div>
              <div className="legend-chip chip-b">
                <span className="pin-sample pin-sample-b">B</span>
                <span>{t('hero.legendTierB')}</span>
              </div>
              <div className="legend-chip chip-c">
                <span className="pin-sample pin-sample-c">C</span>
                <span>{t('hero.legendTierC')}</span>
              </div>
              <div className="legend-chip chip-u">
                <span className="pin-sample pin-sample-u">?</span>
                <span>{t('hero.legendUnmonitored')}</span>
              </div>
            </div>
          )}
        </section>

        {/* PART 3: HERO EXECUTIVE CONTEXT & METRICS */}
        <section className="hero-context-panel" aria-labelledby="hero-title">
          <div className="badge-row">
            <span className="gov-tag">{t('hero.govTag')}</span>
            <span className="date-tag">{t('hero.targetDate')}</span>
          </div>

          <h1 id="hero-title">{t('hero.title')}</h1>

          <p className="subtitle">
            {t('hero.subtitle', { ghatsCount, unmonitoredCount })}
          </p>

          <div className="purpose-box">
            <p>{t('hero.purpose')}</p>
          </div>

          <div className="stat-pills" role="region" aria-label="Dataset Summary">
            <div className="stat-pill">
              <span className="stat-val">{ghatsCount}</span>
              <span className="stat-lbl">{t('hero.statMonitored')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-val">{unmonitoredCount}</span>
              <span className="stat-lbl">{t('hero.statUnmonitored')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-val">{totalRows}</span>
              <span className="stat-lbl">{t('hero.statRecords')}</span>
            </div>
            <div className="stat-pill">
              <span className="stat-val">CPCB Class B</span>
              <span className="stat-lbl">{t('hero.statBenchmark')}</span>
            </div>
          </div>

          {/* Legend in the Info Panel on the right */}
          <div className="map-legend-row hero-info-legend" role="region" aria-label="Map color legend">
            <span className="legend-title">{t('hero.mapLegend')}</span>
            <div className="legend-chip chip-a">
              <span className="pin-sample pin-sample-a">A</span>
              <span>{t('hero.legendTierA')}</span>
            </div>
            <div className="legend-chip chip-b">
              <span className="pin-sample pin-sample-b">B</span>
              <span>{t('hero.legendTierB')}</span>
            </div>
            <div className="legend-chip chip-c">
              <span className="pin-sample pin-sample-c">C</span>
              <span>{t('hero.legendTierC')}</span>
            </div>
            <div className="legend-chip chip-u">
              <span className="pin-sample pin-sample-u">?</span>
              <span>{t('hero.legendUnmonitored')}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Accessible Login Modal */}
      {isLoginOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div
            ref={modalRef}
            className="login-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-dialog-title"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="login-dialog-title" className="modal-title">
                {t('officer.loginTitle')}
              </h2>
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeModal}
                aria-label={t('officer.cancelBtn')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-notice-banner" role="status">
                ℹ️ <strong>{t('officer.demoNotice')}</strong>
                <div className="demo-credentials-hint">{t('officer.demoHint')}</div>
              </div>

              {loginError && (
                <div className="form-error-banner" role="alert" aria-live="assertive">
                  ❌ {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="login-modal-form">
                <div className="form-field">
                  <label htmlFor="officer-email" className="field-label">
                    {t('officer.emailLabel')}
                  </label>
                  <input
                    ref={emailInputRef}
                    id="officer-email"
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="test@gmail.com"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="officer-password" className="field-label">
                    {t('officer.passwordLabel')}
                  </label>
                  <input
                    id="officer-password"
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    {t('officer.cancelBtn')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('officer.signInBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
