import { useState } from 'react';
import type { BriefFacts } from '../../core/facts';
import {
  generateEnglishBrief,
  generateHindiBrief,
  generateWhatsAppSummary,
} from '../../core/briefText';
import { validateNumberLock } from '../../core/numberLock';

interface BilingualBriefProps {
  facts: BriefFacts;
}

export function BilingualBrief({ facts }: BilingualBriefProps) {
  const [activeLang, setActiveLang] = useState<'both' | 'en' | 'hi'>('both');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const englishText = generateEnglishBrief(facts);
  const hindiText = generateHindiBrief(facts);

  const lockCheckEn = validateNumberLock(englishText, facts);
  const lockCheckHi = validateNumberLock(hindiText, facts);
  const allLocked = lockCheckEn.valid && lockCheckHi.valid;

  const handleCopyWhatsApp = async () => {
    const summary = generateWhatsAppSummary(facts);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        // Fallback for environments where navigator.clipboard is unavailable
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopyFeedback('✅ WhatsApp summary copied to clipboard!');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch {
      setCopyFeedback('❌ Could not copy automatically. Please select text manually.');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="bilingual-brief-section" aria-labelledby="brief-heading">
      <div className="section-header-row">
        <div>
          <h2 id="brief-heading">Bilingual Operational Brief for Officers</h2>
          <p className="mute">
            Deterministic, LLM-free operational brief for Durga Visarjan 2026. Every figure is locked to verified facts.
          </p>
        </div>
        <div className="brief-actions-bar">
          <button type="button" className="btn-secondary" onClick={handleCopyWhatsApp}>
            📱 Copy WhatsApp Summary
          </button>
          <button type="button" className="btn-primary" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="copy-feedback-banner" role="status" aria-live="polite">
          {copyFeedback}
        </div>
      )}

      <div className="card brief-card printable-brief">
        <div className="brief-meta-row">
          <div className="lang-toggle-group" role="group" aria-label="Language display toggle">
            <button
              type="button"
              className={`toggle-tab ${activeLang === 'both' ? 'active' : ''}`}
              onClick={() => setActiveLang('both')}
            >
              Side-by-Side (Bilingual)
            </button>
            <button
              type="button"
              className={`toggle-tab ${activeLang === 'en' ? 'active' : ''}`}
              onClick={() => setActiveLang('en')}
            >
              English Only
            </button>
            <button
              type="button"
              className={`toggle-tab ${activeLang === 'hi' ? 'active' : ''}`}
              onClick={() => setActiveLang('hi')}
            >
              हिन्दी (Hindi) Only
            </button>
          </div>

          <div className="number-lock-status">
            {allLocked ? (
              <span className="lock-pill lock-verified" title="Every number matches verified dataset facts.">
                🔒 Number-Lock Verified
              </span>
            ) : (
              <span className="lock-pill lock-warning" title="Discrepancy detected in numbers.">
                ⚠️ Number Discrepancy
              </span>
            )}
          </div>
        </div>

        <div className={`briefs-columns-container view-${activeLang}`}>
          {(activeLang === 'both' || activeLang === 'en') && (
            <article className="brief-column en-column" aria-label="English Operational Brief">
              <div className="column-header">
                <h3>English Operational Brief</h3>
                <span className="doc-version-tag">Official BMC Brief · 20 Oct 2026</span>
              </div>
              <pre className="brief-pre-text">{englishText}</pre>
            </article>
          )}

          {(activeLang === 'both' || activeLang === 'hi') && (
            <article className="brief-column hi-column" aria-label="Hindi Operational Brief">
              <div className="column-header">
                <h3>हिन्दी कार्ययोजना संक्षिप्त विवरण</h3>
                <span className="hindi-review-pill">Draft: Hindi wording needs human review</span>
              </div>
              <pre className="brief-pre-text hindi-font">{hindiText}</pre>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
