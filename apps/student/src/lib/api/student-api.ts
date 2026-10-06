export type StudentAcademicStatus = "AKTIF" | "CUTI" | "NONAKTIF" | "LULUS" | "DROP_OUT";
export type KrsStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export interface StudentAcademicRecord {
  id: string;
  studentNumber: string;
  name: string;
  academicStatus: StudentAcademicStatus;
  cohort: number | null;
  semester: number | null;
  className: string | null;
  email: string | null;
  phone: string | null;
  studyProgram: { id: string; name: string } | null;
  statusHistory: { oldStatus: StudentAcademicStatus; newStatus: StudentAcademicStatus; effectiveAt: string; reason: string; createdAt: string }[];
  krsRecords: {
    id: string;
    academicYear: string;
    term: "GANJIL" | "GENAP";
    status: KrsStatus;
    rejectionReason: string | null;
    items: {
      offering: {
        className: string;
        room: string | null;
        course: { code: string; name: string; credits: number };
        lecturer: { name: string };
        schedules: { day: string; start: string; end: string }[];
      };
    }[];
  }[];
}

export interface StudentBillingRecord {
  id: string;
  billingNumber: string;
  semester: number;
  academicYear: string;
  type: string;
  amount: number;
  status: "PAID" | "UNPAID" | "PENDING_VERIFICATION" | "OVERDUE";
  dueDate: string;
  paymentCode: string | null;
  lineItems: { label: string; amount: number }[];
}

export interface StudentBillingData {
  student: { id: string; nim: string | null; name: string | null; cohort: number | null; semester: number | null; programStudy: string };
  billings: StudentBillingRecord[];
  summary: { total: number; paid: number; outstanding: number };
  payments: { id: string; billingId: string; transactionNumber: string; paymentReference: string; paymentMethod: string; paidAt: string; amount: number; status: "PAID" | "PENDING_VERIFICATION" | "REJECTED" }[];
}

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export async function getStudentAcademicRecord(nim: string): Promise<StudentAcademicRecord> {
  const response = await fetch(`${apiBase}/students/demo/me`, {
    headers: { "x-student-demo-nim": nim },
    cache: "no-store"
  });
  const body = await response.json().catch(() => null) as StudentAcademicRecord | { message?: string | string[] } | null;
  if (!response.ok) {
    const message = body && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || `Data Taruna tidak tersedia (${response.status}).`);
  }
  return body as StudentAcademicRecord;
}

export async function getStudentBillingData(nim: string): Promise<StudentBillingData> {
  const response = await fetch(`${apiBase}/students/demo/billing`, {
    headers: { "x-student-demo-nim": nim },
    cache: "no-store"
  });
  const body = await response.json().catch(() => null) as StudentBillingData | { message?: string | string[] } | null;
  if (!response.ok) {
    const message = body && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || `Data tagihan tidak tersedia (${response.status}).`);
  }
  return body as StudentBillingData;
}
