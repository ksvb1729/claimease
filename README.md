# ClaimEase

**Making policyholders' lives easy with AI for reimbursements.**

ClaimEase takes the pain out of IRDAI reimbursement claims. Upload your hospital documents and AI fills the form for you — both Part A (patient) and Part B (hospital). Verify, fill the gaps in under 3 minutes, and download a ready-to-submit PDF.

---

## What it does

1. **Upload** your Final Bill, Discharge Summary, and TPA/Insurance Card
2. **AI extracts** 30+ fields automatically using Gemini — including diagnosis, ICD codes, treating doctor, hospital PAN, and all billing details
3. **Form peek** shows the partially-filled IRDAI form so you feel the progress immediately
4. **Wizard** walks through remaining questions in 7 grouped sections, not 40+ one-by-one
5. **Download** a properly filled PDF or print directly

### Part A + Part B
Most tools only help with Part A (patient side). ClaimEase also pre-fills Part B (hospital side) from your Discharge Summary — treating doctor name, diagnosis, ICD-10 codes, procedure details — so the receptionist has less to write and just needs to verify and sign.

---

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI extraction**: Google Gemini 2.5 Flash (multi-document: bill + discharge summary + TPA card)
- **PDF generation**: pdf-lib (fills the official IRDAI form at exact coordinates, downloadable)
- **QR codes**: LZ-string compressed, auto-splits to two QRs when payload is large
- **Auth**: HMAC token, user list at `config/users.txt`
- **Hosting**: Vercel (serverless API + static SPA)

---

## Setup

### Prerequisites
- Node.js 18+
- A Vercel account
- A Google AI Studio API key (Gemini, paid tier recommended)

### Local dev
```bash
npm install
npm run dev
```

Add a `.env.local` file:
```
GEMINI_API_KEY=your_key_here
JWT_SECRET=any_random_string
```

### Adding users
Edit `config/users.txt` — one user per line, `USERNAME:PASSWORD`:
```
VIJAY:12345
PRIYA:secret
```
Commit and push. Vercel redeploys automatically.

### Vercel environment variables
Set in Vercel dashboard under Project > Settings > Environment Variables:
- `GEMINI_API_KEY` — your Gemini API key
- `JWT_SECRET` — a random secret for signing session tokens (`openssl rand -hex 32`)

---

## Architecture

```
api/
  auth.ts           — HMAC token auth, reads config/users.txt
  extract-claim.ts  — Gemini multimodal extraction (30+ fields)
config/
  users.txt         — allowed username:password pairs
public/
  Claim_Form.pdf    — blank IRDAI form for download
src/
  App.tsx           — page state machine + ClaimData schema
  components/
    LoginScreen.tsx     — auth gate for extraction flow
    UploadScreen.tsx    — 3-zone upload (bill, DS, TPA card)
    ConfirmFields.tsx   — review AI-extracted fields before proceeding
    Wizard.tsx          — 7-section grouped form
    FormRenderer.tsx    — IRDAI form with text overlays + QR
  utils/
    generateFilledPdf.ts — pdf-lib: text embedded at exact PDF coords
```

---

## Privacy

Documents uploaded for extraction are sent to the Gemini API and never stored on any server. Session data stays in the browser. Progress can be exported/imported as a local JSON file.

---

## Roadmap

- Google OAuth + Supabase for user management
- Usage-based access (Stripe)
- Multi-page discharge summary support
- Short-link QR (Vercel KV) for TPA machine-readable access
