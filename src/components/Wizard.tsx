
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

const documentChecklist = [
  { id: "claim-form", label: "Claim form copy", why: "So you know what this flow will finally fill." },
  { id: "discharge-summary", label: "Hospital discharge summary", why: "Usually has admission date, discharge date, diagnosis, and hospital details." },
  { id: "hospital-bill", label: "Main hospital bill", why: "Needed for hospitalization amount and bill details." },
  { id: "pharmacy-bills", label: "Pharmacy bills", why: "Useful for medicine spends before or after admission." },
  { id: "policy-document", label: "Policy document / e-card", why: "Useful for policy number, TPA ID, and cash benefit details." },
];

const defaultBillRows = (): BillRow[] => [
  { id: "1", billNo: "", date: "", issuedBy: "", towards: "Hospital Main Bill", amount: "" },
  { id: "2", billNo: "", date: "", issuedBy: "", towards: "Pre-hospitalization Bills", amount: "" },
  { id: "3", billNo: "", date: "", issuedBy: "", towards: "Post-hospitalization Bills", amount: "" },
  { id: "4", billNo: "", date: "", issuedBy: "", towards: "Pharmacy Bills", amount: "" },
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

  return {
    years: String(Math.max(0, years)),
    months: String(Math.max(0, months)),
  };
}

function buildSteps(data: ClaimData): StepDef[] {
  const steps: StepDef[] = [
    { key: "documents", title: "Keep these ready before you start", helper: "These papers usually help you answer the next questions without guessing.", section: "Getting ready" },
    { key: "relationship", title: "Who was treated?", helper: "This helps me fill the relationship in the official form.", section: "Patient" },
    { key: "policyholderName", title: "Who holds the insurance policy?", helper: "This is the policyholder or primary insured.", section: "Policyholder" },
    { key: "patientName", title: "Who was treated in the hospital?", helper: "This is the patient name to be entered in the claim form.", section: "Patient" },
    { key: "patientDob", title: "Patient date of birth", helper: "Age will be calculated automatically from this.", section: "Patient" },
    { key: "gender", title: "Patient gender", section: "Patient" },
    { key: "occupation", title: "Patient occupation", helper: "Choose the closest option from the official form.", section: "Patient" },
    { key: "sameAddress", title: "Is the patient address the same as the policyholder address?", helper: "The form asks patient address separately only when it is different.", section: "Address" },
    { key: "policyholderAddress1", title: "Policyholder address", helper: "Enter the main address line first.", section: "Address" },
    { key: "policyholderCity", title: "Policyholder city", section: "Address" },
    { key: "policyholderState", title: "Policyholder state", section: "Address" },
    { key: "policyholderPin", title: "Policyholder PIN code", section: "Address" },
  ];

  if (data.sameAddress === "No") {
    steps.push(
      { key: "patientAddress1", title: "Patient address", helper: "Enter this only because it is different from the policyholder address.", section: "Address" },
      { key: "patientCity", title: "Patient city", section: "Address" },
      { key: "patientState", title: "Patient state", section: "Address" },
      { key: "patientPin", title: "Patient PIN code", section: "Address" },
    );
  }

  steps.push(
    { key: "policyNumber", title: "Policy number", helper: "Usually found on the policy document, e-card, or insurer app.", section: "Policy" },
    { key: "tpaId", title: "TPA ID number", helper: "If you can find it on the policy or claim papers, enter it. Otherwise leave it blank for now.", section: "Policy" },
    { key: "currentOtherCover", title: "Is the patient currently covered under any other health insurance?", section: "Insurance history" },
  );

  if (data.currentOtherCover === "Yes") {
    steps.push(
      { key: "currentOtherCompanyName", title: "Other current insurer name", section: "Insurance history" },
      { key: "currentOtherPolicyNo", title: "Other current policy number", section: "Insurance history" },
      { key: "currentOtherSumInsured", title: "Other current sum insured", section: "Insurance history" },
    );
  }

  steps.push(
    { key: "firstInsuranceStart", title: "Date of first health insurance without break", helper: "Use the earliest continuous start date if known.", section: "Insurance history" },
    { key: "hospitalizedLastFourYears", title: "Has the patient been hospitalized in the last four years?", section: "Insurance history" },
  );

  if (data.hospitalizedLastFourYears === "Yes") {
    steps.push(
      { key: "lastHospitalizationDate", title: "When was that hospitalization?", helper: "Month and year is enough for the form. Use the closest date you know.", section: "Insurance history" },
      { key: "lastHospitalizationDiagnosis", title: "What was the diagnosis?", section: "Insurance history" },
    );
  }

  steps.push({ key: "previousOtherCover", title: "Was the patient previously covered by any other health insurance?", section: "Insurance history" });

  if (data.previousOtherCover === "Yes") {
    steps.push({ key: "previousOtherCompanyName", title: "Previous insurer name", section: "Insurance history" });
  }

  steps.push(
    { key: "phone", title: "Policyholder phone number", section: "Contact" },
    { key: "email", title: "Policyholder email", section: "Contact" },
    { key: "hospitalizationReason", title: "Why was the patient admitted?", helper: "Choose the closest reason shown in the hospital papers.", section: "Hospital stay" },
    { key: "diseaseOrInjuryDate", title: data.hospitalizationReason === "Maternity" ? "Date of delivery or the main maternity event" : data.hospitalizationReason === "Injury" ? "Date of injury" : "Date when the illness was first detected", helper: "Use the date that best matches the official form field.", section: "Hospital stay" },
    { key: "admissionDate", title: "Admission date", helper: "You can usually find this in the discharge summary.", section: "Hospital stay" },
    { key: "admissionTime", title: "Admission time", section: "Hospital stay" },
    { key: "dischargeDate", title: "Discharge date", section: "Hospital stay" },
    { key: "dischargeTime", title: "Discharge time", section: "Hospital stay" },
    { key: "hospitalName", title: "Hospital name", section: "Hospital stay" },
    { key: "roomCategory", title: "What type of room was used?", helper: "Pick the closest option from the form or discharge papers.", section: "Hospital stay" },
    { key: "systemOfMedicine", title: "System of medicine", helper: "For most users this is allopathy. Use the wording shown in hospital papers if available.", section: "Hospital stay" },
  );

  if (data.hospitalizationReason === "Injury") {
    steps.push(
      { key: "injuryCause", title: "What caused the injury?", helper: "This helps fill the injury section correctly in the form.", section: "Injury details" },
      { key: "medicoLegal", title: "Was this treated as a medico-legal case?", helper: "A medico-legal case usually means the hospital treated it as a legal or police-reportable matter.", section: "Injury details" },
      { key: "reportedToPolice", title: "Was it reported to the police?", section: "Injury details" },
      { key: "firAttached", title: "Do you have MLC report or FIR papers attached?", section: "Injury details" },
    );
  }

  steps.push(
    { key: "hadPreExpenses", title: "Any expenses before admission?", helper: "Examples: consultation, tests, or medicines before getting admitted.", section: "Expenses" },
  );
  if (data.hadPreExpenses === "Yes") steps.push({ key: "preExpenses", title: "Amount spent before admission", section: "Expenses" });

  steps.push(
    { key: "hospitalExpenses", title: "Hospitalization amount", helper: "Use the main hospital bill amount.", section: "Expenses" },
    { key: "hadPostExpenses", title: "Any expenses after discharge?", helper: "Examples: follow-up medicines, consultations, or tests after discharge.", section: "Expenses" },
  );
  if (data.hadPostExpenses === "Yes") steps.push({ key: "postExpenses", title: "Amount spent after discharge", section: "Expenses" });

  steps.push(
    { key: "healthCheckupCost", title: "Any health check-up cost being claimed?", helper: "Enter 0 if none.", section: "Expenses" },
    { key: "ambulanceCharges", title: "Any ambulance charges?", helper: "Enter 0 if none.", section: "Expenses" },
    { key: "othersClaimAmount", title: "Any other treatment expense amount?", helper: "If none, enter 0.", section: "Expenses" },
  );
  if (data.othersClaimAmount && data.othersClaimAmount !== "0") {
    steps.push({ key: "othersClaimCode", title: "Short code or label for that other expense", helper: "Use a short label that helps identify it later.", section: "Expenses" });
  }

  steps.push(
    { key: "preHospitalizationDays", title: "Pre-hospitalization period in days", helper: "Number of days before admission covered by related expenses. Enter 0 if none.", section: "Expenses" },
    { key: "postHospitalizationDays", title: "Post-hospitalization period in days", helper: "Number of days after discharge covered by related expenses. Enter 0 if none.", section: "Expenses" },
    { key: "hadDomiciliary", title: "Was the patient treated at home instead of being admitted?", helper: "This is what the form calls domiciliary hospitalization.", section: "Expenses" },
    { key: "hasCashBenefits", title: "Does the policy mention any fixed cash benefits separate from bill reimbursement?", helper: "Examples: hospital daily cash, surgical cash, critical illness cash benefit. If unsure, save and continue later after checking the policy.", section: "Benefits" },
  );

  if (data.hasCashBenefits === "Yes") {
    steps.push(
      { key: "hospitalDailyCash", title: "Hospital daily cash amount", helper: "A fixed amount per day of hospital stay, if your policy provides it.", section: "Benefits" },
      { key: "surgicalCash", title: "Surgical cash amount", section: "Benefits" },
      { key: "criticalIllnessBenefit", title: "Critical illness benefit amount", section: "Benefits" },
      { key: "convalescence", title: "Convalescence amount", helper: "A recovery benefit if your policy mentions it.", section: "Benefits" },
      { key: "prePostLumpSum", title: "Pre / post hospitalization lump sum amount", section: "Benefits" },
      { key: "otherBenefit", title: "Any other cash benefit amount", section: "Benefits" },
    );
  }

  steps.push(
    { key: "documentsReview", title: "Which claim documents do you have with you?", helper: "Tick what is already available. This helps your final form stay complete.", section: "Documents" },
    { key: "billRows", title: "Bills enclosed", helper: "Enter the common bill lines you want shown in the form table.", section: "Bills enclosed" },
    { key: "pan", title: "PAN", section: "Bank details" },
    { key: "bankAccountNumber", title: "Bank account number", section: "Bank details" },
    { key: "bankNameBranch", title: "Bank name and branch", section: "Bank details" },
    { key: "ifsc", title: "IFSC code", section: "Bank details" },
    { key: "chequePayableTo", title: "Cheque / DD payable to", helper: "Usually the same person who should receive the reimbursement.", section: "Bank details" },
    { key: "declarationPlace", title: "Place of declaration", helper: "City or place to be shown near the insured declaration.", section: "Declaration" },
    { key: "review", title: "Review your answers", helper: "You can edit any section before generating the final form.", section: "Review" },
  );

  return steps;
}

export default function Wizard({ initialData, onSave, onComplete }: WizardProps) {
  const [form, setForm] = useState<ClaimData>(
    initialData || {
      documents: [],
      billRows: defaultBillRows(),
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
    }
  );
  const [stepIndex, setStepIndex] = useState(0);

  const steps = useMemo(() => buildSteps(form), [form]);
  const step = steps[stepIndex];

  useEffect(() => {
    onSave(form);
  }, [form, onSave]);

  useEffect(() => {
    if (form.relationship === "Myself") {
      setForm((prev) => ({
        ...prev,
        sameAddress: true,
      }));
    }
  }, [form.relationship]);

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  const setValue = (key: keyof ClaimData, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDocument = (value: string) => {
    setForm((prev) => {
      const docs = new Set(prev.documents || []);
      if (docs.has(value)) docs.delete(value);
      else docs.add(value);
      return { ...prev, documents: Array.from(docs) };
    });
  };

  const updateBillRow = (id: string, key: keyof BillRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      billRows: (prev.billRows || []).map((row) =>
        row.id === id ? { ...row, [key]: value } : row
      ),
    }));
  };

  const addBillRow = () => {
    setForm((prev) => ({
      ...prev,
      billRows: [
        ...(prev.billRows || []),
        {
          id: `${Date.now()}`,
          billNo: "",
          date: "",
          issuedBy: "",
          towards: "Other",
          amount: "",
        },
      ],
    }));
  };

  const next = () => {
    if (step.key === "review") {
      onComplete(form);
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const back = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const autoNextKeys = [
    "relationship",
    "gender",
    "occupation",
    "sameAddress",
    "hospitalizationReason",
    "medicoLegal",
    "reportedToPolice",
    "firAttached",
    "hadPreExpenses",
    "hadPostExpenses",
    "hadDomiciliary",
    "currentOtherCover",
    "hospitalizedLastFourYears",
    "previousOtherCover",
  ];

  return (
    <div className="wizard-shell">
      <div className="wizard-meta no-print">
        <div className="wizard-meta-row">
          <span className="wizard-section-label">{step.section}</span>
          <span className="wizard-progress-label">{progress}%</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="question-card">
        {step.key !== "review" && (
          <>
            <div className="question-eyebrow">{step.section}</div>
            <h1 className="question-title">{step.title}</h1>
            {step.helper && <p className="question-helper">{step.helper}</p>}
          </>
        )}

        {step.key === "documents" && (
          <div className="document-list">
            {documentChecklist.map((doc) => (
              <div className="doc-row" key={doc.id}>
                <div className="doc-title">{doc.label}</div>
                <div className="doc-why">{doc.why}</div>
              </div>
            ))}
          </div>
        )}

        {step.key === "relationship" && (
          <ChoiceGrid
            options={["Myself", "Father", "Mother", "Spouse", "Child", "Other"]}
            value={form.relationship || ""}
            onChange={(v) => setValue("relationship", v)}
            autoNext={next}
          />
        )}

        {step.key === "gender" && (
          <ChoiceGrid options={["Male", "Female", "Other"]} value={form.gender || ""} onChange={(v) => setValue("gender", v)} autoNext={next} />
        )}

        {step.key === "occupation" && (
          <ChoiceGrid
            options={["Service", "Self Employed", "Homemaker", "Student", "Retired", "Other"]}
            value={form.occupation || ""}
            onChange={(v) => setValue("occupation", v)}
            autoNext={next}
          />
        )}

        {step.key === "sameAddress" && (
          <ChoiceGrid options={["Yes", "No"]} value={form.sameAddress === true ? "Yes" : "No"} onChange={(v) => setValue("sameAddress", v === "Yes" ? true : "No")} autoNext={next} />
        )}

        {step.key === "hospitalizationReason" && (
          <ChoiceGrid options={["Illness", "Injury", "Maternity"]} value={form.hospitalizationReason || ""} onChange={(v) => setValue("hospitalizationReason", v as ClaimData["hospitalizationReason"])} autoNext={next} />
        )}

        {["currentOtherCover", "hospitalizedLastFourYears", "previousOtherCover", "medicoLegal", "reportedToPolice", "firAttached", "hadPreExpenses", "hadPostExpenses", "hadDomiciliary"].includes(step.key) && (
          <ChoiceGrid options={["Yes", "No"]} value={(form as any)[step.key] || ""} onChange={(v) => setValue(step.key as keyof ClaimData, v)} autoNext={next} />
        )}

        {step.key === "hasCashBenefits" && (
          <ChoiceGrid options={["Yes", "No"]} value={form.hasCashBenefits || ""} onChange={(v) => setValue("hasCashBenefits", v)} />
        )}

        {step.key === "roomCategory" && (
          <ChoiceGrid
            options={["Day care", "Single occupancy", "Twin sharing", "3 or more beds"]}
            value={form.roomCategory || ""}
            onChange={(v) => setValue("roomCategory", v)}
          />
        )}

        {step.key === "injuryCause" && (
          <ChoiceGrid
            options={["Road traffic accident", "Self inflicted", "Substance / alcohol related", "Other injury"]}
            value={form.injuryCause || ""}
            onChange={(v) => setValue("injuryCause", v)}
          />
        )}

        {step.key === "documentsReview" && (
          <div className="checkbox-list">
            {[
              "Claim form duly signed",
              "Copy of claim intimation",
              "Hospital main bill",
              "Hospital break-up bill",
              "Hospital bill payment receipt",
              "Hospital discharge summary",
              "Pharmacy bill",
              "Operation Theatre notes",
              "ECG",
              "Doctor request for investigation",
              "Investigation reports",
              "Doctor prescriptions",
              "Others",
            ].map((item) => (
              <label className="checkbox-row" key={item}>
                <input
                  type="checkbox"
                  checked={(form.documents || []).includes(item)}
                  onChange={() => toggleDocument(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        )}

        {step.key === "billRows" && (
          <div className="bill-editor">
            {(form.billRows || []).slice(0, 10).map((row, idx) => (
              <div className="bill-card" key={row.id}>
                <div className="bill-card-title">Row {idx + 1} · {row.towards}</div>
                <div className="bill-grid">
                  <div>
                    <div className="mini-label">Bill No</div>
                    <input className="text-input compact-input" value={row.billNo} onChange={(e) => updateBillRow(row.id, "billNo", e.target.value)} />
                  </div>
                  <div>
                    <div className="mini-label">Date</div>
                    <input className="text-input compact-input" type="date" value={row.date} onChange={(e) => updateBillRow(row.id, "date", e.target.value)} />
                  </div>
                  <div>
                    <div className="mini-label">Issued by</div>
                    <input className="text-input compact-input" value={row.issuedBy} onChange={(e) => updateBillRow(row.id, "issuedBy", e.target.value)} />
                  </div>
                  <div>
                    <div className="mini-label">Towards</div>
                    <input className="text-input compact-input" value={row.towards} onChange={(e) => updateBillRow(row.id, "towards", e.target.value)} />
                  </div>
                  <div>
                    <div className="mini-label">Amount</div>
                    <input className="text-input compact-input" value={row.amount} onChange={(e) => updateBillRow(row.id, "amount", e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            {(form.billRows || []).length < 10 && (
              <button type="button" className="ghost-btn small-btn" onClick={addBillRow}>
                Add another bill row
              </button>
            )}
          </div>
        )}

        {step.key === "review" && (
          <ReviewBlock form={form} age={deriveAgeParts(form.patientDob)} />
        )}

        {[
          "policyholderName", "patientName", "policyNumber", "tpaId", "phone", "email",
          "policyholderAddress1", "policyholderCity", "policyholderState", "policyholderPin",
          "patientAddress1", "patientCity", "patientState", "patientPin",
          "hospitalName", "systemOfMedicine", "preExpenses", "hospitalExpenses", "postExpenses",
          "healthCheckupCost", "ambulanceCharges", "othersClaimAmount", "othersClaimCode",
          "preHospitalizationDays", "postHospitalizationDays",
          "hospitalDailyCash", "surgicalCash", "criticalIllnessBenefit",
          "convalescence", "prePostLumpSum", "otherBenefit", "pan", "bankAccountNumber",
          "bankNameBranch", "ifsc", "chequePayableTo", "declarationPlace",
          "currentOtherCompanyName", "currentOtherPolicyNo", "currentOtherSumInsured",
          "lastHospitalizationDiagnosis", "previousOtherCompanyName"
        ].includes(step.key) && (
          <TextInput value={(form as any)[step.key] || ""} onChange={(v) => setValue(step.key as keyof ClaimData, v)} />
        )}

        {["patientDob", "firstInsuranceStart", "diseaseOrInjuryDate", "admissionDate", "dischargeDate", "lastHospitalizationDate"].includes(step.key) && (
          <TextInput type="date" value={(form as any)[step.key] || ""} onChange={(v) => setValue(step.key as keyof ClaimData, v)} />
        )}

        {["admissionTime", "dischargeTime"].includes(step.key) && (
          <TextInput type="time" value={(form as any)[step.key] || ""} onChange={(v) => setValue(step.key as keyof ClaimData, v)} />
        )}

        <div className="question-actions no-print">
          <button className="ghost-btn" onClick={back} disabled={stepIndex === 0}>
            Back
          </button>

          {!autoNextKeys.includes(step.key) && (
            <button className="primary-btn" onClick={next}>
              {step.key === "review" ? "Generate form" : "Next"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
  autoNext,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  autoNext?: () => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`choice-pill ${value === option ? "selected" : ""}`}
          onClick={() => {
            onChange(option);
            if (autoNext) {
              setTimeout(autoNext, 120);
            }
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <input
      className="text-input"
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ReviewBlock({
  form,
  age,
}: {
  form: ClaimData;
  age: { years: string; months: string };
}) {
  return (
    <div className="review-groups">
      <div className="review-group">
        <h3>Policyholder</h3>
        <p><strong>Name:</strong> {form.policyholderName || "—"}</p>
        <p><strong>Policy number:</strong> {form.policyNumber || "—"}</p>
        <p><strong>TPA ID:</strong> {form.tpaId || "—"}</p>
      </div>

      <div className="review-group">
        <h3>Insurance history</h3>
        <p><strong>Other current cover:</strong> {form.currentOtherCover || "—"}</p>
        <p><strong>First continuous start:</strong> {form.firstInsuranceStart || "—"}</p>
        <p><strong>Hospitalized in last 4 years:</strong> {form.hospitalizedLastFourYears || "—"}</p>
      </div>

      <div className="review-group">
        <h3>Patient</h3>
        <p><strong>Name:</strong> {form.patientName || "—"}</p>
        <p><strong>Relationship:</strong> {form.relationship || "—"}</p>
        <p><strong>Occupation:</strong> {form.occupation || "—"}</p>
        <p><strong>DOB:</strong> {form.patientDob || "—"}</p>
        <p><strong>Age:</strong> {age.years || "0"} years {age.months || "0"} months</p>
      </div>

      <div className="review-group">
        <h3>Hospital stay</h3>
        <p><strong>Reason:</strong> {form.hospitalizationReason || "—"}</p>
        <p><strong>Hospital:</strong> {form.hospitalName || "—"}</p>
        <p><strong>Admission:</strong> {form.admissionDate || "—"} {form.admissionTime || ""}</p>
        <p><strong>Discharge:</strong> {form.dischargeDate || "—"} {form.dischargeTime || ""}</p>
      </div>

      <div className="review-group">
        <h3>Expenses</h3>
        <p><strong>Pre:</strong> {form.preExpenses || "0"}</p>
        <p><strong>Hospital:</strong> {form.hospitalExpenses || "0"}</p>
        <p><strong>Post:</strong> {form.postExpenses || "0"}</p>
        <p><strong>Health check-up:</strong> {form.healthCheckupCost || "0"}</p>
        <p><strong>Ambulance:</strong> {form.ambulanceCharges || "0"}</p>
      </div>

      <div className="review-group">
        <h3>Documents and bills</h3>
        <p>{(form.documents || []).length ? form.documents?.join(", ") : "No documents marked yet"}</p>
        <p><strong>Bill rows:</strong> {(form.billRows || []).length}</p>
      </div>

      <div className="review-group">
        <h3>Bank details</h3>
        <p><strong>Account:</strong> {form.bankAccountNumber || "—"}</p>
        <p><strong>IFSC:</strong> {form.ifsc || "—"}</p>
      </div>
    </div>
  );
}
