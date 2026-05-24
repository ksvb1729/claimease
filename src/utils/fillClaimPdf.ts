import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ClaimData, BillRow } from "../App";
import claimFormPdfUrl from "../assets/Claim_Form.pdf?url";

const W = 595;
const H = 842;

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
  const pageA = pages[0];
  const pageB = pages[2];

  const age = deriveAge(data.patientDob);
  const INK = rgb(0.04, 0.04, 0.04);

  function t(xPct: number, yPct: number, value: string | undefined, size = 8, bold = false) {
    if (!value) return;
    pageA.drawText(value, { x: px(xPct), y: py(yPct), size, font: bold ? fontBold : font, color: INK });
  }
  function tick(xPct: number, yPct: number) {
    pageA.drawText("X", { x: px(xPct), y: py(yPct), size: 8, font: fontBold, color: INK });
  }

  // ── SECTION A — Policy / Insured Details ─────────────────────────────────
  t(11.3, 7.4,  data.policyNumber,         7.5);
  t(60.5, 7.4,  data.tpaId,                7.5);
  t(19.4, 9.0,  data.memberId,             7.5);
  t(9.9,  10.9, data.policyholderName,     8);
  t(9.9,  12.6, data.policyholderAddress1, 7.5);
  t(16.1, 16.1, data.policyholderCity,     7.5);
  t(52.7, 16.1, data.policyholderState,    7.5);
  t(17.7, 17.7, data.policyholderPin,      7.5);
  t(34.7, 17.7, data.phone,                7.5);
  t(58.6, 17.7, data.email,                7);

  // ── SECTION B — Insurance History ────────────────────────────────────────
  if (data.currentOtherCover === "Yes") tick(26.0, 19.8); else tick(27.9, 19.8);
  t(62.2, 19.8, formatMonthYear(data.firstInsuranceStart), 7.5);
  if (data.hospitalizedLastFourYears === "Yes") tick(62.9, 21.5); else tick(64.9, 21.5);
  t(8.4,  23.5, data.currentOtherCompanyName, 7.5);
  t(47.0, 23.5, data.currentOtherPolicyNo,    7.5);
  t(8.4,  25.3, data.currentOtherSumInsured,  7.5);
  if (data.previousOtherCover === "Yes") tick(84.8, 25.3); else tick(90.5, 25.3);
  t(8.4,  27.3, data.lastHospitalizationDiagnosis, 7.5);
  t(8.4,  29.2, data.previousOtherCompanyName, 7.5);

  // ── SECTION C — Insured Person ───────────────────────────────────────────
  t(10.2, 26.5, data.patientName, 8);
  if (data.gender === "Male")   tick(14.1, 28.2);
  if (data.gender === "Female") tick(17.9, 28.2);
  t(36.1, 28.2, age.years,                7.5);
  t(43.0, 28.2, age.months,               7.5);
  t(54.7, 28.2, formatDate(data.patientDob), 7.5);

  const relX: Record<string, number> = { Myself: 24.6, Spouse: 30.2, Child: 36.7, Father: 41.1, Mother: 48.4 };
  if (data.relationship && relX[data.relationship]) tick(relX[data.relationship], 29.9);
  else if (data.relationship) tick(53.2, 29.9);

  const occX: Record<string, number> = { Service: 16.5, "Self Employed": 23.8, Homemaker: 30.6, Student: 36.7, Retired: 44.8 };
  if (data.occupation && occX[data.occupation]) tick(occX[data.occupation], 31.6);
  else if (data.occupation) tick(50.0, 31.6);

  if (data.sameAddress !== true) {
    const addrParts = [data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", ");
    t(8.4, 33.5, addrParts, 7);
    t(8.4, 36.8, data.patientPin, 7.5);
  }

  // ── SECTION D — Hospitalization ───────────────────────────────────────────
  t(22.4, 42.3, data.hospitalName, 8);

  if (data.roomCategory === "Day care")              tick(23.0, 44.0);
  else if (data.roomCategory === "Single occupancy") tick(33.9, 44.0);
  else if (data.roomCategory === "Twin sharing")     tick(43.5, 44.0);
  else if (data.roomCategory)                        tick(54.0, 44.0);

  if (data.hospitalizationReason === "Injury")    tick(22.6, 45.8);
  if (data.hospitalizationReason === "Illness")   tick(27.8, 45.8);
  if (data.hospitalizationReason === "Maternity") tick(32.9, 45.8);
  t(69.7, 45.8, formatDate(data.diseaseOrInjuryDate), 7.5);

  t(9.9,  47.5, formatDate(data.admissionDate),   7.5);
  t(29.6, 47.5, formatTime(data.admissionTime),   7.5);
  t(52.8, 47.5, formatDate(data.dischargeDate),   7.5);
  t(72.2, 47.5, formatTime(data.dischargeTime),   7.5);

  if (data.injuryCause === "Self inflicted")              tick(25.8, 49.2);
  if (data.injuryCause === "Road traffic accident")       tick(36.4, 49.2);
  if (data.injuryCause === "Substance / alcohol related") tick(54.0, 49.2);
  t(59.7, 49.2, data.systemOfMedicine, 7.5);
  if (data.medicoLegal === "Yes") tick(69.8, 49.2);
  if (data.medicoLegal === "No")  tick(71.9, 49.2);

  if (data.reportedToPolice === "Yes") tick(10.3, 50.9);
  if (data.reportedToPolice === "No")  tick(12.3, 50.9);
  if (data.firAttached === "Yes") tick(43.4, 50.9);
  if (data.firAttached === "No")  tick(49.3, 50.9);

  // ── SECTION E — Claim Amounts ─────────────────────────────────────────────
  t(27.8, 54.9, data.preExpenses,             7.5);
  t(55.7, 54.9, data.hospitalExpenses,        7.5);
  t(27.1, 56.6, data.postExpenses,            7.5);
  t(55.7, 56.6, data.healthCheckupCost,       7.5);
  t(27.2, 58.3, data.ambulanceCharges,        7.5);
  t(55.7, 58.3, data.othersClaimAmount,       7.5);
  t(34.7, 60.3, data.preHospitalizationDays,  7.5);
  t(56.6, 60.3, data.postHospitalizationDays, 7.5);
  if (data.hadDomiciliary === "Yes") tick(25.8, 62.0); else tick(27.8, 62.0);
  t(27.2, 64.6, data.hospitalDailyCash,       7.5);
  t(55.7, 64.6, data.surgicalCash,            7.5);
  t(27.2, 66.3, data.criticalIllnessBenefit,  7.5);
  t(54.4, 66.3, data.convalescence,           7.5);

  // Document checklist
  const hasDoc = (label: string) => (data.documents || []).includes(label);
  const docMap: [string, number][] = [
    ["Claim form duly signed",        54.9],
    ["Copy of claim intimation",      56.3],
    ["Hospital main bill",            57.7],
    ["Hospital break-up bill",        59.1],
    ["Hospital bill payment receipt", 60.1],
    ["Hospital discharge summary",    61.3],
    ["Pharmacy bill",                 62.6],
    ["OT notes",                      63.7],
    ["ECG / X-Ray",                   64.8],
    ["Doctor request letter",         66.0],
    ["Investigation reports",         67.1],
    ["Doctor prescriptions",          68.3],
    ["Others",                        69.4],
  ];
  docMap.forEach(([lbl, yd]) => { if (hasDoc(lbl)) tick(69.7, yd); });

  // Bills table
  const billYs = [70.8, 72.3, 73.8, 75.4, 76.8, 78.3, 79.7, 81.2, 82.7, 84.1];
  (data.billRows || []).slice(0, 10).forEach((row: BillRow, idx: number) => {
    const ry = billYs[idx];
    t(7.1,  ry, String(idx + 1),       6.5);
    t(11.1, ry, row.billNo,            6.5);
    t(19.4, ry, formatDate(row.date),  6.5);
    t(33.5, ry, row.issuedBy,          6.5);
    t(50.8, ry, row.towards,           6.5);
    t(79.8, ry, row.amount,            6.5);
  });

  // ── SECTION F — Bank / Payment ────────────────────────────────────────────
  t(16.1, 85.1, data.pan,               7.5);
  t(56.5, 85.1, data.bankAccountNumber, 7.5);
  t(20.2, 86.8, data.bankNameBranch,    7.5);
  t(30.6, 88.5, data.chequePayableTo,   7.5);
  t(60.5, 88.5, data.ifsc,              7.5);

  // ── SECTION G — Declaration ───────────────────────────────────────────────
  t(8.1,  94.0, data.declarationPlace, 7.5);
  t(40.0, 94.0, formatDate(data.declarationDate), 7.5);

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
        x: px(6), y: py(97.5) - maxH / 2,
        width: iw * scale, height: ih * scale,
      });
    } catch { /* skip bad image */ }
  } else if (data.signatureText) {
    t(6, 97.5, data.signatureText, 11);
  }

  // ── PART B — Hospital Section ─────────────────────────────────────────────
  function tb(xPct: number, yPct: number, value: string | undefined, size = 8) {
    if (!value) return;
    pageB.drawText(value, { x: px(xPct), y: py(yPct), size, font, color: INK });
  }
  function tickB(xPct: number, yPct: number) {
    pageB.drawText("X", { x: px(xPct), y: py(yPct), size: 8, font: fontBold, color: INK });
  }

  tb(21.6, 9.0,  data.hospitalName,                8);
  tb(8.1,  10.8, data.hospitalAddress,              7);
  tb(8.1,  12.6, data.treatingDoctorName,           8);
  tb(21.0, 14.4, data.treatingDoctorQualification,  7.5);
  tb(49.2, 14.4, data.hospitalRegNo,                7.5);
  tb(70.6, 14.4, data.hospitalPhone,                7.5);
  tb(8.1,  18.9, data.patientName,                  8);
  tb(33.9, 20.6, age.years,                         7.5);
  tb(53.5, 20.6, formatDate(data.patientDob),       7.5);
  tb(10.3, 22.3, formatDate(data.admissionDate),    7.5);
  tb(29.4, 22.3, formatTime(data.admissionTime),    7.5);
  tb(52.4, 22.3, formatDate(data.dischargeDate),    7.5);
  tb(72.6, 22.3, formatTime(data.dischargeTime),    7.5);

  if (data.hospitalizationReason === "Maternity") tickB(31.0, 24.0);
  else if (data.hospitalizationReason === "Illness")  tickB(15.3, 24.0);
  else if (data.hospitalizationReason === "Injury")   tickB(15.3, 24.0);

  tb(22.6, 30.5, data.diagnosisIcdCode,  7.5);
  tb(32.9, 30.5, data.diagnosisText,     7.5);
  tb(66.1, 30.5, data.procedureIcdCode,  7.5);
  tb(74.2, 30.5, data.procedureName,     7.5);

  tb(20.0, 42.5, formatDate(data.procedureDate), 7.5);

  if (data.isPreExistingCondition === "Yes") tickB(25.0, 44.4);
  else if (data.isPreExistingCondition === "No")  tickB(27.0, 44.4);

  tb(15.5, 85.3, formatDate(data.declarationDate), 7.5);
  tb(15.5, 87.2, data.declarationPlace,             7.5);

  return pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, filename = "claim-form-filled.pdf") {
  const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
