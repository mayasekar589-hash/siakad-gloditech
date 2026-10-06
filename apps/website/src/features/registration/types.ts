export type RegistrationType = "POLA_PEMBIBITAN" | "NON_POLA_PEMBIBITAN" | "DIKLAT";
export type RegistrationCategory = "SIPENCATAR" | "DIKLAT";
export type TrainingProgramStatus = "OPEN" | "CLOSED" | "COMING_SOON";

export type RegistrationStepKey =
  | "program"
  | "personal"
  | "parent"
  | "education"
  | "physical"
  | "professional"
  | "documents"
  | "payment"
  | "confirmation";

export type RegistrationStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED";
export type PaymentStatus = "MENUNGGU_VERIFIKASI" | "TERVERIFIKASI" | "DITOLAK";
export type AdmissionPeriodStatus = "OPEN" | "CLOSED" | "NOT_CONFIGURED";

export interface AdmissionPeriod {
  id: string;
  name: string;
  registrationType: RegistrationType;
  status: AdmissionPeriodStatus;
  startDate: string | null;
  endDate: string | null;
  quota: number | null;
}

export interface AdmissionProgram {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface AdmissionRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export interface AdmissionDocumentConfig {
  id: string;
  label: string;
  required: boolean;
  acceptedTypes: readonly string[];
  maxSizeBytes: number | null;
  description?: string;
}

export interface AdmissionFee {
  id: string;
  name: string;
  amount: number | null;
  required: boolean;
}

export interface AdmissionSchedule {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  registrationDeadline?: string | null;
}

export interface RegistrationTimelineEntry {
  id: string;
  status: RegistrationStatus;
  note?: string;
  createdAt: string;
}

export type RegistrationFieldKind = "text" | "email" | "tel" | "date" | "number" | "select" | "textarea";
export type RegistrationValidation = "nik" | "phone" | "postal" | "positive-number" | "year";

export interface RegistrationField {
  id: string;
  label: string;
  kind: RegistrationFieldKind;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: readonly { label: string; value: string }[];
  validation?: RegistrationValidation;
  visibleWhen?: { field: string; equals: string };
}

export interface RegistrationConfiguration {
  registrationType: RegistrationType;
  title: string;
  description: string;
  trainingProgram?: TrainingProgram;
  steps: readonly RegistrationStepKey[];
  period: AdmissionPeriod | null;
  programs: readonly AdmissionProgram[];
  requirements: readonly AdmissionRequirement[];
  documents: readonly AdmissionDocumentConfig[];
  fees: readonly AdmissionFee[];
  schedules: readonly AdmissionSchedule[];
  fields: Partial<Record<RegistrationStepKey, readonly RegistrationField[]>>;
}

export interface PersonalData {
  nik: string;
  familyCardNumber: string;
  fullName: string;
  preferredName: string;
  birthPlace: string;
  birthDate: string;
  gender: string;
  religion: string;
  maritalStatus: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
}

export interface ParentPerson {
  name: string;
  nik: string;
  occupation: string;
  phone: string;
}

export interface GuardianData {
  name: string;
  relationship: string;
  phone: string;
  address: string;
}

export interface ParentData {
  father: ParentPerson;
  mother: ParentPerson;
  hasGuardian: boolean;
  guardian?: GuardianData;
}

export interface EducationData {
  schoolName: string;
  schoolType: string;
  major: string;
  graduationYear: string;
  certificateNumber: string;
  averageGrade: string;
  selectedProgramId: string;
}

export interface PhysicalData {
  heightCm: string;
  weightKg: string;
  bloodType: string;
}

export interface ProgramData {
  programType: string;
  programName: string;
  period: string;
  date: string;
  location: string;
  selectedProgramId: string;
}

export interface ProfessionalData {
  hasSeafarerDocuments: string;
  seafarerBookNumber: string;
  certificateNumber: string;
  rank: string;
  companyName: string;
  seafarerNumber: string;
  certificateExpiry: string;
}

export interface RegistrationDocument {
  id: string;
  configId: string;
  label: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface PaymentData {
  method: string;
  referenceNumber: string;
  proofDocumentId: string;
  status: PaymentStatus;
}

export interface RegistrationFormData {
  personal: Partial<PersonalData>;
  parent: Partial<ParentData>;
  education: Partial<EducationData>;
  physical: Partial<PhysicalData>;
  program: Partial<ProgramData>;
  professional: Partial<ProfessionalData>;
  documents: RegistrationDocument[];
  payment: Partial<PaymentData>;
}

export interface RegistrationApplication {
  id: string;
  registrationNumber: string;
  registrationType: RegistrationType;
  programId?: string;
  admissionPeriodId: string | null;
  status: RegistrationStatus;
  personalData: Partial<PersonalData>;
  parentData?: Partial<ParentData>;
  educationData?: Partial<EducationData>;
  physicalData?: Partial<PhysicalData>;
  professionalData?: Partial<ProfessionalData>;
  programData?: Partial<ProgramData>;
  documents: RegistrationDocument[];
  payment?: Partial<PaymentData>;
  timeline: readonly RegistrationTimelineEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationReceipt {
  registrationNumber: string;
  registrationType: RegistrationType;
  programId?: string;
  applicantName: string;
  status: RegistrationStatus;
  mode: "MOCK" | "API";
}

export interface RegistrationQuestion {
  name: string;
  email: string;
  phone: string;
  category: string;
  question: string;
}

export type TrainingRequirement = AdmissionRequirement;
export type TrainingDocumentRequirement = AdmissionDocumentConfig;
export type TrainingFee = AdmissionFee;
export type TrainingSchedule = AdmissionSchedule;

export interface TrainingEligibility {
  id: string;
  title: string;
  description: string;
}

export interface TrainingProgram {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  imageSrc?: string;
  active: boolean;
  status: TrainingProgramStatus;
  duration: string | null;
  location: string | null;
  requirements: readonly TrainingRequirement[];
  documents: readonly TrainingDocumentRequirement[];
  fees: readonly TrainingFee[];
  schedules: readonly TrainingSchedule[];
  eligibility: readonly TrainingEligibility[];
  registrationFlow: readonly RegistrationStepKey[];
  professionalFields: readonly RegistrationField[];
}