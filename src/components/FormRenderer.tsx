import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { BillRow, ClaimData } from "../App";
import claimFormPartA from "../assets/claim-form-part-a.png";
import claimFormPartB from "../assets/claim-form-part-b.png";

type Props = { data: ClaimData };

type QrCompactData = Record<string, string | boolean | string[] | Array<Record<string, string>>>;

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`;
}
function formatMonthYear(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getFullYear()).slice(-2)}`;
}
function formatTime(value?: string) { return value ? value.replace(":", "") : ""; }
function deriveAge(dob?: string) {
  if (!dob) return { years: "", months: "" };
  const birth = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birth.getTime())) return { years: "", months: "" };
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  return { years: String(Math.max(0, years)), months: String(Math.max(0, months)) };
}

function normalizeBoxText(value?: string) {
  return (value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}
const Tick = ({ x, y }: { x: number; y: number }) => <Text x={x} y={y} text="✓" size={9} bold align="center" />;
const hasDoc = (data: ClaimData, label: string) => (data.documents || []).includes(label);
const rowAt = (rows: BillRow[] | undefined, index: number) => rows && rows[index] ? rows[index] : undefined;

function compactClaimData(data: ClaimData): QrCompactData {
  const entries: Array<[string, unknown]> = [
    ["ws", data.wizardStepKey],
    ["rel", data.relationship],
    ["phn", data.policyholderName],
    ["ptn", data.patientName],
    ["pol", data.policyNumber],
    ["tpa", data.tpaId],
    ["phd", data.policyholderDob],
    ["ptd", data.patientDob],
    ["gen", data.gender],
    ["occ", data.occupation],
    ["oco", data.occupationOther],
    ["ph", data.phone],
    ["em", data.email],
    ["coc", data.currentOtherCover],
    ["fis", data.firstInsuranceStart],
    ["ccn", data.currentOtherCompanyName],
    ["cpn", data.currentOtherPolicyNo],
    ["csi", data.currentOtherSumInsured],
    ["h4y", data.hospitalizedLastFourYears],
    ["lhd", data.lastHospitalizationDate],
    ["lhn", data.lastHospitalizationDiagnosis],
    ["poc", data.previousOtherCover],
    ["pon", data.previousOtherCompanyName],
    ["sad", data.sameAddress],
    ["pa1", data.policyholderAddress1],
    ["pcy", data.policyholderCity],
    ["pst", data.policyholderState],
    ["ppn", data.policyholderPin],
    ["aa1", data.patientAddress1],
    ["acy", data.patientCity],
    ["ast", data.patientState],
    ["apn", data.patientPin],
    ["hrs", data.hospitalizationReason],
    ["did", data.diseaseOrInjuryDate],
    ["adt", data.admissionDate],
    ["atm", data.admissionTime],
    ["ddt", data.dischargeDate],
    ["dtm", data.dischargeTime],
    ["hos", data.hospitalName],
    ["rmc", data.roomCategory],
    ["som", data.systemOfMedicine],
    ["inc", data.injuryCause],
    ["mll", data.medicoLegal],
    ["rtp", data.reportedToPolice],
    ["fir", data.firAttached],
    ["hpe", data.hadPreExpenses],
    ["pre", data.preExpenses],
    ["hpo", data.hadPostExpenses],
    ["pos", data.postExpenses],
    ["hex", data.hospitalExpenses],
    ["hcu", data.healthCheckupCost],
    ["amb", data.ambulanceCharges],
    ["oca", data.othersClaimAmount],
    ["occd", data.othersClaimCode],
    ["phdys", data.preHospitalizationDays],
    ["podys", data.postHospitalizationDays],
    ["dom", data.hadDomiciliary],
    ["hcb", data.hasCashBenefits],
    ["hdc", data.hospitalDailyCash],
    ["srg", data.surgicalCash],
    ["cil", data.criticalIllnessBenefit],
    ["cnv", data.convalescence],
    ["pps", data.prePostLumpSum],
    ["obe", data.otherBenefit],
    ["ban", data.bankAccountNumber],
    ["bnb", data.bankNameBranch],
    ["ifs", data.ifsc],
    ["cpy", data.chequePayableTo],
    ["pyt", data.payeeType],
    ["pan", data.pan],
    ["dpl", data.declarationPlace],
    ["dd", data.declarationDate],
  ];

  const compact = Object.fromEntries(
    entries.filter(([, value]) => value !== undefined && value !== null && value !== ""),
  ) as QrCompactData;

  if (data.documents?.length) compact.docs = data.documents.filter(Boolean);
  if (data.billRows?.length) {
    compact.bills = data.billRows.map((row) => ({
      i: row.id || "",
      n: row.billNo || "",
      d: row.date || "",
      b: row.issuedBy || "",
      t: row.towards || "",
      a: row.amount || "",
    }));
  }

  return compact;
}

function buildQrPayload(pageId: string, data: ClaimData) {
  return JSON.stringify({
    v: 4,
    page: pageId,
    data: compactClaimData(data),
  });
}

function Text({ x, y, w, text, size = 6.1, bold = false, align = "left", boxed = false }: { x: number; y: number; w?: number; text?: string; size?: number; bold?: boolean; align?: "left" | "center" | "right"; boxed?: boolean }) {
  const normalized = normalizeBoxText(text);
  const renderText = boxed ? normalized : (text || "");
  return <div className="pdf-text" style={{ left: `${x}%`, top: `${y}%`, width: w ? `${w}%` : undefined, fontSize: `${boxed ? 6.4 : size}px`, fontWeight: bold ? 700 : 400, textAlign: align, letterSpacing: boxed ? "1.6px" : "0px", fontFamily: boxed ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" : undefined, whiteSpace: "nowrap" }}>{renderText}</div>;
}

function PageFrame({ template, fallbackTemplate, qrValue, children }: { template: string; fallbackTemplate?: string; qrValue: string; children?: React.ReactNode }) {
  const [activeTemplate, setActiveTemplate] = useState(template);
  return <section className="a4-page page-break"><img src={activeTemplate} alt="IRDAI claim form page" className="form-template" onError={() => {
    if (fallbackTemplate && activeTemplate !== fallbackTemplate) setActiveTemplate(fallbackTemplate);
  }} /><div className="page-overlay"><div className="page-qr"><QRCodeSVG value={qrValue} size={86} level="L" includeMargin /></div>{children}</div></section>;
}

export default function FormRenderer({ data }: Props) {
  const age = deriveAge(data.patientDob);
  const rows = (data.billRows || []).slice(0, 10);

  // If you add exact legend images at the paths below, page 2/4 will use them.
  const pages = [
    { id: "p1", template: claimFormPartA, fallbackTemplate: claimFormPartA, withOverlay: true },
    { id: "p2", template: "/src/assets/claim-form-part-a-guidance.png", fallbackTemplate: claimFormPartA, withOverlay: false },
    { id: "p3", template: claimFormPartB, fallbackTemplate: claimFormPartB, withOverlay: false },
    { id: "p4", template: "/src/assets/claim-form-part-b-guidance.png", fallbackTemplate: claimFormPartB, withOverlay: false },
  ] as const;

  return (
    <div className="form-preview-wrap">
      {pages.map((page) => (
        <PageFrame key={page.id} template={page.template} fallbackTemplate={page.fallbackTemplate} qrValue={buildQrPayload(page.id, data)}>
          {page.withOverlay ? (
            <>
        <Text x={8.4} y={7.9} w={22} text={data.policyNumber} boxed /><Text x={8.4} y={11.0} w={25} text={data.tpaId} boxed />
        <Text x={8.4} y={14.8} w={45} text={data.policyholderName} boxed /><Text x={8.4} y={19.0} w={50} text={data.policyholderAddress1} boxed />
        <Text x={18.9} y={24.4} w={13} text={data.policyholderCity} boxed /><Text x={44.3} y={24.4} w={12} text={data.policyholderState} boxed /><Text x={18.8} y={27.0} w={8} text={data.policyholderPin} boxed /><Text x={34.2} y={27.0} w={14} text={data.phone} boxed /><Text x={58.9} y={27.0} w={27} text={data.email} />
        {data.currentOtherCover === "Yes" ? <Tick x={27.9} y={31.95} /> : <Tick x={32.7} y={31.95} />}<Text x={58.5} y={31.95} w={12} text={formatDate(data.firstInsuranceStart)} />
        <Text x={10.8} y={34.8} w={18} text={data.currentOtherCompanyName} boxed /><Text x={43.8} y={34.8} w={14} text={data.currentOtherPolicyNo} boxed /><Text x={10.6} y={37.2} w={11} text={data.currentOtherSumInsured} boxed />
        {data.hospitalizedLastFourYears === "Yes" ? <Tick x={64.5} y={37.1} /> : <Tick x={69.1} y={37.1} />}<Text x={79.2} y={37.1} w={6} text={formatMonthYear(data.lastHospitalizationDate)} /><Text x={10.4} y={39.8} w={23} text={data.lastHospitalizationDiagnosis} />
        {data.previousOtherCover === "Yes" ? <Tick x={84.8} y={39.8} /> : <Tick x={89.2} y={39.8} />}<Text x={10.5} y={42.3} w={23} text={data.previousOtherCompanyName} />
        <Text x={8.2} y={45.8} w={45} text={data.patientName} boxed />{data.gender === "Male" ? <Tick x={26.1} y={48.9} /> : data.gender === "Female" ? <Tick x={30.3} y={48.9} /> : null}
        <Text x={44.8} y={48.9} w={4} text={age.years} /><Text x={52.8} y={48.9} w={4} text={age.months} /><Text x={65.9} y={48.9} w={15} text={formatDate(data.patientDob)} />
        {data.relationship === "Myself" ? <Tick x={27.0} y={51.95} /> : data.relationship === "Spouse" ? <Tick x={33.2} y={51.95} /> : data.relationship === "Child" ? <Tick x={39.5} y={51.95} /> : data.relationship === "Father" ? <Tick x={45.5} y={51.95} /> : data.relationship === "Mother" ? <Tick x={52.0} y={51.95} /> : data.relationship ? <Tick x={58.2} y={51.95} /> : null}
        {data.occupation === "Service" ? <Tick x={24.0} y={54.95} /> : data.occupation === "Self Employed" ? <Tick x={31.6} y={54.95} /> : data.occupation === "Homemaker" ? <Tick x={39.9} y={54.95} /> : data.occupation === "Student" ? <Tick x={49.0} y={54.95} /> : data.occupation === "Retired" ? <Tick x={56.0} y={54.95} /> : data.occupation ? <Tick x={62.2} y={54.95} /> : null}
        <Text x={8.2} y={58.3} w={48} text={data.sameAddress === true ? "" : [data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ")} boxed /><Text x={18.8} y={63.6} w={8} text={data.sameAddress === true ? "" : data.patientPin} boxed />

        <Text x={23.2} y={66.9} w={42} text={data.hospitalName} />{data.roomCategory === "Day care" ? <Tick x={25.9} y={70.0} /> : data.roomCategory === "Single occupancy" ? <Tick x={34.8} y={70.0} /> : data.roomCategory === "Twin sharing" ? <Tick x={46.1} y={70.0} /> : data.roomCategory ? <Tick x={60.1} y={70.0} /> : null}
        {data.hospitalizationReason === "Injury" ? <Tick x={26.4} y={72.95} /> : data.hospitalizationReason === "Illness" ? <Tick x={33.0} y={72.95} /> : data.hospitalizationReason === "Maternity" ? <Tick x={39.6} y={72.95} /> : null}
        <Text x={66.2} y={72.85} w={14} text={formatDate(data.diseaseOrInjuryDate)} /><Text x={18.3} y={75.8} w={14} text={formatDate(data.admissionDate)} /><Text x={34.0} y={75.8} w={8} text={formatTime(data.admissionTime)} /><Text x={52.0} y={75.8} w={14} text={formatDate(data.dischargeDate)} /><Text x={67.9} y={75.8} w={8} text={formatTime(data.dischargeTime)} />
        {data.injuryCause === "Self inflicted" ? <Tick x={25.8} y={78.9} /> : data.injuryCause === "Road traffic accident" ? <Tick x={36.4} y={78.9} /> : data.injuryCause === "Substance / alcohol related" ? <Tick x={54.0} y={78.9} /> : null}
        {data.medicoLegal === "Yes" ? <Tick x={74.5} y={78.9} /> : data.medicoLegal === "No" ? <Tick x={79.0} y={78.9} /> : null}
        {data.reportedToPolice === "Yes" ? <Tick x={20.6} y={81.9} /> : data.reportedToPolice === "No" ? <Tick x={25.1} y={81.9} /> : null}
        {data.firAttached === "Yes" ? <Tick x={43.4} y={81.9} /> : data.firAttached === "No" ? <Tick x={47.9} y={81.9} /> : null}
        <Text x={77.3} y={81.7} w={10} text={data.systemOfMedicine} />

        <Text x={14.8} y={84.8} w={9} text={data.preExpenses} /><Text x={44.9} y={84.8} w={9} text={data.hospitalExpenses} />
        <Text x={14.8} y={87.1} w={9} text={data.postExpenses} /><Text x={44.9} y={87.1} w={9} text={data.healthCheckupCost} />
        <Text x={14.8} y={89.6} w={9} text={data.ambulanceCharges} /><Text x={44.9} y={89.6} w={9} text={data.othersClaimAmount} /><Text x={49.8} y={89.6} w={6} text={data.othersClaimCode} />
        <Text x={20.8} y={92.1} w={5} text={data.preHospitalizationDays} /><Text x={55.0} y={92.1} w={5} text={data.postHospitalizationDays} />
        {data.hadDomiciliary === "Yes" ? <Tick x={26.1} y={94.4} /> : data.hadDomiciliary === "No" ? <Tick x={30.7} y={94.4} /> : null}
        <Text x={14.8} y={96.8} w={9} text={data.hospitalDailyCash} /><Text x={44.9} y={96.8} w={9} text={data.surgicalCash} />
        <Text x={14.8} y={99.0} w={9} text={data.criticalIllnessBenefit} /><Text x={44.9} y={99.0} w={9} text={data.convalescence} />

        {hasDoc(data, "Claim form duly signed") && <Tick x={74.0} y={84.5} />}{hasDoc(data, "Copy of claim intimation") && <Tick x={74.0} y={86.8} />}
        {hasDoc(data, "Hospital main bill") && <Tick x={74.0} y={89.1} />}{hasDoc(data, "Hospital break-up bill") && <Tick x={74.0} y={91.5} />}
        {hasDoc(data, "Hospital bill payment receipt") && <Tick x={74.0} y={93.8} />}{hasDoc(data, "Hospital discharge summary") && <Tick x={74.0} y={96.1} />}
        {hasDoc(data, "Pharmacy bill") && <Tick x={74.0} y={98.4} />}{hasDoc(data, "Operation Theatre notes") && <Tick x={74.0} y={100.7} />}

        {[0,1,2,3,4,5,6,7,8,9].map((idx) => {
          const row = rowAt(rows, idx);
          const baseY = 76.8 + idx * 1.62;
          return <React.Fragment key={idx}><Text x={5.7} y={baseY} w={4} text={row ? String(idx + 1) : ""} align="center" /><Text x={11.5} y={baseY} w={12} text={row?.billNo} /><Text x={26.4} y={baseY} w={10} text={formatDate(row?.date)} /><Text x={39.0} y={baseY} w={17} text={row?.issuedBy} /><Text x={56.3} y={baseY} w={18} text={row?.towards} /><Text x={82.3} y={baseY} w={10} text={row?.amount} align="right" /></React.Fragment>;
        })}

        <Text x={8.1} y={94.3} w={18} text={data.pan} /><Text x={34.1} y={94.3} w={21} text={data.bankAccountNumber} />
        <Text x={8.1} y={96.3} w={43} text={data.bankNameBranch} /><Text x={8.1} y={98.5} w={29} text={data.chequePayableTo} /><Text x={58.9} y={98.5} w={16} text={data.ifsc} />
            </>
          ) : null}
        </PageFrame>
      ))}
    </div>
  );
}
