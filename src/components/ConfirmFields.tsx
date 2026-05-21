import React, { useState } from "react";
import type { ClaimData } from "../App";

type Props = {
  extracted: Partial<ClaimData>;
  onConfirm: (data: Partial<ClaimData>) => void;
  onBack: () => void;
};

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const REASON_OPTIONS = ["Illness", "Injury", "Maternity"];
const ROOM_OPTIONS = ["Day care", "Single occupancy", "Twin sharing", "3 or more beds"];
const MEDICINE_OPTIONS = ["Allopathy", "Ayurveda", "Homeopathy", "Siddha", "Unani", "Naturopathy", "Other"];

export default function ConfirmFields({ extracted, onConfirm, onBack }: Props) {
  const [fields, setFields] = useState<Partial<ClaimData>>({ ...extracted });
  const set = (key: keyof ClaimData, value: any) => setFields((prev) => ({ ...prev, [key]: value }));
  const has = (...keys: (keyof ClaimData)[]) => keys.some((k) => fields[k] !== undefined);

  const extractedCount = Object.keys(extracted).length;

  return (
    <div className="main-stage">
      <div className="confirm-screen">
        <div className="confirm-header">
          <div className="eyebrow">Review what we found</div>
          <h1>
            AI extracted {extractedCount} field{extractedCount !== 1 ? "s" : ""} <span className="ai-badge">AI</span>
          </h1>
          {extractedCount > 0 ? (
            <p>
              Check each value below. Edit anything that looks wrong before continuing.
            </p>
          ) : (
            <p>
              We could not confidently read data from those documents. You can still continue and fill everything manually.
            </p>
          )}
        </div>

        {/* Insurance / TPA card */}
        {has("insurerName", "tpaName", "policyNumber", "memberId", "sumInsured") && (
          <div className="confirm-group">
            <div className="confirm-group-title">Insurance & policy</div>
            {fields.insurerName !== undefined && (
              <ConfirmRow label="Insurance company" value={fields.insurerName || ""} onChange={(v) => set("insurerName", v)} />
            )}
            {fields.tpaName !== undefined && (
              <ConfirmRow label="TPA name" value={fields.tpaName || ""} onChange={(v) => set("tpaName", v)} />
            )}
            {fields.policyNumber !== undefined && (
              <ConfirmRow label="Policy number" value={fields.policyNumber || ""} onChange={(v) => set("policyNumber", v)} />
            )}
            {fields.memberId !== undefined && (
              <ConfirmRow label="Member / card ID" value={fields.memberId || ""} onChange={(v) => set("memberId", v)} />
            )}
            {fields.sumInsured !== undefined && (
              <ConfirmRow label="Sum insured (₹)" value={fields.sumInsured || ""} onChange={(v) => set("sumInsured", v)} />
            )}
          </div>
        )}

        {/* Patient */}
        {has("patientName", "gender", "patientDob") && (
          <div className="confirm-group">
            <div className="confirm-group-title">Patient</div>
            {fields.patientName !== undefined && (
              <ConfirmRow label="Full name" value={fields.patientName || ""} onChange={(v) => set("patientName", v)} />
            )}
            {fields.gender !== undefined && (
              <ConfirmChips label="Gender" options={GENDER_OPTIONS} value={fields.gender || ""} onChange={(v) => set("gender", v)} />
            )}
            {fields.patientDob !== undefined && (
              <ConfirmRow label="Date of birth" value={fields.patientDob || ""} type="date" onChange={(v) => set("patientDob", v)} />
            )}
          </div>
        )}

        {/* Hospital stay */}
        {has("hospitalName", "admissionDate", "dischargeDate", "admissionTime", "dischargeTime", "hospitalizationReason", "roomCategory", "systemOfMedicine") && (
          <div className="confirm-group">
            <div className="confirm-group-title">Hospital stay</div>
            {fields.hospitalName !== undefined && (
              <ConfirmRow label="Hospital name" value={fields.hospitalName || ""} onChange={(v) => set("hospitalName", v)} />
            )}
            {fields.admissionDate !== undefined && (
              <ConfirmRow label="Admission date" value={fields.admissionDate || ""} type="date" onChange={(v) => set("admissionDate", v)} />
            )}
            {fields.admissionTime !== undefined && (
              <ConfirmRow label="Admission time" value={fields.admissionTime || ""} type="time" onChange={(v) => set("admissionTime", v)} />
            )}
            {fields.dischargeDate !== undefined && (
              <ConfirmRow label="Discharge date" value={fields.dischargeDate || ""} type="date" onChange={(v) => set("dischargeDate", v)} />
            )}
            {fields.dischargeTime !== undefined && (
              <ConfirmRow label="Discharge time" value={fields.dischargeTime || ""} type="time" onChange={(v) => set("dischargeTime", v)} />
            )}
            {fields.hospitalizationReason !== undefined && (
              <ConfirmChips
                label="Reason"
                options={REASON_OPTIONS}
                value={fields.hospitalizationReason || ""}
                onChange={(v) => set("hospitalizationReason", v as ClaimData["hospitalizationReason"])}
              />
            )}
            {fields.roomCategory !== undefined && (
              <ConfirmSelect label="Room category" options={ROOM_OPTIONS} value={fields.roomCategory || ""} onChange={(v) => set("roomCategory", v)} />
            )}
            {fields.systemOfMedicine !== undefined && (
              <ConfirmSelect label="System of medicine" options={MEDICINE_OPTIONS} value={fields.systemOfMedicine || ""} onChange={(v) => set("systemOfMedicine", v)} />
            )}
          </div>
        )}

        {/* Billing */}
        {fields.hospitalExpenses !== undefined && (
          <div className="confirm-group">
            <div className="confirm-group-title">Bill amount</div>
            <ConfirmRow
              label="Total hospital bill (₹)"
              value={fields.hospitalExpenses || ""}
              onChange={(v) => set("hospitalExpenses", v)}
            />
          </div>
        )}

        {/* Part B clinical — extracted for hospital section */}
        {has("treatingDoctorName", "diagnosisText", "diagnosisIcdCode", "procedureName", "procedureIcdCode") && (
          <div className="confirm-group">
            <div className="confirm-group-title">
              Clinical details <span style={{ fontWeight: 400, fontSize: 11, color: "var(--muted)", textTransform: "none", letterSpacing: 0 }}>(pre-fills the hospital section of the form)</span>
            </div>
            {fields.treatingDoctorName !== undefined && (
              <ConfirmRow label="Treating doctor" value={fields.treatingDoctorName || ""} onChange={(v) => set("treatingDoctorName", v)} />
            )}
            {fields.diagnosisText !== undefined && (
              <ConfirmRow label="Diagnosis" value={fields.diagnosisText || ""} onChange={(v) => set("diagnosisText", v)} />
            )}
            {fields.diagnosisIcdCode !== undefined && (
              <ConfirmRow label="ICD-10 code" value={fields.diagnosisIcdCode || ""} onChange={(v) => set("diagnosisIcdCode", v)} />
            )}
            {fields.procedureName !== undefined && (
              <ConfirmRow label="Procedure / surgery" value={fields.procedureName || ""} onChange={(v) => set("procedureName", v)} />
            )}
            {fields.procedureIcdCode !== undefined && (
              <ConfirmRow label="Procedure code" value={fields.procedureIcdCode || ""} onChange={(v) => set("procedureIcdCode", v)} />
            )}
          </div>
        )}

        <div className="confirm-actions">
          <button className="primary-btn" onClick={() => onConfirm(fields)}>
            Looks good, continue
          </button>
          <button className="ghost-btn" onClick={onBack}>
            Back to upload
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({
  label, value, onChange, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="confirm-field-row">
      <span className="confirm-field-label">{label}</span>
      <input
        className="confirm-field-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ConfirmChips({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="confirm-field-row confirm-field-row--chips">
      <span className="confirm-field-label">{label}</span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`choice-pill${value === opt ? " selected" : ""}`}
            style={{ minHeight: 36, padding: "8px 16px", fontSize: 14 }}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmSelect({
  label, options, value, onChange,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="confirm-field-row">
      <span className="confirm-field-label">{label}</span>
      <select
        className="confirm-field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}
