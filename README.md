# ClaimEase Rebuild

A privacy-first React + TypeScript rebuild of the reimbursement-claim wizard described in the brief.

## Product choices

- No backend and no server-side persistence.
- In-memory draft state only.
- Explicit JSON export/import for save/resume.
- Human-friendly wizard flow for data collection.
- Official-form renderer that uses the insurer PDF page images as the background and a configuration-driven overlay layer.
- Page-level QR payloads for machine extraction.

## What is implemented

1. End-to-end client-only shell.
2. Multi-step wizard.
3. Canonical claim JSON schema.
4. Export / import logic.
5. Validation pass for critical errors.
6. Official-page renderer for Part A and Part B using the uploaded PDF as reference.
7. Per-page QR code generation.

## What still needs calibration for production

- Fine-tune every coordinate in `FormRenderer.tsx` against the target carrier's print DPI.
- Expand conditional logic and helper text on every wizard step.
- Add a denser bill-entry editor for all 10 bill rows.
- Add checkbox placement overlays for Yes/No and checklist ticks.
- Add PDF export using print CSS or a client-side PDF library.
- Add accessibility refinements and multilingual support.

## Run locally

```bash
npm install
npm run dev
```

## Suggested production architecture

- `app/ui`: wizard, renderer, import/export, review
- `app/domain`: schema, validation, mapping, QR serializers
- `app/assets`: official page images or vector templates
- `app/config`: carrier-specific field maps and language packs

