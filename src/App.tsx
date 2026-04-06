import { useRef, useState } from 'react';
import Wizard from './components/Wizard';
import FormRenderer from './components/FormRenderer';
import './styles.css';

export type YesNo = 'yes' | 'no' | '';

export type ClaimDraft = {
  meta: {
    schemaVersion: string;
    lastUpdatedAt: string;
  };
  primaryInsured: {
    fullName: string;
    policyNumber: string;
    certificateNumber: string;
    companyTpaId: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    email: string;
  };
  insuranceHistory: {
    coveredByOtherPolicy: YesNo;
    firstInsuranceStartDate: string;
    otherInsurerName: string;
    otherPolicyNumber: string;
    otherSumInsured: string;
    hospitalizedLast4Years: YesNo;
    lastHospitalizationMonthYear: string;
    lastHospitalizationDiagnosis: string;
    previouslyCovered: YesNo;
    previousInsurerName: string;
  };
  patient: {
    fullName: string;
    gender: 'male' | 'female' | '';
    dateOfBirth: string;
    relationship: string;
    occupation: string;
    addressSameAsPrimary: boolean;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    email: string;
  };
  hospitalization: {
    hospitalName: string;
    roomCategory: string;
    hospitalizationDueTo: 'injury' | 'illness' | 'maternity' | '';
    eventDate: string;
    admissionDate: string;
    admissionTime: string;
    dischargeDate: string;
    dischargeTime: string;
    injuryCause: string;
    medicoLegal: YesNo;
    policeReported: YesNo;
    firAttached: YesNo;
    systemOfMedicine: string;
    domiciliaryClaim: YesNo;
  };
  claim: {
    preHospitalization: string;
    hospitalization: string;
    postHospitalization: string;
    healthCheckup: string;
    ambulance: string;
    otherExpenseCode: string;
    otherExpenseAmount: string;
    preHospitalizationDays: string;
    postHospitalizationDays: string;
    hospitalDailyCash: string;
    surgicalCash: string;
    criticalIllness: string;
    convalescence: string;
    prePostLumpSum: string;
    otherBenefit: string;
    claimDocuments: string[];
    bills: Array<{
      billNo: string;
      date: string;
      issuedBy: string;
      towards: string;
      amount: string;
    }>;
  };
  bank: {
    pan: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    payeeName: string;
    ifsc: string;
  };
  declaration: {
    place: string;
    date: string;
  };
};

export const EMPTY_DRAFT: ClaimDraft = {
  meta: { schemaVersion: '1.1.0', lastUpdatedAt: new Date().toISOString() },
  primaryInsured: {
    fullName: '',
    policyNumber: '',
    certificateNumber: '',
    companyTpaId: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    email: '',
  },
  insuranceHistory: {
    coveredByOtherPolicy: '',
    firstInsuranceStartDate: '',
    otherInsurerName: '',
    otherPolicyNumber: '',
    otherSumInsured: '',
    hospitalizedLast4Years: '',
    lastHospitalizationMonthYear: '',
    lastHospitalizationDiagnosis: '',
    previouslyCovered: '',
    previousInsurerName: '',
  },
  patient: {
    fullName: '',
    gender: '',
    dateOfBirth: '',
    relationship: '',
    occupation: '',
    addressSameAsPrimary: true,
    address: '',
    city: '',
    state: '',
    pinCode: '',
    phone: '',
    email: '',
  },
  hospitalization: {
    hospitalName: '',
    roomCategory: '',
    hospitalizationDueTo: '',
    eventDate: '',
    admissionDate: '',
    admissionTime: '',
    dischargeDate: '',
    dischargeTime: '',
    injuryCause: '',
    medicoLegal: '',
    policeReported: '',
    firAttached: '',
    systemOfMedicine: '',
    domiciliaryClaim: '',
  },
  claim: {
    preHospitalization: '',
    hospitalization: '',
    postHospitalization: '',
    healthCheckup: '',
    ambulance: '',
    otherExpenseCode: '',
    otherExpenseAmount: '',
    preHospitalizationDays: '',
    postHospitalizationDays: '',
    hospitalDailyCash: '',
    surgicalCash: '',
    criticalIllness: '',
    convalescence: '',
    prePostLumpSum: '',
    otherBenefit: '',
    claimDocuments: [],
    bills: [{ billNo: '', date: '', issuedBy: '', towards: 'Hospital Main Bill', amount: '' }],
  },
  bank: {
    pan: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    payeeName: '',
    ifsc: '',
  },
  declaration: {
    place: '',
    date: '',
  },
};

function App() {
  const [screen, setScreen] = useState<'landing' | 'wizard' | 'review'>('landing');
  const [draft, setDraft] = useState<ClaimDraft>(EMPTY_DRAFT);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const exportJson = () => {
    const payload = {
      ...draft,
      meta: {
        ...draft.meta,
        lastUpdatedAt: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `claimease-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setDraft({ ...EMPTY_DRAFT, ...parsed, meta: { ...(parsed.meta || EMPTY_DRAFT.meta), lastUpdatedAt: new Date().toISOString() } });
        setScreen('wizard');
      } catch {
        alert('That file could not be imported. Please choose a ClaimEase JSON export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-shell">
      <input ref={fileInputRef} type="file" accept="application/json" onChange={onImportFile} hidden />

      {screen === 'landing' && (
        <main className="landing-shell">
          <header className="topbar">
            <div className="brand">ClaimEase</div>
            <div className="topbar-actions">
              <button className="ghost-btn" onClick={onImportClick}>Import JSON</button>
            </div>
          </header>

          <section className="hero-card">
            <div className="eyebrow">Reimbursement claims, made calmer</div>
            <h1>Fill the IRDAI claim form one clear question at a time.</h1>
            <p className="hero-copy">
              ClaimEase behaves like a helper, not a bulky form. It guides the user in plain language,
              reduces avoidable errors, and prepares a cleaner Part A for print or download.
            </p>
            <div className="cta-row">
              <button className="primary-btn" onClick={() => setScreen('wizard')}>Start claim</button>
              <button className="ghost-btn" onClick={onImportClick}>Resume from export</button>
            </div>
            <div className="benefit-grid">
              <article>
                <h3>For users</h3>
                <p>Less overwhelm, higher completion, and clearer guidance on what each field means.</p>
              </article>
              <article>
                <h3>For insurers</h3>
                <p>Cleaner, more structured input for Part A. Part B remains blank for hospital completion.</p>
              </article>
              <article>
                <h3>Privacy-first</h3>
                <p>No backend storage. Progress stays in the browser unless the user exports JSON.</p>
              </article>
            </div>
          </section>
        </main>
      )}

      {screen === 'wizard' && (
        <Wizard
          draft={draft}
          onChange={(next) => setDraft({ ...next, meta: { ...next.meta, lastUpdatedAt: new Date().toISOString() } })}
          onBackToHome={() => setScreen('landing')}
          onExport={exportJson}
          onReview={() => setScreen('review')}
        />
      )}

      {screen === 'review' && (
        <main className="review-shell">
          <header className="topbar compact">
            <div>
              <div className="brand">ClaimEase</div>
              <div className="subtle">Review your Part A output before print or download.</div>
            </div>
            <div className="topbar-actions">
              <button className="ghost-btn" onClick={() => setScreen('wizard')}>Back to wizard</button>
              <button className="ghost-btn" onClick={exportJson}>Export JSON</button>
              <button className="primary-btn" onClick={() => window.print()}>Print</button>
            </div>
          </header>
          <FormRenderer draft={draft} />
        </main>
      )}
    </div>
  );
}

export default App;
