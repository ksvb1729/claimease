import React, { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
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
      ["tdn",data.treatingDoctorName],["dxt",data.diagnosisText],["dxi",data.diagnosisIcdCode],
      ["prc",data.procedureName],["pri",data.procedureIcdCode],["prd",data.procedureDate],
      ["pex",data.isPreExistingCondition],
      ["ban",data.bankAccountNumber],["bnb",data.bankNameBranch],["ifs",data.ifsc],
      ["cpy",data.chequePayableTo],["pyt",data.payeeType],["pan",data.pan],
      ["dpl",data.declarationPlace],["dd",data.declarationDate],
    ];
    const compact: Record<string, unknown> = Object.fromEntries(
      entries.filter(([,v]) => v !== undefined && v !== null && v !== "")
    );
    if (data.documents?.length) compact.docs = data.documents;
    if (data.billRows?.length) compact.bills = data.billRows.map(r => ({ n:r.billNo,d:r.date,b:r.issuedBy,t:r.towards,a:r.amount }));
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify({ v:5, data: compact }));
    const url = `${window.location.origin}/decode?d=${compressed}`;
    return url.length <= 1800 ? url : `${window.location.origin}/decode`;
  } catch { return window.location.origin + "/decode"; }
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function fd(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}
function fmy(d?: string) {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return `${String(dt.getMonth()+1).padStart(2,"0")}/${dt.getFullYear()}`;
}
function age(dob?: string) {
  if (!dob) return "";
  const b = new Date(dob); const t = new Date();
  if (Number.isNaN(b.getTime())) return "";
  let y = t.getFullYear()-b.getFullYear(); let m = t.getMonth()-b.getMonth();
  if (t.getDate()<b.getDate()) m--;
  if (m<0) { y--; m+=12; }
  return `${Math.max(0,y)} yrs ${Math.max(0,m)} mo`;
}

// ─── Micro-components ──────────────────────────────────────────────────────

// Individual character boxes (for policy no, name, IDs)
function Boxes({ value, n = 20 }: { value?: string; n?: number }) {
  const chars = Array.from({ length: n }, (_,i) => (value||"")[i]?.toUpperCase()||"");
  return (
    <span style={{ display:"inline-flex", gap:1, flexWrap:"nowrap" }}>
      {chars.map((c,i) => (
        <span key={i} style={{
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          width:12, height:13, border:"0.5px solid #555",
          fontSize:7.5, fontWeight:"bold", fontFamily:"monospace",
          background: c ? "#fff" : "#f6f6f6", color:"#000",
          flexShrink:0,
        }}>{c}</span>
      ))}
    </span>
  );
}

// Checkbox with label
function Ck({ on, label }: { on?: boolean; label: string }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:2, marginRight:8 }}>
      <span style={{
        display:"inline-flex", alignItems:"center", justifyContent:"center",
        width:9, height:9, border:"0.5px solid #444",
        fontSize:7, fontWeight:"bold", color:"#000", background:"#fff",
        flexShrink:0,
      }}>{on ? "✓" : ""}</span>
      <span style={{ fontSize:7, whiteSpace:"nowrap" }}>{label}</span>
    </span>
  );
}

// Section header band
function SHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background:"#1a237e", color:"#fff", fontWeight:"bold",
      fontSize:7, textTransform:"uppercase", letterSpacing:"0.08em",
      padding:"3px 6px", borderTop:"1px solid #1a237e",
    }}>{children}</div>
  );
}

// A row in the form grid
function Row({ children, last, style }: { children: React.ReactNode; last?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{
      display:"flex", borderBottom: last ? "none" : "0.5px solid #d0d0d0",
      minHeight:18, ...style,
    }}>{children}</div>
  );
}

// A cell inside a row
function Cell({
  label, children, flex=1, noRight, bold, size, noLabel,
}: {
  label?: string; children?: React.ReactNode; flex?: number;
  noRight?: boolean; bold?: boolean; size?: number; noLabel?: boolean;
}) {
  return (
    <div style={{
      flex, padding:"2px 5px 3px",
      borderRight: noRight ? "none" : "0.5px solid #c8c8c8",
      overflow:"hidden",
    }}>
      {!noLabel && label && (
        <div style={{ fontSize:5.5, color:"#666", textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:1 }}>{label}</div>
      )}
      <div style={{ fontSize: size ?? 8, fontWeight: bold ? 700 : 500, color:"#000", lineHeight:1.3 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function IrdaiFormPrint({ data }: { data: ClaimData }) {
  const qrUrl = useMemo(() => buildQrUrl(data), [data]);
  const rows = (data.billRows || []).slice(0, 10);
  const hasDoc = (lbl: string) => (data.documents || []).includes(lbl);

  const DOCS = [
    "Claim form duly signed","Copy of claim intimation","Hospital main bill","Hospital break-up bill",
    "Hospital bill payment receipt","Hospital discharge summary","Pharmacy bill",
    "Operation Theatre notes","ECG","Investigation reports","Doctor prescriptions","Others",
  ];

  const page: React.CSSProperties = {
    width: "190mm", fontFamily: "Arial, Helvetica, sans-serif",
    border: "1px solid #333", fontSize:8, boxSizing:"border-box",
    background:"#fff", color:"#000", margin:"0 auto",
  };

  const BORDER_BOTTOM = "1px solid #888";

  return (
    <div className="irdai-form-wrap">

      {/* ═══════════════════════════════════════ PART A ══════════════════ */}
      <div className="irdai-page" style={page}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{ display:"flex", borderBottom:BORDER_BOTTOM }}>
          <div style={{ flex:1, padding:"5px 8px", textAlign:"center" }}>
            <div style={{ fontSize:9, fontWeight:"bold", textTransform:"uppercase", letterSpacing:"0.04em" }}>
              Claim Form for Health Insurance Policies of The New India Assurance Co Ltd — Part A
            </div>
            <div style={{ fontSize:7, marginTop:2 }}>To Be Filled In by the Insured</div>
            <div style={{ fontSize:6, color:"#888", marginTop:1 }}>
              The issue of this Form is not to be taken as an admission of liability &nbsp;·&nbsp; (To be filled in block letters)
            </div>
          </div>
          <div style={{
            width:72, padding:5, borderLeft:"0.5px solid #aaa",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
          }}>
            <QRCodeCanvas value={qrUrl} size={60} level="M" includeMargin={false} />
            <div style={{ fontSize:5, marginTop:2, color:"#888", textAlign:"center" }}>Scan to verify</div>
          </div>
        </div>

        {/* ── Section A: Primary Insured ──────────────────────────────── */}
        <SHead>Details of Primary Insured</SHead>

        <Row>
          <Cell label="a) Pol No." flex={2}>
            <Boxes value={data.policyNumber} n={18} />
          </Cell>
          <Cell label="b) S.No. / Certificate No." flex={2}>
            <Boxes value={data.tpaId} n={14} />
          </Cell>
          <Cell label="t) Member ID" flex={1} noRight>
            <Boxes value={data.memberId} n={8} />
          </Cell>
        </Row>

        <Row>
          <Cell label="c) Company" flex={2}>{data.insurerName}</Cell>
          <Cell label="TPA Name" flex={2} noRight>{data.tpaName}</Cell>
        </Row>

        <Row>
          <Cell label="d) Name of Policyholder" flex={1} noRight>
            <Boxes value={data.policyholderName} n={30} />
          </Cell>
        </Row>

        <Row>
          <Cell label="e) Address" flex={1} noRight>
            <span style={{ fontSize:8 }}>{data.policyholderAddress1}</span>
          </Cell>
        </Row>

        <Row>
          <Cell label="City" flex={2}>{data.policyholderCity}</Cell>
          <Cell label="State" flex={2}>{data.policyholderState}</Cell>
          <Cell label="Pin Code" flex={1} noRight>
            <Boxes value={data.policyholderPin} n={6} />
          </Cell>
        </Row>

        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="Phone No." flex={2}>{data.phone}</Cell>
          <Cell label="Email ID" flex={3} noRight>{data.email}</Cell>
        </Row>

        {/* ── Section B: Insurance History ────────────────────────────── */}
        <SHead>Details of Insurance History</SHead>

        <Row>
          <Cell label="a) Currently covered by any other Mediclaim / Health Insurance?" flex={3}>
            <Ck on={data.currentOtherCover==="Yes"} label="Yes" />
            <Ck on={data.currentOtherCover!=="Yes"} label="No" />
          </Cell>
          <Cell label="Date of commencement of first insurance without break" flex={2} noRight>
            {fmy(data.firstInsuranceStart)}
          </Cell>
        </Row>

        <Row>
          <Cell label="b) Have you been hospitalized in the last four years since inception of the contract?" flex={3}>
            <Ck on={data.hospitalizedLastFourYears==="Yes"} label="Yes" />
            <Ck on={data.hospitalizedLastFourYears!=="Yes"} label="No" />
          </Cell>
          <Cell label="Date" flex={1}>{fmy(data.lastHospitalizationDate)}</Cell>
          <Cell label="Diagnosis" flex={2} noRight>{data.lastHospitalizationDiagnosis}</Cell>
        </Row>

        <Row>
          <Cell label="c) Yes, Company Name" flex={2}>{data.currentOtherCompanyName}</Cell>
          <Cell label="Policy No." flex={2}>{data.currentOtherPolicyNo}</Cell>
          <Cell label="Sum Insured (Rs.)" flex={1} noRight>{data.currentOtherSumInsured}</Cell>
        </Row>

        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="d) Previously covered by any other Mediclaim / Health Insurance?" flex={3}>
            <Ck on={data.previousOtherCover==="Yes"} label="Yes" />
            <Ck on={data.previousOtherCover!=="Yes"} label="No" />
          </Cell>
          <Cell label="If yes, Company Name" flex={3} noRight>{data.previousOtherCompanyName}</Cell>
        </Row>

        {/* ── Section C: Patient ──────────────────────────────────────── */}
        <SHead>Details of Insured Person Hospitalized</SHead>

        <Row>
          <Cell label="a) Name" flex={1} noRight>
            <Boxes value={data.patientName} n={28} />
          </Cell>
        </Row>

        <Row>
          <Cell label="b) Gender" flex={1}>
            <Ck on={data.gender==="Male"} label="Male" />
            <Ck on={data.gender==="Female"} label="Female" />
          </Cell>
          <Cell label="c) Age" flex={1}>{age(data.patientDob)}</Cell>
          <Cell label="d) Date of Birth" flex={2} noRight>
            <Boxes value={fd(data.patientDob).replace(/\//g,"")} n={8} />
            &nbsp;<span style={{fontSize:7,color:"#888"}}>{fd(data.patientDob)}</span>
          </Cell>
        </Row>

        <Row>
          <Cell label="e) Relationship to Primary Insured" flex={1} noRight>
            {["Myself","Spouse","Child","Father","Mother","Other"].map(r => (
              <Ck key={r} on={
                r==="Other"
                  ? !["Myself","Spouse","Child","Father","Mother"].includes(data.relationship||"") && !!data.relationship
                  : data.relationship===r
              } label={r==="Other" && !["Myself","Spouse","Child","Father","Mother"].includes(data.relationship||"") && data.relationship
                ? `Other: ${data.relationship}` : r} />
            ))}
          </Cell>
        </Row>

        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="f) Occupation" flex={1} noRight>
            {["Service","Self Employed","Homemaker","Student","Retired","Other"].map(o => (
              <Ck key={o} on={data.occupation===o || (o==="Other" && !!data.occupation && !["Service","Self Employed","Homemaker","Student","Retired"].includes(data.occupation||""))} label={o} />
            ))}
          </Cell>
        </Row>

        {data.sameAddress !== true && (
          <>
            <Row>
              <Cell label="g) Address (if different from above)" flex={1} noRight>
                {[data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ")}
              </Cell>
            </Row>
            <Row last style={{ borderBottom:BORDER_BOTTOM }}>
              <Cell label="Pin" flex={1}><Boxes value={data.patientPin} n={6} /></Cell>
              <Cell label="Phone" flex={2}></Cell>
              <Cell label="Email ID" flex={2} noRight></Cell>
            </Row>
          </>
        )}

        {/* ── Section D: Hospitalization ──────────────────────────────── */}
        <SHead>Details of Hospitalization</SHead>

        <Row>
          <Cell label="a) Name of Hospital where Admitted" flex={3}>{data.hospitalName}</Cell>
          <Cell label="Room Category" flex={2} noRight>
            <Ck on={data.roomCategory==="Day care"} label="Day care" />
            <Ck on={data.roomCategory==="Single occupancy"} label="Single occupancy" />
            <Ck on={data.roomCategory==="Twin sharing"} label="Twin sharing" />
            {data.roomCategory && !["Day care","Single occupancy","Twin sharing"].includes(data.roomCategory) && (
              <Ck on label={data.roomCategory} />
            )}
          </Cell>
        </Row>

        <Row>
          <Cell label="b) Reason for Hospitalization" flex={3}>
            <Ck on={data.hospitalizationReason==="Illness"} label="Illness" />
            <Ck on={data.hospitalizationReason==="Injury"} label="Injury / Accident" />
            <Ck on={data.hospitalizationReason==="Maternity"} label="Maternity" />
          </Cell>
          <Cell label="Date of Ailment / Injury" flex={2} noRight>{fd(data.diseaseOrInjuryDate)}</Cell>
        </Row>

        <Row>
          <Cell label="c) Date of Admission" flex={2}>{fd(data.admissionDate)}</Cell>
          <Cell label="Time" flex={1}>{data.admissionTime}</Cell>
          <Cell label="Date of Discharge" flex={2}>{fd(data.dischargeDate)}</Cell>
          <Cell label="Time" flex={1} noRight>{data.dischargeTime}</Cell>
        </Row>

        {data.hospitalizationReason === "Injury" && (
          <>
            <Row>
              <Cell label="d) Cause of Injury" flex={3}>
                <Ck on={data.injuryCause==="Self inflicted"} label="Self inflicted" />
                <Ck on={data.injuryCause==="Road traffic accident"} label="Road traffic accident" />
                <Ck on={data.injuryCause==="Substance / alcohol related"} label="Substance / alcohol related" />
              </Cell>
              <Cell label="Medico-Legal case?" flex={2} noRight>
                <Ck on={data.medicoLegal==="Yes"} label="Yes" />
                <Ck on={data.medicoLegal==="No"} label="No" />
              </Cell>
            </Row>
            <Row>
              <Cell label="Reported to Police?" flex={2}>
                <Ck on={data.reportedToPolice==="Yes"} label="Yes" />
                <Ck on={data.reportedToPolice==="No"} label="No" />
              </Cell>
              <Cell label="FIR Attached?" flex={2} noRight>
                <Ck on={data.firAttached==="Yes"} label="Yes" />
                <Ck on={data.firAttached==="No"} label="No" />
              </Cell>
            </Row>
          </>
        )}

        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="e) System of Medicine" flex={1} noRight>
            {["Allopathy","Ayurveda","Homeopathy","Unani","Siddha","Other"].map(s => (
              <Ck key={s} on={data.systemOfMedicine===s || (s==="Other" && !!data.systemOfMedicine && !["Allopathy","Ayurveda","Homeopathy","Unani","Siddha"].includes(data.systemOfMedicine||""))} label={s} />
            ))}
          </Cell>
        </Row>

        {/* ── Section E: Claim Details ─────────────────────────────────── */}
        <SHead>Details of Claim</SHead>

        {/* Bills table */}
        <div style={{ padding:"3px 5px 2px", borderBottom:"0.5px solid #d0d0d0" }}>
          <div style={{ fontSize:6, color:"#666", fontWeight:"bold", textTransform:"uppercase", marginBottom:2 }}>
            Statement of Bills / Receipts Submitted
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:7 }}>
            <thead>
              <tr style={{ background:"#e8eaf6" }}>
                {["S.No","Bill No.","Date","Name of Hospital / Pharmacy","Nature of Bill","Amount (Rs.)"].map(h => (
                  <th key={h} style={{ border:"0.5px solid #aaa", padding:"2px 3px", textAlign:"left", fontWeight:"bold", fontSize:6.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? rows.map((row: BillRow, i: number) => (
                <tr key={row.id}>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px", width:22 }}>{i+1}</td>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px", width:60 }}>{row.billNo}</td>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px", width:50 }}>{fd(row.date)}</td>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px" }}>{row.issuedBy}</td>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px" }}>{row.towards}</td>
                  <td style={{ border:"0.5px solid #ccc", padding:"1.5px 3px", textAlign:"right", fontWeight:"bold", width:55 }}>
                    {row.amount}
                  </td>
                </tr>
              )) : Array.from({length:5},(_,i) => (
                <tr key={i}>
                  <td style={{ border:"0.5px solid #ccc", padding:"4px 3px" }}>{i+1}</td>
                  {[1,2,3,4,5].map(j => <td key={j} style={{ border:"0.5px solid #ccc", padding:"4px 3px" }}></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Expenses + Document checklist side by side */}
        <div style={{ display:"flex", borderBottom:BORDER_BOTTOM }}>
          {/* Expenses */}
          <div style={{ flex:3, borderRight:"0.5px solid #aaa" }}>
            <div style={{ background:"#e8eaf6", padding:"2px 5px", fontSize:6.5, fontWeight:"bold", textTransform:"uppercase", borderBottom:"0.5px solid #ccc" }}>
              Claim Amounts
            </div>
            {[
              ["a) Pre-hospitalization expenses (Rs.)", data.preExpenses, data.hadPreExpenses==="Yes"],
              ["b) Hospitalization expenses (Rs.)", data.hospitalExpenses, true],
              ["c) Post-hospitalization expenses (Rs.)", data.postExpenses, data.hadPostExpenses==="Yes"],
              ["d) Health checkup cost (Rs.)", data.healthCheckupCost, !!data.healthCheckupCost && data.healthCheckupCost !== "0"],
              ["e) Ambulance charges (Rs.)", data.ambulanceCharges, !!data.ambulanceCharges && data.ambulanceCharges !== "0"],
              ["f) Others (Rs.)", data.othersClaimAmount, !!data.othersClaimAmount && data.othersClaimAmount !== "0"],
            ].map(([label, value, show]) => (
              <div key={String(label)} style={{ display:"flex", alignItems:"center", borderBottom:"0.5px solid #eee", padding:"2px 5px" }}>
                <span style={{ flex:4, fontSize:7, color:"#444" }}>{String(label)}</span>
                <span style={{ flex:1.5, fontSize:8, fontWeight:"bold", textAlign:"right" }}>
                  {show && value && value !== "0" ? String(value) : "—"}
                </span>
              </div>
            ))}
            <div style={{ display:"flex", padding:"2px 5px", borderBottom:"0.5px solid #eee" }}>
              <span style={{ flex:4, fontSize:7, color:"#444" }}>g) Pre-hospitalization days / Post-hospitalization days</span>
              <span style={{ flex:1.5, fontSize:8, fontWeight:"bold", textAlign:"right" }}>
                {data.preHospitalizationDays || 0} / {data.postHospitalizationDays || 0}
              </span>
            </div>
            <div style={{ display:"flex", padding:"2px 5px", borderBottom:"0.5px solid #eee", alignItems:"center" }}>
              <span style={{ flex:4, fontSize:7, color:"#444" }}>h) Domiciliary hospitalization claim?</span>
              <span style={{ flex:1.5 }}>
                <Ck on={data.hadDomiciliary==="Yes"} label="Yes" />
                <Ck on={data.hadDomiciliary!=="Yes"} label="No" />
              </span>
            </div>
            {data.hasCashBenefits === "Yes" && (
              <div style={{ padding:"2px 5px", fontSize:7 }}>
                <div style={{ fontSize:6, color:"#888", textTransform:"uppercase", marginBottom:2 }}>Cash Benefits</div>
                {[
                  ["Hospital daily cash", data.hospitalDailyCash],
                  ["Surgical cash", data.surgicalCash],
                  ["Critical illness", data.criticalIllnessBenefit],
                  ["Convalescence", data.convalescence],
                ].map(([l,v]) => v && v!=="0" ? (
                  <div key={String(l)} style={{ display:"flex" }}>
                    <span style={{ flex:3, color:"#444" }}>{String(l)}</span>
                    <span style={{ flex:1, fontWeight:"bold", textAlign:"right" }}>{String(v)}</span>
                  </div>
                ) : null)}
              </div>
            )}
          </div>

          {/* Document checklist */}
          <div style={{ flex:2 }}>
            <div style={{ background:"#e8eaf6", padding:"2px 5px", fontSize:6.5, fontWeight:"bold", textTransform:"uppercase", borderBottom:"0.5px solid #ccc" }}>
              Documents Submitted / Check List
            </div>
            {DOCS.map(doc => (
              <div key={doc} style={{ display:"flex", alignItems:"center", gap:3, padding:"2px 5px", borderBottom:"0.5px solid #eee" }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  width:8, height:8, border:"0.5px solid #555", flexShrink:0,
                  fontSize:7, fontWeight:"bold", color:"#000",
                }}>{hasDoc(doc) ? "✓" : ""}</span>
                <span style={{ fontSize:6.5 }}>{doc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Section F: Bank Account ──────────────────────────────────── */}
        <SHead>Details of Primary Insured's Bank Account</SHead>

        <Row>
          <Cell label="PAN" flex={1}>
            <Boxes value={data.pan} n={10} />
          </Cell>
          <Cell label="Bank Account Number" flex={2} noRight>
            <Boxes value={data.bankAccountNumber} n={18} />
          </Cell>
        </Row>

        <Row>
          <Cell label="Name and Branch of Bank" flex={3}>{data.bankNameBranch}</Cell>
          <Cell label="IFSC Code" flex={2} noRight>
            <Boxes value={data.ifsc} n={11} />
          </Cell>
        </Row>

        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="Cheque / DD Payable To" flex={3}>{data.chequePayableTo}</Cell>
          <Cell label="Payee Type" flex={2} noRight>{data.payeeType}</Cell>
        </Row>

        {/* ── Declaration ──────────────────────────────────────────────── */}
        <div style={{ padding:"5px 8px", fontSize:6.5, color:"#444", borderBottom:"0.5px solid #ccc", lineHeight:1.5 }}>
          I / We hereby declare that the information furnished in this claim form is to the best of my knowledge and belief.
          If I have made any false or untrue statement, suppressed or concealed any material fact, all benefits under the policy shall be forfeited.
          I also authorise TPA / Insurance Company to seek necessary medical information / documents from any hospital / Medical Practitioner
          who has attended on me / any hospital. I further agree that this proposal shall be the basis of the contract between me and the Insurance Company.
        </div>

        <div style={{ display:"flex" }}>
          <Cell label="Place" flex={2}>{data.declarationPlace}</Cell>
          <Cell label="Date" flex={1}>{fd(data.declarationDate)}</Cell>
          <div style={{ flex:2, padding:"4px 8px", minHeight:44 }}>
            <div style={{ fontSize:5.5, color:"#666", textTransform:"uppercase", marginBottom:4 }}>Signature of the Insured</div>
            {data.signatureDataUrl ? (
              <img src={data.signatureDataUrl} alt="Signature"
                style={{ height:34, maxWidth:160, objectFit:"contain", objectPosition:"left center" }} />
            ) : data.signatureText ? (
              <div style={{
                fontSize:20, fontFamily:"'Brush Script MT','Dancing Script',cursive",
                fontStyle:"italic", color:"#000", paddingTop:4,
              }}>{data.signatureText}</div>
            ) : (
              <div style={{ borderBottom:"0.5px solid #555", marginTop:24, width:140 }} />
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ PART B ══════════════════ */}
      <div className="irdai-page" style={{ ...page, marginTop:8 }}>
        <div style={{ padding:"5px 8px", borderBottom:BORDER_BOTTOM, textAlign:"center", display:"flex", alignItems:"center" }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, fontWeight:"bold", textTransform:"uppercase" }}>
              Claim Form for Health Insurance — Part B
            </div>
            <div style={{ fontSize:7, marginTop:2 }}>To be Filled by the Hospital / Treating Doctor</div>
          </div>
          <div style={{ width:68, padding:5, borderLeft:"0.5px solid #aaa", display:"flex", flexDirection:"column", alignItems:"center" }}>
            <QRCodeCanvas value={qrUrl} size={58} level="M" includeMargin={false} />
            <div style={{ fontSize:5, marginTop:2, color:"#888" }}>Scan to verify</div>
          </div>
        </div>

        <SHead>Section A — Details of Hospital</SHead>
        <Row>
          <Cell label="Name of Hospital" flex={3}>{data.hospitalName}</Cell>
          <Cell label="Hospital Reg. No." flex={2} noRight>{data.hospitalRegNo}</Cell>
        </Row>
        <Row>
          <Cell label="Address" flex={1} noRight>
            <span style={{ fontSize:7.5 }}>{data.hospitalAddress}</span>
          </Cell>
        </Row>
        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="Phone" flex={2}>{data.hospitalPhone}</Cell>
          <Cell label="Email" flex={3}>{data.hospitalEmail}</Cell>
          <Cell label="PAN" flex={1} noRight>{data.hospitalPan}</Cell>
        </Row>

        <SHead>Section B — Details of Treating Doctor</SHead>
        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="Name of Treating Doctor" flex={2}>{data.treatingDoctorName}</Cell>
          <Cell label="Qualification" flex={3} noRight>{data.treatingDoctorQualification}</Cell>
        </Row>

        <SHead>Section C — Clinical Details</SHead>
        <Row>
          <Cell label="Diagnosis" flex={3}>{data.diagnosisText}</Cell>
          <Cell label="ICD-10 Code" flex={1} noRight>{data.diagnosisIcdCode}</Cell>
        </Row>
        <Row>
          <Cell label="Procedure / Operation performed" flex={3}>{data.procedureName}</Cell>
          <Cell label="Procedure ICD Code" flex={1} noRight>{data.procedureIcdCode}</Cell>
        </Row>
        <Row>
          <Cell label="Date of Admission" flex={2}>{fd(data.admissionDate)}</Cell>
          <Cell label="Time" flex={1}>{data.admissionTime}</Cell>
          <Cell label="Date of Discharge" flex={2}>{fd(data.dischargeDate)}</Cell>
          <Cell label="Time" flex={1} noRight>{data.dischargeTime}</Cell>
        </Row>
        <Row last style={{ borderBottom:BORDER_BOTTOM }}>
          <Cell label="Date of Procedure" flex={2}>{fd(data.procedureDate)}</Cell>
          <Cell label="Pre-existing condition?" flex={2} noRight>
            <Ck on={data.isPreExistingCondition==="Yes"} label="Yes" />
            <Ck on={data.isPreExistingCondition==="No"} label="No" />
          </Cell>
        </Row>

        {/* Hospital declaration */}
        <div style={{ padding:"6px 8px", fontSize:6.5, color:"#444", borderBottom:"0.5px solid #ccc", lineHeight:1.5 }}>
          I hereby certify that the above information is correct to the best of my knowledge and belief.
          The patient was under my / our treatment and all the details furnished above are accurate.
        </div>
        <div style={{ display:"flex", padding:"6px 12px", gap:24, marginTop:8, paddingBottom:20 }}>
          <div style={{ flex:1 }}>
            <div style={{ borderTop:"0.5px solid #333", paddingTop:4, fontSize:6.5, color:"#666", textAlign:"center" }}>
              Treating Doctor's Signature &amp; Stamp
            </div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ borderTop:"0.5px solid #333", paddingTop:4, fontSize:6.5, color:"#666", textAlign:"center" }}>
              Hospital Seal &amp; Countersignature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
