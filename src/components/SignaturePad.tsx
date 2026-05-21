import React, { useRef, useState } from "react";

type Props = {
  textValue?: string;
  imageValue?: string;
  onChangeText: (v: string | undefined) => void;
  onChangeImage: (v: string | undefined) => void;
};

export default function SignaturePad({ textValue, imageValue, onChangeText, onChangeImage }: Props) {
  const [mode, setMode] = useState<"type" | "upload">(imageValue ? "upload" : "type");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      onChangeImage(reader.result as string);
      onChangeText(undefined);
    };
    reader.readAsDataURL(file);
  };

  const handleTypeChange = (val: string) => {
    onChangeText(val || undefined);
    onChangeImage(undefined);
  };

  const handleRemove = () => {
    onChangeText(undefined);
    onChangeImage(undefined);
  };

  return (
    <div className="sig-pad">
      <div className="sig-mode-toggle">
        <button
          type="button"
          className={"sig-mode-btn" + (mode === "type" ? " active" : "")}
          onClick={() => setMode("type")}
        >
          Type Signature
        </button>
        <button
          type="button"
          className={"sig-mode-btn" + (mode === "upload" ? " active" : "")}
          onClick={() => setMode("upload")}
        >
          Upload Signature
        </button>
      </div>

      {mode === "type" && (
        <div className="sig-type-area">
          <input
            className="sig-type-input"
            placeholder="e.g. John Doe"
            value={textValue || ""}
            onChange={e => handleTypeChange(e.target.value)}
          />
          <div className="sig-preview-box">
            {textValue ? (
              <span className="sig-preview-text">{textValue}</span>
            ) : (
              <span className="sig-preview-placeholder">[Your Signature Here]</span>
            )}
          </div>
          {textValue && (
            <button type="button" className="sig-clear-btn" onClick={handleRemove}>
              Clear
            </button>
          )}
        </div>
      )}

      {mode === "upload" && (
        imageValue ? (
          <div className="sig-uploaded-box">
            <div className="sig-uploaded-info">
              <div className="sig-uploaded-name">signature.png</div>
              <div className="sig-uploaded-label">Already Uploaded</div>
            </div>
            <button type="button" className="sig-remove-btn" onClick={handleRemove}>
              ×
            </button>
          </div>
        ) : (
          <div
            className="sig-dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
                e.target.value = "";
              }}
            />
            <div className="sig-dropzone-text">Drop signature image or click to browse</div>
            <div className="sig-dropzone-hint">PNG · JPG · GIF</div>
          </div>
        )
      )}
    </div>
  );
}
