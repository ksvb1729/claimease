
import React, { useState } from "react";
import Wizard from "./components/Wizard";
import FormRenderer from "./components/FormRenderer";
import UploadScreen from "./components/UploadScreen";
import ConfirmFields from "./components/ConfirmFields";
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
  wizardStepKey?: string;
  relationship?: string;
  policyholderName?: string;
  patientName?: string;
  policyNumber?: string;
  tpaId?: string;
  policyholderDob?: string;
  patientDob?: string;
  gender?: string;
  occupation?: string;
  occupationOther?: string;
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
  payeeType?: "Primary policyholder" | "Patient" | "Someone else";
  pan?: string;

  declarationPlace?: string;
  declarationDate?: string;
};

type Page = "landing" | "upload" | "confirm-fields" | "wizard" | "review";

const STORAGE_FILE_NAME = "claimease-progress.json";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<ClaimData> | null>(null);

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

  const handleExtracted = (data: Partial<ClaimData>) => {
    setExtractedData(data);
    setPage("confirm-fields");
  };

  const handleConfirm = (confirmed: Partial<ClaimData>) => {
    const merged: ClaimData = {
      sameAddress: true,
      hadPreExpenses: "No",
      hadPostExpenses: "No",
      hadDomiciliary: "No",
      hasCashBenefits: "No",
      currentOtherCover: "No",
      hospitalizedLastFourYears: "No",
      previousOtherCover: "No",
      healthCheckupCost: "0",
      ambulanceCharges: "0",
      othersClaimAmount: "0",
      preHospitalizationDays: "0",
      postHospitalizationDays: "0",
      payeeType: "Primary policyholder",
      ...confirmed,
    };
    setClaimData(merged);
    setPage("wizard");
  };

  const showSaveAction = page !== "landing" && page !== "upload" && !!claimData;

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
              <h1>Upload your hospital documents — we'll fill the form.</h1>

              <p className="hero-text">
                Just got discharged? Upload your Final Bill and Discharge Summary.
                Our AI reads them and pre-fills your IRDAI claim form automatically.
                You answer a few remaining questions, then print and submit.
              </p>

              <div className="benefit-grid">
                <div className="benefit-card">
                  <h3>For patients</h3>
                  <p>
                    From 40+ questions down to under 15. Upload your documents
                    and we handle the rest — no insurance jargon to decode.
                  </p>
                </div>
                <div className="benefit-card">
                  <h3>For insurers / TPAs</h3>
                  <p>
                    Structured data extracted directly from source documents means
                    fewer errors and faster claim processing.
                  </p>
                </div>
              </div>

              <div className="cta-row">
                <button className="primary-btn" onClick={() => setPage("upload")}>
                  Upload my documents →
                </button>
                <button className="ghost-btn" onClick={() => setPage("wizard")}>
                  Answer all questions manually
                </button>
              </div>

              <div className="cta-row" style={{ marginTop: 0 }}>
                <label className="ghost-btn" style={{ fontSize: 14 }}>
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
                Documents are processed for extraction only — never stored. Progress stays on your device.
              </p>
            </div>
          </section>
        </main>
      )}

      {page === "upload" && (
        <UploadScreen
          onExtracted={handleExtracted}
          onSkip={() => setPage("wizard")}
          onBack={() => setPage("landing")}
        />
      )}

      {page === "confirm-fields" && extractedData !== null && (
        <ConfirmFields
          extracted={extractedData}
          onConfirm={handleConfirm}
          onBack={() => setPage("upload")}
        />
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
