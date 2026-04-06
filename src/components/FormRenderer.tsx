import React from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ClaimData } from "../App";
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

function formatTime(value?: string) {
  if (!value) return "";
  return value.replace(":", "");
}

function splitAddress(
  line1?: string,
  city?: string,
  state?: string,
  pin?: string
) {
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
    v: 1,
    p: 1,
    a: {
      pn: data.policyNumber || "",
      tpa: data.tpaId || "",
      phn: data.policyholderName || "",
      pha1: data.policyholderAddress1 || "",
      phc: data.policyholderCity || "",
      phs: data.policyholderState || "",
      php: data.policyholderPin || "",
      phm: data.phone || "",
      phe: data.email || "",
      ptn: data.patientName || "",
      g: data.gender || "",
      dob: data.patientDob || "",
      rel: data.relationship || "",
      pta1: data.patientAddress1 || "",
      ptc: data.patientCity || "",
      pts: data.patientState || "",
      ptp: data.patientPin || "",
      same: data.sameAddress === true ? "Y" : "N",
      hr: data.hospitalizationReason || "",
      evd: data.diseaseOrInjuryDate || "",
      ad: data.admissionDate || "",
      at: data.admissionTime || "",
      dd: data.dischargeDate || "",
      dt: data.dischargeTime || "",
      hn: data.hospitalName || "",
      rc: data.roomCategory || "",
      som: data.systemOfMedicine || "",
      ic: data.injuryCause || "",
      ml: data.medicoLegal || "",
      pol: data.reportedToPolice || "",
      fir: data.firAttached || "",
      pre: data.preExpenses || "",
      hosp: data.hospitalExpenses || "",
      post: data.postExpenses || "",
      amb: data.ambulanceCharges || "",
      dom: data.hadDomiciliary || "",
      hdc: data.hospitalDailyCash || "",
      sc: data.surgicalCash || "",
      cib: data.criticalIllnessBenefit || "",
      conv: data.convalescence || "",
      ppl: data.prePostLumpSum || "",
      ob: data.otherBenefit || "",
      docs: data.documents || [],
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
  size = 8,
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
      ? policyholderAddress
      : splitAddress(
          data.patientAddress1,
          data.patientCity,
          data.patientState,
          data.patientPin
        );

  const qrValue = compactPagePayload(data);

  return (
    <div className="form-preview-wrap">
      <section className="a4-page page-break">
        <img
          src={claimFormPartA}
          alt="IRDAI Claim Form Part A"
          className="form-template"
        />

        <div className="page-overlay">
          <div className="page-qr">
            <QRCodeSVG value={qrValue} size={62} level="L" includeMargin />
          </div>

          <Text x={7.7} y={7.5} w={25} text={data.policyNumber} />
          <Text x={7.7} y={10.6} w={28} text={data.tpaId} />

          <Text x={7.9} y={14.6} w={47} text={data.policyholderName} />
          <Text x={8.0} y={18.8} w={50} text={policyholderAddress} />
          <Text x={18.6} y={24.1} w={13} text={data.policyholderCity} />
          <Text x={44.4} y={24.1} w={14} text={data.policyholderState} />
          <Text x={18.5} y={26.7} w={9} text={data.policyholderPin} />
          <Text x={34.2} y={26.7} w={14} text={data.phone} />
          <Text x={58.9} y={26.7} w={27} text={data.email} />

          <Text x={8.0} y={39.2} w={47} text={data.patientName} />
          <Text x={29.8} y={42.5} w={6} text={data.gender} />
          <Text x={44.7} y={42.5} w={4} text={age.years} />
          <Text x={52.7} y={42.5} w={4} text={age.months} />
          <Text x={66.0} y={42.5} w={15} text={formatDate(data.patientDob)} />
          <Text x={26.6} y={45.7} w={18} text={data.relationship} />
          <Text x={8.1} y={52.0} w={50} text={patientAddress} />
          <Text x={18.5} y={57.8} w={9} text={data.sameAddress === true ? data.policyholderPin : data.patientPin} />
          <Text x={34.2} y={57.8} w={14} text={data.phone} />
          <Text x={58.9} y={57.8} w={27} text={data.email} />

          <Text x={23.0} y={63.4} w={42} text={data.hospitalName} />
          <Text x={42.3} y={66.3} w={20} text={data.roomCategory} />
          <Text x={28.0} y={69.3} w={14} text={data.hospitalizationReason} />
          <Text x={66.1} y={69.3} w={14} text={formatDate(data.diseaseOrInjuryDate)} />
          <Text x={18.1} y={72.1} w={14} text={formatDate(data.admissionDate)} />
          <Text x={34.0} y={72.1} w={8} text={formatTime(data.admissionTime)} />
          <Text x={52.1} y={72.1} w={14} text={formatDate(data.dischargeDate)} />
          <Text x={67.9} y={72.1} w={8} text={formatTime(data.dischargeTime)} />
          <Text x={77.0} y={78.1} w={10} text={data.systemOfMedicine} />

          <Text x={14.7} y={84.2} w={9} text={data.preExpenses} />
          <Text x={44.7} y={84.2} w={9} text={data.hospitalExpenses} />
          <Text x={14.7} y={87.0} w={9} text={data.postExpenses} />
          <Text x={44.7} y={87.0} w={9} text={""} />
          <Text x={14.7} y={89.8} w={9} text={data.ambulanceCharges} />
          <Text x={44.7} y={89.8} w={9} text={""} />

          <Text x={44.7} y={95.9} w={9} text={data.hospitalDailyCash} />
          <Text x={44.7} y={98.6} w={9} text={data.surgicalCash} />
          <Text x={44.7} y={101.4} w={9} text={data.criticalIllnessBenefit} />
          <Text x={44.7} y={104.2} w={9} text={data.convalescence} />

          <Text x={8.1} y={117.3} w={18} text={data.pan} />
          <Text x={34.0} y={117.3} w={20} text={data.bankAccountNumber} />
          <Text x={8.1} y={120.1} w={42} text={data.bankNameBranch} />
          <Text x={8.1} y={122.9} w={28} text={data.chequePayableTo} />
          <Text x={58.8} y={122.9} w={16} text={data.ifsc} />
        </div>
      </section>

      <section className="a4-page">
        <img
          src={claimFormPartB}
          alt="IRDAI Claim Form Part B"
          className="form-template"
        />
      </section>
    </div>
  );
}
