
import React, { useState } from "react";
import Wizard from "./components/Wizard";
import FormRenderer from "./components/FormRenderer";
import "./styles.css";

export type BillRow = {
  id: string;
  billNo: string;
  date: string;
  issuedBy: string;
  towards: string;
  amount: string;
};

export type ClaimData = {
  relationship?: string;
  policyholderName?: string;
  patientName?: string;
  policyNumber?: string;
  tpaId?: string;
  policyholderDob?: string;
  patientDob?: string;
  gender?: string;
  occupation?: string;
  phone?: string;
  email?: string;

  currentOtherCover?: string;
  firstInsuranceStart?: string;
  currentOtherCompanyName?: string;
  currentOtherPolicyNo?: string;
  currentOtherSumInsured?: string;
  hospitalizedLastFourYears?: string;
  lastHospitalizationDate?: string;
  lastHospitalizationDiagnosis?: string;
  previousOtherCover?: string;
  previousOtherCompanyName?: string;

  sameAddress?: boolean | "No";
  policyholderAddress1?: string;
  policyholderCity?: string;
  policyholderState?: string;
  policyholderPin?: string;

  patientAddress1?: string;
  patientCity?: string;
  patientState?: string;
  patientPin?: string;

  hospitalizationReason?: "Illness" | "Injury" | "Maternity";
  diseaseOrInjuryDate?: string;
  admissionDate?: string;
  admissionTime?: string;
  dischargeDate?: string;
  dischargeTime?: string;
  hospitalName?: string;
  roomCategory?: string;
  systemOfMedicine?: string;

  injuryCause?: string;
  medicoLegal?: string;
  reportedToPolice?: string;
  firAttached?: string;

  hadPreExpenses?: string;
  preExpenses?: string;
  hadPostExpenses?: string;
  postExpenses?: string;
  hospitalExpenses?: string;
  healthCheckupCost?: string;
  ambulanceCharges?: string;
  othersClaimAmount?: string;
  othersClaimCode?: string;
  preHospitalizationDays?: string;
  postHospitalizationDays?: string;
  hadDomiciliary?: string;

  hasCashBenefits?: string;
  hospitalDailyCash?: string;
  surgicalCash?: string;
  criticalIllnessBenefit?: string;
  convalescence?: string;
  prePostLumpSum?: string;
  otherBenefit?: string;

  documents?: string[];
  billRows?: BillRow[];

  bankAccountNumber?: string;
  bankNameBranch?: string;
  ifsc?: string;
  chequePayableTo?: string;
  pan?: string;

  declarationPlace?: string;
};

type Page = "landing" | "wizard" | "review";

const STORAGE_FILE_NAME = "claimease-progress.json";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [claimData, setClaimData] = useState<ClaimData | null>(null);

  const handleExport = () => {
    if (!claimData) return;
    const blob = new Blob([JSON.stringify(claimData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = STORAGE_FILE_NAME;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setClaimData(parsed);
        setPage("wizard");
      } catch {
        alert("This JSON file could not be read.");
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => {
    window.print();
  };

  const showSaveAction = page !== "landing" && !!claimData;

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-title">ClaimEase</div>
            <div className="brand-subtitle">IRDAI claim form helper</div>
          </div>
        </div>

        <div className="topbar-actions">
          {page !== "landing" && (
            <button className="ghost-btn" onClick={() => setPage("landing")}>
              Home
            </button>
          )}

          {showSaveAction && (
            <button className="ghost-btn" onClick={handleExport}>
              Save and continue later
            </button>
          )}
        </div>
      </header>

      {page === "landing" && (
        <main className="landing">
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow">IRDAI reimbursement claim form</div>
              <h1>Fill the official claim form correctly, one question at a time.</h1>

              <p className="hero-text">
                ClaimEase guides the insured part of the reimbursement claim form in
                plain language, helps users keep the right papers ready, and prepares a
                cleaner print-ready Part A.
              </p>

              <div className="benefit-grid">
                <div className="benefit-card">
                  <h3>For users</h3>
                  <p>
                    Fewer confusing insurance terms, less guessing, and a calmer
                    way to complete a complex claim form.
                  </p>
                </div>
                <div className="benefit-card">
                  <h3>For insurers / TPAs</h3>
                  <p>
                    More structured claimant input and a QR-backed page summary
                    on the insured section.
                  </p>
                </div>
              </div>

              <div className="cta-row">
                <button className="primary-btn" onClick={() => setPage("wizard")}>
                  Start filling my claim form
                </button>

                <label className="secondary-btn">
                  Resume from saved file
                  <input
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImport(file);
                    }}
                  />
                </label>
              </div>

              <p className="privacy-line">
                Privacy-first: progress stays on your device unless you export it.
              </p>
            </div>
          </section>
        </main>
      )}

      {page === "wizard" && (
        <main className="main-stage">
          <Wizard
            initialData={claimData}
            onSave={(data: ClaimData) => setClaimData(data)}
            onComplete={(data: ClaimData) => {
              setClaimData(data);
              setPage("review");
            }}
          />
        </main>
      )}

      {page === "review" && claimData && (
        <main className="review-layout">
          <aside className="review-panel no-print">
            <div className="review-card">
              <div className="eyebrow">Review</div>
              <h2>Your claim is ready to preview</h2>
              <p className="muted">
                Part A is prefilled from your answers. Part B remains blank for the hospital.
              </p>

              <div className="review-actions">
                <button className="ghost-btn" onClick={() => setPage("wizard")}>
                  Edit answers
                </button>
                <button className="primary-btn" onClick={handlePrint}>
                  Print / Save as PDF
                </button>
              </div>

              <p className="review-note">
                For best output, use portrait orientation and default scale.
              </p>
            </div>
          </aside>

          <section className="preview-stage">
            <FormRenderer data={claimData} />
          </section>
        </main>
      )}
    </div>
  );
}
