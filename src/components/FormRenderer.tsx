import React, { Component } from "react";
import { QRCodeSVG } from "qrcode.react";
import LZString from "lz-string";
import type { BillRow, ClaimData } from "../App";
import claimFormPartA from "../assets/claim-form-part-a.png?url";
import claimFormPartAGuidance from "../assets/claim-form-part-a-guidance.png?url";
import claimFormPartB from "../assets/claim-form-part-b.png?url";
import claimFormPartBGuidance from "../assets/claim-form-part-b-guidance.png?url";

type Props = { data: ClaimData };

function formatDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function formatMonthYear(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
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
  return (value || "").toUpperCase().replace(/[^A-Z0-9\s\-./]/g, "");
}

const hasDoc = (data: ClaimData, label: string) => (data.documents || []).includes(label);
const rowAt = (rows: BillRow[] | undefined, index: number) => rows && rows[index] ? rows[index] : undefined;

// Compact representation for QR
function compactClaimData(data: ClaimData): Record<string, unknown> {
  const entries: Array<[string, unknown]> = [
    ["rel", data.relationship], ["phn", data.policyholderName], ["ptn", data.patientName],
    ["pol", data.policyNumber], ["tpa", data.tpaId], ["ptd", data.patientDob], ["gen", data.gender],
    ["occ", data.occupation], ["ph", data.phone], ["em", data.email],
    ["ins", data.insurerName], ["tpn", data.tpaName], ["mid", data.memberId], ["si", data.sumInsured],
    ["coc", data.currentOtherCover], ["fis", data.firstInsuranceStart],
    ["ccn", data.currentOtherCompanyName], ["cpn", data.currentOtherPolicyNo], ["csi", data.currentOtherSumInsured],
    ["h4y", data.hospitalizedLastFourYears], ["lhd", data.lastHospitalizationDate], ["lhn", data.lastHospitalizationDiagnosis],
    ["poc", data.previousOtherCover], ["pon", data.previousOtherCompanyName],
    ["sad", data.sameAddress], ["pa1", data.policyholderAddress1], ["pcy", data.policyholderCity],
    ["pst", data.policyholderState], ["ppn", data.policyholderPin],
    ["aa1", data.patientAddress1], ["acy", data.patientCity], ["ast", data.patientState], ["apn", data.patientPin],
    ["hrs", data.hospitalizationReason], ["did", data.diseaseOrInjuryDate],
    ["adt", data.admissionDate], ["atm", data.admissionTime], ["ddt", data.dischargeDate], ["dtm", data.dischargeTime],
    ["hos", data.hospitalName], ["had", data.hospitalAddress], ["hph", data.hospitalPhone],
    ["hem", data.hospitalEmail], ["hrn", data.hospitalRegNo], ["hpn", data.hospitalPan],
    ["rmc", data.roomCategory], ["som", data.systemOfMedicine],
    ["inc", data.injuryCause], ["mll", data.medicoLegal], ["rtp", data.reportedToPolice], ["fir", data.firAttached],
    ["hpe", data.hadPreExpenses], ["pre", data.preExpenses], ["hpo", data.hadPostExpenses], ["pos", data.postExpenses],
    ["hex", data.hospitalExpenses], ["hcu", data.healthCheckupCost], ["amb", data.ambulanceCharges],
    ["oca", data.othersClaimAmount], ["phdys", data.preHospitalizationDays], ["podys", data.postHospitalizationDays],
    ["dom", data.hadDomiciliary], ["hcb", data.hasCashBenefits], ["hdc", data.hospitalDailyCash],
    ["srg", data.surgicalCash], ["cil", data.criticalIllnessBenefit], ["cnv", data.convalescence],
    ["tdn", data.treatingDoctorName], ["tdq", data.treatingDoctorQualification],
    ["dxt", data.diagnosisText], ["dxi", data.diagnosisIcdCode],
    ["prc", data.procedureName], ["pri", data.procedureIcdCode], ["prd", data.procedureDate],
    ["pex", data.isPreExistingCondition],
    ["ban", data.bankAccountNumber], ["bnb", data.bankNameBranch], ["ifs", data.ifsc],
    ["cpy", data.chequePayableTo], ["pyt", data.payeeType], ["pan", data.pan],
    ["dpl", data.declarationPlace], ["dd", data.declarationDate],
  ];
  const compact = Object.fromEntries(entries.filter(([, v]) => v !== undefined && v !== null && v !== ""));
  if (data.documents?.length) compact.docs = data.documents;
  if (data.billRows?.length) compact.bills = data.billRows.map(r => ({ n: r.billNo, d: r.date, b: r.issuedBy, t: r.towards, a: r.amount }));
  return compact;
}

function buildKeyPayload(data: ClaimData): Record<string, unknown> {
  const entries: Array<[string, unknown]> = [
    ["pol", data.policyNumber], ["ins", data.insurerName], ["tpn", data.tpaName], ["mid", data.memberId],
    ["phn", data.policyholderName], ["ptn", data.patientName], ["gen", data.gender], ["ptd", data.patientDob],
    ["hos", data.hospitalName], ["adt", data.admissionDate], ["ddt", data.dischargeDate],
    ["hrs", data.hospitalizationReason], ["hex", data.hospitalExpenses],
    ["dxt", data.diagnosisText], ["dxi", data.diagnosisIcdCode],
    ["prc", data.procedureName], ["tdn", data.treatingDoctorName],
  ];
  return Object.fromEntries(entries.filter(([, v]) => v !== undefined && v !== null && v !== ""));
}

function buildQrUrl(data: ClaimData): string {
  try {
    const base = window.location.origin;
    const full = JSON.stringify({ v: 5, data: compactClaimData(data) });
    const compressed = LZString.compressToEncodedURIComponent(full);
    const url = `${base}/decode?d=${compressed}`;
    if (url.length <= 1400) return url;
    const keyCompressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ v: 5, partial: true, data: buildKeyPayload(data) })
    );
    return `${base}/decode?d=${keyCompressed}`;
  } catch {
    return window.location.origin + "/decode";
  }
}

// Text component — all coordinates are % of the page dimensions
function Text({ x, y, w, text, size = 10, bold = false, align = "left", boxed = false }: {
  x: number; y: number; w?: number; text?: string; size?: number;
  bold?: boolean; align?: "left" | "center" | "right"; boxed?: boolean;
}) {
  if (!text) return null;
  const renderText = boxed ? normalizeBoxText(text) : text;
  return (
    <div className="pdf-text" style={{
      left: `${x}%`,
      top: `${y}%`,
      width: w ? `${w}%` : undefined,
      fontSize: `${boxed ? 8.5 : size}px`,
      fontWeight: bold ? 700 : 400,
      textAlign: align,
      letterSpacing: boxed ? "1.4px" : "0px",
      fontFamily: boxed
        ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
        : "Inter, ui-sans-serif, system-ui, sans-serif",
      whiteSpace: "nowrap",
      color: "#090909",
    }}>
      {renderText}
    </div>
  );
}

function Tick({ x, y }: { x: number; y: number }) {
  return (
    <div className="pdf-text" style={{
      left: `${x}%`, top: `${y}%`,
      fontSize: "11px", fontWeight: 700, color: "#090909", lineHeight: 1,
    }}>✓</div>
  );
}

function QrBlock({ url }: { url: string }) {
  return (
    <div className="page-qr-wrap">
      <div className="page-qr">
        <QRCodeSVG value={url} size={76} level="M" includeMargin={false} />
        <div style={{ fontSize: 6, textAlign: "center", marginTop: 2, color: "#555", letterSpacing: "0.02em", fontFamily: "sans-serif" }}>
          Scan to view
        </div>
      </div>
    </div>
  );
}

function SignatureBlock({ data }: { data: ClaimData }) {
  if (data.signatureDataUrl) {
    return (
      <img
        src={data.signatureDataUrl}
        alt="Signature"
        style={{
          position: "absolute",
          left: "6%", top: "83.5%",
          width: "28%", height: "3%",
          objectFit: "contain", objectPosition: "left center",
          zIndex: 3,
        }}
      />
    );
  }
  if (data.signatureText) {
    return (
      <div style={{
        position: "absolute",
        left: "6%", top: "83.5%",
        fontSize: "20px",
        fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
        fontStyle: "italic",
        color: "#090909",
        lineHeight: 1,
        zIndex: 3,
        whiteSpace: "nowrap",
      }}>
        {data.signatureText}
      </div>
    );
  }
  return null;
}

function PageFrame({ template, qrUrl, children }: {
  template: string; qrUrl: string; children?: React.ReactNode;
}) {
  return (
    <section className="a4-page page-break">
      <img src={template} alt="IRDAI claim form" className="form-template" />
      <div className="page-overlay">
        <QrBlock url={qrUrl} />
        {children}
      </div>
    </section>
  );
}

class FormErrorBoundary extends Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: Error) { return { error: err.message }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 16, margin: 16, color: "#991b1b" }}>
          <strong>Form preview error:</strong> {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FormRenderer({ data }: Props) {
  const age = deriveAge(data.patientDob);
  const rows = (data.billRows || []).slice(0, 10);
  const qrUrl = buildQrUrl(data);

  return (
    <FormErrorBoundary>
      <div className="form-preview-wrap">

        {/* ── Part A ── */}
        <PageFrame template={claimFormPartA} qrUrl={qrUrl}>

          {/* Section 1 — Primary insured */}
          <Text x={8.4}  y={7.9}  w={22} text={data.policyNumber}        boxed />
          <Text x={40.0} y={7.9}  w={18} text={data.tpaId}               boxed />
          <Text x={8.4}  y={11.0} w={25} text={data.insurerName}         />
          <Text x={40.0} y={11.0} w={20} text={data.tpaName}             />
          <Text x={8.4}  y={14.8} w={55} text={data.policyholderName}    boxed />
          <Text x={8.4}  y={19.0} w={68} text={data.policyholderAddress1} />
          <Text x={8.4}  y={21.8} w={20} text={data.policyholderCity}    />
          <Text x={40.0} y={21.8} w={18} text={data.policyholderState}   />
          <Text x={8.4}  y={24.5} w={10} text={data.policyholderPin}     boxed />
          <Text x={28.0} y={24.5} w={20} text={data.phone}               />
          <Text x={55.0} y={24.5} w={35} text={data.email}               size={8} />

          {/* Section 2 — Insurance history */}
          {data.currentOtherCover === "Yes" ? <Tick x={27.9} y={29.4} /> : <Tick x={33.8} y={29.4} />}
          <Text x={55.0} y={29.4} w={14} text={formatMonthYear(data.firstInsuranceStart)} />
          {data.hospitalizedLastFourYears === "Yes" ? <Tick x={64.5} y={32.5} /> : <Tick x={70.4} y={32.5} />}
          <Text x={79.0} y={32.5} w={8}  text={formatMonthYear(data.lastHospitalizationDate)} size={8} />
          <Text x={8.4}  y={35.8} w={35} text={data.currentOtherCompanyName}    />
          <Text x={47.0} y={35.8} w={20} text={data.currentOtherPolicyNo}       />
          <Text x={8.4}  y={38.4} w={20} text={data.currentOtherSumInsured}     />
          <Text x={8.4}  y={41.0} w={45} text={data.lastHospitalizationDiagnosis} size={9} />
          {data.previousOtherCover === "Yes" ? <Tick x={84.8} y={38.4} /> : <Tick x={90.5} y={38.4} />}
          <Text x={8.4}  y={43.6} w={35} text={data.previousOtherCompanyName}   />

          {/* Section 3 — Patient */}
          <Text x={8.4}  y={33.0} w={55} text={data.patientName}         boxed />
          {data.gender === "Male"   ? <Tick x={26.1} y={36.0} /> : null}
          {data.gender === "Female" ? <Tick x={33.0} y={36.0} /> : null}
          <Text x={45.5} y={36.0} w={4}  text={age.years}                />
          <Text x={52.5} y={36.0} w={4}  text={age.months}               />
          <Text x={63.5} y={36.0} w={18} text={formatDate(data.patientDob)} />
          {data.relationship === "Myself"  ? <Tick x={27.0} y={39.0} /> :
           data.relationship === "Spouse"  ? <Tick x={33.2} y={39.0} /> :
           data.relationship === "Child"   ? <Tick x={39.5} y={39.0} /> :
           data.relationship === "Father"  ? <Tick x={45.5} y={39.0} /> :
           data.relationship === "Mother"  ? <Tick x={52.0} y={39.0} /> :
           data.relationship              ? <Tick x={58.2} y={39.0} /> : null}
          {data.occupation === "Service"       ? <Tick x={24.0} y={41.5} /> :
           data.occupation === "Self Employed" ? <Tick x={31.6} y={41.5} /> :
           data.occupation === "Homemaker"     ? <Tick x={39.9} y={41.5} /> :
           data.occupation === "Student"       ? <Tick x={49.0} y={41.5} /> :
           data.occupation === "Retired"       ? <Tick x={56.0} y={41.5} /> :
           data.occupation                     ? <Tick x={62.2} y={41.5} /> : null}
          {data.sameAddress !== true && (
            <>
              <Text x={8.4}  y={44.0} w={55} text={[data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ")} size={9} />
              <Text x={8.4}  y={48.5} w={10} text={data.patientPin} boxed />
            </>
          )}

          {/* Section 4 — Hospitalization */}
          <Text x={22.0} y={51.5} w={50} text={data.hospitalName}        />
          {data.roomCategory === "Day care"          ? <Tick x={25.9} y={54.0} /> :
           data.roomCategory === "Single occupancy"  ? <Tick x={34.8} y={54.0} /> :
           data.roomCategory === "Twin sharing"      ? <Tick x={46.1} y={54.0} /> :
           data.roomCategory                         ? <Tick x={60.1} y={54.0} /> : null}
          {data.hospitalizationReason === "Injury"   ? <Tick x={26.4} y={56.5} /> :
           data.hospitalizationReason === "Illness"  ? <Tick x={33.0} y={56.5} /> :
           data.hospitalizationReason === "Maternity"? <Tick x={39.6} y={56.5} /> : null}
          <Text x={64.0} y={56.5} w={16} text={formatDate(data.diseaseOrInjuryDate)} />
          <Text x={17.0} y={59.5} w={14} text={formatDate(data.admissionDate)}  />
          <Text x={33.0} y={59.5} w={8}  text={formatTime(data.admissionTime)}  />
          <Text x={50.0} y={59.5} w={14} text={formatDate(data.dischargeDate)}  />
          <Text x={66.0} y={59.5} w={8}  text={formatTime(data.dischargeTime)}  />
          {data.injuryCause === "Self inflicted"              ? <Tick x={25.8} y={62.5} /> :
           data.injuryCause === "Road traffic accident"       ? <Tick x={36.4} y={62.5} /> :
           data.injuryCause === "Substance / alcohol related" ? <Tick x={54.0} y={62.5} /> : null}
          {data.medicoLegal === "Yes" ? <Tick x={74.5} y={62.5} /> : data.medicoLegal === "No" ? <Tick x={80.5} y={62.5} /> : null}
          {data.reportedToPolice === "Yes" ? <Tick x={20.6} y={65.5} /> : data.reportedToPolice === "No" ? <Tick x={26.5} y={65.5} /> : null}
          {data.firAttached === "Yes"      ? <Tick x={43.4} y={65.5} /> : data.firAttached === "No"      ? <Tick x={49.3} y={65.5} /> : null}
          <Text x={75.0} y={65.0} w={14} text={data.systemOfMedicine} size={8} />

          {/* Section 5 — Claim amounts (expenses section) */}
          <Text x={14.8} y={77.0} w={10} text={data.preExpenses}       />
          <Text x={44.9} y={77.0} w={10} text={data.hospitalExpenses}  />
          <Text x={14.8} y={79.2} w={10} text={data.postExpenses}      />
          <Text x={44.9} y={79.2} w={10} text={data.healthCheckupCost} />
          <Text x={14.8} y={81.5} w={10} text={data.ambulanceCharges}  />
          <Text x={44.9} y={81.5} w={10} text={data.othersClaimAmount} />
          <Text x={20.0} y={83.8} w={6}  text={data.preHospitalizationDays}  />
          <Text x={54.0} y={83.8} w={6}  text={data.postHospitalizationDays} />
          {data.hadDomiciliary === "Yes" ? <Tick x={26.1} y={86.0} /> : data.hadDomiciliary === "No" ? <Tick x={32.0} y={86.0} /> : null}

          {/* Cash benefits */}
          <Text x={14.8} y={88.0} w={10} text={data.hospitalDailyCash}      />
          <Text x={44.9} y={88.0} w={10} text={data.surgicalCash}           />
          <Text x={14.8} y={90.2} w={10} text={data.criticalIllnessBenefit} />
          <Text x={44.9} y={90.2} w={10} text={data.convalescence}          />

          {/* Document checklist — right column, same Y as claim amounts */}
          {hasDoc(data, "Claim form duly signed")       && <Tick x={74.0} y={77.0} />}
          {hasDoc(data, "Copy of claim intimation")     && <Tick x={74.0} y={79.2} />}
          {hasDoc(data, "Hospital main bill")           && <Tick x={74.0} y={81.5} />}
          {hasDoc(data, "Hospital break-up bill")       && <Tick x={74.0} y={83.8} />}
          {hasDoc(data, "Hospital bill payment receipt")&& <Tick x={74.0} y={86.0} />}
          {hasDoc(data, "Hospital discharge summary")   && <Tick x={74.0} y={88.0} />}
          {hasDoc(data, "Pharmacy bill")                && <Tick x={74.0} y={90.2} />}

          {/* Bills table */}
          {[0,1,2,3,4,5,6,7,8,9].map((idx) => {
            const row = rowAt(rows, idx);
            const baseY = 68.5 + idx * 1.55;
            return (
              <React.Fragment key={idx}>
                <Text x={5.7}  y={baseY} w={4}  text={row ? String(idx + 1) : ""} align="center" size={8} />
                <Text x={11.5} y={baseY} w={12} text={row?.billNo}        size={8} />
                <Text x={26.4} y={baseY} w={10} text={formatDate(row?.date)} size={8} />
                <Text x={39.0} y={baseY} w={17} text={row?.issuedBy}      size={8} />
                <Text x={56.3} y={baseY} w={18} text={row?.towards}       size={8} />
                <Text x={82.3} y={baseY} w={10} text={row?.amount}        size={8} align="right" />
              </React.Fragment>
            );
          })}

          {/* Bank details — positioned above "IMPORTANT: PLEASE TURN OVER" */}
          <Text x={8.1}  y={85.3} w={18} text={data.pan}               boxed />
          <Text x={34.1} y={85.3} w={22} text={data.bankAccountNumber} boxed />
          <Text x={8.1}  y={87.3} w={44} text={data.bankNameBranch}    />
          <Text x={8.1}  y={89.5} w={30} text={data.chequePayableTo}   />
          <Text x={58.9} y={89.5} w={16} text={data.ifsc}              boxed />

          {/* Declaration */}
          <Text x={8.1}  y={91.5} w={25} text={data.declarationPlace} />
          <Text x={40.0} y={91.5} w={18} text={formatDate(data.declarationDate)} />

          {/* Signature */}
          <SignatureBlock data={data} />

        </PageFrame>

        {/* Part A guidance page */}
        <PageFrame template={claimFormPartAGuidance} qrUrl={qrUrl} />

        {/* ── Part B — hospital fills; pre-filled from documents ── */}
        <PageFrame template={claimFormPartB} qrUrl={qrUrl}>
          <Text x={30}  y={8.5}  w={55} text={data.hospitalName}                    />
          <Text x={14}  y={12.0} w={50} text={data.hospitalAddress}           size={8} />
          <Text x={30}  y={14.8} w={25} text={data.hospitalPhone}                   />
          <Text x={14}  y={17.8} w={45} text={data.hospitalEmail}             size={8} />
          <Text x={67}  y={11.5} w={20} text={data.hospitalRegNo}             boxed />
          <Text x={67}  y={17.8} w={15} text={data.hospitalPan}               boxed />
          <Text x={30}  y={22.8} w={35} text={data.treatingDoctorName}              />
          <Text x={70}  y={22.8} w={18} text={data.treatingDoctorQualification} size={8} />
          <Text x={25}  y={29.5} w={50} text={data.diagnosisText}             size={8} />
          <Text x={80}  y={29.5} w={12} text={data.diagnosisIcdCode}          boxed />
          <Text x={25}  y={33.5} w={50} text={data.procedureName}             size={8} />
          <Text x={80}  y={33.5} w={12} text={data.procedureIcdCode}          boxed />
          <Text x={20}  y={38.0} w={12} text={formatDate(data.admissionDate)}       />
          <Text x={33}  y={38.0} w={8}  text={formatTime(data.admissionTime)}       />
          <Text x={55}  y={38.0} w={12} text={formatDate(data.dischargeDate)}       />
          <Text x={68}  y={38.0} w={8}  text={formatTime(data.dischargeTime)}       />
          <Text x={20}  y={42.5} w={12} text={formatDate(data.procedureDate)}       />
          {data.isPreExistingCondition === "Yes" ? <Tick x={36} y={47.0} /> :
           data.isPreExistingCondition === "No"  ? <Tick x={41} y={47.0} /> : null}
        </PageFrame>

        {/* Part B guidance page */}
        <PageFrame template={claimFormPartBGuidance} qrUrl={qrUrl} />

      </div>
    </FormErrorBoundary>
  );
}
