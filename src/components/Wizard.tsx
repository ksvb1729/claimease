import React, { useEffect, useMemo, useState } from "react";
import type { BillRow, ClaimData } from "../App";

type WizardProps = {
  initialData: ClaimData | null;
  onSave: (data: ClaimData) => void;
  onComplete: (data: ClaimData) => void;
};

type StepDef = {
  key: string;
  title: string;
  helper?: string;
  section: string;
};

const STATE_OPTIONS = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi",
];

const documentChecklist = [
  "Claim form duly signed","Copy of claim intimation","Hospital main bill","Hospital break-up bill","Hospital bill payment receipt","Hospital discharge summary","Pharmacy bill","Operation Theatre notes","ECG","Doctor request for investigation","Investigation reports","Doctor prescriptions","Others",
];

const defaultBillRows = (): BillRow[] => [
  { id: "1", billNo: "", date: "", issuedBy: "", towards: "Hospital Main Bill", amount: "" },
  { id: "2", billNo: "", date: "", issuedBy: "", towards: "Pre-hospitalization Bills", amount: "" },
  { id: "3", billNo: "", date: "", issuedBy: "", towards: "Post-hospitalization Bills", amount: "" },
];

function deriveAgeParts(dob?: string) {
  if (!dob) return { years: "", months: "" };
  const birth = new Date(dob);
  const now = new Date();
  if (Number.isNaN(birth.getTime())) return { years: "", months: "" };
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: String(Math.max(0, years)), months: String(Math.max(0, months)) };
}

function buildSteps(data: ClaimData): StepDef[] {
  const steps: StepDef[] = [
    { key: "documents", title: "Keep these ready", helper: "Quick checklist before filling the form.", section: "Getting ready" },
    { key: "policyholderContext", title: "Now I’ll ask about the policyholder", helper: "Policyholder = primary insured person in the policy.", section: "Policyholder" },
    { key: "policyholderName", title: "Policyholder full name", section: "Policyholder" },
    { key: "policyNumber", title: "Policy number", section: "Policyholder" },
    { key: "tpaId", title: "TPA ID number", section: "Policyholder" },
    { key: "phone", title: "Policyholder phone", section: "Policyholder" },
    { key: "email", title: "Policyholder email", section: "Policyholder" },
    { key: "policyholderAddress1", title: "Policyholder address", section: "Policyholder" },
    { key: "policyholderCity", title: "Policyholder city", section: "Policyholder" },
    { key: "policyholderState", title: "Policyholder state", section: "Policyholder" },
    { key: "policyholderPin", title: "Policyholder PIN code", section: "Policyholder" },
    { key: "patientContext", title: "Now I’ll ask about the patient", helper: "Patient = person who was hospitalized.", section: "Patient" },
    { key: "relationship", title: "Patient relationship to policyholder", section: "Patient" },
    { key: "patientName", title: "Patient full name", section: "Patient" },
    { key: "gender", title: "Patient gender", section: "Patient" },
    { key: "patientDob", title: "Patient date of birth", section: "Patient" },
    { key: "occupation", title: "Patient occupation", section: "Patient" },
    { key: "sameAddress", title: "Is patient address same as policyholder?", section: "Patient" },
  ];

  if (data.sameAddress === "No") {
    steps.push(
      { key: "patientAddress1", title: "Patient address", section: "Patient" },
      { key: "patientCity", title: "Patient city", section: "Patient" },
      { key: "patientState", title: "Patient state", section: "Patient" },
      { key: "patientPin", title: "Patient PIN code", section: "Patient" },
    );
  }

  steps.push(
    { key: "currentOtherCover", title: "Any other current health insurance cover?", section: "Insurance history" },
    { key: "firstInsuranceStart", title: "First health insurance start date (without break)", section: "Insurance history" },
    { key: "hospitalizedLastFourYears", title: "Hospitalized in last 4 years?", section: "Insurance history" },
    { key: "previousOtherCover", title: "Previously covered by another insurer?", section: "Insurance history" },
  );

  if (data.currentOtherCover === "Yes") {
    steps.push(
      { key: "currentOtherCompanyName", title: "Current other insurer name", section: "Insurance history" },
      { key: "currentOtherPolicyNo", title: "Current other policy number", section: "Insurance history" },
      { key: "currentOtherSumInsured", title: "Current other sum insured", section: "Insurance history" },
    );
  }
  if (data.hospitalizedLastFourYears === "Yes") {
    steps.push(
      { key: "lastHospitalizationDate", title: "Last hospitalization date", section: "Insurance history" },
      { key: "lastHospitalizationDiagnosis", title: "Diagnosis in last hospitalization", section: "Insurance history" },
    );
  }
  if (data.previousOtherCover === "Yes") {
    steps.push({ key: "previousOtherCompanyName", title: "Previous insurer name", section: "Insurance history" });
  }

  steps.push(
    { key: "hospitalContext", title: "Now I’ll ask about the hospital stay", section: "Hospital stay" },
    { key: "hospitalizationReason", title: "Reason for hospitalization", section: "Hospital stay" },
    { key: "diseaseOrInjuryDate", title: "Date of illness/injury/delivery", section: "Hospital stay" },
    { key: "admissionDate", title: "Admission date", section: "Hospital stay" },
    { key: "admissionTime", title: "Admission time", section: "Hospital stay" },
    { key: "dischargeDate", title: "Discharge date", section: "Hospital stay" },
    { key: "dischargeTime", title: "Discharge time", section: "Hospital stay" },
    { key: "hospitalName", title: "Hospital name", section: "Hospital stay" },
    { key: "roomCategory", title: "Room category", section: "Hospital stay" },
    { key: "systemOfMedicine", title: "System of medicine", section: "Hospital stay" },
  );

  if (data.hospitalizationReason === "Injury") {
    steps.push(
      { key: "injuryCause", title: "Cause of injury", section: "Injury details" },
      { key: "medicoLegal", title: "Medico-legal case?", section: "Injury details" },
      { key: "reportedToPolice", title: "Reported to police?", section: "Injury details" },
      { key: "firAttached", title: "MLC/FIR attached?", section: "Injury details" },
    );
  }

  steps.push(
    { key: "hadPreExpenses", title: "Any expenses before admission?", helper: "Pre-hospitalization = doctor visit/tests/medicine before admission.", section: "Claim details" },
    { key: "hospitalExpenses", title: "Expenses during hospital stay", section: "Claim details" },
    { key: "hadPostExpenses", title: "Any expenses after discharge?", helper: "Post-hospitalization = follow-up consultations, tests, medicines after discharge.", section: "Claim details" },
    { key: "healthCheckupCost", title: "Health checkup amount", section: "Claim details" },
    { key: "ambulanceCharges", title: "Ambulance amount", section: "Claim details" },
    { key: "othersClaimAmount", title: "Other claim amount", section: "Claim details" },
    { key: "preHospitalizationDays", title: "Pre-hospitalization period (days)", section: "Claim details" },
    { key: "postHospitalizationDays", title: "Post-hospitalization period (days)", section: "Claim details" },
    { key: "hadDomiciliary", title: "Domiciliary hospitalization?", helper: "Domiciliary hospitalization = treatment taken at home that insurer recognizes as hospitalization.", section: "Claim details" },
    { key: "hasCashBenefits", title: "Any fixed cash benefits in policy?", helper: "Cash benefits are fixed payouts and are separate from reimbursement bills.", section: "Claim details" },
  );

  if (data.hadPreExpenses === "Yes") steps.push({ key: "preExpenses", title: "Pre-admission expense amount", section: "Claim details" });
  if (data.hadPostExpenses === "Yes") steps.push({ key: "postExpenses", title: "Post-discharge expense amount", section: "Claim details" });
  if (data.othersClaimAmount && data.othersClaimAmount !== "0") steps.push({ key: "othersClaimCode", title: "Others code", section: "Claim details" });
  if (data.hasCashBenefits === "Yes") {
    steps.push(
      { key: "hospitalDailyCash", title: "Hospital daily cash", section: "Claim details" },
      { key: "surgicalCash", title: "Surgical cash", section: "Claim details" },
      { key: "criticalIllnessBenefit", title: "Critical illness benefit", section: "Claim details" },
      { key: "convalescence", title: "Convalescence benefit", section: "Claim details" },
      { key: "prePostLumpSum", title: "Pre/post lump sum", section: "Claim details" },
      { key: "otherBenefit", title: "Other cash benefit", section: "Claim details" },
    );
  }

  steps.push(
    { key: "documentsReview", title: "Claim documents checklist", section: "Bills & docs" },
    { key: "billRows", title: "Bills enclosed table", section: "Bills & docs" },
    { key: "payeeType", title: "Who should receive the reimbursement?", section: "Bank details" },
    { key: "pan", title: "PAN", section: "Bank details" },
    { key: "bankAccountNumber", title: "Bank account number", section: "Bank details" },
    { key: "bankNameBranch", title: "Bank name and branch", section: "Bank details" },
    { key: "ifsc", title: "IFSC code", section: "Bank details" },
    { key: "chequePayableTo", title: "Cheque/DD payable to", section: "Bank details" },
    { key: "declarationPlace", title: "Declaration place", section: "Declaration" },
    { key: "declarationDate", title: "Declaration date", section: "Declaration" },
    { key: "review", title: "Review answers", section: "Review" },
  );

  return steps;
}

export default function Wizard({ initialData, onSave, onComplete }: WizardProps) {
  const [form, setForm] = useState<ClaimData>(
    initialData || {
      documents: [], billRows: defaultBillRows(), sameAddress: true,
      hadPreExpenses: "No", hadPostExpenses: "No", hadDomiciliary: "No", hasCashBenefits: "No",
      currentOtherCover: "No", hospitalizedLastFourYears: "No", previousOtherCover: "No",
      healthCheckupCost: "0", ambulanceCharges: "0", othersClaimAmount: "0", preHospitalizationDays: "0", postHospitalizationDays: "0", payeeType: "Primary policyholder",
    },
  );
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => buildSteps(form), [form]);
  const step = steps[stepIndex];

  useEffect(() => onSave(form), [form, onSave]);
  useEffect(() => {
    if (form.relationship === "Myself") {
      setForm((prev) => ({ ...prev, patientName: prev.patientName || prev.policyholderName, sameAddress: true }));
    }
  }, [form.relationship]);
  useEffect(() => {
    if (form.payeeType === "Primary policyholder" && form.policyholderName) setForm((p) => ({ ...p, chequePayableTo: p.chequePayableTo || p.policyholderName }));
    if (form.payeeType === "Patient" && form.patientName) setForm((p) => ({ ...p, chequePayableTo: p.chequePayableTo || p.patientName }));
  }, [form.payeeType, form.policyholderName, form.patientName]);

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const setValue = (key: keyof ClaimData, value: any) => setForm((prev) => ({ ...prev, [key]: value }));
  const next = () => step.key === "review" ? onComplete(form) : setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  const validationError = getStepValidation(step.key, form);

  return (
    <div className="wizard-shell">
      <div className="wizard-meta no-print"><div className="wizard-meta-row"><span className="wizard-section-label">{step.section}</span><span className="wizard-progress-label">{progress}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></div>
      <div className="question-card">
        {step.key !== "review" && <><div className="question-eyebrow">{step.section}</div><h1 className="question-title">{step.title}</h1>{step.helper && <p className="question-helper">{step.helper}</p>}</>}
        {renderStep(step, form, setValue)}
        {validationError && <p className="validation-text">{validationError}</p>}
        <div className="question-actions no-print">
          <button className="ghost-btn" onClick={back} disabled={stepIndex === 0}>Back</button>
          {(INTRO_STEPS.has(step.key) || !AUTO_NEXT.has(step.key)) && (
            <button className="primary-btn" onClick={next} disabled={Boolean(validationError)}>
              {step.key === "review" ? "Generate form" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * These narrative steps are pure "continue" checkpoints.
 * Keep Next visible even if AUTO_NEXT changes during future merges.
 */
const INTRO_STEPS = new Set(["policyholderContext", "patientContext", "hospitalContext"]);
const AUTO_NEXT = new Set<string>();

function renderStep(step: StepDef, form: ClaimData, setValue: (key: keyof ClaimData, value: any) => void) {
  if (["policyholderContext", "patientContext", "hospitalContext"].includes(step.key)) {
    return <div className="doc-row">Tap <strong>Next</strong> to continue.</div>;
  }
  if (step.key === "documents") {
    return <div className="document-list">{documentChecklist.map((doc) => <div className="doc-row" key={doc}><div className="doc-title">{doc}</div></div>)}</div>;
  }
  if (["relationship","gender","occupation","sameAddress","hospitalizationReason","injuryCause","payeeType"].includes(step.key)) {
    const options: Record<string, string[]> = {
      relationship: ["Myself","Father","Mother","Spouse","Child","Other"],
      gender: ["Male","Female","Other"],
      occupation: ["Service","Self Employed","Homemaker","Student","Retired","Other"],
      sameAddress: ["Yes","No"],
      hospitalizationReason: ["Illness","Injury","Maternity"],
      injuryCause: ["Road traffic accident","Self inflicted","Substance / alcohol related","Other injury"],
      payeeType: ["Primary policyholder","Patient","Someone else"],
    };
    const value = step.key === "sameAddress" ? (form.sameAddress === true ? "Yes" : "No") : String((form as any)[step.key] || "");
    return <ChoiceGrid options={options[step.key]} value={value} onChange={(v) => setValue(step.key as keyof ClaimData, step.key === "sameAddress" ? (v === "Yes" ? true : "No") : v)} />;
  }
  if (["currentOtherCover","hospitalizedLastFourYears","previousOtherCover","medicoLegal","reportedToPolice","firAttached","hadPreExpenses","hadPostExpenses","hadDomiciliary","hasCashBenefits"].includes(step.key)) {
    return <ChoiceGrid options={["Yes", "No"]} value={String((form as any)[step.key] || "")} onChange={(v) => setValue(step.key as keyof ClaimData, v)} />;
  }
  if (["policyholderState", "patientState"].includes(step.key)) {
    return <SelectInput value={String((form as any)[step.key] || "")} onChange={(v) => setValue(step.key as keyof ClaimData, v)} options={STATE_OPTIONS} />;
  }
  if (step.key === "roomCategory") {
    return <SelectInput value={form.roomCategory || ""} onChange={(v) => setValue("roomCategory", v)} options={["Day care", "Single occupancy", "Twin sharing", "3 or more beds"]} />;
  }
  if (step.key === "documentsReview") {
    return <div className="checkbox-list">{documentChecklist.map((item) => <label className="checkbox-row" key={item}><input type="checkbox" checked={(form.documents || []).includes(item)} onChange={() => {
      const docs = new Set(form.documents || []);
      if (docs.has(item)) docs.delete(item); else docs.add(item);
      setValue("documents", Array.from(docs));
    }} /><span>{item}</span></label>)}</div>;
  }
  if (step.key === "billRows") {
    return <BillEditor form={form} setValue={setValue} />;
  }
  if (step.key === "review") return <ReviewBlock form={form} age={deriveAgeParts(form.patientDob)} />;

  const type = ["patientDob","firstInsuranceStart","diseaseOrInjuryDate","admissionDate","dischargeDate","lastHospitalizationDate","declarationDate"].includes(step.key) ? "date" : ["admissionTime","dischargeTime"].includes(step.key) ? "time" : "text";
  return <TextInput value={String((form as any)[step.key] || "")} onChange={(v) => setValue(step.key as keyof ClaimData, v)} type={type} />;
}

function getStepValidation(key: string, form: ClaimData) {
  if (key === "policyholderPin" || key === "patientPin") {
    const value = String((form as any)[key] || "");
    if (value && !/^\d{6}$/.test(value)) return "PIN code should be 6 digits.";
  }
  if (key === "ifsc") {
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) return "IFSC should look like ABCD0123456.";
  }
  if (key === "dischargeDate" && form.admissionDate && form.dischargeDate && new Date(form.dischargeDate) < new Date(form.admissionDate)) return "Discharge date cannot be before admission date.";
  return "";
}

function ChoiceGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="choice-grid">{options.map((option) => <button key={option} type="button" className={`choice-pill ${value === option ? "selected" : ""}`} onClick={() => onChange(option)}>{option}</button>)}</div>;
}
function TextInput({ value, onChange, type = "text" }: { value: string; onChange: (value: string) => void; type?: string }) {
  return <input className="text-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />;
}
function SelectInput({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select className="text-input" value={value} onChange={(e) => onChange(e.target.value)}><option value="">Select</option>{options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>;
}

function BillEditor({ form, setValue }: { form: ClaimData; setValue: (key: keyof ClaimData, value: any) => void }) {
  const rows = form.billRows || [];
  const updateRow = (id: string, key: keyof BillRow, value: string) => setValue("billRows", rows.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const addRow = () => setValue("billRows", [...rows, { id: `${Date.now()}`, billNo: "", date: "", issuedBy: "", towards: "Other", amount: "" }]);
  return <div className="bill-editor">{rows.slice(0, 10).map((row, idx) => <div className="bill-card" key={row.id}><div className="bill-card-title">Row {idx + 1}</div><div className="bill-grid"><input className="text-input compact-input" placeholder="Bill No" value={row.billNo} onChange={(e) => updateRow(row.id, "billNo", e.target.value)} /><input className="text-input compact-input" type="date" value={row.date} onChange={(e) => updateRow(row.id, "date", e.target.value)} /><input className="text-input compact-input" placeholder="Issued by" value={row.issuedBy} onChange={(e) => updateRow(row.id, "issuedBy", e.target.value)} /><input className="text-input compact-input" placeholder="Towards" value={row.towards} onChange={(e) => updateRow(row.id, "towards", e.target.value)} /><input className="text-input compact-input" placeholder="Amount" value={row.amount} onChange={(e) => updateRow(row.id, "amount", e.target.value)} /></div></div>)}{rows.length < 10 && <button type="button" className="ghost-btn small-btn" onClick={addRow}>Add another bill row</button>}</div>;
}

function ReviewBlock({ form, age }: { form: ClaimData; age: { years: string; months: string } }) {
  return <div className="review-groups"><div className="review-group"><h3>Policyholder</h3><p><strong>Name:</strong> {form.policyholderName || "—"}</p><p><strong>Policy:</strong> {form.policyNumber || "—"}</p></div><div className="review-group"><h3>Patient</h3><p><strong>Name:</strong> {form.patientName || "—"}</p><p><strong>Relationship:</strong> {form.relationship || "—"}</p><p><strong>Age:</strong> {age.years || "0"}y {age.months || "0"}m</p></div><div className="review-group"><h3>Hospital stay</h3><p><strong>Hospital:</strong> {form.hospitalName || "—"}</p><p><strong>Admission:</strong> {form.admissionDate || "—"}</p><p><strong>Discharge:</strong> {form.dischargeDate || "—"}</p></div><div className="review-group"><h3>Bank details</h3><p><strong>Payee:</strong> {form.chequePayableTo || "—"}</p><p><strong>IFSC:</strong> {form.ifsc || "—"}</p></div></div>;
}
