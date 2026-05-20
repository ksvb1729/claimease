import React, { useRef, useState } from "react";
import type { ClaimData } from "../App";

type FileData = { name: string; mimeType: string; data: string; size: number };

type Props = {
  onExtracted: (data: Partial<ClaimData>) => void;
  onSkip: () => void;
  onBack: () => void;
};

const ACCEPTED = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
const MAX_BYTES = 10 * 1024 * 1024;
const RATE_KEY = "ce_extractions";
const MAX_PER_DAY = 3;

function getRateLimit() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const saved = raw ? JSON.parse(raw) : { date: "", count: 0 };
    if (saved.date !== today) return { ok: true, remaining: MAX_PER_DAY };
    return { ok: saved.count < MAX_PER_DAY, remaining: Math.max(0, MAX_PER_DAY - saved.count) };
  } catch {
    return { ok: true, remaining: MAX_PER_DAY };
  }
}

function incrementRateLimit() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const raw = localStorage.getItem(RATE_KEY);
    const saved = raw ? JSON.parse(raw) : { date: today, count: 0 };
    const count = saved.date === today ? saved.count + 1 : 1;
    localStorage.setItem(RATE_KEY, JSON.stringify({ date: today, count }));
  } catch { /* ignore */ }
}

async function prepareFile(file: File): Promise<FileData> {
  if (file.type === "application/pdf") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const data = result.split(",")[1];
        resolve({ name: file.name, mimeType: "application/pdf", data, size: file.size });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_DIM = 1800;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > MAX_DIM) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
      if (h > MAX_DIM) { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      const data = dataUrl.split(",")[1];
      resolve({ name: file.name, mimeType: "image/jpeg", data, size: Math.ceil(data.length * 0.75) });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read image")); };
    img.src = url;
  });
}

export default function UploadScreen({ onExtracted, onSkip, onBack }: Props) {
  const [finalBill, setFinalBill] = useState<FileData | null>(null);
  const [dischargeSummary, setDischargeSummary] = useState<FileData | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState<"bill" | "summary" | null>(null);

  const billRef = useRef<HTMLInputElement>(null);
  const summaryRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File, target: "bill" | "summary") => {
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 10 MB). Please compress or photograph at a lower resolution.");
      return;
    }
    setError("");
    try {
      const fd = await prepareFile(file);
      if (target === "bill") setFinalBill(fd);
      else setDischargeSummary(fd);
    } catch {
      setError("Could not read that file. Please try a JPG or PNG photo.");
    }
  };

  const handleDrop = (e: React.DragEvent, target: "bill" | "summary") => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, target);
  };

  const handleExtract = async () => {
    if (!finalBill && !dischargeSummary) {
      setError("Please upload at least one document to continue.");
      return;
    }
    const rl = getRateLimit();
    if (!rl.ok) {
      setError(`You've used all ${MAX_PER_DAY} daily extractions. Try again tomorrow, or fill manually below.`);
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/extract-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalBill: finalBill ? { data: finalBill.data, mimeType: finalBill.mimeType } : null,
          dischargeSummary: dischargeSummary ? { data: dischargeSummary.data, mimeType: dischargeSummary.mimeType } : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error || "Extraction failed. Please try again.");
      }
      const { extracted } = await res.json();
      incrementRateLimit();
      onExtracted(extracted);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again or fill manually.");
    } finally {
      setExtracting(false);
    }
  };

  if (extracting) {
    return (
      <div className="main-stage">
        <div className="upload-screen">
          <div className="extracting-overlay">
            <div className="spinner" />
            <div style={{ textAlign: "center" }}>
              <h2 style={{ margin: "0 0 8px" }}>Reading your documents…</h2>
              <p style={{ margin: 0, color: "var(--muted)" }}>
                AI is extracting claim details. This usually takes 5–15 seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-stage">
      <div className="upload-screen">
        <div className="upload-intro">
          <div className="eyebrow">Step 1 — Upload documents</div>
          <h1>Upload your hospital documents</h1>
          <p>
            We'll read your Final Bill and Discharge Summary to pre-fill most of the
            claim form. You'll only answer a few remaining questions after this.
          </p>
        </div>

        <div className="upload-zones">
          <DropZone
            label="Final Bill"
            alias="Also called: Final Invoice, Hospital Bill"
            file={finalBill}
            dragActive={dragOver === "bill"}
            inputRef={billRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver("bill"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, "bill")}
            onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "bill"); e.target.value = ""; }}
            onRemove={() => setFinalBill(null)}
          />
          <DropZone
            label="Discharge Summary"
            alias="Also called: Discharge Card, Discharge Certificate"
            file={dischargeSummary}
            dragActive={dragOver === "summary"}
            inputRef={summaryRef}
            onDragOver={(e) => { e.preventDefault(); setDragOver("summary"); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => handleDrop(e, "summary")}
            onFileChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, "summary"); e.target.value = ""; }}
            onRemove={() => setDischargeSummary(null)}
          />
        </div>

        <div className="privacy-notice">
          Your documents are sent to an AI service only to extract medical and billing information.
          They are <strong>never stored</strong> on any server.
        </div>

        {error && <p className="validation-text" style={{ textAlign: "center", marginBottom: 16 }}>{error}</p>}

        <div className="upload-actions">
          <button
            className="primary-btn"
            onClick={handleExtract}
            disabled={!finalBill && !dischargeSummary}
          >
            Extract claim details →
          </button>
          <button className="ghost-btn" onClick={onSkip}>
            Skip — I'll answer all questions manually
          </button>
          <button className="ghost-btn" style={{ fontSize: 14, color: "var(--muted)" }} onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}

function DropZone({
  label, alias, file, dragActive, inputRef,
  onDragOver, onDragLeave, onDrop, onFileChange, onRemove,
}: {
  label: string;
  alias: string;
  file: FileData | null;
  dragActive: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`drop-zone${dragActive ? " drag-over" : ""}${file ? " has-file" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !file && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED} hidden onChange={onFileChange} />
      {file ? (
        <>
          <div className="drop-zone-icon" style={{ color: "#16a34a" }}>✓</div>
          <div className="drop-zone-label" style={{ color: "#16a34a" }}>{label}</div>
          <div className="file-selected">
            <span className="file-selected-name">{file.name}</span>
            <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>
              {(file.size / 1024).toFixed(0)} KB
            </span>
            <button
              className="file-remove-btn"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              title="Remove"
            >
              ×
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="drop-zone-icon">📄</div>
          <div className="drop-zone-label">{label}</div>
          <div className="drop-zone-hint">Drop file here or click to browse</div>
          <div className="drop-zone-hint">JPG · PNG · PDF &nbsp;·&nbsp; max 10 MB</div>
          <div className="drop-zone-alias">{alias}</div>
        </>
      )}
    </div>
  );
}
