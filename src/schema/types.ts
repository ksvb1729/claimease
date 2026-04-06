export type YesNo = 'yes' | 'no' | '';

export type Relationship =
  | 'self'
  | 'spouse'
  | 'child'
  | 'father'
  | 'mother'
  | 'other'
  | '';

export type Occupation =
  | 'service'
  | 'self_employed'
  | 'homemaker'
  | 'student'
  | 'retired'
  | 'other'
  | '';

export type HospitalizationReason = 'injury' | 'illness' | 'maternity' | '';
export type RoomCategory = 'day_care' | 'single' | 'twin' | 'multi' | '';
export type InjuryCause = 'self_inflicted' | 'rta' | 'substance' | 'other' | '';
export type HospitalType = 'network' | 'non_network' | '';
export type AdmissionType = 'emergency' | 'planned' | 'day_care' | 'maternity' | '';
export type DischargeStatus = 'home' | 'other_hospital' | 'deceased' | '';

export interface PersonName {
  surname: string;
  firstName: string;
  middleName: string;
}

export interface PostalAddress {
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
  email: string;
}

export interface InsuranceHistory {
  currentOtherCover: YesNo;
  firstInsuranceStart: string;
  currentOtherCompanyName: string;
  currentOtherPolicyNo: string;
  currentOtherSumInsured: string;
  hospitalizedLastFourYears: YesNo;
  lastHospitalizationDate: string;
  lastHospitalizationDiagnosis: string;
  previousOtherCover: YesNo;
  previousOtherCompanyName: string;
}

export interface PrimaryInsured {
  policyNo: string;
  certificateNo: string;
  companyTpaIdNo: string;
  name: PersonName;
  address: PostalAddress;
}

export interface InsuredPatient {
  name: PersonName;
  gender: 'male' | 'female' | '';
  ageYears: string;
  ageMonths: string;
  dob: string;
  relationship: Relationship;
  relationshipOther: string;
  occupation: Occupation;
  occupationOther: string;
  address: PostalAddress;
}

export interface Hospitalization {
  hospitalName: string;
  roomCategory: RoomCategory;
  dueTo: HospitalizationReason;
  eventDate: string;
  admissionDate: string;
  admissionTime: string;
  dischargeDate: string;
  dischargeTime: string;
  injuryCause: InjuryCause;
  injuryCauseOther: string;
  medicoLegal: YesNo;
  reportedToPolice: YesNo;
  firAttached: YesNo;
  systemOfMedicine: string;
}

export interface TreatmentExpenses {
  preHospitalization: string;
  hospitalization: string;
  postHospitalization: string;
  healthCheckup: string;
  ambulance: string;
  others: string;
  othersCode: string;
  preHospitalizationDays: string;
  postHospitalizationDays: string;
  domiciliaryHospitalization: YesNo;
  hospitalDailyCash: string;
  surgicalCash: string;
  criticalIllnessBenefit: string;
  convalescence: string;
  prePostLumpSum: string;
  othersBenefit: string;
}

export interface BillLine {
  id: string;
  slNo: string;
  billNo: string;
  date: string;
  issuedBy: string;
  towards: string;
  amount: string;
}

export interface DocumentChecklist {
  claimFormSigned: boolean;
  claimIntimationCopy: boolean;
  hospitalMainBill: boolean;
  breakUpBill: boolean;
  paymentReceipt: boolean;
  dischargeSummary: boolean;
  pharmacyBill: boolean;
  operationTheatreNotes: boolean;
  ecg: boolean;
  doctorRequestInvestigation: boolean;
  investigationReports: boolean;
  prescriptions: boolean;
  others: boolean;
  othersText: string;
}

export interface BankDetails {
  pan: string;
  accountNumber: string;
  bankNameBranch: string;
  payableTo: string;
  ifsc: string;
}

export interface DeclarationA {
  place: string;
  date: string;
  insuredName: string;
}

export interface HospitalDetailsB {
  hospitalName: string;
  hospitalId: string;
  hospitalType: HospitalType;
  treatingDoctorName: PersonName;
  qualification: string;
  registrationNoStateCode: string;
  phoneNo: string;
}

export interface PatientAdmittedB {
  patientName: PersonName;
  ipRegistrationNumber: string;
  gender: 'male' | 'female' | '';
  ageYears: string;
  ageMonths: string;
  dob: string;
  admissionDate: string;
  admissionTime: string;
  dischargeDate: string;
  dischargeTime: string;
  admissionType: AdmissionType;
  deliveryDate: string;
  gravidaStatus: string;
  dischargeStatus: DischargeStatus;
  totalClaimedAmount: string;
}

export interface DiagnosisLine {
  code: string;
  description: string;
}

export interface ProcedureLine {
  code: string;
  description: string;
}

export interface DiagnosisB {
  primaryDiagnosis: DiagnosisLine;
  additionalDiagnosis: DiagnosisLine;
  coMorbidities1: DiagnosisLine;
  coMorbidities2: DiagnosisLine;
  procedure1: ProcedureLine;
  procedure2: ProcedureLine;
  procedure3: ProcedureLine;
  procedureDetails: string;
  preAuthObtained: YesNo;
  preAuthNumber: string;
  noPreAuthReason: string;
  hospitalizationDueToInjury: YesNo;
  injuryCause: InjuryCause;
  injuryTestConducted: YesNo;
  medicoLegal: YesNo;
  reportedToPolice: YesNo;
  firNo: string;
  noPoliceReason: string;
}

export interface ChecklistB {
  claimFormSigned: boolean;
  preAuthRequest: boolean;
  preAuthApproval: boolean;
  patientPhotoId: boolean;
  dischargeSummary: boolean;
  otNotes: boolean;
  hospitalMainBill: boolean;
  hospitalBreakUpBill: boolean;
  investigationReports: boolean;
  ctMrUsgHpe: boolean;
  doctorReferenceSlip: boolean;
  ecg: boolean;
  pharmacyBills: boolean;
  mlcPoliceFir: boolean;
  deathSummary: boolean;
  others: string;
}

export interface NonNetworkHospitalB {
  address: PostalAddress;
  registrationNoStateCode: string;
  pan: string;
  inpatientBeds: string;
  otAvailable: YesNo;
  icuAvailable: YesNo;
  others: string;
}

export interface DeclarationB {
  date: string;
  place: string;
  authorityName: string;
}

export interface ClaimDraft {
  version: string;
  claimRef: string;
  createdAt: string;
  primaryInsured: PrimaryInsured;
  insuranceHistory: InsuranceHistory;
  insuredPatient: InsuredPatient;
  hospitalization: Hospitalization;
  treatmentExpenses: TreatmentExpenses;
  documentsA: DocumentChecklist;
  bills: BillLine[];
  bankDetails: BankDetails;
  declarationA: DeclarationA;
  hospitalB: HospitalDetailsB;
  patientB: PatientAdmittedB;
  diagnosisB: DiagnosisB;
  documentsB: ChecklistB;
  nonNetworkHospitalB: NonNetworkHospitalB;
  declarationB: DeclarationB;
}
