
import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { BillRow, ClaimData } from "../App";
import claimFormPartA from "../assets/claim-form-part-a.png";
import claimFormPartB from "../assets/claim-form-part-b.png";

type Props = {
  data: ClaimData;
};

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}`;
}

function formatMonthYear(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}${yy}`;
}

function formatTime(value?: string) {
  if (!value) return "";
  return value.replace(":", "");
}

function splitAddress(line1?: string, city?: string, state?: string, pin?: string) {
  return [line1, city, state, pin].filter(Boolean).join(", ");
}

function deriveAge(dob?: string) {
  if (!dob) return { years: "", months: "" };
  const birth = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birth.getTime())) return { years: "", months: "" };

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: String(Math.max(0, years)),
    months: String(Math.max(0, months)),
  };
}

function compactPagePayload(data: ClaimData) {
  return JSON.stringify({
    v: 2,
    p: 1,
    f: {
      pn: data.policyNumber || "",
      tp: data.tpaId || "",
      ph: data.policyholderName || "",
      pa1: data.policyholderAddress1 || "",
      pc: data.policyholderCity || "",
      ps: data.policyholderState || "",
      pp: data.policyholderPin || "",
      phn: data.phone || "",
      phe: data.email || "",
      coc: data.currentOtherCover || "",
      fis: data.firstInsuranceStart || "",
      ccn: data.currentOtherCompanyName || "",
      ccp: data.currentOtherPolicyNo || "",
      csi: data.currentOtherSumInsured || "",
      h4: data.hospitalizedLastFourYears || "",
      h4d: data.lastHospitalizationDate || "",
      h4x: data.lastHospitalizationDiagnosis || "",
      poc: data.previousOtherCover || "",
      pocn: data.previousOtherCompanyName || "",
      pt: data.patientName || "",
      g: data.gender || "",
      dob: data.patientDob || "",
      rel: data.relationship || "",
      occ: data.occupation || "",
      sa: data.sameAddress === true ? "Y" : "N",
      pta1: data.patientAddress1 || "",
      ptc: data.patientCity || "",
      pts: data.patientState || "",
      ptp: data.patientPin || "",
      hn: data.hospitalName || "",
      rc: data.roomCategory || "",
      hr: data.hospitalizationReason || "",
      ev: data.diseaseOrInjuryDate || "",
      ad: data.admissionDate || "",
      at: data.admissionTime || "",
      dd: data.dischargeDate || "",
      dt: data.dischargeTime || "",
      ic: data.injuryCause || "",
      ml: data.medicoLegal || "",
      rp: data.reportedToPolice || "",
      fa: data.firAttached || "",
      sm: data.systemOfMedicine || "",
      pre: data.preExpenses || "",
      hosp: data.hospitalExpenses || "",
      post: data.postExpenses || "",
      hcu: data.healthCheckupCost || "",
      amb: data.ambulanceCharges || "",
      oamt: data.othersClaimAmount || "",
      ocode: data.othersClaimCode || "",
      pred: data.preHospitalizationDays || "",
      postd: data.postHospitalizationDays || "",
      dom: data.hadDomiciliary || "",
      hdc: data.hospitalDailyCash || "",
      sc: data.surgicalCash || "",
      cib: data.criticalIllnessBenefit || "",
      cv: data.convalescence || "",
      ppl: data.prePostLumpSum || "",
      ob: data.otherBenefit || "",
      docs: data.documents || [],
      bills: data.billRows || [],
      pan: data.pan || "",
      acc: data.bankAccountNumber || "",
      bank: data.bankNameBranch || "",
      pay: data.chequePayableTo || "",
      ifsc: data.ifsc || "",
      plc: data.declarationPlace || "",
    },
  });
}

function Text({
  x,
  y,
  w,
  text,
  size = 6.5,
  bold = false,
  align = "left",
}: {
  x: number;
  y: number;
  w?: number;
  text?: string;
  size?: number;
  bold?: boolean;
  align?: "left" | "center" | "right";
}) {
  return (
    <div
      className="pdf-text"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: w ? `${w}%` : undefined,
        fontSize: `${size}px`,
        fontWeight: bold ? 700 : 400,
        textAlign: align,
      }}
    >
      {text || ""}
    </div>
  );
}

function Tick({ x, y }: { x: number; y: number }) {
  return <Text x={x} y={y} text="✓" size={9} bold align="center" />;
}

function hasDoc(data: ClaimData, label: string) {
  return (data.documents || []).includes(label);
}

function rowAt(rows: BillRow[] | undefined, index: number) {
  return rows && rows[index] ? rows[index] : undefined;
}

export default function FormRenderer({ data }: Props) {
  const age = deriveAge(data.patientDob);
  const policyholderAddress = splitAddress(
    data.policyholderAddress1,
    data.policyholderCity,
    data.policyholderState,
    data.policyholderPin
  );
  const patientAddress =
    data.sameAddress === true
      ? ""
      : splitAddress(data.patientAddress1, data.patientCity, data.patientState, data.patientPin);

  const qrValue = compactPagePayload(data);
  const rows = (data.billRows || []).slice(0, 10);

  return (
    <div className="form-preview-wrap">
      <section className="a4-page page-break">
        <img src={claimFormPartA} alt="IRDAI Claim Form Part A" className="form-template" />
        <div className="page-overlay">
          <div className="page-qr">
            <QRCodeSVG value={qrValue} size={58} level="M" includeMargin />
          </div>

          <Text x={8.0} y={7.7} w={22} text={data.policyNumber} />
          <Text x={8.0} y={10.9} w={25} text={data.tpaId} />
          <Text x={8.0} y={14.7} w={45} text={data.policyholderName} />
          <Text x={8.0} y={18.9} w={50} text={data.policyholderAddress1} />
          <Text x={18.9} y={24.3} w={13} text={data.policyholderCity} />
          <Text x={44.3} y={24.3} w={12} text={data.policyholderState} />
          <Text x={18.8} y={26.95} w={8} text={data.policyholderPin} />
          <Text x={34.2} y={26.95} w={14} text={data.phone} />
          <Text x={58.9} y={26.95} w={27} text={data.email} />

          {data.currentOtherCover === "Yes" ? <Tick x={27.9} y={31.95} /> : <Tick x={32.7} y={31.95} />}
          <Text x={58.5} y={31.95} w={12} text={formatDate(data.firstInsuranceStart)} />
          <Text x={10.8} y={34.7} w={18} text={data.currentOtherCompanyName} />
          <Text x={43.8} y={34.7} w={14} text={data.currentOtherPolicyNo} />
          <Text x={10.6} y={37.1} w={11} text={data.currentOtherSumInsured} />
          {data.hospitalizedLastFourYears === "Yes" ? <Tick x={64.5} y={37.1} /> : <Tick x={69.1} y={37.1} />}
          <Text x={79.2} y={37.1} w={6} text={formatMonthYear(data.lastHospitalizationDate)} />
          <Text x={10.4} y={39.8} w={23} text={data.lastHospitalizationDiagnosis} />
          {data.previousOtherCover === "Yes" ? <Tick x={84.8} y={39.8} /> : <Tick x={89.2} y={39.8} />}
          <Text x={10.5} y={42.3} w={23} text={data.previousOtherCompanyName} />

          <Text x={8.2} y={45.7} w={45} text={data.patientName} />
          {data.gender === "Male" ? <Tick x={26.1} y={48.9} /> : data.gender === "Female" ? <Tick x={30.3} y={48.9} /> : null}
          <Text x={44.8} y={48.9} w={4} text={age.years} />
          <Text x={52.8} y={48.9} w={4} text={age.months} />
          <Text x={65.9} y={48.9} w={15} text={formatDate(data.patientDob)} />
          {data.relationship === "Myself" ? <Tick x={27.0} y={51.95} /> :
            data.relationship === "Spouse" ? <Tick x={33.2} y={51.95} /> :
            data.relationship === "Child" ? <Tick x={39.5} y={51.95} /> :
            data.relationship === "Father" ? <Tick x={45.5} y={51.95} /> :
            data.relationship === "Mother" ? <Tick x={52.0} y={51.95} /> :
            data.relationship ? <Tick x={58.2} y={51.95} /> : null}
          {data.occupation === "Service" ? <Tick x={24.0} y={54.95} /> :
            data.occupation === "Self Employed" ? <Tick x={31.6} y={54.95} /> :
            data.occupation === "Homemaker" ? <Tick x={39.9} y={54.95} /> :
            data.occupation === "Student" ? <Tick x={49.0} y={54.95} /> :
            data.occupation === "Retired" ? <Tick x={56.0} y={54.95} /> :
            data.occupation ? <Tick x={62.2} y={54.95} /> : null}
          <Text x={8.2} y={58.2} w={48} text={patientAddress} />
          <Text x={18.8} y={63.55} w={8} text={data.sameAddress === true ? "" : data.patientPin} />

          <Text x={23.2} y={66.9} w={42} text={data.hospitalName} />
          {data.roomCategory === "Day care" ? <Tick x={25.9} y={70.0} /> :
            data.roomCategory === "Single occupancy" ? <Tick x={34.8} y={70.0} /> :
            data.roomCategory === "Twin sharing" ? <Tick x={46.1} y={70.0} /> :
            data.roomCategory ? <Tick x={60.1} y={70.0} /> : null}
          {data.hospitalizationReason === "Injury" ? <Tick x={26.4} y={72.95} /> :
            data.hospitalizationReason === "Illness" ? <Tick x={33.0} y={72.95} /> :
            data.hospitalizationReason === "Maternity" ? <Tick x={39.6} y={72.95} /> : null}
          <Text x={66.2} y={72.85} w={14} text={formatDate(data.diseaseOrInjuryDate)} />
          <Text x={18.3} y={75.8} w={14} text={formatDate(data.admissionDate)} />
          <Text x={34.0} y={75.8} w={8} text={formatTime(data.admissionTime)} />
          <Text x={52.0} y={75.8} w={14} text={formatDate(data.dischargeDate)} />
          <Text x={67.9} y={75.8} w={8} text={formatTime(data.dischargeTime)} />

          {data.injuryCause === "Self inflicted" ? <Tick x={25.8} y={78.9} /> :
            data.injuryCause === "Road traffic accident" ? <Tick x={36.4} y={78.9} /> :
            data.injuryCause === "Substance / alcohol related" ? <Tick x={54.0} y={78.9} /> : null}
          {data.medicoLegal === "Yes" ? <Tick x={74.5} y={78.9} /> : data.medicoLegal === "No" ? <Tick x={79.0} y={78.9} /> : null}
          {data.reportedToPolice === "Yes" ? <Tick x={20.6} y={81.9} /> : data.reportedToPolice === "No" ? <Tick x={25.1} y={81.9} /> : null}
          {data.firAttached === "Yes" ? <Tick x={43.4} y={81.9} /> : data.firAttached === "No" ? <Tick x={47.9} y={81.9} /> : null}
          <Text x={77.3} y={81.7} w={10} text={data.systemOfMedicine} />

          <Text x={14.8} y={87.0} w={9} text={data.preExpenses} />
          <Text x={44.9} y={87.0} w={9} text={data.hospitalExpenses} />
          <Text x={14.8} y={89.8} w={9} text={data.postExpenses} />
          <Text x={44.9} y={89.8} w={9} text={data.healthCheckupCost} />
          <Text x={14.8} y={92.55} w={9} text={data.ambulanceCharges} />
          <Text x={44.9} y={92.55} w={9} text={data.othersClaimAmount} />
          <Text x={49.8} y={92.55} w={6} text={data.othersClaimCode} />
          <Text x={20.8} y={95.2} w={5} text={data.preHospitalizationDays} />
          <Text x={55.0} y={95.2} w={5} text={data.postHospitalizationDays} />
          {data.hadDomiciliary === "Yes" ? <Tick x={26.1} y={98.25} /> : data.hadDomiciliary === "No" ? <Tick x={30.7} y={98.25} /> : null}

          <Text x={14.8} y={101.2} w={9} text={data.hospitalDailyCash} />
          <Text x={44.9} y={101.2} w={9} text={data.surgicalCash} />
          <Text x={14.8} y={104.0} w={9} text={data.criticalIllnessBenefit} />
          <Text x={44.9} y={104.0} w={9} text={data.convalescence} />
          <Text x={14.8} y={106.8} w={9} text={data.prePostLumpSum} />
          <Text x={44.9} y={106.8} w={9} text={data.otherBenefit} />

          {hasDoc(data, "Claim form duly signed") && <Tick x={74.0} y={86.8} />}
          {hasDoc(data, "Copy of claim intimation") && <Tick x={74.0} y={89.6} />}
          {hasDoc(data, "Hospital main bill") && <Tick x={74.0} y={92.3} />}
          {hasDoc(data, "Hospital break-up bill") && <Tick x={74.0} y={95.1} />}
          {hasDoc(data, "Hospital bill payment receipt") && <Tick x={74.0} y={97.9} />}
          {hasDoc(data, "Hospital discharge summary") && <Tick x={74.0} y={100.7} />}
          {hasDoc(data, "Pharmacy bill") && <Tick x={74.0} y={103.4} />}
          {hasDoc(data, "Operation Theatre notes") && <Tick x={74.0} y={106.2} />}
          {hasDoc(data, "ECG") && <Tick x={74.0} y={108.9} />}
          {hasDoc(data, "Doctor request for investigation") && <Tick x={74.0} y={111.7} />}
          {hasDoc(data, "Investigation reports") && <Tick x={74.0} y={114.5} />}
          {hasDoc(data, "Doctor prescriptions") && <Tick x={74.0} y={117.2} />}
          {hasDoc(data, "Others") && <Tick x={74.0} y={120.0} />}

          {[0,1,2,3,4,5,6,7,8,9].map((idx) => {
            const row = rowAt(rows, idx);
            const baseY = 112.2 + idx * 2.45;
            return (
              <React.Fragment key={idx}>
                <Text x={5.7} y={baseY} w={4} text={row ? String(idx + 1) : ""} align="center" />
                <Text x={11.5} y={baseY} w={12} text={row?.billNo} />
                <Text x={26.4} y={baseY} w={10} text={formatDate(row?.date)} />
                <Text x={39.0} y={baseY} w={17} text={row?.issuedBy} />
                <Text x={56.3} y={baseY} w={18} text={row?.towards} />
                <Text x={82.3} y={baseY} w={10} text={row?.amount} align="right" />
              </React.Fragment>
            );
          })}

          <Text x={8.1} y={139.05} w={18} text={data.pan} />
          <Text x={34.1} y={139.05} w={21} text={data.bankAccountNumber} />
          <Text x={8.1} y={141.7} w={43} text={data.bankNameBranch} />
          <Text x={8.1} y={144.4} w={29} text={data.chequePayableTo} />
          <Text x={58.9} y={144.4} w={16} text={data.ifsc} />
        </div>
      </section>

      <section className="a4-page">
        <img src={claimFormPartB} alt="IRDAI Claim Form Part B" className="form-template" />
      </section>
    </div>
  );
}
