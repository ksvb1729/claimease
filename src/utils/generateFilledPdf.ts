import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { BillRow, ClaimData } from "../App";
import partAUrl from "../assets/claim-form-part-a.png?url";
import partBUrl from "../assets/claim-form-part-b.png?url";

function fmtDate(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtTime(value?: string) { return value?.replace(":", "") || ""; }

function calcAge(dob?: string) {
  if (!dob) return { y: "", m: "" };
  const birth = new Date(dob);
  const today = new Date();
  if (Number.isNaN(birth.getTime())) return { y: "", m: "" };
  let y = today.getFullYear() - birth.getFullYear();
  let m = today.getMonth() - birth.getMonth();
  if (today.getDate() < birth.getDate()) m -= 1;
  if (m < 0) { y -= 1; m += 12; }
  return { y: String(Math.max(0, y)), m: String(Math.max(0, m)) };
}

// A4 page dimensions in PDF points (matches PNG aspect ratio 1190:1684 ≈ 0.707)
const PW = 595, PH = 842;

function cx(xPct: number) { return (xPct / 100) * PW; }
// PDF y=0 is bottom; HTML y=0 is top — invert, then shift up by ~1% to account for text baseline
function cy(yPct: number, fontSize = 9) { return PH - (yPct / 100) * PH + fontSize * 0.25; }

type DrawOpts = { size?: number; mono?: boolean };
type DrawFn = (text: string | undefined, xPct: number, yPct: number, opts?: DrawOpts) => void;

function makeDrawFn(page: ReturnType<PDFDocument["getPages"]>[number], plain: any, mono: any): DrawFn {
  return (text, xPct, yPct, opts = {}) => {
    if (!text) return;
    const size = opts.size ?? 9;
    page.drawText(String(text), {
      x: cx(xPct),
      y: cy(yPct, size),
      size,
      font: opts.mono ? mono : plain,
      color: rgb(0.04, 0.04, 0.04),
    });
  };
}

export async function generateFilledPdf(data: ClaimData): Promise<Uint8Array> {
  // Load the same PNG images used by the HTML preview — guarantees coordinate alignment
  const [partABytes, partBBytes] = await Promise.all([
    fetch(partAUrl).then(r => r.arrayBuffer()),
    fetch(partBUrl).then(r => r.arrayBuffer()),
  ]);

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const mono = await pdfDoc.embedFont(StandardFonts.Courier);

  const partAImage = await pdfDoc.embedPng(new Uint8Array(partABytes));
  const partBImage = await pdfDoc.embedPng(new Uint8Array(partBBytes));

  // ── Part A page ──────────────────────────────────────────────────────────
  const page1 = pdfDoc.addPage([PW, PH]);
  page1.drawImage(partAImage, { x: 0, y: 0, width: PW, height: PH });

  const draw = makeDrawFn(page1, regular, mono);
  const { y: ageY, m: ageM } = calcAge(data.patientDob);
  const rows: BillRow[] = (data.billRows || []).slice(0, 10);

  draw(data.policyNumber,          8.4,  7.9,  { mono: true });
  draw(data.tpaId,                 8.4,  11.0, { mono: true });
  draw(data.policyholderName,      8.4,  14.8, { mono: true });
  draw(data.policyholderAddress1,  8.4,  19.0, { mono: true });
  draw(data.policyholderCity,     18.9,  24.4, { mono: true });
  draw(data.policyholderState,    44.3,  24.4, { mono: true });
  draw(data.policyholderPin,      18.8,  27.0, { mono: true });
  draw(data.phone,                34.2,  27.0);
  draw(data.email,                58.9,  27.0, { size: 7 });

  draw(fmtDate(data.firstInsuranceStart), 58.5, 31.95);
  draw(data.currentOtherCompanyName,      10.8, 34.8, { mono: true });
  draw(data.currentOtherPolicyNo,         43.8, 34.8, { mono: true });
  draw(data.currentOtherSumInsured,       10.6, 37.2, { mono: true });
  draw(fmtDate(data.lastHospitalizationDate), 79.2, 37.1, { size: 7 });
  draw(data.lastHospitalizationDiagnosis, 10.4, 39.8);
  draw(data.previousOtherCompanyName,     10.5, 42.3);

  draw(data.patientName,  8.2, 45.8, { mono: true });
  draw(ageY,             44.8, 48.9);
  draw(ageM,             52.8, 48.9);
  draw(fmtDate(data.patientDob), 65.9, 48.9);

  if (data.sameAddress !== true) {
    draw([data.patientAddress1, data.patientCity, data.patientState].filter(Boolean).join(", "), 8.2, 58.3, { size: 7 });
    draw(data.patientPin, 18.8, 63.6, { mono: true });
  }

  draw(data.hospitalName,             23.2, 66.9);
  draw(fmtDate(data.diseaseOrInjuryDate), 66.2, 72.85);
  draw(fmtDate(data.admissionDate),   18.3, 75.8);
  draw(fmtTime(data.admissionTime),   34.0, 75.8);
  draw(fmtDate(data.dischargeDate),   52.0, 75.8);
  draw(fmtTime(data.dischargeTime),   67.9, 75.8);
  draw(data.systemOfMedicine,         77.3, 81.7, { size: 7 });

  draw(data.preExpenses,           14.8, 84.8);
  draw(data.hospitalExpenses,      44.9, 84.8);
  draw(data.postExpenses,          14.8, 87.1);
  draw(data.healthCheckupCost,     44.9, 87.1);
  draw(data.ambulanceCharges,      14.8, 89.6);
  draw(data.othersClaimAmount,     44.9, 89.6);
  draw(data.othersClaimCode,       49.8, 89.6, { size: 7 });
  draw(data.preHospitalizationDays, 20.8, 92.1);
  draw(data.postHospitalizationDays, 55.0, 92.1);
  draw(data.hospitalDailyCash,     14.8, 96.8);
  draw(data.surgicalCash,          44.9, 96.8);
  draw(data.criticalIllnessBenefit, 14.8, 99.0);
  draw(data.convalescence,         44.9, 99.0);

  rows.forEach((row, idx) => {
    const baseY = 76.8 + idx * 1.62;
    draw(String(idx + 1), 5.7,  baseY, { size: 7 });
    draw(row.billNo,     11.5,  baseY, { size: 7 });
    draw(fmtDate(row.date), 26.4, baseY, { size: 7 });
    draw(row.issuedBy,   39.0,  baseY, { size: 7 });
    draw(row.towards,    56.3,  baseY, { size: 7 });
    draw(row.amount,     82.3,  baseY, { size: 7 });
  });

  draw(data.pan,               8.1,  94.3, { mono: true });
  draw(data.bankAccountNumber, 34.1, 94.3, { mono: true });
  draw(data.bankNameBranch,    8.1,  96.3);
  draw(data.chequePayableTo,   8.1,  98.5);
  draw(data.ifsc,             58.9,  98.5, { mono: true });

  // ── Part B page ──────────────────────────────────────────────────────────
  const page2 = pdfDoc.addPage([PW, PH]);
  page2.drawImage(partBImage, { x: 0, y: 0, width: PW, height: PH });

  const drawB = makeDrawFn(page2, regular, mono);

  drawB(data.hospitalName,              30,   8.5);
  drawB(data.hospitalAddress,           14,  12,   { size: 7 });
  drawB(data.hospitalPhone,             30,  14.8);
  drawB(data.hospitalEmail,             14,  17.8, { size: 7 });
  drawB(data.hospitalRegNo,             67,  11.5, { mono: true });
  drawB(data.hospitalPan,               67,  17.8, { mono: true });

  drawB(data.treatingDoctorName,        30,  22.8);
  drawB(data.treatingDoctorQualification, 70, 22.8, { size: 7 });

  drawB(data.diagnosisText,             25,  29.5, { size: 7 });
  drawB(data.diagnosisIcdCode,          80,  29.5, { mono: true });
  drawB(data.procedureName,             25,  33.5, { size: 7 });
  drawB(data.procedureIcdCode,          80,  33.5, { mono: true });

  drawB(fmtDate(data.admissionDate),    20,  38);
  drawB(fmtTime(data.admissionTime),    33,  38);
  drawB(fmtDate(data.dischargeDate),    55,  38);
  drawB(fmtTime(data.dischargeTime),    68,  38);
  drawB(fmtDate(data.procedureDate),    20,  42.5);

  return pdfDoc.save();
}
