import { QRCodeSVG } from 'qrcode.react';
import partA from '../assets/irda-part-a.png';
import partB from '../assets/irda-part-b.png';
import { ClaimDraft } from '../schema/types';
import { buildPagePayload } from '../lib/qr';
import { computeBillsTotal, computePartATotal, formatName } from '../lib/claimEngine';

type Box = { x: number; y: number; w: number; h: number; text: string; size?: number; weight?: number };

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
    { x: 915, y: 478, w: 150, h: 20, text: draft.insuredPatient.dob },
    { x: 84, y: 602, w: 1010, h: 20, text: draft.hospitalization.hospitalName },
    { x: 628, y: 671, w: 150, h: 20, text: draft.hospitalization.eventDate },
    { x: 157, y: 703, w: 150, h: 20, text: draft.hospitalization.admissionDate },
    { x: 430, y: 703, w: 90, h: 20, text: draft.hospitalization.admissionTime },
    { x: 698, y: 703, w: 150, h: 20, text: draft.hospitalization.dischargeDate },
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

function textBoxesForPartB(draft: ClaimDraft): Box[] {
  return [
    { x: 151, y: 89, w: 930, h: 20, text: draft.hospitalB.hospitalName },
    { x: 140, y: 120, w: 165, h: 20, text: draft.hospitalB.hospitalId },
    { x: 221, y: 152, w: 877, h: 20, text: formatName(draft.hospitalB.treatingDoctorName) },
    { x: 126, y: 183, w: 180, h: 20, text: draft.hospitalB.qualification },
    { x: 593, y: 183, w: 195, h: 20, text: draft.hospitalB.registrationNoStateCode },
    { x: 936, y: 183, w: 135, h: 20, text: draft.hospitalB.phoneNo },
    { x: 153, y: 247, w: 930, h: 20, text: formatName(draft.patientB.patientName) },
    { x: 206, y: 279, w: 135, h: 20, text: draft.patientB.ipRegistrationNumber },
    { x: 598, y: 279, w: 40, h: 20, text: draft.patientB.ageYears },
    { x: 722, y: 279, w: 40, h: 20, text: draft.patientB.ageMonths },
    { x: 948, y: 279, w: 100, h: 20, text: draft.patientB.dob },
    { x: 162, y: 309, w: 150, h: 20, text: draft.patientB.admissionDate },
    { x: 432, y: 309, w: 90, h: 20, text: draft.patientB.admissionTime },
    { x: 690, y: 309, w: 150, h: 20, text: draft.patientB.dischargeDate },
    { x: 953, y: 309, w: 90, h: 20, text: draft.patientB.dischargeTime },
    { x: 313, y: 375, w: 160, h: 20, text: draft.patientB.deliveryDate },
    { x: 700, y: 375, w: 100, h: 20, text: draft.patientB.gravidaStatus },
    { x: 948, y: 408, w: 110, h: 20, text: draft.patientB.totalClaimedAmount },
    { x: 210, y: 469, w: 110, h: 20, text: draft.diagnosisB.primaryDiagnosis.code },
    { x: 350, y: 465, w: 200, h: 55, text: draft.diagnosisB.primaryDiagnosis.description, size: 9 },
    { x: 210, y: 525, w: 110, h: 20, text: draft.diagnosisB.additionalDiagnosis.code },
    { x: 350, y: 522, w: 200, h: 55, text: draft.diagnosisB.additionalDiagnosis.description, size: 9 },
    { x: 210, y: 579, w: 110, h: 20, text: draft.diagnosisB.coMorbidities1.code },
    { x: 350, y: 576, w: 200, h: 55, text: draft.diagnosisB.coMorbidities1.description, size: 9 },
    { x: 210, y: 635, w: 110, h: 20, text: draft.diagnosisB.coMorbidities2.code },
    { x: 350, y: 632, w: 200, h: 55, text: draft.diagnosisB.coMorbidities2.description, size: 9 },
    { x: 720, y: 470, w: 120, h: 20, text: draft.diagnosisB.procedure1.code },
    { x: 871, y: 466, w: 190, h: 55, text: draft.diagnosisB.procedure1.description, size: 9 },
    { x: 720, y: 537, w: 120, h: 20, text: draft.diagnosisB.procedure2.code },
    { x: 871, y: 532, w: 190, h: 55, text: draft.diagnosisB.procedure2.description, size: 9 },
    { x: 720, y: 601, w: 120, h: 20, text: draft.diagnosisB.procedure3.code },
    { x: 871, y: 597, w: 190, h: 55, text: draft.diagnosisB.procedure3.description, size: 9 },
    { x: 755, y: 670, w: 308, h: 40, text: draft.diagnosisB.procedureDetails, size: 9 },
    { x: 819, y: 736, w: 200, h: 20, text: draft.diagnosisB.preAuthNumber },
    { x: 396, y: 765, w: 662, h: 20, text: draft.diagnosisB.noPreAuthReason, size: 9 },
    { x: 182, y: 1127, w: 910, h: 20, text: draft.nonNetworkHospitalB.address.line1 },
    { x: 95, y: 1159, w: 270, h: 20, text: draft.nonNetworkHospitalB.address.city },
    { x: 463, y: 1159, w: 210, h: 20, text: draft.nonNetworkHospitalB.address.state },
    { x: 786, y: 1159, w: 110, h: 20, text: draft.nonNetworkHospitalB.address.pinCode },
    { x: 962, y: 1159, w: 110, h: 20, text: draft.nonNetworkHospitalB.address.phone },
    { x: 621, y: 1529, w: 230, h: 20, text: draft.declarationB.place },
  ];
}

function BoxLayer({ boxes }: { boxes: Box[] }) {
  return (
    <>
      {boxes.map((box, index) => (
        <div
          key={`${box.x}-${box.y}-${index}`}
          className="box-value"
          style={{
            left: box.x,
            top: box.y,
            width: box.w,
            minHeight: box.h,
            fontSize: box.size ?? 11,
            fontWeight: box.weight ?? 600,
          }}
        >
          {box.text}
        </div>
      ))}
    </>
  );
}

function PageFrame({ image, qrPayload, boxes }: { image: string; qrPayload: object; boxes: Box[] }) {
  return (
    <div className="page-frame">
      <img src={image} alt="IRDAI form page" className="page-image" />
      <div className="qr-zone">
        <QRCodeSVG value={JSON.stringify(qrPayload)} size={72} />
      </div>
      <BoxLayer boxes={boxes} />
    </div>
  );
}

export function FormRenderer({ draft }: { draft: ClaimDraft }) {
  return (
    <div className="render-stack">
      <PageFrame image={partA} qrPayload={buildPagePayload('part-a', draft)} boxes={textBoxesForPartA(draft)} />
      <PageFrame image={partB} qrPayload={buildPagePayload('part-b', draft)} boxes={textBoxesForPartB(draft)} />
      <div className="totals-strip">
        <strong>Part A total:</strong> Rs. {computePartATotal(draft)}
        <span>
          <strong>Enclosed bills total:</strong> Rs. {computeBillsTotal(draft)}
        </span>
      </div>
    </div>
  );
}
