import { ClaimDraft } from '../schema/types';
import { computeBillsTotal, computePartATotal, formatName } from './claimEngine';

export function buildPagePayload(page: 'part-a' | 'part-b', draft: ClaimDraft) {
  if (page === 'part-a') {
    return {
      schema: 'claimease.qr.v1',
      claimRef: draft.claimRef,
      page: 'part-a',
      policyNo: draft.primaryInsured.policyNo,
      patient: formatName(draft.insuredPatient.name),
      hospital: draft.hospitalization.hospitalName,
      admissionDate: draft.hospitalization.admissionDate,
      dischargeDate: draft.hospitalization.dischargeDate,
      totalClaimed: computePartATotal(draft),
      totalBills: computeBillsTotal(draft),
    };
  }

  return {
    schema: 'claimease.qr.v1',
    claimRef: draft.claimRef,
    page: 'part-b',
    hospitalId: draft.hospitalB.hospitalId,
    hospital: draft.hospitalB.hospitalName,
    patient: formatName(draft.patientB.patientName),
    ipRegistrationNumber: draft.patientB.ipRegistrationNumber,
    totalClaimedAmount: draft.patientB.totalClaimedAmount,
    primaryDiagnosis: draft.diagnosisB.primaryDiagnosis.code,
    procedure1: draft.diagnosisB.procedure1.code,
  };
}
