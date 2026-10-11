import { useState } from 'react';

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
          <h2 id="blind-spot-heading">Unmonitored / Provisional Immersion Sites</h2>
          <p className="mute">
            <strong>Provisional, editable operational list. Source: February 2026 press report. Confirm with BMC before use.</strong>
          </p>
        </div>
        <span className="unmonitored-badge">0 Historical MPPCB Samples</span>
      </div>

      <div className="card blind-spot-card">
        <div className="blind-spot-warning">
          ⚠️ <strong>Notice to BMC Officers:</strong> These sites are reported in press coverage following the NGT idol immersion restrictions.
          None of these sites have historical water quality records in the MPPCB 2023–2025 reports.
          <em>"No data" means conditions are completely unknown, never assumed clean or safe. Fresh pre-immersion sampling must precede operational use.</em>
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
                        Save
                      </button>
                      <button type="button" className="btn-small btn-cancel" onClick={cancelEdit}>
                        Cancel
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
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-small btn-remove"
                        onClick={() => onRemoveSite(s)}
                        aria-label={`Remove ${s}`}
                      >
                        🗑️ Remove
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
            Add Another Operational / Immersion Site:
          </label>
          <div className="add-input-row">
            <input
              id="new-site-input"
              type="text"
              className="form-input"
              placeholder="e.g. Kolar Dam temporary pit"
              value={newSiteInput}
              onChange={e => setNewSiteInput(e.target.value)}
            />
            <button type="submit" className="btn-primary">
              + Add Site
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
