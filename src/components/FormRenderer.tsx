import React from "react";
import type { ClaimData } from "../App";

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

function Text({
  x,
  y,
  w,
  text,
  size = 11,
  bold = false,
}: {
  x: number;
  y: number;
  w?: number;
  text?: string;
  size?: number;
  bold?: boolean;
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

  return (
    <div className="form-preview-wrap">
      <section className="a4-page page-break">
        <div className="page-bg page-a" />
        <div className="page-overlay">
          <Text x={8} y={7.4} w={24} text={data.policyNumber} />
          <Text x={61} y={7.4} w={22} text="" />
          <Text x={8} y={10.7} w={26} text={data.tpaId} />

          <Text x={8} y={14.5} w={48} text={data.policyholderName} />
          <Text x={8} y={18.6} w={52} text={policyholderAddress} />
          <Text x={19} y={24.2} w={15} text={data.policyholderCity} />
          <Text x={44.5} y={24.2} w={12} text={data.policyholderState} />
          <Text x={18.8} y={26.9} w={10} text={data.policyholderPin} />
          <Text x={34.2} y={26.9} w={15} text={data.phone} />
          <Text x={59.4} y={26.9} w={28} text={data.email} />

          <Text x={8.2} y={39.3} w={48} text={data.patientName} />
          <Text x={29.8} y={42.6} w={5} text={data.gender} />
          <Text x={44.8} y={42.6} w={5} text={age.years} />
          <Text x={52.9} y={42.6} w={4} text={age.months} />
          <Text x={66.1} y={42.6} w={14} text={formatDate(data.patientDob)} />
          <Text x={26.8} y={45.9} w={18} text={data.relationship} />
          <Text x={8.2} y={52.1} w={52} text={patientAddress} />
          <Text x={18.8} y={58.0} w={10} text={data.patientPin} />
          <Text x={34.2} y={58.0} w={15} text={data.phone} />
          <Text x={59.4} y={58.0} w={28} text={data.email} />

          <Text x={23.2} y={63.5} w={45} text={data.hospitalName} />
          <Text x={42.5} y={66.5} w={20} text={data.roomCategory} />
          <Text x={28.0} y={69.4} w={14} text={data.hospitalizationReason} />
          <Text x={66.3} y={69.4} w={14} text={formatDate(data.diseaseOrInjuryDate)} />
          <Text x={18.3} y={72.3} w={14} text={formatDate(data.admissionDate)} />
          <Text x={34.1} y={72.3} w={8} text={formatTime(data.admissionTime)} />
          <Text x={52.2} y={72.3} w={14} text={formatDate(data.dischargeDate)} />
          <Text x={68.0} y={72.3} w={8} text={formatTime(data.dischargeTime)} />
          <Text x={77.3} y={78.2} w={10} text={data.systemOfMedicine} />

          <Text x={14.8} y={84.2} w={10} text={data.preExpenses} />
          <Text x={45.0} y={84.2} w={10} text={data.hospitalExpenses} />
          <Text x={14.8} y={87.0} w={10} text={data.postExpenses} />
          <Text x={45.0} y={87.0} w={10} text="0" />
          <Text x={14.8} y={89.8} w={10} text={data.ambulanceCharges} />
          <Text x={45.0} y={89.8} w={10} text="0" />

          <Text x={45.0} y={96.0} w={10} text={data.hospitalDailyCash} />
          <Text x={45.0} y={98.7} w={10} text={data.surgicalCash} />
          <Text x={45.0} y={101.5} w={10} text={data.criticalIllnessBenefit} />
          <Text x={45.0} y={104.2} w={10} text={data.convalescence} />

          <Text x={8.0} y={117.4} w={18} text={data.pan} />
          <Text x={34.2} y={117.4} w={20} text={data.bankAccountNumber} />
          <Text x={8.0} y={120.2} w={42} text={data.bankNameBranch} />
          <Text x={8.0} y={123.0} w={28} text={data.chequePayableTo} />
          <Text x={59.0} y={123.0} w={16} text={data.ifsc} />
        </div>
      </section>

      <section className="a4-page">
        <div className="page-bg page-b" />
        <div className="page-overlay" />
      </section>
    </div>
  );
}
