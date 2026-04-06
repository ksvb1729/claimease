import { ClaimDraft } from '../schema/types';

export type WizardStep = {
  id: string;
  title: string;
  description: string;
  fields: string[];
};

export const wizardSteps: WizardStep[] = [
  {
    id: 'intro',
    title: 'Before you start',
    description: 'Collect the policy, discharge summary, bills, bank details, PAN, and patient ID proof.',
    fields: [],
  },
  {
    id: 'policy',
    title: 'Primary insured details',
    description: 'These map to Part A, Section A of the insurer form.',
    fields: ['primaryInsured'],
  },
  {
    id: 'history',
    title: 'Insurance history',
    description: 'Collect other cover and recent hospitalization history.',
    fields: ['insuranceHistory'],
  },
  {
    id: 'patient',
    title: 'Patient details',
    description: 'Ask about the person who was hospitalized.',
    fields: ['insuredPatient'],
  },
  {
    id: 'hospitalization',
    title: 'Hospital stay',
    description: 'Admission, discharge, room category, injury or illness, and system of medicine.',
    fields: ['hospitalization'],
  },
  {
    id: 'expenses',
    title: 'Claim amounts and documents',
    description: 'Capture claim heads and bill lines exactly the way the form expects them.',
    fields: ['treatmentExpenses', 'documentsA', 'bills'],
  },
  {
    id: 'bank',
    title: 'Payment details and declaration',
    description: 'Capture reimbursement destination and insured declaration.',
    fields: ['bankDetails', 'declarationA'],
  },
  {
    id: 'hospital-part-b',
    title: 'Hospital section',
    description: 'Part B is usually completed by the hospital, but the app can pre-stage it.',
    fields: ['hospitalB', 'patientB', 'diagnosisB', 'documentsB', 'nonNetworkHospitalB', 'declarationB'],
  },
  {
    id: 'review',
    title: 'Review and print',
    description: 'Render official pages, embed page-level QR, export JSON, and print.',
    fields: [],
  },
];

export function formatName(name: { surname: string; firstName: string; middleName: string }) {
  return [name.surname, name.firstName, name.middleName].filter(Boolean).join(' ');
}

export function currencyTotal(values: string[]) {
  return values.reduce((acc, current) => acc + (Number(current) || 0), 0);
}

export function computePartATotal(draft: ClaimDraft) {
  return currencyTotal([
    draft.treatmentExpenses.preHospitalization,
    draft.treatmentExpenses.hospitalization,
    draft.treatmentExpenses.postHospitalization,
    draft.treatmentExpenses.healthCheckup,
    draft.treatmentExpenses.ambulance,
    draft.treatmentExpenses.others,
    draft.treatmentExpenses.hospitalDailyCash,
    draft.treatmentExpenses.surgicalCash,
    draft.treatmentExpenses.criticalIllnessBenefit,
    draft.treatmentExpenses.convalescence,
    draft.treatmentExpenses.prePostLumpSum,
    draft.treatmentExpenses.othersBenefit,
  ]);
}

export function computeBillsTotal(draft: ClaimDraft) {
  return currencyTotal(draft.bills.map((line) => line.amount));
}

export function validateDraft(draft: ClaimDraft) {
  const issues: string[] = [];
  if (!draft.primaryInsured.policyNo) issues.push('Policy number is missing.');
  if (!draft.insuredPatient.name.firstName) issues.push('Patient first name is missing.');
  if (!draft.hospitalization.hospitalName) issues.push('Hospital name is missing.');
  if (draft.hospitalization.admissionDate && draft.hospitalization.dischargeDate) {
    const admission = new Date(draft.hospitalization.admissionDate);
    const discharge = new Date(draft.hospitalization.dischargeDate);
    if (discharge < admission) issues.push('Discharge date cannot be earlier than admission date.');
  }
  if (!draft.bankDetails.accountNumber) issues.push('Bank account number is missing.');
  if (!draft.bankDetails.ifsc) issues.push('IFSC code is missing.');
  return issues;
}
