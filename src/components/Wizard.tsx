import { useMemo, useState } from 'react';
import type { ClaimDraft } from '../App';

type Props = {
  draft: ClaimDraft;
  onChange: (draft: ClaimDraft) => void;
  onBackToHome: () => void;
  onExport: () => void;
  onReview: () => void;
};

type Step = {
  id: string;
  title: string;
  helper?: string;
  kind: 'choice' | 'text' | 'date' | 'datetime' | 'textarea' | 'money' | 'multiselect' | 'bills';
  options?: Array<{ label: string; value: string; hint?: string }>;
  path?: string;
  placeholder?: string;
  isVisible?: (draft: ClaimDraft) => boolean;
  validate?: (value: unknown, draft: ClaimDraft) => string | null;
};

const DOC_OPTIONS = [
  'Claim Form Duly signed',
  'Copy of the claim intimation, if any',
  'Hospital Main Bill',
  'Hospital Break-up Bill',
  'Hospital Bill Payment Receipt',
  'Hospital Discharge Summary',
  'Pharmacy Bill',
  'Operation Theatre Notes',
  'ECG',
  'Doctor request for investigation',
  'Investigation Reports',
  'Doctor Prescriptions',
  'Others',
];

function setByPath<T extends object>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone: any = structuredClone(obj);
  let ref = clone;
  for (let i = 0; i < keys.length - 1; i += 1) ref = ref[keys[i]];
  ref[keys[keys.length - 1]] = value;
  return clone;
}

function getByPath(obj: any, path?: string) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

function getAgeFromDob(dob: string) {
  if (!dob) return { years: '', months: '' };
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return { years: '', months: '' };
  const today = new Date();
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: String(Math.max(years, 0)), months: String(Math.max(months, 0)) };
}

function buildSteps(draft: ClaimDraft): Step[] {
  return [
    {
      id: 'relationship',
      title: 'Who is this claim for?',
      helper: 'This decides the relationship field in Part A and helps me speak more naturally.',
      kind: 'choice',
      path: 'patient.relationship',
      options: [
        { label: 'Myself', value: 'Self' },
        { label: 'My spouse', value: 'Spouse' },
        { label: 'My child', value: 'Child' },
        { label: 'My father', value: 'Father' },
        { label: 'My mother', value: 'Mother' },
        { label: 'Someone else', value: 'Other' },
      ],
      validate: (v) => (!v ? 'Please choose who the patient is.' : null),
    },
    {
      id: 'patientName',
      title: 'What is the patient’s full name?',
      helper: 'Use the same name that appears in hospital records and the insurance policy.',
      kind: 'text',
      path: 'patient.fullName',
      placeholder: 'Full name',
      validate: (v) => (!String(v || '').trim() ? 'Please enter the patient name.' : null),
    },
    {
      id: 'dob',
      title: 'What is the patient’s date of birth?',
      helper: 'I’ll derive age from this so you don’t have to enter both.',
      kind: 'date',
      path: 'patient.dateOfBirth',
      validate: (v) => (!v ? 'Please enter the date of birth.' : null),
    },
    {
      id: 'gender',
      title: 'What is the patient’s gender?',
      kind: 'choice',
      path: 'patient.gender',
      options: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
      ],
      validate: (v) => (!v ? 'Please choose the gender.' : null),
    },
    {
      id: 'primaryName',
      title: draft.patient.relationship === 'Self' ? 'What is your full name as insured?' : 'What is the primary insured’s full name?',
      helper: 'This is the policyholder name that appears in Section A.',
      kind: 'text',
      path: 'primaryInsured.fullName',
      placeholder: 'Policyholder name',
      validate: (v) => (!String(v || '').trim() ? 'Please enter the primary insured name.' : null),
    },
    {
      id: 'policyNumber',
      title: 'What is the policy number?',
      helper: 'Copy it exactly from the policy card or policy document.',
      kind: 'text',
      path: 'primaryInsured.policyNumber',
      placeholder: 'Policy number',
      validate: (v) => (!String(v || '').trim() ? 'Please enter the policy number.' : null),
    },
    {
      id: 'tpaId',
      title: 'What is the company / TPA ID number?',
      helper: 'If unsure, check the health card. This is usually printed near the policy details.',
      kind: 'text',
      path: 'primaryInsured.companyTpaId',
      placeholder: 'Company / TPA ID',
    },
    {
      id: 'certificateNumber',
      title: 'Do you have the certificate or social insurance number?',
      helper: 'Optional. If you do not have it, you can leave it blank.',
      kind: 'text',
      path: 'primaryInsured.certificateNumber',
      placeholder: 'Certificate / social insurance number',
    },
    {
      id: 'primaryAddress',
      title: 'What is the primary insured’s address?',
      helper: 'Use the correspondence address you want reflected in the claim form.',
      kind: 'textarea',
      path: 'primaryInsured.address',
      placeholder: 'House / street / area',
      validate: (v) => (!String(v || '').trim() ? 'Please enter the address.' : null),
    },
    { id: 'primaryCity', title: 'City?', kind: 'text', path: 'primaryInsured.city', placeholder: 'City', validate: (v) => (!v ? 'Enter the city.' : null) },
    { id: 'primaryState', title: 'State?', kind: 'text', path: 'primaryInsured.state', placeholder: 'State', validate: (v) => (!v ? 'Enter the state.' : null) },
    { id: 'primaryPin', title: 'PIN code?', kind: 'text', path: 'primaryInsured.pinCode', placeholder: 'PIN code', validate: (v) => (!v ? 'Enter the PIN code.' : null) },
    { id: 'primaryPhone', title: 'Phone number?', kind: 'text', path: 'primaryInsured.phone', placeholder: 'Phone number', validate: (v) => (!v ? 'Enter the phone number.' : null) },
    { id: 'primaryEmail', title: 'Email ID?', kind: 'text', path: 'primaryInsured.email', placeholder: 'Email address' },
    {
      id: 'patientAddressSame',
      title: 'Should I use the same address for the patient?',
      helper: 'If the patient address is different, I’ll ask for it separately.',
      kind: 'choice',
      path: 'patient.addressSameAsPrimary',
      options: [
        { label: 'Yes, same address', value: 'true' },
        { label: 'No, different address', value: 'false' },
      ],
      validate: (v) => (v === undefined ? 'Please choose one option.' : null),
    },
    { id: 'patientAddress', title: 'What is the patient’s address?', kind: 'textarea', path: 'patient.address', placeholder: 'Patient address', isVisible: (d) => !d.patient.addressSameAsPrimary, validate: (v) => (!v ? 'Please enter the patient address.' : null) },
    { id: 'patientCity', title: 'Patient city?', kind: 'text', path: 'patient.city', placeholder: 'City', isVisible: (d) => !d.patient.addressSameAsPrimary, validate: (v) => (!v ? 'Enter the city.' : null) },
    { id: 'patientState', title: 'Patient state?', kind: 'text', path: 'patient.state', placeholder: 'State', isVisible: (d) => !d.patient.addressSameAsPrimary, validate: (v) => (!v ? 'Enter the state.' : null) },
    { id: 'patientPin', title: 'Patient PIN code?', kind: 'text', path: 'patient.pinCode', placeholder: 'PIN code', isVisible: (d) => !d.patient.addressSameAsPrimary, validate: (v) => (!v ? 'Enter the PIN code.' : null) },
    { id: 'patientPhone', title: 'Patient phone number?', kind: 'text', path: 'patient.phone', placeholder: 'Phone number', isVisible: (d) => !d.patient.addressSameAsPrimary },
    { id: 'patientEmail', title: 'Patient email?', kind: 'text', path: 'patient.email', placeholder: 'Email ID', isVisible: (d) => !d.patient.addressSameAsPrimary },
    {
      id: 'occupation',
      title: 'What is the patient’s occupation?',
      helper: 'This is required in Section C. Use the closest standard option.',
      kind: 'choice',
      path: 'patient.occupation',
      options: [
        { label: 'Service', value: 'Service' },
        { label: 'Self employed', value: 'Self Employed' },
        { label: 'Homemaker', value: 'Homemaker' },
        { label: 'Student', value: 'Student' },
        { label: 'Retired', value: 'Retired' },
        { label: 'Other', value: 'Other' },
      ],
      validate: (v) => (!v ? 'Please choose the occupation.' : null),
    },
    {
      id: 'otherCover',
      title: 'Is the patient currently covered by any other mediclaim or health insurance?',
      kind: 'choice',
      path: 'insuranceHistory.coveredByOtherPolicy',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      validate: (v) => (!v ? 'Please choose yes or no.' : null),
    },
    {
      id: 'firstInsuranceStartDate',
      title: 'When did the first uninterrupted health insurance start?',
      helper: 'This corresponds to “date of commencement of first insurance without break.”',
      kind: 'date',
      path: 'insuranceHistory.firstInsuranceStartDate',
      validate: (v) => (!v ? 'Please enter the commencement date.' : null),
    },
    { id: 'otherInsurerName', title: 'What is the other insurer’s name?', kind: 'text', path: 'insuranceHistory.otherInsurerName', placeholder: 'Insurer name', isVisible: (d) => d.insuranceHistory.coveredByOtherPolicy === 'yes', validate: (v, d) => d.insuranceHistory.coveredByOtherPolicy === 'yes' && !v ? 'Please enter the company name.' : null },
    { id: 'otherPolicyNumber', title: 'What is that other policy number?', kind: 'text', path: 'insuranceHistory.otherPolicyNumber', placeholder: 'Policy number', isVisible: (d) => d.insuranceHistory.coveredByOtherPolicy === 'yes' },
    { id: 'otherSumInsured', title: 'What is the sum insured under that policy?', kind: 'money', path: 'insuranceHistory.otherSumInsured', placeholder: 'Amount in rupees', isVisible: (d) => d.insuranceHistory.coveredByOtherPolicy === 'yes' },
    {
      id: 'hospitalizedLast4Years',
      title: 'Has the patient been hospitalized in the last four years since inception?',
      kind: 'choice',
      path: 'insuranceHistory.hospitalizedLast4Years',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      validate: (v) => (!v ? 'Please choose yes or no.' : null),
    },
    { id: 'lastHospMonthYear', title: 'What was the month and year of that hospitalization?', kind: 'text', path: 'insuranceHistory.lastHospitalizationMonthYear', placeholder: 'MM-YYYY', isVisible: (d) => d.insuranceHistory.hospitalizedLast4Years === 'yes' },
    { id: 'lastHospDiagnosis', title: 'What was the diagnosis then?', kind: 'textarea', path: 'insuranceHistory.lastHospitalizationDiagnosis', placeholder: 'Diagnosis', isVisible: (d) => d.insuranceHistory.hospitalizedLast4Years === 'yes' },
    {
      id: 'previouslyCovered',
      title: 'Was the patient previously covered by any other mediclaim or health insurance?',
      kind: 'choice',
      path: 'insuranceHistory.previouslyCovered',
      options: [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ],
      validate: (v) => (!v ? 'Please choose yes or no.' : null),
    },
    { id: 'previousInsurerName', title: 'Which company covered the patient earlier?', kind: 'text', path: 'insuranceHistory.previousInsurerName', placeholder: 'Previous insurer name', isVisible: (d) => d.insuranceHistory.previouslyCovered === 'yes' },
    {
      id: 'claimType',
      title: 'What led to this hospitalization?',
      helper: 'This decides which date field I should treat as the key event date.',
      kind: 'choice',
      path: 'hospitalization.hospitalizationDueTo',
      options: [
        { label: 'Illness', value: 'illness' },
        { label: 'Injury', value: 'injury' },
        { label: 'Maternity', value: 'maternity' },
      ],
      validate: (v) => (!v ? 'Please choose one option.' : null),
    },
    {
      id: 'eventDate',
      title: draft.hospitalization.hospitalizationDueTo === 'maternity' ? 'What is the delivery date?' : draft.hospitalization.hospitalizationDueTo === 'injury' ? 'When did the injury happen?' : 'When was the disease first detected?',
      kind: 'date',
      path: 'hospitalization.eventDate',
      validate: (v) => (!v ? 'Please enter the relevant date.' : null),
    },
    { id: 'hospitalName', title: 'Which hospital admitted the patient?', kind: 'text', path: 'hospitalization.hospitalName', placeholder: 'Hospital name', validate: (v) => (!v ? 'Please enter the hospital name.' : null) },
    {
      id: 'roomCategory',
      title: 'Which room category was occupied?',
      kind: 'choice',
      path: 'hospitalization.roomCategory',
      options: [
        { label: 'Day care', value: 'Day care' },
        { label: 'Single occupancy', value: 'Single occupancy' },
        { label: 'Twin sharing', value: 'Twin sharing' },
        { label: '3 or more beds per room', value: '3 or more beds per room' },
      ],
      validate: (v) => (!v ? 'Please choose the room category.' : null),
    },
    { id: 'admissionDate', title: 'What is the admission date?', kind: 'date', path: 'hospitalization.admissionDate', validate: (v) => (!v ? 'Please enter the admission date.' : null) },
    { id: 'admissionTime', title: 'What is the admission time?', kind: 'text', path: 'hospitalization.admissionTime', placeholder: 'HH:MM', validate: (v) => (!v ? 'Please enter the admission time.' : null) },
    { id: 'dischargeDate', title: 'What is the discharge date?', kind: 'date', path: 'hospitalization.dischargeDate', validate: (v, d) => {
      if (!v) return 'Please enter the discharge date.';
      if (d.hospitalization.admissionDate && String(v) < d.hospitalization.admissionDate) return 'Discharge date cannot be before admission date.';
      return null;
    } },
    { id: 'dischargeTime', title: 'What is the discharge time?', kind: 'text', path: 'hospitalization.dischargeTime', placeholder: 'HH:MM', validate: (v) => (!v ? 'Please enter the discharge time.' : null) },
    {
      id: 'injuryCause',
      title: 'What caused the injury?',
      kind: 'choice',
      path: 'hospitalization.injuryCause',
      isVisible: (d) => d.hospitalization.hospitalizationDueTo === 'injury',
      options: [
        { label: 'Self inflicted', value: 'Self inflicted' },
        { label: 'Road traffic accident', value: 'Road Traffic Accident' },
        { label: 'Substance abuse / alcohol consumption', value: 'Substance Abuse / Alcohol Consumption' },
        { label: 'Other / not sure', value: 'Other' },
      ],
    },
    { id: 'medicoLegal', title: 'Was this medico-legal?', kind: 'choice', path: 'hospitalization.medicoLegal', isVisible: (d) => d.hospitalization.hospitalizationDueTo === 'injury', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    { id: 'policeReported', title: 'Was it reported to the police?', kind: 'choice', path: 'hospitalization.policeReported', isVisible: (d) => d.hospitalization.hospitalizationDueTo === 'injury', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    { id: 'firAttached', title: 'Are MLC report and police FIR attached?', kind: 'choice', path: 'hospitalization.firAttached', isVisible: (d) => d.hospitalization.hospitalizationDueTo === 'injury', options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    { id: 'systemOfMedicine', title: 'What system of medicine was used?', kind: 'text', path: 'hospitalization.systemOfMedicine', placeholder: 'Allopathy / AYUSH / other', validate: (v) => (!v ? 'Please enter the system of medicine.' : null) },
    { id: 'preHosp', title: 'How much are you claiming as pre-hospitalization expenses?', kind: 'money', path: 'claim.preHospitalization', placeholder: '0' },
    { id: 'hospitalizationAmount', title: 'How much are you claiming as hospitalization expenses?', kind: 'money', path: 'claim.hospitalization', placeholder: '0', validate: (v) => (!v ? 'Please enter the hospitalization amount.' : null) },
    { id: 'postHosp', title: 'How much are you claiming as post-hospitalization expenses?', kind: 'money', path: 'claim.postHospitalization', placeholder: '0' },
    { id: 'healthCheckup', title: 'Any health check-up cost being claimed?', kind: 'money', path: 'claim.healthCheckup', placeholder: '0' },
    { id: 'ambulance', title: 'Any ambulance charges being claimed?', kind: 'money', path: 'claim.ambulance', placeholder: '0' },
    { id: 'otherExpenseCode', title: 'Any other treatment expense code to mention?', kind: 'text', path: 'claim.otherExpenseCode', placeholder: 'Leave blank if none' },
    { id: 'otherExpenseAmount', title: 'Any other treatment expense amount?', kind: 'money', path: 'claim.otherExpenseAmount', placeholder: '0' },
    { id: 'preHospDays', title: 'How many pre-hospitalization days should be shown?', kind: 'text', path: 'claim.preHospitalizationDays', placeholder: 'Days' },
    { id: 'postHospDays', title: 'How many post-hospitalization days should be shown?', kind: 'text', path: 'claim.postHospitalizationDays', placeholder: 'Days' },
    {
      id: 'domiciliary',
      title: 'Is this a claim for domiciliary hospitalization?',
      kind: 'choice',
      path: 'hospitalization.domiciliaryClaim',
      options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }],
      validate: (v) => (!v ? 'Please choose yes or no.' : null),
    },
    { id: 'hospitalDailyCash', title: 'Any hospital daily cash benefit being claimed?', kind: 'money', path: 'claim.hospitalDailyCash', placeholder: '0' },
    { id: 'surgicalCash', title: 'Any surgical cash benefit being claimed?', kind: 'money', path: 'claim.surgicalCash', placeholder: '0' },
    { id: 'criticalIllness', title: 'Any critical illness benefit being claimed?', kind: 'money', path: 'claim.criticalIllness', placeholder: '0' },
    { id: 'convalescence', title: 'Any convalescence benefit being claimed?', kind: 'money', path: 'claim.convalescence', placeholder: '0' },
    { id: 'prePostLumpSum', title: 'Any pre/post hospitalization lump sum benefit?', kind: 'money', path: 'claim.prePostLumpSum', placeholder: '0' },
    { id: 'otherBenefit', title: 'Any other cash benefit to mention?', kind: 'money', path: 'claim.otherBenefit', placeholder: '0' },
    {
      id: 'documents',
      title: 'Which claim documents do you already have ready?',
      helper: 'Pick whatever is available now. This improves completeness and reduces back-and-forth later.',
      kind: 'multiselect',
      path: 'claim.claimDocuments',
      options: DOC_OPTIONS.map((item) => ({ label: item, value: item })),
    },
    {
      id: 'bills',
      title: 'Add the bills you want printed in the enclosed bills table.',
      helper: 'Keep this short for the MVP. Add the main bill first, then any major pre/post or pharmacy bills.',
      kind: 'bills',
    },
    { id: 'pan', title: 'What is the PAN for the primary insured?', kind: 'text', path: 'bank.pan', placeholder: 'PAN', validate: (v) => (!v ? 'Please enter the PAN.' : null) },
    { id: 'accountNumber', title: 'Which bank account should receive the reimbursement?', kind: 'text', path: 'bank.accountNumber', placeholder: 'Account number', validate: (v) => (!v ? 'Please enter the account number.' : null) },
    { id: 'bankName', title: 'What is the bank name?', kind: 'text', path: 'bank.bankName', placeholder: 'Bank name', validate: (v) => (!v ? 'Please enter the bank name.' : null) },
    { id: 'branch', title: 'What is the bank branch?', kind: 'text', path: 'bank.branch', placeholder: 'Branch', validate: (v) => (!v ? 'Please enter the branch.' : null) },
    { id: 'payeeName', title: 'In whose name should the cheque / DD be payable?', kind: 'text', path: 'bank.payeeName', placeholder: 'Payee name', validate: (v) => (!v ? 'Please enter the payee name.' : null) },
    { id: 'ifsc', title: 'What is the IFSC code?', kind: 'text', path: 'bank.ifsc', placeholder: 'IFSC', validate: (v) => (!v ? 'Please enter the IFSC code.' : null) },
    { id: 'declarationPlace', title: 'Which place should appear in the insured declaration?', kind: 'text', path: 'declaration.place', placeholder: 'Place', validate: (v) => (!v ? 'Please enter the place.' : null) },
    { id: 'declarationDate', title: 'What is the declaration date?', kind: 'date', path: 'declaration.date', validate: (v) => (!v ? 'Please enter the declaration date.' : null) },
  ].filter((step) => (step.isVisible ? step.isVisible(draft) : true));
}

export default function Wizard({ draft, onChange, onBackToHome, onExport, onReview }: Props) {
  const steps = useMemo(() => buildSteps(draft), [draft]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const step = steps[index];
  const currentValue = getByPath(draft, step.path);
  const age = getAgeFromDob(draft.patient.dateOfBirth);

  const goNext = () => {
    const validation = step.validate?.(currentValue, draft) || null;
    if (validation) {
      setError(validation);
      return;
    }
    setError(null);
    if (index === steps.length - 1) {
      onReview();
      return;
    }
    setIndex((value) => value + 1);
  };

  const goBack = () => {
    setError(null);
    setIndex((value) => Math.max(0, value - 1));
  };

  const updateValue = (value: unknown, autoAdvance = false) => {
    if (!step.path) return;
    const normalized = step.path === 'patient.addressSameAsPrimary' ? value === 'true' : value;
    const next = setByPath(draft, step.path, normalized);
    if (step.path === 'patient.addressSameAsPrimary' && normalized === true) {
      next.patient.address = '';
      next.patient.city = '';
      next.patient.state = '';
      next.patient.pinCode = '';
      next.patient.phone = '';
      next.patient.email = '';
    }
    onChange(next);
    setError(null);
    if (autoAdvance) {
      setTimeout(() => {
        const currentValidation = step.validate?.(normalized, next) || null;
        if (!currentValidation) setIndex((v) => Math.min(v + 1, steps.length - 1));
      }, 120);
    }
  };

  const updateBills = (rowIndex: number, field: string, value: string) => {
    const bills = draft.claim.bills.map((row, idx) => (idx === rowIndex ? { ...row, [field]: value } : row));
    onChange({ ...draft, claim: { ...draft.claim, bills } });
  };

  const addBillRow = () => {
    onChange({
      ...draft,
      claim: {
        ...draft.claim,
        bills: [...draft.claim.bills, { billNo: '', date: '', issuedBy: '', towards: '', amount: '' }],
      },
    });
  };

  const removeBillRow = (rowIndex: number) => {
    onChange({
      ...draft,
      claim: {
        ...draft.claim,
        bills: draft.claim.bills.filter((_, idx) => idx !== rowIndex),
      },
    });
  };

  const progress = Math.round(((index + 1) / steps.length) * 100);

  return (
    <main className="wizard-shell">
      <header className="topbar compact">
        <div>
          <div className="brand">ClaimEase</div>
          <div className="subtle">One clear question at a time.</div>
        </div>
        <div className="topbar-actions">
          <button className="ghost-btn" onClick={onBackToHome}>Home</button>
          <button className="ghost-btn" onClick={onExport}>Export JSON</button>
        </div>
      </header>

      <section className="wizard-stage">
        <div className="progress-wrap">
          <div className="progress-meta">
            <span>Step {index + 1} of {steps.length}</span>
            <span>{progress}%</span>
          </div>
          <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
        </div>

        <div className="assistant-chip">
          <div className="assistant-emoji">🧾</div>
          <div>
            <strong>ClaimBuddy mode</strong>
            <p>I’ll only ask what is needed for Part A. Age is derived from date of birth, and Part B stays blank for the hospital.</p>
          </div>
        </div>

        <section className="question-card">
          <div className="question-eyebrow">{step.id.replace(/([A-Z])/g, ' $1')}</div>
          <h1>{step.title}</h1>
          {step.helper && <p className="question-helper">{step.helper}</p>}

          {step.kind === 'choice' && (
            <div className="choice-stack">
              {step.options?.map((option) => {
                const selected = String(currentValue) === option.value || (typeof currentValue === 'boolean' && String(currentValue) === option.value);
                return (
                  <button
                    key={option.value}
                    className={`choice-tile ${selected ? 'selected' : ''}`}
                    onClick={() => updateValue(option.value, true)}
                    type="button"
                  >
                    <span>{option.label}</span>
                    {option.hint && <small>{option.hint}</small>}
                  </button>
                );
              })}
            </div>
          )}

          {(step.kind === 'text' || step.kind === 'date' || step.kind === 'money') && (
            <div className="input-wrap single">
              <input
                type={step.kind === 'date' ? 'date' : 'text'}
                inputMode={step.kind === 'money' ? 'numeric' : 'text'}
                value={String(currentValue || '')}
                placeholder={step.placeholder}
                onChange={(e) => updateValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && goNext()}
                autoFocus
              />
              {step.path === 'patient.dateOfBirth' && draft.patient.dateOfBirth && (
                <div className="derived-note">Derived age for the form: {age.years || '0'} years {age.months || '0'} months</div>
              )}
            </div>
          )}

          {step.kind === 'textarea' && (
            <div className="input-wrap">
              <textarea
                rows={4}
                value={String(currentValue || '')}
                placeholder={step.placeholder}
                onChange={(e) => updateValue(e.target.value)}
                autoFocus
              />
            </div>
          )}

          {step.kind === 'multiselect' && (
            <div className="multi-grid">
              {step.options?.map((option) => {
                const selected = draft.claim.claimDocuments.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`multi-tile ${selected ? 'selected' : ''}`}
                    onClick={() => {
                      const values = selected
                        ? draft.claim.claimDocuments.filter((item) => item !== option.value)
                        : [...draft.claim.claimDocuments, option.value];
                      onChange({ ...draft, claim: { ...draft.claim, claimDocuments: values } });
                    }}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}

          {step.kind === 'bills' && (
            <div className="bills-editor">
              {draft.claim.bills.map((row, rowIndex) => (
                <div className="bill-row-card" key={`${rowIndex}-${row.billNo}`}>
                  <div className="bill-row-grid">
                    <input placeholder="Bill no" value={row.billNo} onChange={(e) => updateBills(rowIndex, 'billNo', e.target.value)} />
                    <input type="date" value={row.date} onChange={(e) => updateBills(rowIndex, 'date', e.target.value)} />
                    <input placeholder="Issued by" value={row.issuedBy} onChange={(e) => updateBills(rowIndex, 'issuedBy', e.target.value)} />
                    <input placeholder="Towards" value={row.towards} onChange={(e) => updateBills(rowIndex, 'towards', e.target.value)} />
                    <input placeholder="Amount" value={row.amount} onChange={(e) => updateBills(rowIndex, 'amount', e.target.value)} />
                  </div>
                  {draft.claim.bills.length > 1 && <button className="link-btn" onClick={() => removeBillRow(rowIndex)}>Remove</button>}
                </div>
              ))}
              <button className="ghost-btn" onClick={addBillRow}>Add another bill</button>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          <div className="nav-row">
            <button className="ghost-btn" onClick={goBack} disabled={index === 0}>Back</button>
            {step.kind !== 'choice' && <button className="primary-btn" onClick={goNext}>{index === steps.length - 1 ? 'Review form' : 'Next'}</button>}
          </div>
        </section>
      </section>
    </main>
  );
}
