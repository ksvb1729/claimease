import { ChangeEvent } from 'react';
import { ClaimDraft } from '../schema/types';
import { wizardSteps } from '../lib/claimEngine';

type Props = {
  draft: ClaimDraft;
  stepIndex: number;
  onStepChange: (next: number) => void;
  onDraftChange: (updater: (current: ClaimDraft) => ClaimDraft) => void;
};

function updateText<T>(setter: (value: string) => T) {
  return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setter(event.target.value);
}

export function Wizard({ draft, stepIndex, onStepChange, onDraftChange }: Props) {
  const step = wizardSteps[stepIndex];

  const next = () => onStepChange(Math.min(stepIndex + 1, wizardSteps.length - 1));
  const prev = () => onStepChange(Math.max(stepIndex - 1, 0));

  return (
    <div className="wizard-shell">
      <aside className="wizard-rail">
        {wizardSteps.map((wizardStep, index) => (
          <button
            key={wizardStep.id}
            className={`rail-step ${index === stepIndex ? 'active' : ''}`}
            onClick={() => onStepChange(index)}
          >
            <span>{index + 1}</span>
            <div>
              <strong>{wizardStep.title}</strong>
              <small>{wizardStep.description}</small>
            </div>
          </button>
        ))}
      </aside>

      <section className="wizard-card">
        <div className="wizard-head">
          <div>
            <p className="eyebrow">ClaimEase wizard</p>
            <h2>{step.title}</h2>
            <p>{step.description}</p>
          </div>
          <div className="ref-pill">{draft.claimRef}</div>
        </div>

        {step.id === 'intro' && (
          <div className="stack-gap">
            <div className="notice-box">
              This flow mirrors the official insurer form, but asks questions in human language and stages hospital-only fields separately.
            </div>
            <ul className="clean-list">
              <li>Nothing is sent to a backend.</li>
              <li>Use Export JSON to save progress.</li>
              <li>Imported JSON reconstructs the full draft instantly.</li>
              <li>Rendered form pages carry page-level QR payloads for machine extraction.</li>
            </ul>
          </div>
        )}

        {step.id === 'policy' && (
          <div className="form-grid two">
            <label>Policy number<input value={draft.primaryInsured.policyNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, policyNo: value } })))} /></label>
            <label>Certificate number<input value={draft.primaryInsured.certificateNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, certificateNo: value } })))} /></label>
            <label>Company / TPA ID<input value={draft.primaryInsured.companyTpaIdNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, companyTpaIdNo: value } })))} /></label>
            <label>Surname<input value={draft.primaryInsured.name.surname} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, name: { ...current.primaryInsured.name, surname: value } } })))} /></label>
            <label>First name<input value={draft.primaryInsured.name.firstName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, name: { ...current.primaryInsured.name, firstName: value } } })))} /></label>
            <label>Middle name<input value={draft.primaryInsured.name.middleName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, name: { ...current.primaryInsured.name, middleName: value } } })))} /></label>
            <label className="span-2">Address<input value={draft.primaryInsured.address.line1} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, line1: value } } })))} /></label>
            <label>City<input value={draft.primaryInsured.address.city} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, city: value } } })))} /></label>
            <label>State<input value={draft.primaryInsured.address.state} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, state: value } } })))} /></label>
            <label>PIN<input value={draft.primaryInsured.address.pinCode} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, pinCode: value } } })))} /></label>
            <label>Phone<input value={draft.primaryInsured.address.phone} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, phone: value } } })))} /></label>
            <label>Email<input value={draft.primaryInsured.address.email} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, address: { ...current.primaryInsured.address, email: value } } })))} /></label>
          </div>
        )}

        {step.id === 'history' && (
          <div className="form-grid two">
            <label>Currently covered by another health policy?
              <select value={draft.insuranceHistory.currentOtherCover} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherCover: value as typeof current.insuranceHistory.currentOtherCover } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
            <label>First insurance start date<input type="date" value={draft.insuranceHistory.firstInsuranceStart} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, firstInsuranceStart: value } })))} /></label>
            <label>Other insurer<input value={draft.insuranceHistory.currentOtherCompanyName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherCompanyName: value } })))} /></label>
            <label>Other policy no<input value={draft.insuranceHistory.currentOtherPolicyNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherPolicyNo: value } })))} /></label>
            <label>Other sum insured<input value={draft.insuranceHistory.currentOtherSumInsured} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherSumInsured: value } })))} /></label>
            <label>Hospitalized in last 4 years?
              <select value={draft.insuranceHistory.hospitalizedLastFourYears} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, hospitalizedLastFourYears: value as typeof current.insuranceHistory.hospitalizedLastFourYears } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
            <label>Last hospitalization date<input type="month" value={draft.insuranceHistory.lastHospitalizationDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, lastHospitalizationDate: value } })))} /></label>
            <label className="span-2">Diagnosis<textarea value={draft.insuranceHistory.lastHospitalizationDiagnosis} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, lastHospitalizationDiagnosis: value } })))} /></label>
          </div>
        )}

        {step.id === 'patient' && (
          <div className="form-grid two">
            <label>Surname<input value={draft.insuredPatient.name.surname} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, surname: value } } })))} /></label>
            <label>First name<input value={draft.insuredPatient.name.firstName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, firstName: value } } })))} /></label>
            <label>Middle name<input value={draft.insuredPatient.name.middleName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, middleName: value } } })))} /></label>
            <label>Gender<select value={draft.insuredPatient.gender} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, gender: value as typeof current.insuredPatient.gender } })))}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
            <label>Age in years<input value={draft.insuredPatient.ageYears} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, ageYears: value } })))} /></label>
            <label>Age in months<input value={draft.insuredPatient.ageMonths} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, ageMonths: value } })))} /></label>
            <label>Date of birth<input type="date" value={draft.insuredPatient.dob} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, dob: value } })))} /></label>
            <label>Relationship<select value={draft.insuredPatient.relationship} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, relationship: value as typeof current.insuredPatient.relationship } })))}><option value="">Select</option><option value="self">Self</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select></label>
            <label>Occupation<select value={draft.insuredPatient.occupation} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, occupation: value as typeof current.insuredPatient.occupation } })))}><option value="">Select</option><option value="service">Service</option><option value="self_employed">Self-employed</option><option value="homemaker">Homemaker</option><option value="student">Student</option><option value="retired">Retired</option><option value="other">Other</option></select></label>
            <label className="span-2">Address<input value={draft.insuredPatient.address.line1} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, line1: value } } })))} /></label>
          </div>
        )}

        {step.id === 'hospitalization' && (
          <div className="form-grid two">
            <label className="span-2">Hospital name<input value={draft.hospitalization.hospitalName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, hospitalName: value } })))} /></label>
            <label>Room category<select value={draft.hospitalization.roomCategory} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, roomCategory: value as typeof current.hospitalization.roomCategory } })))}><option value="">Select</option><option value="day_care">Day care</option><option value="single">Single</option><option value="twin">Twin sharing</option><option value="multi">3 or more beds</option></select></label>
            <label>Hospitalization due to<select value={draft.hospitalization.dueTo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dueTo: value as typeof current.hospitalization.dueTo } })))}><option value="">Select</option><option value="injury">Injury</option><option value="illness">Illness</option><option value="maternity">Maternity</option></select></label>
            <label>Event date<input type="date" value={draft.hospitalization.eventDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, eventDate: value } })))} /></label>
            <label>Admission date<input type="date" value={draft.hospitalization.admissionDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, admissionDate: value } })))} /></label>
            <label>Admission time<input type="time" value={draft.hospitalization.admissionTime} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, admissionTime: value } })))} /></label>
            <label>Discharge date<input type="date" value={draft.hospitalization.dischargeDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dischargeDate: value } })))} /></label>
            <label>Discharge time<input type="time" value={draft.hospitalization.dischargeTime} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dischargeTime: value } })))} /></label>
            <label>System of medicine<input value={draft.hospitalization.systemOfMedicine} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, systemOfMedicine: value } })))} /></label>
          </div>
        )}

        {step.id === 'expenses' && (
          <div className="form-grid two">
            <label>Pre-hospitalization (Rs.)<input value={draft.treatmentExpenses.preHospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, preHospitalization: value } })))} /></label>
            <label>Hospitalization (Rs.)<input value={draft.treatmentExpenses.hospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, hospitalization: value } })))} /></label>
            <label>Post-hospitalization (Rs.)<input value={draft.treatmentExpenses.postHospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, postHospitalization: value } })))} /></label>
            <label>Health checkup (Rs.)<input value={draft.treatmentExpenses.healthCheckup} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, healthCheckup: value } })))} /></label>
            <label>Ambulance (Rs.)<input value={draft.treatmentExpenses.ambulance} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, ambulance: value } })))} /></label>
            <label>Others (Rs.)<input value={draft.treatmentExpenses.others} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, others: value } })))} /></label>
            <label>Pre-hospitalization days<input value={draft.treatmentExpenses.preHospitalizationDays} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, preHospitalizationDays: value } })))} /></label>
            <label>Post-hospitalization days<input value={draft.treatmentExpenses.postHospitalizationDays} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, postHospitalizationDays: value } })))} /></label>
            <label>Bank account<input value={draft.bankDetails.accountNumber} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, accountNumber: value } })))} /></label>
            <label>IFSC<input value={draft.bankDetails.ifsc} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, ifsc: value } })))} /></label>
            <label className="span-2">Sample bill row 1 amount<input value={draft.bills[0]?.amount ?? ''} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bills: current.bills.map((line, idx) => idx === 0 ? { ...line, amount: value, issuedBy: line.issuedBy || 'Hospital', towards: line.towards || 'Hospital main bill' } : line) })))} /></label>
          </div>
        )}

        {step.id === 'bank' && (
          <div className="form-grid two">
            <label>PAN<input value={draft.bankDetails.pan} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, pan: value } })))} /></label>
            <label>Payable to<input value={draft.bankDetails.payableTo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, payableTo: value } })))} /></label>
            <label className="span-2">Bank name and branch<input value={draft.bankDetails.bankNameBranch} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, bankNameBranch: value } })))} /></label>
            <label>Declaration place<input value={draft.declarationA.place} onChange={updateText((value) => onDraftChange((current) => ({ ...current, declarationA: { ...current.declarationA, place: value } })))} /></label>
            <label>Declaration date<input type="date" value={draft.declarationA.date} onChange={updateText((value) => onDraftChange((current) => ({ ...current, declarationA: { ...current.declarationA, date: value } })))} /></label>
          </div>
        )}

        {step.id === 'hospital-part-b' && (
          <div className="form-grid two">
            <label className="span-2">Hospital name<input value={draft.hospitalB.hospitalName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, hospitalName: value } })))} /></label>
            <label>Hospital ID<input value={draft.hospitalB.hospitalId} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, hospitalId: value } })))} /></label>
            <label>Hospital type<select value={draft.hospitalB.hospitalType} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, hospitalType: value as typeof current.hospitalB.hospitalType } })))}><option value="">Select</option><option value="network">Network</option><option value="non_network">Non-network</option></select></label>
            <label>Doctor first name<input value={draft.hospitalB.treatingDoctorName.firstName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, treatingDoctorName: { ...current.hospitalB.treatingDoctorName, firstName: value } } })))} /></label>
            <label>Qualification<input value={draft.hospitalB.qualification} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, qualification: value } })))} /></label>
            <label>Registration no + state code<input value={draft.hospitalB.registrationNoStateCode} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalB: { ...current.hospitalB, registrationNoStateCode: value } })))} /></label>
            <label>IP registration number<input value={draft.patientB.ipRegistrationNumber} onChange={updateText((value) => onDraftChange((current) => ({ ...current, patientB: { ...current.patientB, ipRegistrationNumber: value } })))} /></label>
            <label>Primary diagnosis ICD-10<input value={draft.diagnosisB.primaryDiagnosis.code} onChange={updateText((value) => onDraftChange((current) => ({ ...current, diagnosisB: { ...current.diagnosisB, primaryDiagnosis: { ...current.diagnosisB.primaryDiagnosis, code: value } } })))} /></label>
            <label className="span-2">Primary diagnosis description<input value={draft.diagnosisB.primaryDiagnosis.description} onChange={updateText((value) => onDraftChange((current) => ({ ...current, diagnosisB: { ...current.diagnosisB, primaryDiagnosis: { ...current.diagnosisB.primaryDiagnosis, description: value } } })))} /></label>
            <label>Procedure 1<input value={draft.diagnosisB.procedure1.code} onChange={updateText((value) => onDraftChange((current) => ({ ...current, diagnosisB: { ...current.diagnosisB, procedure1: { ...current.diagnosisB.procedure1, code: value } } })))} /></label>
            <label>Claimed amount<input value={draft.patientB.totalClaimedAmount} onChange={updateText((value) => onDraftChange((current) => ({ ...current, patientB: { ...current.patientB, totalClaimedAmount: value } })))} /></label>
          </div>
        )}

        <div className="wizard-foot">
          <button className="ghost-btn" onClick={prev} disabled={stepIndex === 0}>Back</button>
          <button className="primary-btn" onClick={next} disabled={stepIndex === wizardSteps.length - 1}>Next</button>
        </div>
      </section>
    </div>
  );
}
