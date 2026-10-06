export type StudentStatus = "ACTIVE" | "INACTIVE" | "AKTIF" | "CUTI" | "NONAKTIF" | "LULUS" | "DROP_OUT";
export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa";
export type AnnouncementCategory = "Akademik" | "Keuangan" | "Kegiatan" | "Kemahasiswaan" | "Umum";

export interface AnnouncementAttachment {
  id: string;
  name: string;
  type: string;
  size?: number;
  url?: string;
  previewable?: boolean;
  documentTitle?: string;
}

export interface Student {
  id: string;
  nim: string;
  name: string;
  programStudy: string;
  semester: number;
  className: string;
  status: StudentStatus;
  cohort: number;
  email: string;
  phone: string;
}

export interface Course {
  code: string;
  name: string;
  credits: number;
  className: string;
  lecturer: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface Grade {
  courseCode: string;
  grade: string;
  weight: number;
  status: "Lulus" | "Mengulang";
}

export interface AttendanceRecord {
  date: string;
  courseCode: string;
  status: AttendanceStatus;
}

export interface AcademicEvent {
  id: string;
  title: string;
  date: string;
  type: "KRS" | "Kuliah" | "UTS" | "UAS" | "Libur" | "Yudisium";
  description: string;
}

export interface Announcement {
  slug: string;
  category: AnnouncementCategory;
  sender: string;
  senderRole: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  attachments?: AnnouncementAttachment[];
  audience?: {
    programs?: string[];
    semesters?: number[];
    roles?: string[];
  };
}

export type BillingStatus = "PAID" | "UNPAID" | "PENDING_VERIFICATION" | "OVERDUE";

export interface Billing {
  id: string;
  semester: number;
  academicYear: string;
  type: string;
  amount: number;
  status: BillingStatus;
  dueDate: string;
  billingNumber: string;
  paymentCode: string | null;
  lineItems: { label: string; amount: number }[];
}

export interface Payment {
  id: string;
  billingId: string;
  transactionNumber: string;
  paymentReference: string;
  paymentMethod: string;
  paidAt: string;
  amount: number;
  status: "PAID" | "PENDING_VERIFICATION" | "REJECTED";
}

export type AcademicDocumentStatus = "AVAILABLE" | "PROCESSING" | "UNAVAILABLE";
export type AcademicDocumentType = "KRS" | "KHS" | "TRANSKRIP" | "SURAT_AKADEMIK" | "KARTU_TARUNA";

export interface AcademicDocument {
  id: string;
  documentType: AcademicDocumentType;
  title: string;
  description: string;
  period: string;
  status: AcademicDocumentStatus;
  downloadable: boolean;
  printable: boolean;
  semester?: number;
}