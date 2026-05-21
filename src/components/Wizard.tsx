import React, { useEffect, useState } from "react";
import type { BillRow, ClaimData } from "../App";

type WizardProps = {
  initialData: ClaimData | null;
  onSave: (data: ClaimData) => void;
  onComplete: (data: ClaimData) => void;
};

const STATE_OPTIONS = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi"];

const DOCS = ["Claim form duly signed","Copy of claim intimation","Hospital main bill","Hospital break-up bill","Hospital bill payment receipt","Hospital discharge summary","Pharmacy bill","Operation Theatre notes","ECG","Doctor request for investigation","Investigation reports","Doctor prescriptions","Others"];

type FieldDef = {
  key: keyof ClaimData;
  label: string;
  type: "text" | "date" | "time" | "chips" | "yn" | "select";
  options?: string[];
  required?: boolean;
  span?: "full" | "half";
  condition?: (d: ClaimData) => boolean;
};

type SectionDef = {
  key: string;
  title: string;
  sub: string;
  fields?: FieldDef[];
  custom?: "docs-bills";
};

const SECTIONS: SectionDef[] = [
  {
    key: "policyholder", title: "Policy & contact details", sub: "Fill exactly as on your policy document",
    fields: [
      { key: "policyholderName", label: "Policyholder full name", type: "text", required: true, span: "full" },
      { key: "policyNumber", label: "Policy number", type: "text", required: true, span: "half" },
      { key: "tpaId", label: "TPA ID (if any)", type: "text", span: "half" },
      { key: "phone", label: "Phone", type: "text", span: "half" },
      { key: "email", label: "Email", type: "text", span: "half" },
      { key: "firstInsuranceStart", label: "Health insurance start date", type: "date", span: "half" },
      { key: "policyholderAddress1", label: "Address", type: "text", span: "full" },
      { key: "policyholderCity", label: "City", type: "text", span: "half" },
      { key: "policyholderState", label: "State", type: "select", options: STATE_OPTIONS, span: "half" },
      { key: "policyholderPin", label: "PIN code", type: "text", span: "half" },
    ],
  },
  {
    key: "patient", title: "About the patient", sub: "Person who was hospitalized",
    fields: [
      { key: "relationship", label: "Relationship to policyholder", type: "chips", options: ["Myself","Father","Mother","Spouse","Child","Other"], span: "full" },
      { key: "patientName", label: "Full name", type: "text", required: true, span: "full" },
      { key: "gender", label: "Gender", type: "chips", options: ["Male","Female","Other"], span: "half" },
      { key: "patientDob", label: "Date of birth", type: "date", span: "half" },
      { key: "occupation", label: "Occupation", type: "select", options: ["Service","Self Employed","Homemaker","Student","Retired","Other"], span: "half" },
      { key: "sameAddress", label: "Address same as policyholder?", type: "yn", span: "half" },
      { key: "patientAddress1", label: "Patient address", type: "text", span: "full", condition: (d) => d.sameAddress === "No" },
      { key: "patientCity", label: "City", type: "text", span: "half", condition: (d) => d.sameAddress === "No" },
      { key: "patientState", label: "State", type: "select", options: STATE_OPTIONS, span: "half", condition: (d) => d.sameAddress === "No" },
      { key: "patientPin", label: "PIN code", type: "text", span: "half", condition: (d) => d.sameAddress === "No" },
    ],
  },
  {
    key: "insurance", title: "Insurance history", sub: "Keep your policy document handy",
    fields: [
      { key: "currentOtherCover", label: "Currently covered by another insurer?", type: "yn", span: "half" },
      { key: "hospitalizedLastFourYears", label: "Hospitalized in last 4 years?", type: "yn", span: "half" },
      { key: "previousOtherCover", label: "Previously covered by another insurer?", type: "yn", span: "full" },
      { key: "currentOtherCompanyName", label: "Other insurer name", type: "text", span: "half", condition: (d) => d.currentOtherCover === "Yes" },
      { key: "currentOtherPolicyNo", label: "Other policy number", type: "text", span: "half", condition: (d) => d.currentOtherCover === "Yes" },
      { key: "currentOtherSumInsured", label: "Other sum insured (₹)", type: "text", span: "half", condition: (d) => d.currentOtherCover === "Yes" },
      { key: "lastHospitalizationDate", label: "Last hospitalization date", type: "date", span: "half", condition: (d) => d.hospitalizedLastFourYears === "Yes" },
      { key: "lastHospitalizationDiagnosis", label: "Diagnosis", type: "text", span: "full", condition: (d) => d.hospitalizedLastFourYears === "Yes" },
      { key: "previousOtherCompanyName", label: "Previous insurer name", type: "text", span: "half", condition: (d) => d.previousOtherCover === "Yes" },
    ],
  },
  {
    key: "hospital", title: "Hospital stay", sub: "Most fields below are pre-filled from your documents — verify and adjust if needed",
    fields: [
      { key: "hospitalizationReason", label: "Reason for hospitalization", type: "chips", options: ["Illness","Injury","Maternity"], span: "full" },
      { key: "diseaseOrInjuryDate", label: "Date illness / injury started", type: "date", span: "half" },
      { key: "hospitalName", label: "Hospital name", type: "text", required: true, span: "full" },
      { key: "admissionDate", label: "Admission date", type: "date", span: "half" },
      { key: "admissionTime", label: "Admission time", type: "time", span: "half" },
      { key: "dischargeDate", label: "Discharge date", type: "date", span: "half" },
      { key: "dischargeTime", label: "Discharge time", type: "time", span: "half" },
      { key: "roomCategory", label: "Room category", type: "select", options: ["Day care","Single occupancy","Twin sharing","3 or more beds"], span: "half" },
      { key: "systemOfMedicine", label: "System of medicine", type: "select", options: ["Allopathy","Ayurveda","Homeopathy","Siddha","Unani","Naturopathy","Other"], span: "half" },
      { key: "injuryCause", label: "Cause of injury", type: "chips", options: ["Road traffic accident","Self inflicted","Substance / alcohol related","Other injury"], span: "full", condition: (d) => d.hospitalizationReason === "Injury" },
      { key: "medicoLegal", label: "Medico-legal case?", type: "yn", span: "half", condition: (d) => d.hospitalizationReason === "Injury" },
      { key: "reportedToPolice", label: "Reported to police?", type: "yn", span: "half", condition: (d) => d.hospitalizationReason === "Injury" },
      { key: "firAttached", label: "MLC / FIR attached?", type: "yn", span: "half", condition: (d) => d.hospitalizationReason === "Injury" },
    ],
  },
  {
    key: "expenses", title: "Claim expenses", sub: "Enter amounts in ₹ — use 0 if not applicable",
    fields: [
      { key: "hospitalExpenses", label: "Total hospital bill (₹)", type: "text", required: true, span: "half" },
      { key: "hadPreExpenses", label: "Pre-admission expenses?", type: "yn", span: "half" },
      { key: "preExpenses", label: "Pre-admission amount (₹)", type: "text", span: "half", condition: (d) => d.hadPreExpenses === "Yes" },
      { key: "hadPostExpenses", label: "Post-discharge expenses?", type: "yn", span: "half" },
      { key: "postExpenses", label: "Post-discharge amount (₹)", type: "text", span: "half", condition: (d) => d.hadPostExpenses === "Yes" },
      { key: "preHospitalizationDays", label: "Pre-hospitalization days", type: "text", span: "half" },
      { key: "postHospitalizationDays", label: "Post-hospitalization days", type: "text", span: "half" },
      { key: "healthCheckupCost", label: "Health checkup cost (₹)", type: "text", span: "half" },
      { key: "ambulanceCharges", label: "Ambulance charges (₹)", type: "text", span: "half" },
      { key: "othersClaimAmount", label: "Other claim amount (₹)", type: "text", span: "half" },
      { key: "hadDomiciliary", label: "Domiciliary hospitalization?", type: "yn", span: "half" },
      { key: "hasCashBenefits", label: "Fixed cash benefits in policy?", type: "yn", span: "half" },
      { key: "hospitalDailyCash", label: "Hospital daily cash (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
      { key: "surgicalCash", label: "Surgical cash (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
      { key: "criticalIllnessBenefit", label: "Critical illness benefit (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
      { key: "convalescence", label: "Convalescence benefit (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
      { key: "prePostLumpSum", label: "Pre/post lump sum (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
      { key: "otherBenefit", label: "Other cash benefit (₹)", type: "text", span: "half", condition: (d) => d.hasCashBenefits === "Yes" },
    ],
  },
  { key: "docs-bills", title: "Documents & bills", sub: "Tick what you're submitting and enter bill details", custom: "docs-bills" },
  {
    key: "bank", title: "Bank & declaration", sub: "Where should the reimbursement be credited?",
    fields: [
      { key: "payeeType", label: "Reimbursement payable to", type: "chips", options: ["Primary policyholder","Patient","Someone else"], span: "full" },
      { key: "pan", label: "PAN", type: "text", span: "half" },
      { key: "bankAccountNumber", label: "Account number", type: "text", required: true, span: "half" },
      { key: "bankNameBranch", label: "Bank name & branch", type: "text", span: "full" },
      { key: "ifsc", label: "IFSC code", type: "text", required: true, span: "half" },
      { key: "chequePayableTo", label: "Cheque / DD payable to", type: "text", span: "half" },
      { key: "declarationPlace", label: "Place of declaration", type: "text", span: "half" },
      { key: "declarationDate", label: "Declaration date", type: "date", span: "half" },
    ],
  },
];

function defaultForm(): ClaimData {
  return {
    documents: [], billRows: defaultBillRows(), sameAddress: true,
    hadPreExpenses: "No", hadPostExpenses: "No", hadDomiciliary: "No", hasCashBenefits: "No",
    currentOtherCover: "No", hospitalizedLastFourYears: "No", previousOtherCover: "No",
    healthCheckupCost: "0", ambulanceCharges: "0", othersClaimAmount: "0",
    preHospitalizationDays: "0", postHospitalizationDays: "0", payeeType: "Primary policyholder",
  };
}

function defaultBillRows(): BillRow[] {
  return [
    { id: "1", billNo: "", date: "", issuedBy: "", towards: "Hospital Main Bill", amount: "" },
    { id: "2", billNo: "", date: "", issuedBy: "", towards: "Pre-hospitalization Bills", amount: "" },
    { id: "3", billNo: "", date: "", issuedBy: "", towards: "Post-hospitalization Bills", amount: "" },
  ];
}

function validateSection(section: SectionDef, form: ClaimData): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!section.fields) return errors;
  const amountKeys = new Set(["preExpenses","hospitalExpenses","postExpenses","healthCheckupCost","ambulanceCharges","othersClaimAmount","hospitalDailyCash","surgicalCash","criticalIllnessBenefit","convalescence","prePostLumpSum","otherBenefit"]);
  for (const f of section.fields) {
    if (f.condition && !f.condition(form)) continue;
    const val = String((form as any)[f.key] ?? "").trim();
    if (f.required && !val) { errors[f.key] = "Required"; continue; }
    if (amountKeys.has(f.key) && val && !/^\d+(\.\d{1,2})?$/.test(val)) errors[f.key] = "Numbers only (e.g. 5000)";
    if ((f.key === "policyholderPin" || f.key === "patientPin") && val && !/^\d{6}$/.test(val)) errors[f.key] = "6 digits required";
    if (f.key === "ifsc" && val && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(val)) errors[f.key] = "Format: ABCD0123456";
    if (f.key === "dischargeDate" && form.admissionDate && val && new Date(val) < new Date(form.admissionDate)) errors[f.key] = "Cannot be before admission date";
  }
  return errors;
}

export default function Wizard({ initialData, onSave, onComplete }: WizardProps) {
  const [form, setForm] = useState<ClaimData>(() => initialData ?? defaultForm());
  const [sectionIndex, setSectionIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const section = SECTIONS[sectionIndex];
  const isLast = sectionIndex === SECTIONS.length - 1;

  useEffect(() => { onSave({ ...form, wizardStepKey: section.key }); }, [form, section.key]);

  useEffect(() => {
    if (!initialData?.wizardStepKey) return;
    const idx = SECTIONS.findIndex(s => s.key === initialData.wizardStepKey);
    if (idx >= 0) setSectionIndex(idx);
  }, []);

  useEffect(() => {
    if (form.relationship === "Myself") {
      setForm(p => ({ ...p, patientName: p.patientName || p.policyholderName, sameAddress: true }));
    }
  }, [form.relationship]);

  useEffect(() => {
    if (form.payeeType === "Primary policyholder" && form.policyholderName)
      setForm(p => ({ ...p, chequePayableTo: p.chequePayableTo || p.policyholderName }));
    if (form.payeeType === "Patient" && form.patientName)
      setForm(p => ({ ...p, chequePayableTo: p.chequePayableTo || p.patientName }));
  }, [form.payeeType, form.policyholderName, form.patientName]);

  const setValue = (key: keyof ClaimData, value: any) => {
    setForm(p => ({ ...p, [key]: value }));
    setErrors(p => ({ ...p, [key]: "" }));
  };

  const handleNext = () => {
    const errs = validateSection(section, form);
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }
    setErrors({});
    if (isLast) { onComplete(form); return; }
    setSectionIndex(i => i + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setSectionIndex(i => Math.max(0, i - 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const progress = Math.round(((sectionIndex + 1) / SECTIONS.length) * 100);

  return (
    <div className="wizard-shell">
      <div className="wizard-meta no-print">
        <div className="wizard-meta-row">
          <span className="wizard-section-label">{section.title}</span>
          <span className="wizard-progress-label">{sectionIndex + 1} / {SECTIONS.length}</span>
        </div>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="question-card">
        <div className="question-eyebrow">Step {sectionIndex + 1} of {SECTIONS.length}</div>
        <h1 className="question-title">{section.title}</h1>
        {section.sub && <p className="question-helper">{section.sub}</p>}

        {section.custom === "docs-bills"
          ? <DocsBillsSection form={form} setValue={setValue} />
          : (
            <div className="section-form">
              {(section.fields || []).map(f => {
                if (f.condition && !f.condition(form)) return null;
                return <FieldBlock key={f.key} field={f} form={form} setValue={setValue} error={errors[f.key]} />;
              })}
            </div>
          )
        }

        <div className="question-actions no-print">
          <button className="ghost-btn" onClick={handleBack} disabled={sectionIndex === 0}>Back</button>
          <button className="primary-btn" onClick={handleNext}>{isLast ? "Generate form" : "Next →"}</button>
        </div>
      </div>
    </div>
  );
}

function getDisplayVal(key: keyof ClaimData, raw: any): string {
  if (key === "sameAddress") return raw === true ? "Yes" : raw === "No" ? "No" : "";
  return String(raw ?? "");
}

function FieldBlock({ field, form, setValue, error }: {
  field: FieldDef; form: ClaimData;
  setValue: (k: keyof ClaimData, v: any) => void; error?: string;
}) {
  const raw = (form as any)[field.key];
  const val = getDisplayVal(field.key, raw);

  const setVal = (opt: string) => {
    if (field.key === "sameAddress") { setValue(field.key, opt === "Yes" ? true : "No"); return; }
    setValue(field.key, opt);
  };

  return (
    <div className={`field-block${field.span === "full" ? " full" : ""}`}>
      <label className="field-label">
        {field.label}{field.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>

      {field.type === "yn" && (
        <div className="yn-toggle">
          {["Yes", "No"].map(opt => (
            <button key={opt} type="button"
              className={`yn-btn${val === opt ? ` selected ${opt.toLowerCase()}` : ""}`}
              onClick={() => setVal(opt)}>{opt}</button>
          ))}
        </div>
      )}

      {field.type === "chips" && (
        <div className="mini-chips">
          {(field.options || []).map(opt => (
            <button key={opt} type="button"
              className={`mini-chip${val === opt ? " selected" : ""}`}
              onClick={() => setVal(opt)}>{opt}</button>
          ))}
        </div>
      )}

      {field.type === "select" && (
        <select className={`section-input${error ? " input-error" : ""}`} value={val}
          onChange={e => setValue(field.key, e.target.value)}>
          <option value="">Select</option>
          {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {(field.type === "text" || field.type === "date" || field.type === "time") && (
        <input className={`section-input${error ? " input-error" : ""}`}
          type={field.type} value={val}
          onChange={e => setValue(field.key, e.target.value)} />
      )}

      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function DocsBillsSection({ form, setValue }: {
  form: ClaimData; setValue: (k: keyof ClaimData, v: any) => void;
}) {
  const rows = form.billRows || [];
  const updateRow = (id: string, key: keyof BillRow, value: string) =>
    setValue("billRows", rows.map(r => r.id === id ? { ...r, [key]: value } : r));
  const addRow = () =>
    setValue("billRows", [...rows, { id: `${Date.now()}`, billNo: "", date: "", issuedBy: "", towards: "Other", amount: "" }]);

  return (
    <div>
      <div className="docs-section-label">Documents enclosed</div>
      <div className="checkbox-list">
        {DOCS.map(item => (
          <label className="checkbox-row" key={item}>
            <input type="checkbox" checked={(form.documents || []).includes(item)}
              onChange={() => {
                const docs = new Set(form.documents || []);
                if (docs.has(item)) docs.delete(item); else docs.add(item);
                setValue("documents", Array.from(docs));
              }} />
            <span>{item}</span>
          </label>
        ))}
      </div>

      <div className="docs-section-label" style={{ marginTop: 24 }}>Bills enclosed</div>
      <div className="bill-editor">
        {rows.slice(0, 10).map((row, idx) => (
          <div className="bill-card" key={row.id}>
            <div className="bill-card-title">Row {idx + 1}</div>
            <div className="bill-grid">
              <input className="text-input compact-input" placeholder="Bill No" value={row.billNo} onChange={e => updateRow(row.id, "billNo", e.target.value)} />
              <input className="text-input compact-input" type="date" value={row.date} onChange={e => updateRow(row.id, "date", e.target.value)} />
              <input className="text-input compact-input" placeholder="Issued by" value={row.issuedBy} onChange={e => updateRow(row.id, "issuedBy", e.target.value)} />
              <input className="text-input compact-input" placeholder="Towards" value={row.towards} onChange={e => updateRow(row.id, "towards", e.target.value)} />
              <input className="text-input compact-input" placeholder="Amount" value={row.amount} onChange={e => updateRow(row.id, "amount", e.target.value)} />
            </div>
          </div>
        ))}
        {rows.length < 10 && <button type="button" className="ghost-btn small-btn" onClick={addRow}>+ Add row</button>}
      </div>
    </div>
  );
}
