import { QRCodeSVG } from 'qrcode.react';
import partA from '../assets/irda-part-a.png';
import partB from '../assets/irda-part-b.png';
import { ClaimDraft } from '../schema/types';
import { buildPagePayload } from '../lib/qr';
import { computeBillsTotal, computePartATotal, formatName } from '../lib/claimEngine';

type Box = { x: number; y: number; w: number; h: number; text: string; size?: number; weight?: number };

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1755;

function fitFontSize(text: string, width: number, base = 11) {
  if (!text) return base;
  const estimated = width / Math.max(text.length * 0.58, 1);
  return Math.max(8.5, Math.min(base, estimated));
}

function formatDate(value: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}-${month}-${year}`;
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-');
    return `${month}-${year}`;
  }
  return value;
}

function textBoxesForPartA(draft: ClaimDraft): Box[] {
  return [
    { x: 77, y: 87, w: 240, h: 20, text: draft.primaryInsured.policyNo },
    { x: 767, y: 87, w: 220, h: 20, text: draft.primaryInsured.certificateNo },
    { x: 140, y: 117, w: 265, h: 20, text: draft.primaryInsured.companyTpaIdNo },
    { x: 88, y: 150, w: 1010, h: 20, text: formatName(draft.primaryInsured.name) },
    { x: 88, y: 181, w: 1010, h: 20, text: draft.primaryInsured.address.line1 },
    { x: 84, y: 214, w: 300, h: 20, text: draft.primaryInsured.address.city },
    { x: 466, y: 214, w: 240, h: 20, text: draft.primaryInsured.address.state },
    { x: 88, y: 245, w: 170, h: 20, text: draft.primaryInsured.address.pinCode },
    { x: 388, y: 245, w: 190, h: 20, text: draft.primaryInsured.address.phone },
    { x: 739, y: 245, w: 330, h: 20, text: draft.primaryInsured.address.email, size: 10 },
    { x: 89, y: 447, w: 1010, h: 20, text: formatName(draft.insuredPatient.name) },
    { x: 600, y: 478, w: 60, h: 20, text: draft.insuredPatient.ageYears },
    { x: 726, y: 478, w: 60, h: 20, text: draft.insuredPatient.ageMonths },
    { x: 915, y: 478, w: 150, h: 20, text: formatDate(draft.insuredPatient.dob) },
    { x: 84, y: 602, w: 1010, h: 20, text: draft.hospitalization.hospitalName },
    { x: 628, y: 671, w: 150, h: 20, text: formatDate(draft.hospitalization.eventDate) },
    { x: 157, y: 703, w: 150, h: 20, text: formatDate(draft.hospitalization.admissionDate) },
    { x: 430, y: 703, w: 90, h: 20, text: draft.hospitalization.admissionTime },
    { x: 698, y: 703, w: 150, h: 20, text: formatDate(draft.hospitalization.dischargeDate) },
    { x: 950, y: 703, w: 90, h: 20, text: draft.hospitalization.dischargeTime },
    { x: 873, y: 794, w: 180, h: 20, text: draft.hospitalization.systemOfMedicine },
    { x: 150, y: 846, w: 150, h: 20, text: draft.treatmentExpenses.preHospitalization },
    { x: 150, y: 878, w: 150, h: 20, text: draft.treatmentExpenses.postHospitalization },
    { x: 150, y: 908, w: 150, h: 20, text: draft.treatmentExpenses.ambulance },
    { x: 637, y: 846, w: 150, h: 20, text: draft.treatmentExpenses.hospitalization },
    { x: 637, y: 878, w: 150, h: 20, text: draft.treatmentExpenses.healthCheckup },
    { x: 637, y: 908, w: 150, h: 20, text: draft.treatmentExpenses.others },
    { x: 618, y: 938, w: 170, h: 20, text: String(computePartATotal(draft)), weight: 700 },
    { x: 190, y: 969, w: 50, h: 20, text: draft.treatmentExpenses.preHospitalizationDays },
    { x: 657, y: 969, w: 50, h: 20, text: draft.treatmentExpenses.postHospitalizationDays },
    { x: 229, y: 1192, w: 160, h: 20, text: draft.bankDetails.pan },
    { x: 590, y: 1192, w: 350, h: 20, text: draft.bankDetails.accountNumber },
    { x: 165, y: 1222, w: 620, h: 20, text: draft.bankDetails.bankNameBranch },
    { x: 224, y: 1253, w: 255, h: 20, text: draft.bankDetails.payableTo },
    { x: 904, y: 1253, w: 165, h: 20, text: draft.bankDetails.ifsc },
  ];
}

function BoxLayer({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((box, index) => {
        const left = (box.x / PAGE_WIDTH) * 100;
        const top = (box.y / PAGE_HEIGHT) * 100;
        const width = (box.w / PAGE_WIDTH) * 100;
        const minHeight = (box.h / PAGE_HEIGHT) * 100;
        const fontSize = fitFontSize(box.text, box.w, box.size ?? 11);

        return (
          <div
            key={`${box.x}-${box.y}-${index}`}
            className="box-value"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              minHeight: `${minHeight}%`,
              fontSize: `${fontSize}px`,
              fontWeight: box.weight ?? 600,
              letterSpacing: box.text.length > 26 ? '-0.01em' : '0',
            }}
          >
            {box.text}
          </div>
        );
      })}
    </>
  );
}

function PageFrame({ image, qrPayload, boxes, showQr = true }: { image: string; qrPayload?: object; boxes?: Box[]; showQr?: boolean }) {
  return (
    <div className="page-frame">
      <img src={image} alt="IRDAI form page" className="page-image" />
      {showQr && qrPayload && (
        <div className="qr-zone">
          <QRCodeSVG value={JSON.stringify(qrPayload)} size={72} />
        </div>
      )}
      {boxes && boxes.length > 0 && <BoxLayer boxes={boxes} />}
    </div>
  );
}

export function FormRenderer({ draft, compact = false }: { draft: ClaimDraft; compact?: boolean }) {
  return (
    <div className={`render-stack ${compact ? 'render-stack-compact' : ''}`}>
      <PageFrame image={partA} qrPayload={buildPagePayload('part-a', draft)} boxes={textBoxesForPartA(draft)} />
      <PageFrame image={partB} showQr={false} boxes={[]} />
      {!compact && (
        <div className="totals-strip">
          <strong>Part A total:</strong> Rs. {computePartATotal(draft)}
          <span>
            <strong>Enclosed bills total:</strong> Rs. {computeBillsTotal(draft)}
          </span>
        </div>
      )}
    </div>
  );
}
