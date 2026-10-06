export type AcademicStatus = "AKTIF" | "CUTI" | "NONAKTIF" | "LULUS" | "DROP_OUT";
export type CurriculumStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type KrsStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type GradeStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "PUBLISHED";
export type GraduationStatus = "NOT_ELIGIBLE" | "PENDING" | "ELIGIBLE" | "VERIFIED" | "GRADUATED";
export type CeremonyStatus = "DRAFT" | "OPEN" | "VERIFICATION" | "VERIFIED" | "CLOSED";
export type AttendanceRecordStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface StudyProgram {
  id: string;
  code: string;
  name: string;
  degree: string;
  unit: string;
  headLecturerId?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Lecturer {
  id: string;
  nidn: string;
  nip?: string;
  name: string;
  title: string;
  email?: string;
  phone: string;
  programId: string;
  status: "ACTIVE" | "INACTIVE";
  titleFront?: string;
  titleBack?: string;
}

export interface StudentRecord {
  id: string;
  nim: string;
  name: string;
  email: string;
  phone: string;
  programId: string;
  cohort: number;
  semester: number;
  className: string;
  status: AcademicStatus;
  nik?: string;
  nickname?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: "L" | "P" | string;
  religion?: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  postalCode?: string;
}

export interface Curriculum {
  id: string;
  programId: string;
  name: string;
  effectiveYear: number;
  status: CurriculumStatus;
  courseIds: string[];
  code?: string;
  endYear?: number;
}

export interface CurriculumCourseAssignment {
  id: string;
  curriculumId: string;
  courseId: string;
  semester: number;
  nature: "WAJIB" | "PILIHAN";
  credits: number;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  programId: string;
  kind: "WAJIB" | "PILIHAN" | "PRAKTIKUM";
  prerequisiteIds: string[];
  status: "ACTIVE" | "INACTIVE";
  description?: string;
}

export interface ClassOffering {
  id: string;
  code: string;
  courseId: string;
  lecturerId: string;
  academicYear: string;
  term: "GANJIL" | "GENAP";
  className: string;
  capacity: number;
  studentIds: string[];
  status: "OPEN" | "ACTIVE" | "CLOSED";
  room?: string;
}

export interface ClassSchedule {
  id: string;
  offeringId: string;
  day: string;
  start: string;
  end: string;
  room: string;
  status: "CONFIRMED" | "CONFLICT";
}

export interface KrsRecord {
  id: string;
  studentId: string;
  offeringIds: string[];
  status: KrsStatus;
  rejectionReason?: string;
  academicYear?: string;
  term?: "GANJIL" | "GENAP";
}

export interface GradeRecord {
  id: string;
  studentId: string;
  offeringId: string;
  assignment: number;
  midterm: number;
  finalExam: number;
  finalScore: number;
  grade: string;
  status: GradeStatus;
}

export interface AttendanceSummary {
  id: string;
  studentId: string;
  offeringId: string;
  meetings: number;
  present: number;
  excused: number;
  sick: number;
  absent: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  offeringId: string;
  meetingNumber: number;
  date: string;
  status: AttendanceRecordStatus;
  note?: string;
}

export interface GraduationRule {
  id: string;
  programId: string;
  minimumCredits: number;
  minimumGpa: number;
  minimumAttendancePercent: number;
  requiredDocuments: string[];
  active: boolean;
}

export interface GraduationEvaluation {
  id: string;
  studentId: string;
  academicYear: string;
  credits: number;
  gpa: number;
  attendancePercent: number;
  outstandingRequirements: string[];
  status: GraduationStatus;
  verifiedAt?: string;
  note?: string;
}

export interface CeremonyPeriod {
  id: string;
  name: string;
  date: string;
  location: string;
  capacity: number;
  registrationStart: string;
  registrationEnd: string;
  status: CeremonyStatus;
  registrationIds: string[];
  code?: string;
}

export interface CeremonyRegistration {
  id: string;
  ceremonyId: string;
  studentId: string;
  status: "REGISTERED" | "VERIFIED" | "REJECTED";
  documentsReady: number;
  documentsRequired: number;
  registrationDate?: string;
  note?: string;
}

export interface AcademicCalendarEvent {
  id: string;
  title: string;
  category: "KULIAH" | "KRS" | "UTS" | "UAS" | "LIBUR" | "REGISTRASI" | "WISUDA" | "PENERIMAAN" | "PENERIMAAN_MAHASISWA" | "DEADLINE" | "LAINNYA";
  start: string;
  end: string;
  description: string;
  audience: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  academicYear?: string;
}

export interface AcademicWorkspaceData {
  programs: StudyProgram[];
  lecturers: Lecturer[];
  students: StudentRecord[];
  curricula: Curriculum[];
  curriculumAssignments: CurriculumCourseAssignment[];
  courses: Course[];
  offerings: ClassOffering[];
  schedules: ClassSchedule[];
  krs: KrsRecord[];
  grades: GradeRecord[];
  attendance: AttendanceSummary[];
  attendanceRecords: AttendanceRecord[];
  graduationRules: GraduationRule[];
  graduations: GraduationEvaluation[];
  ceremonies: CeremonyPeriod[];
  ceremonyRegistrations: CeremonyRegistration[];
  calendarEvents: AcademicCalendarEvent[];
}

export type AcademicCollection = keyof AcademicWorkspaceData;
