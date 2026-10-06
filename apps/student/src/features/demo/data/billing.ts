import type { Billing, Payment } from "../types";

export const billingSummary = {
  total: 3_500_000,
  paid: 2_000_000,
  outstanding: 1_500_000
} as const;

export const billingHistory: readonly Billing[] = [
  {
    id: "bill-2026-00041",
    semester: 4,
    academicYear: "2026/2027",
    type: "Biaya Pendidikan",
    amount: 1_500_000,
    status: "UNPAID",
    dueDate: "2026-10-15",
    billingNumber: "BILL-2026-00041",
    paymentCode: "88888 202501001 00041",
    lineItems: [{ label: "Biaya Pendidikan", amount: 1_500_000 }]
  },
  {
    id: "bill-2026-00038",
    semester: 4,
    academicYear: "2026/2027",
    type: "Praktikum & Laboratorium",
    amount: 500_000,
    status: "PAID",
    dueDate: "2026-10-01",
    billingNumber: "BILL-2026-00038",
    paymentCode: "88888 202501001 00038",
    lineItems: [{ label: "Praktikum & Laboratorium", amount: 500_000 }]
  },
  {
    id: "bill-2026-00043",
    semester: 4,
    academicYear: "2026/2027",
    type: "Biaya Kemahasiswaan",
    amount: 250_000,
    status: "PENDING_VERIFICATION",
    dueDate: "2026-10-20",
    billingNumber: "BILL-2026-00043",
    paymentCode: "88888 202501001 00043",
    lineItems: [{ label: "Biaya Kemahasiswaan", amount: 250_000 }]
  },
  {
    id: "bill-2025-00032",
    semester: 3,
    academicYear: "2025/2026",
    type: "Biaya Laboratorium",
    amount: 350_000,
    status: "OVERDUE",
    dueDate: "2026-02-20",
    billingNumber: "BILL-2025-00032",
    paymentCode: "88888 202501001 00032",
    lineItems: [{ label: "Biaya Laboratorium", amount: 350_000 }]
  },
  {
    id: "bill-2025-00030",
    semester: 3,
    academicYear: "2025/2026",
    type: "Biaya Pendidikan",
    amount: 1_500_000,
    status: "PAID",
    dueDate: "2026-02-10",
    billingNumber: "BILL-2025-00030",
    paymentCode: "88888 202501001 00030",
    lineItems: [{ label: "Biaya Pendidikan", amount: 1_500_000 }]
  }
];

export const payments: readonly Payment[] = [
  {
    id: "payment-2026-00981",
    billingId: "bill-2026-00038",
    transactionNumber: "TRX-2026-00981",
    paymentReference: "123456789012",
    paymentMethod: "Virtual Account (BRI)",
    paidAt: "2026-10-01T14:32:00+07:00",
    amount: 500_000,
    status: "PAID"
  },
  {
    id: "payment-2026-00942",
    billingId: "bill-2025-00030",
    transactionNumber: "TRX-2026-00942",
    paymentReference: "123456789010",
    paymentMethod: "Virtual Account (BRI)",
    paidAt: "2026-02-10T11:18:00+07:00",
    amount: 1_500_000,
    status: "PAID"
  }
];

export function getBillingById(id: string) {
  return billingHistory.find((billing) => billing.id === id);
}

export function getPaymentByBillingId(billingId: string) {
  return payments.find((payment) => payment.billingId === billingId);
}