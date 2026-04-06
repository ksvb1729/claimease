import { useMemo, useState } from 'react';
import { Wizard } from './components/Wizard';
import { FormRenderer } from './components/FormRenderer';
import { initialDraft } from './data/initialDraft';
import { exportDraftJson, importDraftJson } from './lib/export';
import { validateDraft } from './lib/claimEngine';
import { ClaimDraft } from './schema/types';

type ViewMode = 'landing' | 'wizard';

const benefits = [
  {
    title: 'For users',
    body: 'A calm helper asks only what matters, in plain language, so the reimbursement form feels manageable.',
  },
  {
    title: 'For insurers',
    body: 'Part A is rendered into the official layout with page-level QR data for faster machine readability.',
  },
  {
    title: 'For privacy',
    body: 'No backend, no database, no server-side save. Progress stays on the device unless the user exports JSON.',
  },
];

const checklist = [
  'Insurance policy or health card',
  'Hospital discharge summary',
  'Main bill and supporting bills',
  'Bank details and IFSC',
  'PAN and patient ID proof',
];

export default function App() {
  const [draft, setDraft] = useState<ClaimDraft>(initialDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [importError, setImportError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('landing');

  const issues = useMemo(() => validateDraft(draft), [draft]);

  async function handleImport(file: File | null) {
    if (!file) return;
    try {
      const parsed = await importDraftJson(file);
      setDraft(parsed);
      setImportError('');
      setViewMode('wizard');
    } catch {
      setImportError('Could not import this JSON file. Check schema and try again.');
    }
  }

  return (
    <div className="app-shell premium-shell">
      <header className="topbar">
        <button className="brand-lockup" onClick={() => setViewMode('landing')}>
          <span className="brand-mark">CE</span>
          <span>
            <strong>ClaimEase</strong>
            <small>IRDAI reimbursement helper</small>
          </span>
        </button>

        <div className="topbar-actions">
          <label className="ghost-btn file-btn compact-btn">
            Import JSON
            <input type="file" accept="application/json" onChange={(event) => void handleImport(event.target.files?.[0] ?? null)} />
          </label>
          <button className="ghost-btn compact-btn" onClick={() => exportDraftJson(draft)}>Export JSON</button>
          <button className="primary-btn compact-btn" onClick={() => setViewMode('wizard')}>
            {viewMode === 'landing' ? 'Start claim' : 'Continue claim'}
          </button>
        </div>
      </header>

      {importError && <div className="error-banner">{importError}</div>}

      {viewMode === 'landing' ? (
        <main className="landing-layout">
          <section className="landing-hero card-surface">
            <div className="hero-copy">
              <p className="eyebrow">Reimbursement made calmer</p>
              <h1>Fill a complex IRDAI health claim form without feeling lost.</h1>
              <p className="hero-summary">
                ClaimEase acts like a guided helper. It asks in simple language, maps answers into the official insurer format,
                and keeps everything client-side only.
              </p>

              <div className="hero-badges">
                <span>One step at a time</span>
                <span>No backend storage</span>
                <span>Official form output</span>
                <span>QR on Part A</span>
              </div>

              <div className="hero-actions-row">
                <button className="primary-btn" onClick={() => setViewMode('wizard')}>Start your claim</button>
                <button className="ghost-btn" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                  See output preview
                </button>
              </div>
            </div>

            <div className="hero-helper-card">
              <div className="helper-avatar">CB</div>
              <div>
                <p className="helper-label">Claim helper</p>
                <h3>I ask simple questions so you do not have to decode the form.</h3>
                <ul className="clean-list soft-list">
                  <li>Guides what to keep ready before starting</li>
                  <li>Catches basic mistakes like date mismatches</li>
                  <li>Reduces overwhelm by breaking the claim into clear steps</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="benefits-grid">
            {benefits.map((item) => (
              <article className="card-surface info-card" key={item.title}>
                <p className="card-kicker">Benefit</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </section>

          <section className="landing-split">
            <article className="card-surface">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Before starting</p>
                  <h2>Keep these handy</h2>
                </div>
                <span className="time-pill">15–20 min</span>
              </div>
              <ul className="clean-list checklist-grid">
                {checklist.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>

            <article className="card-surface">
              <div className="section-head">
                <div>
                  <p className="eyebrow">How it works</p>
                  <h2>Simple in front. Official in back.</h2>
                </div>
              </div>
              <div className="mini-flow">
                <div><strong>1</strong><span>Answer guided questions</span></div>
                <div><strong>2</strong><span>Review mistakes early</span></div>
                <div><strong>3</strong><span>Generate submission-ready Part A</span></div>
                <div><strong>4</strong><span>Keep Part B blank for hospital completion</span></div>
              </div>
            </article>
          </section>

          <section className="card-surface preview-section">
            <div className="section-head section-head-tight">
              <div>
                <p className="eyebrow">Preview</p>
                <h2>Official form rendering</h2>
                <p className="muted-text">
                  Part A is prefilled and includes QR. Part B remains blank for the hospital, exactly as required for this MVP.
                </p>
              </div>
            </div>
            <FormRenderer draft={draft} compact />
          </section>
        </main>
      ) : (
        <main className="workspace-layout">
          <section className="workspace-main">
            <Wizard
              draft={draft}
              stepIndex={stepIndex}
              onStepChange={setStepIndex}
              onDraftChange={(updater) => setDraft((current) => updater(current))}
            />
          </section>

          <aside className="workspace-side">
            <div className="panel card-surface">
              <div className="panel-head">
                <h3>Quick checks</h3>
                <span>{issues.length} issue(s)</span>
              </div>
              {issues.length === 0 ? (
                <div className="ok-box">Looks clean so far.</div>
              ) : (
                <ul className="clean-list compact">
                  {issues.map((issue) => <li key={issue}>{issue}</li>)}
                </ul>
              )}
            </div>

            <div className="panel card-surface helper-panel">
              <p className="eyebrow">MVP behavior</p>
              <h3>What gets generated</h3>
              <ul className="clean-list compact">
                <li>Part A is prefilled from the wizard.</li>
                <li>Part A includes a QR payload for machine readability.</li>
                <li>Part B stays blank because the hospital must complete it.</li>
                <li>Use Export JSON to save and resume later.</li>
              </ul>
            </div>

            <div className="panel card-surface">
              <div className="panel-head">
                <h3>Rendered output</h3>
                <button className="ghost-btn compact-btn" onClick={() => window.print()}>Print</button>
              </div>
              <FormRenderer draft={draft} />
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
