import { useState } from 'react';
import { useLanguage } from '../i18n';

interface BlindSpotPanelProps {
  sites: string[];
  onAddSite: (site: string) => { success: boolean; error?: string };
  onEditSite: (oldSite: string, newSite: string) => { success: boolean; error?: string };
  onRemoveSite: (site: string) => void;
}

export function BlindSpotPanel({
  sites,
  onAddSite,
  onEditSite,
  onRemoveSite,
}: BlindSpotPanelProps) {
  const { t } = useLanguage();
  const [newSiteInput, setNewSiteInput] = useState('');
  const [editingSite, setEditingSite] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const result = onAddSite(newSiteInput);
    if (!result.success) {
      setFormError(result.error ?? 'Failed to add site.');
    } else {
      setNewSiteInput('');
    }
  };

  const startEdit = (site: string) => {
    setEditingSite(site);
    setEditInput(site);
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    setFormError(null);
    const result = onEditSite(editingSite, editInput);
    if (!result.success) {
      setFormError(result.error ?? 'Failed to update site.');
    } else {
      setEditingSite(null);
      setEditInput('');
    }
  };

  const cancelEdit = () => {
    setEditingSite(null);
    setEditInput('');
    setFormError(null);
  };

  return (
    <section className="blind-spot-section" aria-labelledby="blind-spot-heading">
      <div className="section-header-row">
        <div>
          <h2 id="blind-spot-heading">{t('blindSpot.heading')}</h2>
          <p className="mute">
            <strong>{t('blindSpot.subtitle')}</strong>
          </p>
        </div>
        <span className="unmonitored-badge">{t('blindSpot.zeroSamples')}</span>
      </div>

      <div className="card blind-spot-card">
        <div className="blind-spot-warning">
          ⚠️ {t('blindSpot.warning')}
        </div>

        {formError && (
          <div className="form-error-banner" role="alert">
            ❌ {formError}
          </div>
        )}

        <ul className="blind-spot-list" aria-label="List of provisional unmonitored sites">
          {sites.map(s => {
            const isEditing = editingSite === s;

            return (
              <li key={s} className="blind-spot-item">
                {isEditing ? (
                  <form onSubmit={handleSaveEdit} className="inline-edit-form">
                    <input
                      type="text"
                      className="form-input edit-input"
                      value={editInput}
                      onChange={e => setEditInput(e.target.value)}
                      aria-label="Edit site name"
                      required
                    />
                    <div className="btn-group">
                      <button type="submit" className="btn-small btn-save">
                        {t('blindSpot.btnSave')}
                      </button>
                      <button type="button" className="btn-small btn-cancel" onClick={cancelEdit}>
                        {t('blindSpot.btnCancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="site-row-display">
                    <div className="site-info">
                      <span className="site-name">📍 {s}</span>
                      <span className="site-status-tag">Untested (Zero Baseline)</span>
                    </div>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn-small btn-edit"
                        onClick={() => startEdit(s)}
                        aria-label={`Edit ${s}`}
                      >
                        ✏️ {t('blindSpot.btnEdit')}
                      </button>
                      <button
                        type="button"
                        className="btn-small btn-remove"
                        onClick={() => onRemoveSite(s)}
                        aria-label={`Remove ${s}`}
                      >
                        🗑️ {t('blindSpot.btnRemove')}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <form onSubmit={handleAdd} className="add-site-form" aria-label="Add a new provisional site">
          <label htmlFor="new-site-input" className="form-label">
            {t('blindSpot.addTitle')}:
          </label>
          <div className="add-input-row">
            <input
              id="new-site-input"
              type="text"
              className="form-input"
              placeholder={t('blindSpot.inputPlaceholder')}
              value={newSiteInput}
              onChange={e => setNewSiteInput(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              + {t('blindSpot.btnAdd')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
