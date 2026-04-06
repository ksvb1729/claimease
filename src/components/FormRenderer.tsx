import type { ClaimDraft } from '../App';
import partA from '../assets/claim-form-part-a.png';
import partB from '../assets/claim-form-part-b.png';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatMonthYear(value: string) {
  if (!value) return '';
  if (/^\d{2}-\d{4}$/.test(value)) return value;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

function formatCurrency(v: string) {
  if (!v) return '';
  return String(v).replace(/,/g, '');
}

function ageFromDob(dob: string) {
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
  return { years: String(Math.max(0, years)), months: String(Math.max(0, months)) };
}

function joinAddress(address: string, city: string, state: string, pin: string) {
  return [address, city, state, pin].filter(Boolean).join(', ');
}

function fitClass(value: string, max = 24) {
  const len = value?.length || 0;
  if (len > max + 20) return 'tiny';
  if (len > max) return 'small';
  return '';
}

type OverlayField = {
  value: string;
  top: number;
  left: number;
  width: number;
  align?: 'left' | 'center' | 'right';
};

function renderField(field: OverlayField, index: number) {
  return (
    <div
      key={index}
      className={`overlay-text ${fitClass(field.value)}`}
      style={{ top: `${field.top}%`, left: `${field.left}%`, width: `${field.width}%`, textAlign: field.align || 'left' }}
    >
      {field.value}
    </div>
  );
}

export default function FormRenderer({ draft }: { draft: ClaimDraft }) {
  const age = ageFromDob(draft.patient.dateOfBirth);
  const patientAddress = draft.patient.addressSameAsPrimary
    ? joinAddress(draft.primaryInsured.address, draft.primaryInsured.city, draft.primaryInsured.state, draft.primaryInsured.pinCode)
    : joinAddress(draft.patient.address, draft.patient.city, draft.patient.state, draft.patient.pinCode);

  const partAFields: OverlayField[] = [
    { value: draft.primaryInsured.policyNumber, top: 6.35, left: 12.4, width: 22 },
    { value: draft.primaryInsured.certificateNumber, top: 6.35, left: 76.6, width: 15 },
    { value: draft.primaryInsured.companyTpaId, top: 8.45, left: 14.8, width: 23 },
    { value: draft.primaryInsured.fullName, top: 10.25, left: 10.8, width: 62 },
    { value: draft.primaryInsured.address, top: 12.35, left: 9.4, width: 83 },
    { value: draft.primaryInsured.city, top: 16.05, left: 8.2, width: 18 },
    { value: draft.primaryInsured.state, top: 16.05, left: 52.6, width: 12 },
    { value: draft.primaryInsured.pinCode, top: 18.0, left: 10.5, width: 12 },
    { value: draft.primaryInsured.phone, top: 18.0, left: 31.1, width: 16 },
    { value: draft.primaryInsured.email, top: 18.0, left: 69.4, width: 23 },
    { value: draft.insuranceHistory.coveredByOtherPolicy === 'yes' ? 'Yes' : draft.insuranceHistory.coveredByOtherPolicy === 'no' ? 'No' : '', top: 22.2, left: 62.8, width: 7 },
    { value: formatDate(draft.insuranceHistory.firstInsuranceStartDate), top: 22.2, left: 86, width: 11, align: 'center' },
    { value: draft.insuranceHistory.otherInsurerName, top: 24.35, left: 8.3, width: 22 },
    { value: draft.insuranceHistory.otherPolicyNumber, top: 24.35, left: 50.3, width: 18 },
    { value: formatCurrency(draft.insuranceHistory.otherSumInsured), top: 26.25, left: 17.1, width: 14 },
    { value: draft.insuranceHistory.hospitalizedLast4Years === 'yes' ? 'Yes' : draft.insuranceHistory.hospitalizedLast4Years === 'no' ? 'No' : '', top: 26.25, left: 76.5, width: 7 },
    { value: formatMonthYear(draft.insuranceHistory.lastHospitalizationMonthYear), top: 26.25, left: 92.5, width: 8, align: 'center' },
    { value: draft.insuranceHistory.lastHospitalizationDiagnosis, top: 28.1, left: 12.4, width: 24 },
    { value: draft.insuranceHistory.previouslyCovered === 'yes' ? 'Yes' : draft.insuranceHistory.previouslyCovered === 'no' ? 'No' : '', top: 28.1, left: 77.1, width: 7 },
    { value: draft.insuranceHistory.previousInsurerName, top: 29.9, left: 14.5, width: 24 },
    { value: draft.patient.fullName, top: 33.25, left: 8.4, width: 63 },
    { value: draft.patient.gender, top: 35.1, left: 23.2, width: 8 },
    { value: age.years, top: 35.1, left: 42.4, width: 4, align: 'center' },
    { value: age.months, top: 35.1, left: 54.5, width: 4, align: 'center' },
    { value: formatDate(draft.patient.dateOfBirth), top: 35.1, left: 72.7, width: 18 },
    { value: draft.patient.relationship, top: 36.95, left: 28.5, width: 20 },
    { value: draft.patient.occupation, top: 38.85, left: 19.2, width: 24 },
    { value: patientAddress, top: 41.2, left: 15.1, width: 77 },
    { value: draft.patient.addressSameAsPrimary ? draft.primaryInsured.city : draft.patient.city, top: 44.7, left: 8.2, width: 18 },
    { value: draft.patient.addressSameAsPrimary ? draft.primaryInsured.state : draft.patient.state, top: 44.7, left: 52.8, width: 12 },
    { value: draft.patient.addressSameAsPrimary ? draft.primaryInsured.pinCode : draft.patient.pinCode, top: 46.6, left: 10.3, width: 12 },
    { value: draft.patient.addressSameAsPrimary ? draft.primaryInsured.phone : draft.patient.phone, top: 46.6, left: 31.3, width: 16 },
    { value: draft.patient.addressSameAsPrimary ? draft.primaryInsured.email : draft.patient.email, top: 46.6, left: 69.5, width: 23 },
    { value: draft.hospitalization.hospitalName, top: 50.2, left: 22.6, width: 47 },
    { value: draft.hospitalization.roomCategory, top: 52.1, left: 24.2, width: 34 },
    { value: draft.hospitalization.hospitalizationDueTo, top: 54.1, left: 21.5, width: 16 },
    { value: formatDate(draft.hospitalization.eventDate), top: 54.1, left: 79.7, width: 15, align: 'center' },
    { value: formatDate(draft.hospitalization.admissionDate), top: 56.05, left: 17.5, width: 14, align: 'center' },
    { value: draft.hospitalization.admissionTime, top: 56.05, left: 43.8, width: 8, align: 'center' },
    { value: formatDate(draft.hospitalization.dischargeDate), top: 56.05, left: 59.8, width: 14, align: 'center' },
    { value: draft.hospitalization.dischargeTime, top: 56.05, left: 86.6, width: 8, align: 'center' },
    { value: draft.hospitalization.injuryCause, top: 58.2, left: 18.2, width: 35 },
    { value: draft.hospitalization.medicoLegal, top: 58.2, left: 77.6, width: 7 },
    { value: draft.hospitalization.policeReported, top: 60.0, left: 35.2, width: 7 },
    { value: draft.hospitalization.firAttached, top: 60.0, left: 70.7, width: 7 },
    { value: draft.hospitalization.systemOfMedicine, top: 60.0, left: 85.4, width: 12 },
    { value: formatCurrency(draft.claim.preHospitalization), top: 64.1, left: 27.1, width: 11, align: 'right' },
    { value: formatCurrency(draft.claim.hospitalization), top: 64.1, left: 61.8, width: 11, align: 'right' },
    { value: formatCurrency(draft.claim.postHospitalization), top: 66.0, left: 27.1, width: 11, align: 'right' },
    { value: formatCurrency(draft.claim.healthCheckup), top: 66.0, left: 61.8, width: 11, align: 'right' },
    { value: formatCurrency(draft.claim.ambulance), top: 67.9, left: 27.1, width: 11, align: 'right' },
    { value: `${draft.claim.otherExpenseCode} ${formatCurrency(draft.claim.otherExpenseAmount)}`.trim(), top: 67.9, left: 61.8, width: 16, align: 'right' },
    { value: draft.claim.preHospitalizationDays, top: 70.0, left: 27.5, width: 8, align: 'center' },
    { value: draft.claim.postHospitalizationDays, top: 70.0, left: 61.6, width: 8, align: 'center' },
    { value: draft.hospitalization.domiciliaryClaim, top: 72.0, left: 31.6, width: 7 },
    { value: formatCurrency(draft.claim.hospitalDailyCash), top: 74.0, left: 28.2, width: 10, align: 'right' },
    { value: formatCurrency(draft.claim.surgicalCash), top: 74.0, left: 60.5, width: 10, align: 'right' },
    { value: formatCurrency(draft.claim.criticalIllness), top: 75.9, left: 28.2, width: 10, align: 'right' },
    { value: formatCurrency(draft.claim.convalescence), top: 75.9, left: 60.5, width: 10, align: 'right' },
    { value: formatCurrency(draft.claim.prePostLumpSum), top: 77.8, left: 31.4, width: 10, align: 'right' },
    { value: formatCurrency(draft.claim.otherBenefit), top: 77.8, left: 60.5, width: 10, align: 'right' },
    { value: draft.bank.pan, top: 94.15, left: 8.8, width: 28 },
    { value: draft.bank.accountNumber, top: 94.15, left: 55.7, width: 23 },
    { value: `${draft.bank.bankName} ${draft.bank.branch}`.trim(), top: 96.05, left: 16.2, width: 48 },
    { value: draft.bank.payeeName, top: 98.0, left: 24.2, width: 29 },
    { value: draft.bank.ifsc, top: 98.0, left: 79.8, width: 15 },
  ];

  return (
    <div className="render-shell">
      <section className="review-summary-card">
        <h2>Review summary</h2>
        <p>
          Part A is prefilled from the wizard. Part B is intentionally left blank because the official form says it is to be filled by the hospital.
        </p>
        <ul>
          <li>Patient: {draft.patient.fullName || '—'}</li>
          <li>Hospital: {draft.hospitalization.hospitalName || '—'}</li>
          <li>Claimed hospitalization amount: ₹{formatCurrency(draft.claim.hospitalization) || '0'}</li>
          <li>Declaration date: {formatDate(draft.declaration.date) || '—'}</li>
        </ul>
      </section>

      <section className="form-page-wrap">
        <div className="form-caption">Part A — to be filled in by the insured</div>
        <div className="form-page">
          <img src={partA} alt="IRDAI claim form Part A" className="form-bg" />
          <div className="overlay-layer">{partAFields.map(renderField)}</div>
        </div>
      </section>

      <section className="form-page-wrap">
        <div className="form-caption">Part B — left blank for the hospital / provider</div>
        <div className="form-page">
          <img src={partB} alt="IRDAI claim form Part B blank" className="form-bg" />
        </div>
      </section>
    </div>
  );
}
