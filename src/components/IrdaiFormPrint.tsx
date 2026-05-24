import React, { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import LZString from "lz-string";
import type { ClaimData, BillRow } from "../App";

// ─── QR URL ────────────────────────────────────────────────────────────────
function buildQrUrl(data: ClaimData): string {
  try {
    const entries: Array<[string, unknown]> = [
      ["rel",data.relationship],["phn",data.policyholderName],["ptn",data.patientName],
      ["pol",data.policyNumber],["tpa",data.tpaId],["ptd",data.patientDob],["gen",data.gender],
      ["occ",data.occupation],["ph",data.phone],["em",data.email],
      ["ins",data.insurerName],["tpn",data.tpaName],["mid",data.memberId],["si",data.sumInsured],
      ["coc",data.currentOtherCover],["fis",data.firstInsuranceStart],
      ["ccn",data.currentOtherCompanyName],["cpn",data.currentOtherPolicyNo],["csi",data.currentOtherSumInsured],
      ["h4y",data.hospitalizedLastFourYears],["lhd",data.lastHospitalizationDate],["lhn",data.lastHospitalizationDiagnosis],
      ["poc",data.previousOtherCover],["pon",data.previousOtherCompanyName],
      ["sad",data.sameAddress],["pa1",data.policyholderAddress1],["pcy",data.policyholderCity],
      ["pst",data.policyholderState],["ppn",data.policyholderPin],
      ["aa1",data.patientAddress1],["acy",data.patientCity],["ast",data.patientState],["apn",data.patientPin],
      ["hrs",data.hospitalizationReason],["did",data.diseaseOrInjuryDate],
      ["adt",data.admissionDate],["atm",data.admissionTime],["ddt",data.dischargeDate],["dtm",data.dischargeTime],
      ["hos",data.hospitalName],["had",data.hospitalAddress],["hph",data.hospitalPhone],
      ["hem",data.hospitalEmail],["hrn",data.hospitalRegNo],["hpn",data.hospitalPan],
      ["rmc",data.roomCategory],["som",data.systemOfMedicine],
      ["inc",data.injuryCause],["mll",data.medicoLegal],["rtp",data.reportedToPolice],["fir",data.firAttached],
      ["pre",data.preExpenses],["pos",data.postExpenses],["hex",data.hospitalExpenses],
      ["amb",data.ambulanceCharges],["dom",data.hadDomiciliary],
      ["tdn",data.treatingDoctorName],["tdq",data.treatingDoctorQualification],
      ["dxt",data.diagnosisText],["dxi",data.diagnosisIcdCode],
      ["prc",data.procedureName],["pri",data.procedureIcdCode],["prd",data.procedureDate],
      ["pex",data.isPreExistingCondition],
      ["ban",data.bankAccountNumber],["bnb",data.bankNameBranch],["ifs",data.ifsc],
      ["cpy",data.chequePayableTo],["pyt",data.payeeType],["pan",data.pan],
      ["dpl",data.declarationPlace],["dd",data.declarationDate],
    ];
    const compact: Record<string, unknown> = Object.fromEntries(
      entries.filter(([, v]) => v !== undefined && v !== null && v !== "")
    );
    if (data.documents?.length) compact.docs = data.documents;
    if (data.billRows?.length) compact.bills = data.billRows.map(r => ({
      n: r.billNo, d: r.date, b: r.issuedBy, t: r.towards, a: r.amount,
    }));
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify({ v: 5, data: compact }));
    const url = `${window.location.origin}/decode?d=${compressed}`;
    return url.length <= 1800 ? url : `${window.location.origin}/decode`;
  } catch { return window.location.origin + "/decode"; }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function fd(d?: string): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}
function fmy(d?: string): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}
function age(dob?: string): string {
  if (!dob) return "";
  const b = new Date(dob); const t = new Date();
  if (Number.isNaN(b.getTime())) return "";
  let y = t.getFullYear() - b.getFullYear(); let m = t.getMonth() - b.getMonth();
  if (t.getDate() < b.getDate()) m--;
  if (m < 0) { y--; m += 12; }
  return `${Math.max(0, y)} yrs ${Math.max(0, m)} mo`;
}

// ─── Design tokens ─────────────────────────────────────────────────────────
const BD = "0.5pt solid #b0b0b0";   // cell border
const BS = "1pt solid #555";         // section divider
const BH = "1.5pt solid #111";       // header bottom
const SBG = "#e8e8e8";               // section header bg
const LBL = "#444";                  // label color
const LS = 5.5;                      // label font-size (pt)
const VS = 7.5;                      // value font-size (pt)
const FF = "'Arial','Helvetica',sans-serif";

// ─── Micro-components ──────────────────────────────────────────────────────

function Boxes({ value, n = 20 }: { value?: string; n?: number }) {
  const chars = Array.from({ length: n }, (_, i) => (value || "")[i]?.toUpperCase() || "");
  return (
    <span style={{ display: "inline-flex", verticalAlign: "middle" }}>
      {chars.map((c, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 10, height: 11,
          borderTop: "0.5pt solid #777", borderBottom: "0.5pt solid #777",
          borderRight: "0.5pt solid #777",
          borderLeft: i === 0 ? "0.5pt solid #777" : "none",
          fontSize: 7, fontWeight: 700, fontFamily: "monospace",
          background: "#fff", color: "#000", flexShrink: 0, lineHeight: 1,
        }}>{c}</span>
      ))}
    </span>
  );
}

function Ck({ on, label }: { on?: boolean; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, marginRight: 8 }}>
      <span style={{
        width: 7.5, height: 7.5,
        border: "0.5pt solid #333",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 6.5, fontWeight: 700, color: "#000", background: "#fff", flexShrink: 0,
        lineHeight: 1,
      }}>{on ? "✓" : ""}</span>
      <span style={{ fontSize: LS, color: "#111", whiteSpace: "nowrap" }}>{label}</span>
    </span>
  );
}

function SHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: SBG, color: "#000", fontWeight: 700,
      fontSize: 6.5, textTransform: "uppercase", letterSpacing: "0.07em",
      padding: "2px 5px", borderTop: BS, borderBottom: BD,
    }}>{children}</div>
  );
}

function Row({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", borderBottom: BD, minHeight: 17, ...style }}>
      {children}
    </div>
  );
}

function Cell({
  label, children, flex = 1, noRight, center, valign = "center",
}: {
  label?: string; children?: React.ReactNode; flex?: number;
  noRight?: boolean; center?: boolean; valign?: "center" | "top";
}) {
  return (
    <div style={{
      flex, padding: "1px 4px 2px",
      borderRight: noRight ? "none" : BD,
      display: "flex", flexDirection: "column",
      justifyContent: valign === "top" ? "flex-start" : "center",
      alignItems: center ? "center" : "flex-start",
      overflow: "hidden",
    }}>
      {label && (
        <div style={{ fontSize: LS, color: LBL, lineHeight: 1.2, marginBottom: 0.5 }}>{label}</div>
      )}
      <div style={{ fontSize: VS, color: "#000", lineHeight: 1.3, width: "100%" }}>
        {children}
      </div>
    </div>
  );
}

// ─── QR block (shared) ─────────────────────────────────────────────────────
function QRBlock({ url }: { url: string }) {
  return (
    <div style={{
      width: 58, padding: 4, borderLeft: BD, flexShrink: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      background: "#fff",
    }}>
      <QRCodeSVG value={url} size={48} level="Q" includeMargin={false} />
      <div style={{ fontSize: 4.5, color: "#777", marginTop: 2, textAlign: "center", lineHeight: 1.3 }}>
        Scan to<br />load form
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function IrdaiFormPrint({ data }: { data: ClaimData }) {
  const qrUrl = useMemo(() => buildQrUrl(data), [data]);
  const hasDoc = (lbl: string) => (data.documents || []).includes(lbl);
  const billRows: BillRow[] = (data.billRows || []).slice(0, 8);

  const PAGE: React.CSSProperties = {
    width: "100%", fontFamily: FF, fontSize: VS,
    background: "#fff", color: "#000", boxSizing: "border-box",
    border: "0.5pt solid #888",
  };

  const DOCS_A = [
    "Claim form duly signed", "Copy of claim intimation", "Hospital main bill",
    "Hospital break-up bill", "Hospital bill payment receipt", "Hospital discharge summary",
    "Pharmacy bill", "Operation Theatre notes", "ECG",
    "Doctor request for investigation", "Investigation reports", "Doctor prescriptions", "Others",
  ];

  return (
    <div className="irdai-form-wrap">

      {/* ══════════════════════════════ PART A ══════════════════════════════ */}
      <div className="irdai-page" style={PAGE}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: BH }}>
          <div style={{ flex: 1, padding: "5px 8px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>
              Health Insurance Reimbursement Claim Form — Part A
            </div>
            <div style={{ fontSize: 6, color: "#555", marginTop: 2, lineHeight: 1.5 }}>
              To be filled in by the Insured &nbsp;·&nbsp; Use block capital letters &nbsp;·&nbsp;
              Issue of this form is not an admission of liability
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 3 }}>
              <span style={{ fontSize: LS, color: LBL }}>
                Insurer: <strong style={{ color: "#000" }}>{data.insurerName || "________________________"}</strong>
              </span>
              <span style={{ fontSize: LS, color: LBL }}>
                TPA: <strong style={{ color: "#000" }}>{data.tpaName || "________________________"}</strong>
              </span>
            </div>
          </div>
          <QRBlock url={qrUrl} />
        </div>

        {/* ── Section A: Primary Insured ──────────────────────────────────── */}
        <SHead>A — Details of Primary Insured</SHead>
        <Row>
          <Cell label="a) Policy No." flex={5}><Boxes value={data.policyNumber} n={20} /></Cell>
          <Cell label="b) S.No. / Certificate No." flex={4}><Boxes value={data.tpaId} n={14} /></Cell>
          <Cell label="c) Member ID" flex={2} noRight><Boxes value={data.memberId} n={8} /></Cell>
        </Row>
        <Row>
          <Cell label="d) Name of Policyholder" flex={1} noRight>
            <Boxes value={data.policyholderName} n={36} />
          </Cell>
        </Row>
        <Row>
          <Cell label="e) Address" flex={1} noRight>
            <span style={{ fontSize: VS }}>{data.policyholderAddress1}</span>
          </Cell>
        </Row>
        <Row>
          <Cell label="City" flex={3}>{data.policyholderCity}</Cell>
          <Cell label="State" flex={3}>{data.policyholderState}</Cell>
          <Cell label="Pin" flex={1}><Boxes value={data.policyholderPin} n={6} /></Cell>
          <Cell label="Phone" flex={3}>{data.phone}</Cell>
          <Cell label="Email" flex={5} noRight><span style={{ fontSize: 7 }}>{data.email}</span></Cell>
        </Row>

        {/* ── Section B: Insurance History ────────────────────────────────── */}
        <SHead>B — Details of Insurance History</SHead>
        <Row>
          <Cell label="a) Covered by any other Mediclaim / Health Insurance currently?" flex={4}>
            <Ck on={data.currentOtherCover === "Yes"} label="Yes" />
            <Ck on={data.currentOtherCover !== "Yes"} label="No" />
          </Cell>
          <Cell label="Date of first insurance (without break)" flex={2} noRight>
            {fmy(data.firstInsuranceStart)}
          </Cell>
        </Row>
        <Row>
          <Cell label="b) Hospitalized in the last 4 years?" flex={3}>
            <Ck on={data.hospitalizedLastFourYears === "Yes"} label="Yes" />
            <Ck on={data.hospitalizedLastFourYears !== "Yes"} label="No" />
          </Cell>
          <Cell label="Date" flex={1}>{fmy(data.lastHospitalizationDate)}</Cell>
          <Cell label="Diagnosis / Ailment" flex={3} noRight>{data.lastHospitalizationDiagnosis}</Cell>
        </Row>
        <Row>
          <Cell label="c) If yes — Company" flex={3}>{data.currentOtherCompanyName}</Cell>
          <Cell label="Policy No." flex={2}>{data.currentOtherPolicyNo}</Cell>
          <Cell label="Sum Insured (Rs.)" flex={2}>{data.currentOtherSumInsured}</Cell>
          <Cell label="d) Previous insurance?" flex={2} noRight>
            <Ck on={data.previousOtherCover === "Yes"} label="Yes" />
            <Ck on={data.previousOtherCover !== "Yes"} label="No" />
            <span style={{ fontSize: LS, color: LBL, marginLeft: 4 }}>{data.previousOtherCompanyName}</span>
          </Cell>
        </Row>

        {/* ── Section C: Patient ──────────────────────────────────────────── */}
        <SHead>C — Details of Insured Person Hospitalized</SHead>
        <Row>
          <Cell label="a) Name of Patient" flex={1} noRight>
            <Boxes value={data.patientName} n={36} />
          </Cell>
        </Row>
        <Row>
          <Cell label="b) Gender" flex={2}>
            <Ck on={data.gender === "Male"} label="Male" />
            <Ck on={data.gender === "Female"} label="Female" />
          </Cell>
          <Cell label="c) Age" flex={1}>{age(data.patientDob)}</Cell>
          <Cell label="d) Date of Birth" flex={2}>
            <Boxes value={fd(data.patientDob).replace(/\//g, "")} n={8} />
            <span style={{ fontSize: 6.5, color: LBL, marginLeft: 4 }}>{fd(data.patientDob)}</span>
          </Cell>
          <Cell label="e) Relationship to Policyholder" flex={4} noRight>
            {(["Self","Spouse","Child","Father","Mother"] as const).map(r => (
              <Ck key={r} on={r === "Self"
                ? data.relationship === "Myself" || data.relationship === "Self"
                : data.relationship === r
              } label={r} />
            ))}
            <Ck on={!!data.relationship && !["Myself","Self","Spouse","Child","Father","Mother"].includes(data.relationship!)}
              label={!["Myself","Self","Spouse","Child","Father","Mother"].includes(data.relationship || "")
                ? `Other: ${data.relationship}` : "Other"} />
          </Cell>
        </Row>
        <Row>
          <Cell label="f) Occupation" flex={1} noRight>
            {["Service","Self Employed","Homemaker","Student","Retired"].map(o => (
              <Ck key={o} on={data.occupation === o} label={o} />
            ))}
            <Ck on={!!data.occupation && !["Service","Self Employed","Homemaker","Student","Retired"].includes(data.occupation!)}
              label="Other" />
          </Cell>
        </Row>
        {data.sameAddress !== true && (
          <Row>
            <Cell label="g) Patient address (if different from policyholder)" flex={5}>
              {[data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ")}
            </Cell>
            <Cell label="Pin" flex={1}><Boxes value={data.patientPin} n={6} /></Cell>
            <Cell label="Phone" flex={2}></Cell>
            <Cell label="Email" flex={2} noRight></Cell>
          </Row>
        )}

        {/* ── Section D: Hospitalization ──────────────────────────────────── */}
        <SHead>D — Details of Hospitalization</SHead>
        <Row>
          <Cell label="a) Name of Hospital / Nursing Home" flex={4}>{data.hospitalName}</Cell>
          <Cell label="b) Room Category" flex={3} noRight>
            <Ck on={data.roomCategory === "Day care"} label="Day care" />
            <Ck on={data.roomCategory === "Single occupancy"} label="Single" />
            <Ck on={data.roomCategory === "Twin sharing"} label="Twin sharing" />
            {data.roomCategory && !["Day care","Single occupancy","Twin sharing"].includes(data.roomCategory) && (
              <Ck on label={data.roomCategory} />
            )}
          </Cell>
        </Row>
        <Row>
          <Cell label="c) Reason for Hospitalization" flex={3}>
            <Ck on={data.hospitalizationReason === "Illness"} label="Illness" />
            <Ck on={data.hospitalizationReason === "Injury"} label="Injury" />
            <Ck on={data.hospitalizationReason === "Maternity"} label="Maternity" />
          </Cell>
          <Cell label="Date of onset of illness / injury" flex={2}>{fd(data.diseaseOrInjuryDate)}</Cell>
          <Cell label="d) System of Medicine" flex={3} noRight>
            <Ck on={data.systemOfMedicine === "Allopathy"} label="Allopathy" />
            <Ck on={data.systemOfMedicine === "Ayurveda"} label="Ayurveda" />
            <Ck on={data.systemOfMedicine === "Unani"} label="Unani" />
            <Ck on={data.systemOfMedicine === "Homeopathy"} label="Homeopathy" />
            {data.systemOfMedicine && !["Allopathy","Ayurveda","Unani","Homeopathy"].includes(data.systemOfMedicine) && (
              <Ck on label={data.systemOfMedicine} />
            )}
          </Cell>
        </Row>
        <Row>
          <Cell label="e) Date of Admission" flex={2}>{fd(data.admissionDate)}</Cell>
          <Cell label="Time" flex={1}>{data.admissionTime}</Cell>
          <Cell label="Date of Discharge" flex={2}>{fd(data.dischargeDate)}</Cell>
          <Cell label="Time" flex={1}>{data.dischargeTime}</Cell>
          <Cell label="f) Medico-legal case?" flex={2}>
            <Ck on={data.medicoLegal === "Yes"} label="Yes" />
            <Ck on={data.medicoLegal !== "Yes"} label="No" />
          </Cell>
          <Cell label="Police report filed?" flex={2} noRight>
            <Ck on={data.reportedToPolice === "Yes"} label="Yes" />
            <Ck on={data.reportedToPolice !== "Yes"} label="No" />
          </Cell>
        </Row>
        {data.injuryCause && (
          <Row>
            <Cell label="g) Cause of injury (if applicable)" flex={1} noRight>
              <Ck on={data.injuryCause === "Self inflicted"} label="Self inflicted" />
              <Ck on={data.injuryCause === "Road traffic accident"} label="Road traffic accident" />
              <Ck on={data.injuryCause === "Substance / alcohol related"} label="Substance / alcohol related" />
              {data.injuryCause && !["Self inflicted","Road traffic accident","Substance / alcohol related"].includes(data.injuryCause) && (
                <Ck on label={data.injuryCause} />
              )}
            </Cell>
          </Row>
        )}

        {/* ── Section E: Claim Amounts + Document Checklist ──────────────── */}
        <SHead>E — Details of Claim</SHead>
        <div style={{ display: "flex", borderBottom: BS }}>

          {/* Left: amounts */}
          <div style={{ flex: 55, borderRight: BS }}>
            <div style={{ display: "flex", borderBottom: BD, background: "#f5f5f5", minHeight: 13 }}>
              <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, fontWeight: 700, borderRight: BD }}>Expense Head</div>
              <div style={{ flex: 1, padding: "1px 4px", fontSize: LS, fontWeight: 700, textAlign: "right" }}>Amount (Rs.)</div>
            </div>
            {([
              [`a) Pre-hospitalisation (${data.preHospitalizationDays || "0"} days)`, data.preExpenses],
              [`b) Post-hospitalisation (${data.postHospitalizationDays || "0"} days)`, data.postExpenses],
              ["c) Hospitalisation expenses", data.hospitalExpenses],
              ["d) Ambulance charges", data.ambulanceCharges],
              ["e) Health check-up cost", data.healthCheckupCost],
              ["f) Others", data.othersClaimAmount],
            ] as [string, string | undefined][]).map(([lbl, amt]) => (
              <div key={lbl} style={{ display: "flex", borderBottom: BD, minHeight: 15 }}>
                <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, display: "flex", alignItems: "center", borderRight: BD }}>{lbl}</div>
                <div style={{ flex: 1, padding: "1px 4px", fontSize: VS, fontWeight: 600, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  {amt && amt !== "0" ? amt : ""}
                </div>
              </div>
            ))}
            <div style={{ display: "flex", borderBottom: BD, minHeight: 15 }}>
              <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, display: "flex", alignItems: "center", borderRight: BD }}>
                g) Domiciliary hospitalisation
              </div>
              <div style={{ flex: 1, padding: "1px 4px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                <Ck on={data.hadDomiciliary === "Yes"} label="Yes" />
                <Ck on={data.hadDomiciliary !== "Yes"} label="No" />
              </div>
            </div>
            {/* Cash benefits (only if applicable) */}
            {data.hasCashBenefits === "Yes" && ([
              ["h) Hospital daily cash", data.hospitalDailyCash],
              ["i) Surgical cash benefit", data.surgicalCash],
              ["j) Critical illness benefit", data.criticalIllnessBenefit],
              ["k) Convalescence benefit", data.convalescence],
            ] as [string, string | undefined][]).map(([lbl, amt]) => (
              <div key={lbl} style={{ display: "flex", borderBottom: BD, minHeight: 14 }}>
                <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, display: "flex", alignItems: "center", borderRight: BD }}>{lbl}</div>
                <div style={{ flex: 1, padding: "1px 4px", fontSize: VS, fontWeight: 600, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  {amt && amt !== "0" ? amt : ""}
                </div>
              </div>
            ))}
          </div>

          {/* Right: document checklist */}
          <div style={{ flex: 45, display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "1px 5px", fontSize: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: BD, background: "#f5f5f5", lineHeight: 1.8 }}>
              Claim Documents Check List
            </div>
            {DOCS_A.map(doc => (
              <div key={doc} style={{ display: "flex", alignItems: "center", gap: 3, padding: "1px 5px", borderBottom: BD, minHeight: 13 }}>
                <span style={{
                  width: 7, height: 7, border: "0.5pt solid #444", flexShrink: 0,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  fontSize: 6, fontWeight: 700, background: "#fff",
                }}>{hasDoc(doc) ? "✓" : ""}</span>
                <span style={{ fontSize: 5.5, color: "#111", lineHeight: 1.3 }}>{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section F: Bills Enclosed ───────────────────────────────────── */}
        <SHead>F — Details of Bills Enclosed</SHead>
        <div style={{ borderBottom: BS }}>
          <div style={{ display: "flex", background: "#f5f5f5", borderBottom: BD }}>
            {(["Sr.", "Bill No.", "Date", "Issued By", "Towards", "Amount (Rs.)"] as const).map((h, i) => (
              <div key={h} style={{
                flex: [0.5, 1.5, 1.5, 3.5, 2.5, 2][i],
                padding: "1px 4px", fontSize: 5.5, fontWeight: 700,
                borderRight: i < 5 ? BD : "none",
              }}>{h}</div>
            ))}
          </div>
          {billRows.map((row, idx) => (
            <div key={row.id} style={{ display: "flex", borderBottom: BD, minHeight: 13 }}>
              <div style={{ flex: 0.5, padding: "1px 4px", fontSize: VS, borderRight: BD }}>{idx + 1}</div>
              <div style={{ flex: 1.5, padding: "1px 4px", fontSize: VS, borderRight: BD }}>{row.billNo}</div>
              <div style={{ flex: 1.5, padding: "1px 4px", fontSize: VS, borderRight: BD }}>{fd(row.date)}</div>
              <div style={{ flex: 3.5, padding: "1px 4px", fontSize: VS, borderRight: BD }}>{row.issuedBy}</div>
              <div style={{ flex: 2.5, padding: "1px 4px", fontSize: VS, borderRight: BD }}>{row.towards}</div>
              <div style={{ flex: 2, padding: "1px 4px", fontSize: VS, textAlign: "right" }}>{row.amount}</div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 5 - billRows.length) }).map((_, i) => (
            <div key={`ep-${i}`} style={{ display: "flex", borderBottom: i < (4 - billRows.length) ? BD : "none", minHeight: 13 }}>
              {[0.5, 1.5, 1.5, 3.5, 2.5, 2].map((f, j) => (
                <div key={j} style={{ flex: f, borderRight: j < 5 ? BD : "none" }}>&nbsp;</div>
              ))}
            </div>
          ))}
        </div>

        {/* ── Section G: Bank Account ─────────────────────────────────────── */}
        <SHead>G — Bank Account Details (for NEFT / ECS Payment)</SHead>
        <Row>
          <Cell label="a) PAN" flex={2}><Boxes value={data.pan} n={10} /></Cell>
          <Cell label="b) Account No." flex={3}><Boxes value={data.bankAccountNumber} n={18} /></Cell>
          <Cell label="c) IFSC Code" flex={2} noRight><Boxes value={data.ifsc} n={11} /></Cell>
        </Row>
        <Row>
          <Cell label="d) Bank Name & Branch" flex={3}>{data.bankNameBranch}</Cell>
          <Cell label="e) Cheque / DD payable to" flex={3}>{data.chequePayableTo}</Cell>
          <Cell label="f) Payee Type" flex={2} noRight>{data.payeeType}</Cell>
        </Row>

        {/* ── Declaration ─────────────────────────────────────────────────── */}
        <SHead>Declaration by the Insured</SHead>
        <div style={{ padding: "3px 6px", fontSize: 6, lineHeight: 1.6, borderBottom: BD }}>
          I/We hereby declare that the information furnished above is true and correct to the best of my/our knowledge
          and belief. I/We authorize the attending physician / hospital to disclose any information relating to my/our
          illness, injury or treatment to the company or its authorized representative. I/We undertake to refund any
          excess amount paid by the company. No claim in respect of this illness has been made with any other insurer.
        </div>
        <div style={{ display: "flex", minHeight: 38 }}>
          <div style={{ flex: 2, padding: "3px 6px", borderRight: BD }}>
            <div style={{ fontSize: LS, color: LBL }}>Place</div>
            <div style={{ fontSize: VS + 0.5, fontWeight: 700, marginTop: 2 }}>{data.declarationPlace}</div>
          </div>
          <div style={{ flex: 2, padding: "3px 6px", borderRight: BD }}>
            <div style={{ fontSize: LS, color: LBL }}>Date</div>
            <div style={{ fontSize: VS + 0.5, fontWeight: 700, marginTop: 2 }}>{fd(data.declarationDate)}</div>
          </div>
          <div style={{ flex: 4, padding: "3px 8px" }}>
            <div style={{ fontSize: LS, color: LBL }}>Signature of Insured / Claimant</div>
            {data.signatureDataUrl ? (
              <img src={data.signatureDataUrl} alt="Signature"
                style={{ maxHeight: 28, maxWidth: 180, objectFit: "contain", marginTop: 2 }} />
            ) : data.signatureText ? (
              <div style={{ fontSize: 13, fontFamily: "'Dancing Script', cursive", color: "#000", marginTop: 2 }}>
                {data.signatureText}
              </div>
            ) : (
              <div style={{ height: 24, borderBottom: "0.5pt solid #888", marginTop: 4 }}></div>
            )}
          </div>
        </div>

        {/* Important note footer */}
        <div style={{ padding: "2px 6px", fontSize: 5, color: "#666", borderTop: BD, background: "#f9f9f9", textAlign: "center" }}>
          IMPORTANT: Please note — claim must be submitted within 30 days of discharge. Retain copies of all documents submitted.
        </div>
      </div>

      {/* ══════════════════════════════ PART B ══════════════════════════════ */}
      <div className="irdai-page" style={{ ...PAGE, borderTop: "none" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: BH }}>
          <div style={{ flex: 1, padding: "5px 8px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.2 }}>
              Health Insurance Reimbursement Claim Form — Part B
            </div>
            <div style={{ fontSize: 6, color: "#555", marginTop: 2, lineHeight: 1.5 }}>
              To be filled in and certified by the Hospital / Treating Doctor &nbsp;·&nbsp;
              Please use hospital seal and authorised signatory
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 3 }}>
              <span style={{ fontSize: LS, color: LBL }}>
                Patient: <strong style={{ color: "#000" }}>{data.patientName}</strong>
              </span>
              <span style={{ fontSize: LS, color: LBL }}>
                Admission: <strong style={{ color: "#000" }}>{fd(data.admissionDate)}</strong>
              </span>
              <span style={{ fontSize: LS, color: LBL }}>
                Policy No.: <strong style={{ color: "#000" }}>{data.policyNumber}</strong>
              </span>
            </div>
          </div>
          <QRBlock url={qrUrl} />
        </div>

        {/* ── Section A: Hospital Details ─────────────────────────────────── */}
        <SHead>A — Details of Hospital</SHead>
        <Row>
          <Cell label="a) Name of Hospital / Nursing Home" flex={4}>{data.hospitalName}</Cell>
          <Cell label="b) Reg. No." flex={2}><Boxes value={data.hospitalRegNo} n={14} /></Cell>
          <Cell label="c) Hospital PAN" flex={2} noRight><Boxes value={data.hospitalPan} n={10} /></Cell>
        </Row>
        <Row>
          <Cell label="d) Address" flex={1} noRight>
            <span style={{ fontSize: 7 }}>{data.hospitalAddress}</span>
          </Cell>
        </Row>
        <Row>
          <Cell label="e) Phone" flex={2}>{data.hospitalPhone}</Cell>
          <Cell label="f) Email" flex={3}>{data.hospitalEmail}</Cell>
          <Cell label="g) Type" flex={2}>
            <Ck on={false} label="Govt." />
            <Ck on={true} label="Private" />
          </Cell>
          <Cell label="h) NABH Accredited?" flex={2} noRight>
            <Ck on={false} label="Yes" />
            <Ck on={false} label="No" />
          </Cell>
        </Row>

        {/* ── Section B: Treating Doctor ──────────────────────────────────── */}
        <SHead>B — Details of the Treating Doctor</SHead>
        <Row>
          <Cell label="a) Doctor's Name" flex={3}>{data.treatingDoctorName}</Cell>
          <Cell label="b) Qualifications" flex={3}>{data.treatingDoctorQualification}</Cell>
          <Cell label="c) Registration No." flex={2} noRight><Boxes value={undefined} n={10} /></Cell>
        </Row>

        {/* ── Section C: Ailment / Diagnosis ──────────────────────────────── */}
        <SHead>C — Details of Ailment / Diagnosis</SHead>
        <Row>
          <Cell label="a) Primary Diagnosis" flex={4}>{data.diagnosisText}</Cell>
          <Cell label="ICD-10 Code" flex={2}>{data.diagnosisIcdCode}</Cell>
          <Cell label="Duration of illness prior to admission" flex={3} noRight></Cell>
        </Row>
        <Row>
          <Cell label="b) Procedure / Operation performed" flex={4}>{data.procedureName}</Cell>
          <Cell label="ICD Code" flex={2}>{data.procedureIcdCode}</Cell>
          <Cell label="Date of procedure" flex={3} noRight>{fd(data.procedureDate)}</Cell>
        </Row>
        <Row>
          <Cell label="c) Secondary diagnosis (if any)" flex={4}></Cell>
          <Cell label="ICD-10 Code" flex={2}></Cell>
          <Cell label="d) Is this a pre-existing condition?" flex={3} noRight>
            <Ck on={data.isPreExistingCondition === "Yes"} label="Yes" />
            <Ck on={data.isPreExistingCondition === "No"} label="No" />
            <Ck on={!data.isPreExistingCondition} label="Not known" />
          </Cell>
        </Row>

        {/* ── Section D: Expense Details ──────────────────────────────────── */}
        <SHead>D — Expense Details</SHead>
        <div style={{ display: "flex" }}>
          {/* Left column */}
          <div style={{ flex: 1, borderRight: BS }}>
            <div style={{ display: "flex", background: "#f5f5f5", borderBottom: BD }}>
              <div style={{ flex: 3, padding: "1px 4px", fontSize: 5.5, fontWeight: 700, borderRight: BD }}>Expense Head</div>
              <div style={{ flex: 1.5, padding: "1px 4px", fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>Amount (Rs.)</div>
            </div>
            {([
              ["Room charges (per day)", ""],
              ["ICU / HDU charges (per day)", ""],
              ["OT charges", ""],
              ["Surgeon's / Specialist fee", ""],
              ["Anaesthetist's fee", ""],
              ["Medicines & drugs", ""],
            ] as [string, string][]).map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", borderBottom: BD, minHeight: 14 }}>
                <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, display: "flex", alignItems: "center", borderRight: BD }}>{lbl}</div>
                <div style={{ flex: 1.5, padding: "1px 4px", fontSize: VS, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{val}</div>
              </div>
            ))}
          </div>
          {/* Right column */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", background: "#f5f5f5", borderBottom: BD }}>
              <div style={{ flex: 3, padding: "1px 4px", fontSize: 5.5, fontWeight: 700, borderRight: BD }}>Expense Head</div>
              <div style={{ flex: 1.5, padding: "1px 4px", fontSize: 5.5, fontWeight: 700, textAlign: "right" }}>Amount (Rs.)</div>
            </div>
            {([
              ["Diagnostics / lab charges", ""],
              ["Blood / oxygen / fluids", ""],
              ["Physiotherapy charges", ""],
              ["Nursing charges", ""],
              ["Other charges (specify)", ""],
              ["Total bill amount", data.hospitalExpenses || ""],
            ] as [string, string][]).map(([lbl, val], i) => (
              <div key={lbl} style={{ display: "flex", borderBottom: BD, minHeight: 14 }}>
                <div style={{ flex: 3, padding: "1px 4px", fontSize: LS, display: "flex", alignItems: "center", borderRight: BD, fontWeight: i === 5 ? 700 : 400 }}>{lbl}</div>
                <div style={{ flex: 1.5, padding: "1px 4px", fontSize: VS, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", fontWeight: i === 5 ? 700 : 400 }}>
                  {val ? val : ""}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section E: Hospitalization Period ───────────────────────────── */}
        <SHead>E — Hospitalization Period & Additional Details</SHead>
        <Row>
          <Cell label="a) Admission date & time" flex={2}>{fd(data.admissionDate)} &nbsp; {data.admissionTime}</Cell>
          <Cell label="b) Discharge date & time" flex={2}>{fd(data.dischargeDate)} &nbsp; {data.dischargeTime}</Cell>
          <Cell label="c) Total days admitted" flex={1}></Cell>
          <Cell label="d) Days in ICU / HDU" flex={1} noRight></Cell>
        </Row>
        <Row>
          <Cell label="e) Pre-authorization obtained?" flex={2}>
            <Ck on={false} label="Yes" />
            <Ck on={false} label="No" />
          </Cell>
          <Cell label="f) Ventilator used?" flex={2}>
            <Ck on={false} label="Yes" />
            <Ck on={false} label="No" />
          </Cell>
          <Cell label="g) Dialysis?" flex={1}>
            <Ck on={false} label="Yes" />
            <Ck on={false} label="No" />
          </Cell>
          <Cell label="h) Surgery performed?" flex={1} noRight>
            <Ck on={!!data.procedureName} label="Yes" />
            <Ck on={!data.procedureName} label="No" />
          </Cell>
        </Row>

        {/* ── Section F: Documents Submitted ──────────────────────────────── */}
        <SHead>F — Claim Documents Submitted — Check List</SHead>
        <div style={{ padding: "3px 6px", display: "flex", flexWrap: "wrap", gap: "1px 0", borderBottom: BD }}>
          {[
            "Claim form (duly filled & signed by insured)",
            "Discharge summary (original)",
            "Hospital main bill (original)",
            "Hospital bill break-up / itemised bill",
            "Bill payment receipts",
            "OT / procedure notes",
            "Lab / investigation reports (original)",
            "X-Ray / MRI / CT scan reports",
            "Pharmacy bills (original)",
            "Doctor's prescriptions",
            "Referral / consultation letter",
            "Pre-authorisation letter (if applicable)",
            "Medical certificate / fitness certificate",
            "Any other document (specify below)",
          ].map(doc => (
            <div key={doc} style={{ display: "flex", alignItems: "center", gap: 3, width: "50%", padding: "1.5px 0" }}>
              <span style={{
                width: 7, height: 7, border: "0.5pt solid #444", flexShrink: 0,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 6, fontWeight: 700, background: "#fff",
              }}>{hasDoc(doc) ? "✓" : ""}</span>
              <span style={{ fontSize: 5.5, lineHeight: 1.3 }}>{doc}</span>
            </div>
          ))}
        </div>

        {/* ── Section G: Non-network hospital ─────────────────────────────── */}
        <SHead>G — Additional Details (Non-Network / Non-Empanelled Hospital)</SHead>
        <Row>
          <Cell label="Reason for admission to non-empanelled hospital (if applicable)" flex={3}></Cell>
          <Cell label="Nearest empanelled hospital" flex={3}></Cell>
          <Cell label="Emergency?" flex={1} noRight>
            <Ck on={false} label="Yes" />
            <Ck on={false} label="No" />
          </Cell>
        </Row>

        {/* ── Declaration ─────────────────────────────────────────────────── */}
        <SHead>Declaration by the Hospital</SHead>
        <div style={{ padding: "3px 6px", fontSize: 6, lineHeight: 1.6, borderBottom: BD }}>
          We hereby certify that the above information is true and correct to the best of our knowledge. The patient
          named above was admitted to this hospital and received treatment as stated. The charges are as per the
          standard tariff of the hospital. We confirm that all documents submitted are genuine.
        </div>
        <div style={{ display: "flex", minHeight: 46 }}>
          <div style={{ flex: 2, padding: "3px 6px", borderRight: BD }}>
            <div style={{ fontSize: LS, color: LBL }}>Date</div>
            <div style={{ fontSize: VS, marginTop: 28 }}>____________________</div>
          </div>
          <div style={{ flex: 3, padding: "3px 6px", borderRight: BD }}>
            <div style={{ fontSize: LS, color: LBL }}>Signature & Designation of Authorised Signatory</div>
          </div>
          <div style={{ flex: 3, padding: "3px 6px" }}>
            <div style={{ fontSize: LS, color: LBL }}>Seal of Hospital</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "2px 6px", fontSize: 5, color: "#666", borderTop: BD, background: "#f9f9f9", textAlign: "center" }}>
          IMPORTANT: Claim must be submitted within 30 days of discharge. All bills / documents must be in original. Retain photocopies for your records.
        </div>
      </div>

    </div>
  );
}
