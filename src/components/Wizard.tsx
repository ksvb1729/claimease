import { ChangeEvent, ReactNode } from 'react';
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

function PromptCard({ eyebrow, title, body, children }: { eyebrow: string; title: string; body: string; children?: ReactNode }) {
  return (
    <div className="prompt-card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{body}</p>
      {children}
    </div>
  );
}

export function Wizard({ draft, stepIndex, onStepChange, onDraftChange }: Props) {
  const step = wizardSteps[stepIndex];
  const progress = Math.round(((stepIndex + 1) / wizardSteps.length) * 100);

  const next = () => onStepChange(Math.min(stepIndex + 1, wizardSteps.length - 1));
  const prev = () => onStepChange(Math.max(stepIndex - 1, 0));

  return (
    <section className="wizard-card card-surface">
      <div className="wizard-topbar">
        <div>
          <p className="eyebrow">Guided claim intake</p>
          <h1>{step.title}</h1>
          <p className="muted-text">{step.description}</p>
        </div>
        <div className="wizard-meta">
          <div className="ref-pill">{draft.claimRef}</div>
          <div className="step-chip">Step {stepIndex + 1} / {wizardSteps.length}</div>
        </div>
      </div>

      <div className="progress-shell" aria-label="Wizard progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="step-pills" role="tablist" aria-label="Claim steps">
        {wizardSteps.map((wizardStep, index) => (
          <button
            key={wizardStep.id}
            className={`step-pill ${index === stepIndex ? 'active' : ''}`}
            onClick={() => onStepChange(index)}
          >
            {index + 1}. {wizardStep.title}
          </button>
        ))}
      </div>

      {step.id === 'intro' && (
        <div className="stack-gap">
          <PromptCard
            eyebrow="Meet your helper"
            title="We will fill this calmly, one section at a time."
            body="This wizard translates your answers into the insurer's Part A form. Nothing is sent to a server. Export JSON if you want to save progress."
          >
            <ul className="clean-list compact soft-list">
              <li>Keep policy details, discharge summary, bills, bank details, PAN, and patient ID proof nearby.</li>
              <li>The wizard checks obvious issues like missing policy number or discharge before admission.</li>
              <li>Part B is left blank for the hospital in this MVP.</li>
            </ul>
          </PromptCard>
        </div>
      )}

      {step.id === 'policy' && (
        <div className="field-stack">
          <PromptCard eyebrow="Primary insured" title="Who holds the policy?" body="Start with the details that appear on the policy card or policy document." />
          <div className="form-grid two compact-form">
            <label>Policy number<input value={draft.primaryInsured.policyNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, policyNo: value } })))} /></label>
            <label>Certificate / member number<input value={draft.primaryInsured.certificateNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, certificateNo: value } })))} /></label>
            <label className="span-2">Company / TPA ID<input value={draft.primaryInsured.companyTpaIdNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, primaryInsured: { ...current.primaryInsured, companyTpaIdNo: value } })))} /></label>
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
        </div>
      )}

      {step.id === 'history' && (
        <div className="field-stack">
          <PromptCard eyebrow="Insurance history" title="Do we need to mention any earlier or parallel cover?" body="Only fill what applies. Leave the rest blank if there is no other cover." />
          <div className="form-grid two compact-form">
            <label>Any other current health policy?
              <select value={draft.insuranceHistory.currentOtherCover} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherCover: value as typeof current.insuranceHistory.currentOtherCover } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
            <label>First insurance start date<input type="date" value={draft.insuranceHistory.firstInsuranceStart} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, firstInsuranceStart: value } })))} /></label>
            <label>Other insurer<input value={draft.insuranceHistory.currentOtherCompanyName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherCompanyName: value } })))} /></label>
            <label>Other policy number<input value={draft.insuranceHistory.currentOtherPolicyNo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherPolicyNo: value } })))} /></label>
            <label>Other sum insured<input value={draft.insuranceHistory.currentOtherSumInsured} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, currentOtherSumInsured: value } })))} /></label>
            <label>Hospitalized in the last 4 years?
              <select value={draft.insuranceHistory.hospitalizedLastFourYears} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, hospitalizedLastFourYears: value as typeof current.insuranceHistory.hospitalizedLastFourYears } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
            <label>Last hospitalization month<input type="month" value={draft.insuranceHistory.lastHospitalizationDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, lastHospitalizationDate: value } })))} /></label>
            <label className="span-2">Diagnosis or reason<textarea value={draft.insuranceHistory.lastHospitalizationDiagnosis} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuranceHistory: { ...current.insuranceHistory, lastHospitalizationDiagnosis: value } })))} /></label>
          </div>
        </div>
      )}

      {step.id === 'patient' && (
        <div className="field-stack">
          <PromptCard eyebrow="Patient details" title="Who was hospitalized?" body="If the claimant and patient are the same person, just repeat the same person details here." />
          <div className="form-grid two compact-form">
            <label>Surname<input value={draft.insuredPatient.name.surname} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, surname: value } } })))} /></label>
            <label>First name<input value={draft.insuredPatient.name.firstName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, firstName: value } } })))} /></label>
            <label>Middle name<input value={draft.insuredPatient.name.middleName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, name: { ...current.insuredPatient.name, middleName: value } } })))} /></label>
            <label>Gender<select value={draft.insuredPatient.gender} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, gender: value as typeof current.insuredPatient.gender } })))}><option value="">Select</option><option value="male">Male</option><option value="female">Female</option></select></label>
            <label>Age in years<input value={draft.insuredPatient.ageYears} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, ageYears: value } })))} /></label>
            <label>Age in months<input value={draft.insuredPatient.ageMonths} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, ageMonths: value } })))} /></label>
            <label>Date of birth<input type="date" value={draft.insuredPatient.dob} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, dob: value } })))} /></label>
            <label>Relationship to policy holder<select value={draft.insuredPatient.relationship} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, relationship: value as typeof current.insuredPatient.relationship } })))}><option value="">Select</option><option value="self">Self</option><option value="spouse">Spouse</option><option value="child">Child</option><option value="father">Father</option><option value="mother">Mother</option><option value="other">Other</option></select></label>
            <label>Occupation<select value={draft.insuredPatient.occupation} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, occupation: value as typeof current.insuredPatient.occupation } })))}><option value="">Select</option><option value="service">Service</option><option value="self_employed">Self employed</option><option value="homemaker">Homemaker</option><option value="student">Student</option><option value="retired">Retired</option><option value="other">Other</option></select></label>
            <label className="span-2">Patient address<input value={draft.insuredPatient.address.line1} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, line1: value } } })))} /></label>
            <label>City<input value={draft.insuredPatient.address.city} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, city: value } } })))} /></label>
            <label>State<input value={draft.insuredPatient.address.state} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, state: value } } })))} /></label>
            <label>PIN<input value={draft.insuredPatient.address.pinCode} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, pinCode: value } } })))} /></label>
            <label>Phone<input value={draft.insuredPatient.address.phone} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, phone: value } } })))} /></label>
            <label>Email<input value={draft.insuredPatient.address.email} onChange={updateText((value) => onDraftChange((current) => ({ ...current, insuredPatient: { ...current.insuredPatient, address: { ...current.insuredPatient.address, email: value } } })))} /></label>
          </div>
        </div>
      )}

      {step.id === 'hospitalization' && (
        <div className="field-stack">
          <PromptCard eyebrow="Hospital stay" title="Tell me about the admission and discharge." body="Use the discharge summary or hospital record for these dates and times." />
          <div className="form-grid two compact-form">
            <label className="span-2">Hospital name<input value={draft.hospitalization.hospitalName} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, hospitalName: value } })))} /></label>
            <label>Room category<select value={draft.hospitalization.roomCategory} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, roomCategory: value as typeof current.hospitalization.roomCategory } })))}><option value="">Select</option><option value="day_care">Day care</option><option value="single">Single occupancy</option><option value="twin">Twin sharing</option><option value="multi">3 or more beds</option></select></label>
            <label>Hospitalization due to<select value={draft.hospitalization.dueTo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dueTo: value as typeof current.hospitalization.dueTo } })))}><option value="">Select</option><option value="illness">Illness</option><option value="injury">Injury</option><option value="maternity">Maternity</option></select></label>
            <label>Injury / illness / delivery date<input type="date" value={draft.hospitalization.eventDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, eventDate: value } })))} /></label>
            <label>System of medicine<input value={draft.hospitalization.systemOfMedicine} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, systemOfMedicine: value } })))} /></label>
            <label>Admission date<input type="date" value={draft.hospitalization.admissionDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, admissionDate: value } })))} /></label>
            <label>Admission time<input type="time" value={draft.hospitalization.admissionTime} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, admissionTime: value } })))} /></label>
            <label>Discharge date<input type="date" value={draft.hospitalization.dischargeDate} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dischargeDate: value } })))} /></label>
            <label>Discharge time<input type="time" value={draft.hospitalization.dischargeTime} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, dischargeTime: value } })))} /></label>
            <label>Medico-legal case?
              <select value={draft.hospitalization.medicoLegal} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, medicoLegal: value as typeof current.hospitalization.medicoLegal } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
            <label>Reported to police?
              <select value={draft.hospitalization.reportedToPolice} onChange={updateText((value) => onDraftChange((current) => ({ ...current, hospitalization: { ...current.hospitalization, reportedToPolice: value as typeof current.hospitalization.reportedToPolice } })))}>
                <option value="">Select</option><option value="yes">Yes</option><option value="no">No</option>
              </select>
            </label>
          </div>
        </div>
      )}

      {step.id === 'expenses' && (
        <div className="field-stack">
          <PromptCard eyebrow="Amounts" title="What are you claiming?" body="Use rounded rupee amounts as they appear in the bills and claim summary." />
          <div className="form-grid two compact-form">
            <label>Pre-hospitalization<input value={draft.treatmentExpenses.preHospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, preHospitalization: value } })))} /></label>
            <label>Hospitalization<input value={draft.treatmentExpenses.hospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, hospitalization: value } })))} /></label>
            <label>Post-hospitalization<input value={draft.treatmentExpenses.postHospitalization} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, postHospitalization: value } })))} /></label>
            <label>Health check-up cost<input value={draft.treatmentExpenses.healthCheckup} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, healthCheckup: value } })))} /></label>
            <label>Ambulance<input value={draft.treatmentExpenses.ambulance} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, ambulance: value } })))} /></label>
            <label>Other amount<input value={draft.treatmentExpenses.others} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, others: value } })))} /></label>
            <label>Pre-hospitalization period (days)<input value={draft.treatmentExpenses.preHospitalizationDays} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, preHospitalizationDays: value } })))} /></label>
            <label>Post-hospitalization period (days)<input value={draft.treatmentExpenses.postHospitalizationDays} onChange={updateText((value) => onDraftChange((current) => ({ ...current, treatmentExpenses: { ...current.treatmentExpenses, postHospitalizationDays: value } })))} /></label>
          </div>
        </div>
      )}

      {step.id === 'bank' && (
        <div className="field-stack">
          <PromptCard eyebrow="Payout details" title="Where should reimbursement go?" body="Use the same bank details where you want the insurer to credit the reimbursement." />
          <div className="form-grid two compact-form">
            <label>PAN<input value={draft.bankDetails.pan} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, pan: value } })))} /></label>
            <label>Account number<input value={draft.bankDetails.accountNumber} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, accountNumber: value } })))} /></label>
            <label className="span-2">Bank name and branch<input value={draft.bankDetails.bankNameBranch} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, bankNameBranch: value } })))} /></label>
            <label>Payable to<input value={draft.bankDetails.payableTo} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, payableTo: value } })))} /></label>
            <label>IFSC<input value={draft.bankDetails.ifsc} onChange={updateText((value) => onDraftChange((current) => ({ ...current, bankDetails: { ...current.bankDetails, ifsc: value } })))} /></label>
            <label className="span-2">Declaration place<input value={draft.declarationA.place} onChange={updateText((value) => onDraftChange((current) => ({ ...current, declarationA: { ...current.declarationA, place: value } })))} /></label>
          </div>
        </div>
      )}

      {step.id === 'hospital-part-b' && (
        <div className="field-stack">
          <PromptCard eyebrow="Hospital section" title="Part B stays blank in this MVP." body="The hospital is expected to complete Part B. We are intentionally not auto-filling or QR-tagging that section in the generated form." />
          <div className="notice-box">For demo purposes, you can focus on the insured journey and show a blank Part B in the final output.</div>
        </div>
      )}

      {step.id === 'review' && (
        <div className="field-stack">
          <PromptCard eyebrow="Review" title="You are ready to preview the final form." body="Check the preview on the right, export JSON if you need a save point, and print when satisfied." />
        </div>
      )}

      <div className="wizard-foot">
        <button className="ghost-btn" onClick={prev} disabled={stepIndex === 0}>Back</button>
        <button className="primary-btn" onClick={next} disabled={stepIndex === wizardSteps.length - 1}>
          {stepIndex === wizardSteps.length - 1 ? 'Done' : 'Continue'}
        </button>
      </div>
    </section>
  );
}
