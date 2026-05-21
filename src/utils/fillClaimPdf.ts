import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ClaimData, BillRow } from "../App";
import claimFormPdfUrl from "../assets/Claim_Form.pdf?url";

const W = 595;
const H = 842;

// Convert % from top-left → PDF points (origin bottom-left)
function px(xPct: number): number { return (xPct / 100) * W; }
function py(yPct: number): number { return H - (yPct / 100) * H; }

function formatDate(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function formatMonthYear(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function formatTime(v?: string): string { return v ? v.replace(":", "") : ""; }
function deriveAge(dob?: string): { years: string; months: string } {
  if (!dob) return { years: "", months: "" };
  const b = new Date(dob); const t = new Date();
  if (Number.isNaN(b.getTime())) return { years: "", months: "" };
  let y = t.getFullYear() - b.getFullYear();
  let m = t.getMonth() - b.getMonth();
  if (t.getDate() < b.getDate()) m -= 1;
  if (m < 0) { y -= 1; m += 12; }
  return { years: String(Math.max(0, y)), months: String(Math.max(0, m)) };
}

export async function fillClaimPdf(data: ClaimData): Promise<Uint8Array> {
  const pdfBytes = await fetch(claimFormPdfUrl).then((r) => r.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pages = pdfDoc.getPages();
  const pageA = pages[0]; // Part A
  const pageB = pages[2]; // Part B

  const age = deriveAge(data.patientDob);
  const INK = rgb(0.04, 0.04, 0.04);

  function t(xPct: number, yPct: number, value: string | undefined, size = 8.5, bold = false) {
    if (!value) return;
    pageA.drawText(value, { x: px(xPct), y: py(yPct), size, font: bold ? fontBold : font, color: INK });
  }
  function tick(xPct: number, yPct: number) {
    // Draw an X since checkmark isn't in standard font
    pageA.drawText("X", { x: px(xPct), y: py(yPct), size: 9, font: fontBold, color: INK });
  }

  // ── SECTION A — Primary Insured ──────────────────────────────────────────
  t(8.4,  8.5,  data.policyNumber,       7.5);
  t(40.0, 8.5,  data.tpaId,              7.5);
  t(8.4,  11.0, data.insurerName);
  t(40.0, 11.0, data.tpaName);
  t(8.4,  14.5, data.policyholderName,   8);
  t(8.4,  18.0, data.policyholderAddress1);
  t(8.4,  20.5, data.policyholderCity);
  t(40.0, 20.5, data.policyholderState);
  t(8.4,  23.2, data.policyholderPin,    7.5);
  t(28.0, 23.2, data.phone);
  t(55.0, 23.2, data.email,              7.5);

  // ── SECTION B — Insurance History ────────────────────────────────────────
  if (data.currentOtherCover === "Yes") tick(27.9, 29.5); else tick(33.8, 29.5);
  t(55.0, 29.5, formatMonthYear(data.firstInsuranceStart), 8);
  if (data.hospitalizedLastFourYears === "Yes") tick(64.5, 31.8); else tick(70.4, 31.8);
  t(79.0, 31.8, formatMonthYear(data.lastHospitalizationDate), 7.5);
  t(8.4,  35.2, data.currentOtherCompanyName);
  t(47.0, 35.2, data.currentOtherPolicyNo);
  t(8.4,  37.5, data.currentOtherSumInsured);
  if (data.previousOtherCover === "Yes") tick(84.8, 37.5); else tick(90.5, 37.5);
  t(8.4,  40.5, data.lastHospitalizationDiagnosis, 8);
  t(8.4,  42.5, data.previousOtherCompanyName);

  // ── SECTION C — Insured Person Hospitalized ───────────────────────────────
  t(8.4,  47.5, data.patientName,        8);
  if (data.gender === "Male")   tick(26.1, 50.2);
  if (data.gender === "Female") tick(33.0, 50.2);
  t(45.5, 50.2, age.years);
  t(52.5, 50.2, age.months);
  t(63.5, 50.2, formatDate(data.patientDob));

  const relX: Record<string, number> = { Myself: 27.0, Spouse: 33.2, Child: 39.5, Father: 45.5, Mother: 52.0 };
  if (data.relationship && relX[data.relationship]) tick(relX[data.relationship], 52.5);
  else if (data.relationship) tick(58.2, 52.5);

  const occX: Record<string, number> = { Service: 24.0, "Self Employed": 31.6, Homemaker: 39.9, Student: 49.0, Retired: 56.0 };
  if (data.occupation && occX[data.occupation]) tick(occX[data.occupation], 54.5);
  else if (data.occupation) tick(62.2, 54.5);

  if (data.sameAddress !== true) {
    const addrParts = [data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ");
    t(8.4, 56.5, addrParts, 7.5);
    t(8.4, 60.0, data.patientPin, 7.5);
  }

  // ── SECTION D — Hospitalization ───────────────────────────────────────────
  t(22.0, 62.5, data.hospitalName);

  if (data.roomCategory === "Day care")          tick(25.9, 65.0);
  else if (data.roomCategory === "Single occupancy") tick(34.8, 65.0);
  else if (data.roomCategory === "Twin sharing")     tick(46.1, 65.0);
  else if (data.roomCategory)                        tick(60.1, 65.0);

  if (data.hospitalizationReason === "Injury")   tick(26.4, 67.5);
  if (data.hospitalizationReason === "Illness")  tick(33.0, 67.5);
  if (data.hospitalizationReason === "Maternity") tick(39.6, 67.5);
  t(64.0, 67.5, formatDate(data.diseaseOrInjuryDate));

  t(17.0, 70.0, formatDate(data.admissionDate));
  t(33.0, 70.0, formatTime(data.admissionTime));
  t(50.0, 70.0, formatDate(data.dischargeDate));
  t(66.0, 70.0, formatTime(data.dischargeTime));

  if (data.injuryCause === "Self inflicted")              tick(25.8, 72.5);
  if (data.injuryCause === "Road traffic accident")       tick(36.4, 72.5);
  if (data.injuryCause === "Substance / alcohol related") tick(54.0, 72.5);
  if (data.medicoLegal === "Yes") tick(74.5, 72.5);
  if (data.medicoLegal === "No")  tick(80.5, 72.5);

  if (data.reportedToPolice === "Yes") tick(20.6, 74.5);
  if (data.reportedToPolice === "No")  tick(26.5, 74.5);
  if (data.firAttached === "Yes") tick(43.4, 74.5);
  if (data.firAttached === "No")  tick(49.3, 74.5);
  t(75.0, 74.5, data.systemOfMedicine, 7.5);

  // ── SECTION E — Claim Amounts ─────────────────────────────────────────────
  t(14.8, 77.5, data.preExpenses);
  t(44.9, 77.5, data.hospitalExpenses);
  t(14.8, 79.2, data.postExpenses);
  t(44.9, 79.2, data.healthCheckupCost);
  t(14.8, 81.0, data.ambulanceCharges);
  t(44.9, 81.0, data.othersClaimAmount);
  t(20.0, 82.7, data.preHospitalizationDays);
  t(54.0, 82.7, data.postHospitalizationDays);
  if (data.hadDomiciliary === "Yes") tick(26.1, 84.2); else tick(32.0, 84.2);
  t(14.8, 85.5, data.hospitalDailyCash);
  t(44.9, 85.5, data.surgicalCash);
  t(14.8, 87.0, data.criticalIllnessBenefit);
  t(44.9, 87.0, data.convalescence);

  // Document checklist ticks
  const hasDoc = (label: string) => (data.documents || []).includes(label);
  const docY = [77.5, 79.2, 81.0, 82.7, 84.2, 85.5, 87.0];
  const docLabels = [
    "Claim form duly signed", "Copy of claim intimation", "Hospital main bill",
    "Hospital break-up bill", "Hospital bill payment receipt", "Hospital discharge summary", "Pharmacy bill",
  ];
  docLabels.forEach((lbl, i) => { if (hasDoc(lbl)) tick(74.0, docY[i]); });

  // Bills table rows (below expense amounts)
  const rows = (data.billRows || []).slice(0, 8);
  rows.forEach((row: BillRow, idx: number) => {
    const ry = 88.5 + idx * 0.8;
    t(5.7,  ry, String(idx + 1), 7);
    t(11.5, ry, row.billNo,            7);
    t(26.4, ry, formatDate(row.date),  7);
    t(39.0, ry, row.issuedBy,          7);
    t(56.3, ry, row.towards,           7);
    t(82.3, ry, row.amount,            7);
  });

  // ── Bank Account ──────────────────────────────────────────────────────────
  t(8.1,  89.5, data.pan,               7.5);
  t(34.1, 89.5, data.bankAccountNumber, 7.5);
  t(8.1,  91.5, data.bankNameBranch);
  t(8.1,  93.2, data.chequePayableTo);
  t(58.9, 93.2, data.ifsc,              7.5);

  // ── Declaration ────────────────────────────────────────────────────────────
  t(8.1,  95.0, data.declarationPlace);
  t(40.0, 95.0, formatDate(data.declarationDate));

  // ── Signature ──────────────────────────────────────────────────────────────
  if (data.signatureDataUrl) {
    try {
      const raw = data.signatureDataUrl;
      const imgBytes = Uint8Array.from(atob(raw.split(",")[1]), (c) => c.charCodeAt(0));
      const embed = raw.includes("image/png")
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);
      const { width: iw, height: ih } = embed.scale(1);
      const maxW = 120; const maxH = 28;
      const scale = Math.min(maxW / iw, maxH / ih);
      pageA.drawImage(embed, {
        x: px(6), y: py(97.2) - maxH / 2,
        width: iw * scale, height: ih * scale,
      });
    } catch { /* skip bad image */ }
  } else if (data.signatureText) {
    // Helvetica can render ASCII letters — cursive look not possible in standard PDF
    t(6, 97.2, data.signatureText, 12, false);
  }

  // ── PART B — Hospital Section ─────────────────────────────────────────────
  function tb(xPct: number, yPct: number, value: string | undefined, size = 8.5) {
    if (!value) return;
    pageB.drawText(value, { x: px(xPct), y: py(yPct), size, font, color: INK });
  }

  tb(30,  8.5,  data.hospitalName);
  tb(14,  12.0, data.hospitalAddress, 7.5);
  tb(30,  14.8, data.hospitalPhone);
  tb(14,  17.8, data.hospitalEmail,   7.5);
  tb(67,  11.5, data.hospitalRegNo,   7.5);
  tb(67,  17.8, data.hospitalPan,     7.5);
  tb(30,  22.8, data.treatingDoctorName);
  tb(70,  22.8, data.treatingDoctorQualification, 7.5);
  tb(25,  29.5, data.diagnosisText,   7.5);
  tb(80,  29.5, data.diagnosisIcdCode, 7.5);
  tb(25,  33.5, data.procedureName,   7.5);
  tb(80,  33.5, data.procedureIcdCode, 7.5);
  tb(20,  38.0, formatDate(data.admissionDate));
  tb(33,  38.0, formatTime(data.admissionTime));
  tb(55,  38.0, formatDate(data.dischargeDate));
  tb(68,  38.0, formatTime(data.dischargeTime));
  tb(20,  42.5, formatDate(data.procedureDate));
  if (data.isPreExistingCondition === "Yes") {
    pageB.drawText("X", { x: px(36), y: py(47.0), size: 9, font: fontBold, color: INK });
  } else if (data.isPreExistingCondition === "No") {
    pageB.drawText("X", { x: px(41), y: py(47.0), size: 9, font: fontBold, color: INK });
  }

  return pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, filename = "claim-form-filled.pdf") {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
