import { useState, useId } from 'react';
import type { AlertItem } from '../../alerts';

interface AlertsTabProps {
  alerts: AlertItem[];
}

export function AlertsTab({ alerts }: AlertsTabProps) {
  // Form state held in React state only
  const [phone, setPhone] = useState('+919876543210');
  const [consent, setConsent] = useState(true);
  const [prefTierA, setPrefTierA] = useState(true);
  const [prefExceeds, setPrefExceeds] = useState(true);
  const [prefGaps, setPrefGaps] = useState(true);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Simulated Alert feed items
  const [feedItems, setFeedItems] = useState<AlertItem[]>(alerts);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unique IDs for form controls
  const phoneInputId = useId();
  const consentCheckboxId = useId();
  const toggleTierAId = useId();
  const toggleExceedsId = useId();
  const toggleGapsId = useId();

  // E.164 validation: starts with +, followed by 7 to 15 digits
  const isE164Valid = /^\+[1-9]\d{7,14}$/.test(phone.trim());

  const handleSendTestAlert = () => {
    if (!isE164Valid) {
      setToastMessage('Please enter a valid E.164 WhatsApp number (+91XXXXXXXXXX) before testing.');
      return;
    }

    const testItem: AlertItem = {
      id: `alert-test-${Date.now()}`,
      date: 'Just Now',
      ghat: 'Prempura ghat',
      parameter: 'Dissolved oxygen',
      value: 'Simulated 3.8 mg/L',
      benchmark: 'CPCB Class B (≥ 5 mg/L)',
      message: 'Simulated test notification: field testing alert dispatched to officer emergency queue.',
      severity: 'info',
      sourceBadge: 'Simulated',
      citation: 'Test Trigger',
    };

    setFeedItems([testItem, ...feedItems]);
    setToastMessage('Simulated: no WhatsApp message was sent. Toast notification triggered.');

    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  return (
    <div className="officer-alerts-content" role="tabpanel" id="panel-alerts" aria-labelledby="tab-alerts">
      <div className="alerts-header-row">
        <div>
          <h3>Automated Alert Subscriptions &amp; Active Feed</h3>
          <p className="mute">
            Configure mobile threshold notifications and inspect automated priority alerts based on water quality triggers.
          </p>
        </div>
      </div>

      {/* Toast Announcement */}
      {toastMessage && (
        <div className="alert-toast-banner" role="status" aria-live="polite">
          🔔 {toastMessage}
        </div>
      )}

      <div className="alerts-layout-grid">
        {/* Left Column: Notification Preferences Form */}
        <section className="card pref-form-card" aria-labelledby="pref-heading">
          <h4 id="pref-heading">Officer Mobile Alert Preferences</h4>
          <p className="mute">
            Preferences stored in working memory only for this session.
          </p>

          <form onSubmit={e => e.preventDefault()} className="pref-form">
            <div className="form-field">
              <label htmlFor={phoneInputId} className="field-label">
                Officer WhatsApp Number (E.164 format):
              </label>
              <input
                id={phoneInputId}
                type="tel"
                className={`form-input ${phoneTouched && !isE164Valid ? 'input-error' : ''}`}
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  setPhoneTouched(true);
                }}
                placeholder="+919876543210"
                aria-invalid={phoneTouched && !isE164Valid}
                aria-describedby={phoneTouched && !isE164Valid ? 'phone-error' : undefined}
                required
              />
              {phoneTouched && !isE164Valid ? (
                <span id="phone-error" className="field-error-text" role="alert">
                  Invalid E.164 format. Example: +919876543210
                </span>
              ) : (
                <span className="field-help-text">Standard country code prefix required (e.g. +91).</span>
              )}
            </div>

            <div className="form-field checkbox-field">
              <input
                id={consentCheckboxId}
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="form-checkbox"
              />
              <label htmlFor={consentCheckboxId} className="checkbox-label">
                I consent to receive simulated automated water quality alerts on WhatsApp for municipal duty purposes.
              </label>
            </div>

            <fieldset className="toggles-fieldset">
              <legend className="fieldset-legend">Trigger Rules to Receive:</legend>

              <div className="toggle-row">
                <input
                  id={toggleTierAId}
                  type="checkbox"
                  checked={prefTierA}
                  onChange={e => setPrefTierA(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor={toggleTierAId} className="toggle-label">
                  <strong>Ghat moves into Tier A</strong> (Immediate high-priority triage)
                </label>
              </div>

              <div className="toggle-row">
                <input
                  id={toggleExceedsId}
                  type="checkbox"
                  checked={prefExceeds}
                  onChange={e => setPrefExceeds(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor={toggleExceedsId} className="toggle-label">
                  <strong>New reading outside Class B benchmark</strong> (Hypoxia / BOD spike)
                </label>
              </div>

              <div className="toggle-row">
                <input
                  id={toggleGapsId}
                  type="checkbox"
                  checked={prefGaps}
                  onChange={e => setPrefGaps(e.target.checked)}
                  className="form-checkbox"
                />
                <label htmlFor={toggleGapsId} className="toggle-label">
                  <strong>Data gap detected before visarjan</strong> (Unmonitored / missing table)
                </label>
              </div>
            </fieldset>

            <div className="pref-action-buttons">
              <button
                type="button"
                className="btn-primary btn-test-alert"
                onClick={handleSendTestAlert}
              >
                📲 Send test alert
              </button>
            </div>

            <div className="backend-disclaimer-note">
              <em>Note:</em> Real WhatsApp alerts need a backend and an approved WhatsApp Business account (planned).
            </div>
          </form>
        </section>

        {/* Right Column: Alert Feed */}
        <section className="card feed-section-card" aria-labelledby="feed-heading">
          <div className="feed-header-row">
            <h4 id="feed-heading">Active Incident &amp; Triage Feed ({feedItems.length} Triggers)</h4>
            <span className="live-feed-badge">Live Working State</span>
          </div>

          <div className="alert-items-list" role="feed" aria-label="Water quality alerts feed">
            {feedItems.map(item => (
              <article key={item.id} className={`alert-card severity-${item.severity}`}>
                <div className="alert-card-header">
                  <div className="alert-title-group">
                    <span className={`severity-tag sev-${item.severity}`}>
                      {item.severity.toUpperCase()}
                    </span>
                    <strong className="alert-ghat-name">{item.ghat}</strong>
                  </div>
                  <span className="alert-timestamp">{item.date}</span>
                </div>

                <p className="alert-body-text">{item.message}</p>

                <div className="alert-meta-grid">
                  <div className="meta-col">
                    <span className="m-title">Parameter:</span>
                    <span className="m-val">{item.parameter}</span>
                  </div>
                  <div className="meta-col">
                    <span className="m-title">Measured Value:</span>
                    <span className="m-val">{item.value}</span>
                  </div>
                  <div className="meta-col">
                    <span className="m-title">Benchmark Standard:</span>
                    <span className="m-val">{item.benchmark}</span>
                  </div>
                </div>

                <div className="alert-footer-line">
                  <span className={`provenance-chip ${item.sourceBadge.toLowerCase().replace(/[^a-z]/g, '-')}`}>
                    {item.sourceBadge}
                  </span>
                  {item.citation && <span className="citation-text">Ref: {item.citation}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
