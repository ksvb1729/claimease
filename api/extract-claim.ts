import { verifyToken } from "./auth";

const EXTRACTION_PROMPT = `You are extracting medical claim information from Indian hospital documents for an IRDAI reimbursement form.
Analyze all provided documents (Final Bill, Discharge Summary, and/or TPA/Insurance Card) and extract the fields below.
Return ONLY a valid JSON object. Use null for any field you cannot determine with confidence.

Required output format (return exactly these keys):
{
  "patientName": string or null,
  "gender": "Male" or "Female" or "Other" or null,
  "patientDob": date in YYYY-MM-DD format or null,
  "hospitalName": string or null,
  "hospitalAddress": string or null,
  "hospitalPhone": string or null,
  "hospitalEmail": string or null,
  "hospitalRegNo": string or null,
  "hospitalPan": string or null,
  "admissionDate": date in YYYY-MM-DD format or null,
  "admissionTime": time in HH:MM 24-hour format or null,
  "dischargeDate": date in YYYY-MM-DD format or null,
  "dischargeTime": time in HH:MM 24-hour format or null,
  "roomCategory": "Day care" or "Single occupancy" or "Twin sharing" or "3 or more beds" or null,
  "systemOfMedicine": "Allopathy" or "Ayurveda" or "Homeopathy" or "Siddha" or "Unani" or "Naturopathy" or "Other" or null,
  "hospitalizationReason": "Illness" or "Injury" or "Maternity" or null,
  "hospitalExpenses": plain number string without currency symbol or commas e.g. "124500.00" or null,
  "treatingDoctorName": string or null,
  "treatingDoctorQualification": string or null,
  "diagnosisText": string or null,
  "diagnosisIcdCode": string or null,
  "procedureName": string or null,
  "procedureIcdCode": string or null,
  "procedureDate": date in YYYY-MM-DD format or null,
  "isPreExistingCondition": "Yes" or "No" or null,
  "policyNumber": string or null,
  "insurerName": string or null,
  "tpaName": string or null,
  "memberId": string or null,
  "sumInsured": plain number string without currency symbol or commas or null
}

Rules:
- Convert any date format to YYYY-MM-DD (e.g. "24/04/2025" becomes "2025-04-24")
- Convert any time to 24-hour HH:MM (e.g. "2:30 PM" becomes "14:30")
- For hospitalExpenses use only the grand total / net payable amount from the final bill
- For hospitalPan look for the hospital's GST/PAN number on the bill header
- For diagnosisIcdCode extract ICD-10 codes if explicitly written (e.g. "J18.9", "I21.0")
- For procedureIcdCode extract procedure/PCS codes if explicitly written
- For insurerName, tpaName, memberId and sumInsured extract from the TPA/insurance card
- Return ONLY the JSON object, no explanation or markdown`;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers["authorization"] as string | undefined;
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!verifyToken(token)) {
    return res.status(401).json({ error: "Please sign in to use document extraction." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Extraction service not configured." });
  }

  try {
    const { finalBill, dischargeSummary, tpaCard } = req.body || {};

    const parts: any[] = [];

    if (finalBill?.data) {
      parts.push({ text: "The following is the Final Bill / Invoice from the hospital:" });
      parts.push({ inlineData: { mimeType: finalBill.mimeType || "image/jpeg", data: finalBill.data } });
    }
    if (dischargeSummary?.data) {
      parts.push({ text: "The following is the Discharge Summary from the hospital:" });
      parts.push({ inlineData: { mimeType: dischargeSummary.mimeType || "image/jpeg", data: dischargeSummary.data } });
    }
    if (tpaCard?.data) {
      parts.push({ text: "The following is the TPA / Insurance Card of the patient:" });
      parts.push({ inlineData: { mimeType: tpaCard.mimeType || "image/jpeg", data: tpaCard.data } });
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: "No documents provided." });
    }

    parts.push({ text: EXTRACTION_PROMPT });

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { temperature: 0 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errText);
      let detail = "";
      try { detail = JSON.parse(errText)?.error?.message || ""; } catch { detail = errText.slice(0, 200); }
      return res.status(502).json({ error: `Extraction failed (${geminiRes.status}): ${detail || "check Vercel logs"}` });
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    const jsonStr = rawText.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const extracted = JSON.parse(jsonStr);

    for (const key of ["hospitalExpenses", "sumInsured"]) {
      if (extracted[key]) extracted[key] = String(extracted[key]).replace(/[₹,\s]/g, "");
    }

    const filtered = Object.fromEntries(
      Object.entries(extracted).filter(([, v]) => v !== null && v !== undefined && v !== "")
    );

    return res.status(200).json({ extracted: filtered });
  } catch (err: any) {
    console.error("extract-claim error:", err);
    return res.status(500).json({ error: "Failed to process documents. Please try again or fill manually." });
  }
}
