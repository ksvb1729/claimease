import React from "react";
import type { ClaimData } from "../App";

type Props = { data: ClaimData };

function formatDate(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}
function val(v?: string | boolean | null) { return v !== undefined && v !== null && v !== "" ? String(v) : "—"; }
function Row({ label, value }: { label: string; value?: string | boolean | null }) {
  const v = value !== undefined && value !== null && value !== "" ? String(value) : "";
  return (
    <div className="cdv-row">
      <span className="cdv-label">{label}</span>
      <span className={"cdv-value" + (!v ? " cdv-empty" : "")}>{v || "—"}</span>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="cdv-section">
      <div className="cdv-section-header">{title}</div>
      <div className="cdv-rows">{children}</div>
    </div>
  );
}

export default function ClaimDataView({ data }: Props) {
  return (
    <div className="cdv-wrap">
      <div className="cdv-title">Claim Form — Filled Data</div>
      <div className="cdv-subtitle">Verify all fields before downloading</div>

      <Section title="Primary Insured Details">
        <Row label="Policy Number" value={data.policyNumber} />
        <Row label="TPA ID" value={data.tpaId} />
        <Row label="Insurer" value={data.insurerName} />
        <Row label="TPA Name" value={data.tpaName} />
        <Row label="Policyholder Name" value={data.policyholderName} />
        <Row label="Address" value={data.policyholderAddress1} />
        <Row label="City" value={data.policyholderCity} />
        <Row label="State" value={data.policyholderState} />
        <Row label="Pin Code" value={data.policyholderPin} />
        <Row label="Phone" value={data.phone} />
        <Row label="Email" value={data.email} />
        <Row label="Member ID" value={data.memberId} />
        <Row label="Sum Insured" value={data.sumInsured} />
      </Section>

      <Section title="Insurance History">
        <Row label="Other medical cover?" value={data.currentOtherCover} />
        <Row label="First insurance date" value={data.firstInsuranceStart} />
        <Row label="Hospitalized (last 4 yrs)?" value={data.hospitalizedLastFourYears} />
        <Row label="Last hosp. date" value={formatDate(data.lastHospitalizationDate)} />
        <Row label="Last diagnosis" value={data.lastHospitalizationDiagnosis} />
        <Row label="Other insurer name" value={data.currentOtherCompanyName} />
        <Row label="Other policy no." value={data.currentOtherPolicyNo} />
        <Row label="Other sum insured" value={data.currentOtherSumInsured} />
        <Row label="Previously covered?" value={data.previousOtherCover} />
        <Row label="Prev. insurer" value={data.previousOtherCompanyName} />
      </Section>

      <Section title="Patient (Hospitalized Person)">
        <Row label="Patient Name" value={data.patientName} />
        <Row label="Relationship to Policyholder" value={data.relationship} />
        <Row label="Gender" value={data.gender} />
        <Row label="Date of Birth" value={formatDate(data.patientDob)} />
        <Row label="Occupation" value={data.occupation} />
        <Row label="Patient Address" value={
          data.sameAddress === true
            ? "(same as policyholder)"
            : [data.patientAddress1, data.patientCity, data.patientState, data.patientPin].filter(Boolean).join(", ")
        } />
      </Section>

      <Section title="Hospitalization Details">
        <Row label="Hospital Name" value={data.hospitalName} />
        <Row label="Hospital Address" value={data.hospitalAddress} />
        <Row label="Hospital Phone" value={data.hospitalPhone} />
        <Row label="Hospital Email" value={data.hospitalEmail} />
        <Row label="Reg No." value={data.hospitalRegNo} />
        <Row label="Hospital PAN" value={data.hospitalPan} />
        <Row label="Room Category" value={data.roomCategory} />
        <Row label="System of Medicine" value={data.systemOfMedicine} />
        <Row label="Reason" value={data.hospitalizationReason} />
        <Row label="Disease / Injury Date" value={formatDate(data.diseaseOrInjuryDate)} />
        <Row label="Admission Date" value={formatDate(data.admissionDate)} />
        <Row label="Admission Time" value={data.admissionTime} />
        <Row label="Discharge Date" value={formatDate(data.dischargeDate)} />
        <Row label="Discharge Time" value={data.dischargeTime} />
        {data.hospitalizationReason === "Injury" && <>
          <Row label="Injury Cause" value={data.injuryCause} />
          <Row label="Medico-Legal?" value={data.medicoLegal} />
          <Row label="Reported to Police?" value={data.reportedToPolice} />
          <Row label="FIR Attached?" value={data.firAttached} />
        </>}
      </Section>

      <Section title="Claim Amounts">
        <Row label="Pre-hospitalization expenses" value={data.preExpenses ? `₹ ${data.preExpenses}` : ""} />
        <Row label="Hospitalization expenses" value={data.hospitalExpenses ? `₹ ${data.hospitalExpenses}` : ""} />
        <Row label="Post-hospitalization expenses" value={data.postExpenses ? `₹ ${data.postExpenses}` : ""} />
        <Row label="Health checkup cost" value={data.healthCheckupCost ? `₹ ${data.healthCheckupCost}` : ""} />
        <Row label="Ambulance charges" value={data.ambulanceCharges ? `₹ ${data.ambulanceCharges}` : ""} />
        <Row label="Others" value={data.othersClaimAmount ? `₹ ${data.othersClaimAmount}` : ""} />
        <Row label="Pre-hosp. days" value={data.preHospitalizationDays} />
        <Row label="Post-hosp. days" value={data.postHospitalizationDays} />
        <Row label="Domiciliary claim?" value={data.hadDomiciliary} />
        {data.hasCashBenefits === "Yes" && <>
          <Row label="Hospital daily cash" value={data.hospitalDailyCash ? `₹ ${data.hospitalDailyCash}` : ""} />
          <Row label="Surgical cash" value={data.surgicalCash ? `₹ ${data.surgicalCash}` : ""} />
          <Row label="Critical illness benefit" value={data.criticalIllnessBenefit ? `₹ ${data.criticalIllnessBenefit}` : ""} />
          <Row label="Convalescence" value={data.convalescence ? `₹ ${data.convalescence}` : ""} />
        </>}
      </Section>

      {data.billRows && data.billRows.length > 0 && (
        <div className="cdv-section">
          <div className="cdv-section-header">Bills Submitted</div>
          <div className="cdv-bill-table">
            <div className="cdv-bill-header">
              <span>S.No</span><span>Bill No</span><span>Date</span>
              <span>Issued By</span><span>Nature</span><span>Amount</span>
            </div>
            {data.billRows.map((row, i) => (
              <div key={row.id} className="cdv-bill-row">
                <span>{i + 1}</span>
                <span>{row.billNo || "—"}</span>
                <span>{formatDate(row.date)}</span>
                <span>{row.issuedBy || "—"}</span>
                <span>{row.towards || "—"}</span>
                <span>{row.amount ? `₹ ${row.amount}` : "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.documents && data.documents.length > 0 && (
        <Section title="Documents to Submit">
          <div className="cdv-doc-list">
            {data.documents.map((d) => (
              <span key={d} className="cdv-doc-chip">{d}</span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Bank Account (Reimbursement)">
        <Row label="Account Number" value={data.bankAccountNumber} />
        <Row label="Bank / Branch" value={data.bankNameBranch} />
        <Row label="IFSC Code" value={data.ifsc} />
        <Row label="Cheque Payable To" value={data.chequePayableTo} />
        <Row label="Payee Type" value={data.payeeType} />
        <Row label="PAN" value={data.pan} />
      </Section>

      <Section title="Declaration">
        <Row label="Place" value={data.declarationPlace} />
        <Row label="Date" value={formatDate(data.declarationDate)} />
        {data.signatureText && <Row label="Signature (typed)" value={data.signatureText} />}
        {data.signatureDataUrl && (
          <div className="cdv-row">
            <span className="cdv-label">Signature (uploaded)</span>
            <img src={data.signatureDataUrl} alt="Signature" style={{ height: 40, maxWidth: 200, objectFit: "contain" }} />
          </div>
        )}
      </Section>

      <Section title="Hospital Section (Part B — Pre-filled)">
        <Row label="Treating Doctor" value={data.treatingDoctorName} />
        <Row label="Qualification" value={data.treatingDoctorQualification} />
        <Row label="Diagnosis" value={data.diagnosisText} />
        <Row label="ICD-10 Code" value={data.diagnosisIcdCode} />
        <Row label="Procedure" value={data.procedureName} />
        <Row label="Procedure Code" value={data.procedureIcdCode} />
        <Row label="Procedure Date" value={formatDate(data.procedureDate)} />
        <Row label="Pre-existing?" value={data.isPreExistingCondition} />
      </Section>
    </div>
  );
}
