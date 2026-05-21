
import React, { useState, useEffect } from "react";
import LZString from "lz-string";
import Wizard from "./components/Wizard";
import ClaimDataView from "./components/ClaimDataView";
import UploadScreen from "./components/UploadScreen";
import ConfirmFields from "./components/ConfirmFields";
import LoginScreen from "./components/LoginScreen";
import { fillClaimPdf, downloadPdf } from "./utils/fillClaimPdf";
import "./styles.css";
import claimFormPdfUrl from "./assets/Claim_Form.pdf?url";

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

  // From TPA card
  insurerName?: string;
  tpaName?: string;
  memberId?: string;
  sumInsured?: string;

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
  hospitalAddress?: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalRegNo?: string;
  hospitalPan?: string;
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
  signatureText?: string;
  signatureDataUrl?: string;

  // Part B — hospital / clinical (auto-extracted, verified by hospital)
  treatingDoctorName?: string;
  treatingDoctorQualification?: string;
  diagnosisText?: string;
  diagnosisIcdCode?: string;
  procedureName?: string;
  procedureIcdCode?: string;
  procedureDate?: string;
  isPreExistingCondition?: string;
};

type Page = "landing" | "login" | "upload" | "confirm-fields" | "form-peek" | "wizard" | "review";

const EXTRACTED_FIELD_LABELS: Partial<Record<keyof ClaimData, string>> = {
  patientName: "Patient name",
  gender: "Gender",
  patientDob: "Date of birth",
  hospitalName: "Hospital name",
  hospitalAddress: "Hospital address",
  hospitalPhone: "Hospital phone",
  hospitalEmail: "Hospital email",
  hospitalRegNo: "Hospital reg no",
  hospitalPan: "Hospital PAN",
  admissionDate: "Admission date",
  admissionTime: "Admission time",
  dischargeDate: "Discharge date",
  dischargeTime: "Discharge time",
  roomCategory: "Room category",
  systemOfMedicine: "System of medicine",
  hospitalizationReason: "Hospitalization reason",
  hospitalExpenses: "Hospital bill total",
  treatingDoctorName: "Treating doctor",
  treatingDoctorQualification: "Doctor qualification",
  diagnosisText: "Diagnosis",
  diagnosisIcdCode: "ICD-10 code",
  procedureName: "Procedure",
  procedureIcdCode: "Procedure code",
  procedureDate: "Procedure date",
  isPreExistingCondition: "Pre-existing?",
  insurerName: "Insurer",
  tpaName: "TPA",
  policyNumber: "Policy number",
  memberId: "Member ID",
  sumInsured: "Sum insured",
};

const STORAGE_FILE_NAME = "claimease-progress.json";

// Reverse-expand compact QR payload back to ClaimData keys
const QR_KEY_MAP: Record<string, keyof ClaimData> = {
  rel:"relationship", phn:"policyholderName", ptn:"patientName", pol:"policyNumber",
  tpa:"tpaId", ptd:"patientDob", gen:"gender", occ:"occupation", ph:"phone", em:"email",
  ins:"insurerName", tpn:"tpaName", mid:"memberId", si:"sumInsured",
  coc:"currentOtherCover", fis:"firstInsuranceStart", ccn:"currentOtherCompanyName",
  cpn:"currentOtherPolicyNo", csi:"currentOtherSumInsured",
  h4y:"hospitalizedLastFourYears", lhd:"lastHospitalizationDate",
  lhn:"lastHospitalizationDiagnosis", poc:"previousOtherCover", pon:"previousOtherCompanyName",
  sad:"sameAddress", pa1:"policyholderAddress1", pcy:"policyholderCity",
  pst:"policyholderState", ppn:"policyholderPin",
  aa1:"patientAddress1", acy:"patientCity", ast:"patientState", apn:"patientPin",
  hrs:"hospitalizationReason", did:"diseaseOrInjuryDate",
  adt:"admissionDate", atm:"admissionTime", ddt:"dischargeDate", dtm:"dischargeTime",
  hos:"hospitalName", had:"hospitalAddress", hph:"hospitalPhone",
  hem:"hospitalEmail", hrn:"hospitalRegNo", hpn:"hospitalPan",
  rmc:"roomCategory", som:"systemOfMedicine",
  inc:"injuryCause", mll:"medicoLegal", rtp:"reportedToPolice", fir:"firAttached",
  hpe:"hadPreExpenses", pre:"preExpenses", hpo:"hadPostExpenses", pos:"postExpenses",
  hex:"hospitalExpenses", hcu:"healthCheckupCost", amb:"ambulanceCharges",
  oca:"othersClaimAmount", phdys:"preHospitalizationDays", podys:"postHospitalizationDays",
  dom:"hadDomiciliary", hcb:"hasCashBenefits", hdc:"hospitalDailyCash",
  srg:"surgicalCash", cil:"criticalIllnessBenefit", cnv:"convalescence",
  tdn:"treatingDoctorName", tdq:"treatingDoctorQualification",
  dxt:"diagnosisText", dxi:"diagnosisIcdCode",
  prc:"procedureName", pri:"procedureIcdCode", prd:"procedureDate",
  pex:"isPreExistingCondition",
  ban:"bankAccountNumber", bnb:"bankNameBranch", ifs:"ifsc",
  cpy:"chequePayableTo", pyt:"payeeType", pan:"pan",
  dpl:"declarationPlace", dd:"declarationDate",
};

function expandCompact(compact: Record<string, unknown>): Partial<ClaimData> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(compact)) {
    const mapped = QR_KEY_MAP[k];
    if (mapped) out[mapped] = v;
  }
  if (compact.docs) out.documents = compact.docs;
  if (compact.bills) {
    out.billRows = (compact.bills as Array<Record<string, string>>).map((b, i) => ({
      id: String(i), billNo: b.n || "", date: b.d || "", issuedBy: b.b || "", towards: b.t || "", amount: b.a || "",
    }));
  }
  return out as Partial<ClaimData>;
}

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [claimData, setClaimData] = useState<ClaimData | null>(null);
  const [extractedData, setExtractedData] = useState<Partial<ClaimData> | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(() => sessionStorage.getItem("ce_auth"));
  const [pdfBusy, setPdfBusy] = useState(false);

  // Handle QR decode URL: /decode?d=<lz-compressed>
  useEffect(() => {
    if (window.location.pathname !== "/decode") return;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (!d) return;
    try {
      const json = LZString.decompressFromEncodedURIComponent(d);
      if (!json) return;
      const parsed = JSON.parse(json);
      const raw = parsed.data || parsed;
      const expanded = expandCompact(raw);
      const merged: ClaimData = {
        sameAddress: true, hadPreExpenses: "No", hadPostExpenses: "No",
        hadDomiciliary: "No", hasCashBenefits: "No", currentOtherCover: "No",
        hospitalizedLastFourYears: "No", previousOtherCover: "No",
        healthCheckupCost: "0", ambulanceCharges: "0", othersClaimAmount: "0",
        preHospitalizationDays: "0", postHospitalizationDays: "0",
        payeeType: "Primary policyholder",
        ...expanded,
      };
      setClaimData(merged);
      setPage("review");
      window.history.replaceState({}, "", "/");
    } catch { /* bad payload — just show landing */ }
  }, []);

  const handleDownloadPdf = async () => {
    if (!claimData || pdfBusy) return;
    setPdfBusy(true);
    try {
      const bytes = await fillClaimPdf(claimData);
      downloadPdf(bytes);
    } catch (e) {
      alert("Could not generate PDF. Please try again.");
      console.error(e);
    } finally {
      setPdfBusy(false);
    }
  };

  const handleLoginSuccess = (token: string) => {
    sessionStorage.setItem("ce_auth", token);
    setAuthToken(token);
    setPage("upload");
  };

  const handleUploadClick = () => {
    if (authToken) setPage("upload");
    else setPage("login");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ce_auth");
    setAuthToken(null);
    setClaimData(null);
    setExtractedData(null);
    setPage("landing");
  };

  const handleExport = () => {
    if (!claimData) return;
    const blob = new Blob([JSON.stringify(claimData, null, 2)], { type: "application/json" });
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
        alert("This file could not be read.");
      }
    };
    reader.readAsText(file);
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
    setPage("form-peek");
  };

  const showSaveAction = page !== "landing" && page !== "upload" && page !== "login" && page !== "form-peek" && !!claimData;

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand">
          <div className="brand-mark">CE</div>
          <div>
            <div className="brand-title">ClaimEase</div>
            <div className="brand-subtitle">IRDAI reimbursement, simplified</div>
          </div>
        </div>

        <div className="topbar-actions">
          {page !== "landing" && (
            <button className="ghost-btn" onClick={() => setPage("landing")}>Home</button>
          )}
          {showSaveAction && (
            <button className="ghost-btn" onClick={handleExport}>Save progress</button>
          )}
          {authToken && (
            <button className="ghost-btn" style={{ color: "var(--muted)", fontSize: 14 }} onClick={handleLogout}>
              Sign out
            </button>
          )}
        </div>
      </header>

      {page === "landing" && (
        <main className="landing">
          <section className="hero">
            <div className="hero-inner">
              <div className="hero-left">
                <p className="hero-eyebrow">For patients and families</p>
                <h1 className="hero-h1">
                  Your claim form,<br />filled in seconds.
                </h1>
                <p className="hero-sub">
                  Upload your hospital documents. We read them, extract the details, and fill your IRDAI reimbursement form automatically. Verify once and print.
                </p>

                <div className="hero-steps">
                  <div className="hero-step">
                    <span className="step-num">1</span>
                    <span>Upload Final Bill, Discharge Summary, TPA card</span>
                  </div>
                  <div className="hero-step">
                    <span className="step-num">2</span>
                    <span>AI reads and fills the form instantly</span>
                  </div>
                  <div className="hero-step">
                    <span className="step-num">3</span>
                    <span>Verify, fill the gaps, download and submit</span>
                  </div>
                </div>

                <div className="hero-ctas">
                  <button className="primary-btn hero-primary-btn" onClick={handleUploadClick}>
                    Upload documents
                  </button>
                </div>

                <div className="hero-secondary-links">
                  <a className="text-link" href={claimFormPdfUrl} download="IRDAI_Claim_Form.pdf">
                    Download the blank IRDAI form
                  </a>
                  <span className="link-divider">·</span>
                  <label className="text-link">
                    Resume saved progress
                    <input type="file" accept=".json,application/json" hidden
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImport(f); }} />
                  </label>
                </div>

                <p className="hero-privacy">
                  Documents are used only for extraction and never stored on any server.
                </p>
              </div>

              <div className="hero-right">
                <div className="hero-card-stack">
                  <div className="hero-stat-card">
                    <div className="stat-number">30+</div>
                    <div className="stat-label">fields filled automatically</div>
                  </div>
                  <div className="hero-stat-card">
                    <div className="stat-number">3 min</div>
                    <div className="stat-label">average time to complete</div>
                  </div>
                  <div className="hero-stat-card accent">
                    <div className="stat-number">Part A + B</div>
                    <div className="stat-label">both sections pre-filled from your documents</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {page === "login" && (
        <LoginScreen onSuccess={handleLoginSuccess} onBack={() => setPage("landing")} />
      )}

      {page === "upload" && (
        <UploadScreen
          authToken={authToken || ""}
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

      {page === "form-peek" && claimData && (
        <main className="review-layout">
          <aside className="review-panel no-print">
            <div className="review-card">
              <div className="eyebrow">Extraction complete</div>
              <div className="peek-stat">
                {Object.keys(extractedData || {}).filter(k => k in EXTRACTED_FIELD_LABELS).length}
              </div>
              <div className="peek-stat-sub">fields filled from your documents</div>

              {extractedData && (
                <div className="peek-filled-list">
                  {Object.keys(extractedData)
                    .filter(k => k in EXTRACTED_FIELD_LABELS)
                    .map(k => (
                      <span key={k} className="peek-field-chip">
                        {EXTRACTED_FIELD_LABELS[k as keyof ClaimData]}
                      </span>
                    ))}
                </div>
              )}

              <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
                Review the pre-filled values on the right, then answer the remaining questions.
              </p>

              <div className="review-actions">
                <button className="primary-btn" onClick={() => setPage("wizard")}>
                  Fill remaining details
                </button>
                <button className="ghost-btn" onClick={() => setPage("upload")}>Back to upload</button>
              </div>
            </div>
          </aside>

          <section className="preview-stage">
            <ClaimDataView data={claimData} />
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
              <div className="eyebrow">Ready to submit</div>
              <h2>Your claim form is ready</h2>
              <p className="muted">
                Verify the data on the right. Then download the filled PDF — print it, sign it, and submit to your insurer.
              </p>

              <div className="review-actions">
                <button className="primary-btn" onClick={handleDownloadPdf} disabled={pdfBusy}>
                  {pdfBusy ? "Generating PDF…" : "Download filled PDF"}
                </button>
                <button className="ghost-btn" onClick={() => setPage("wizard")}>
                  Edit answers
                </button>
              </div>

              <p className="review-note">
                The PDF is generated in your browser — your data never leaves your device. Part B (hospital section) is pre-filled from your documents for the doctor to verify and sign.
              </p>
            </div>
          </aside>

          <section className="preview-stage">
            <ClaimDataView data={claimData} />
          </section>
        </main>
      )}
    </div>
  );
}
