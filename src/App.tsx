import { useMemo, useState } from 'react';
import { Wizard } from './components/Wizard';
import { FormRenderer } from './components/FormRenderer';
import { initialDraft } from './data/initialDraft';
import { exportDraftJson, importDraftJson } from './lib/export';
import { validateDraft } from './lib/claimEngine';
import { ClaimDraft } from './schema/types';

export default function App() {
  const [draft, setDraft] = useState<ClaimDraft>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [importError, setImportError] = useState('');

  const issues = useMemo(() => validateDraft(draft), [draft]);

  async function handleImport(file: File | null) {
    if (!file) return;
    try {
      const parsed = await importDraftJson(file);
      setDraft(parsed);
      setImportError('');
    } catch {
      setImportError('Could not import this JSON file. Check schema and try again.');
    }
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Privacy-first reimbursement intake</p>
          <h1>ClaimEase rebuild</h1>
          <p>
            Human-friendly wizard in the front, official insurer form at the back. No backend persistence, no server state, and structured QR on every rendered page.
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-btn" onClick={() => exportDraftJson(draft)}>Export JSON</button>
          <label className="ghost-btn file-btn">
            Import JSON
            <input type="file" accept="application/json" onChange={(event) => void handleImport(event.target.files?.[0] ?? null)} />
          </label>
          <button className="ghost-btn" onClick={() => window.print()}>Print rendered pages</button>
        </div>
      </header>

      {importError && <div className="error-banner">{importError}</div>}

      <main className="main-grid">
        <Wizard draft={draft} stepIndex={stepIndex} onStepChange={setStepIndex} onDraftChange={(updater) => setDraft((current) => updater(current))} />

        <section className="preview-column">
          <div className="panel">
            <div className="panel-head">
              <h3>Validation checks</h3>
              <span>{issues.length} issue(s)</span>
            </div>
            {issues.length === 0 ? (
              <div className="ok-box">No blocking issues found.</div>
            ) : (
              <ul className="clean-list compact">
                {issues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            )}
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Rendered official pages</h3>
              <span>Ready for calibration</span>
            </div>
            <FormRenderer draft={draft} />
          </div>
        </section>
      </main>
    </div>
  );
}
