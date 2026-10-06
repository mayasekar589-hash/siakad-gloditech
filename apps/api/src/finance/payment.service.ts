import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { BillingStatus, FinancePaymentStatus, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { ReviewFinancePaymentDto } from "./dto/payment.dto";

type PaymentFilters = {
  query?: string;
  academicYear?: string;
  paymentMethod?: string;
  status?: FinancePaymentStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

type UploadedProof = { buffer: Buffer; originalname: string; mimetype: string; size: number };

const paymentInclude = {
  billing: { include: { student: { include: { studyProgram: { select: { id: true, code: true, name: true } } } } } },
  proof: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploadedAt: true } }
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filters: PaymentFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const search = filters.query?.trim();
    const where: Prisma.PaymentWhereInput = {
      ...(filters.academicYear ? { billing: { academicYear: filters.academicYear } } : {}),
      ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from || filters.to ? { submittedAt: { ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}) } } : {}),
      ...(search ? { OR: [
        { transactionNumber: { contains: search, mode: "insensitive" } },
        { paymentReference: { contains: search, mode: "insensitive" } },
        { billing: { billingNumber: { contains: search, mode: "insensitive" } } },
        { billing: { student: { studentNumber: { contains: search, mode: "insensitive" } } } },
        { billing: { student: { name: { contains: search, mode: "insensitive" } } } }
      ] } : {})
    };
    const [rows, total, groups, amount] = await Promise.all([
      this.prisma.payment.findMany({ where, include: paymentInclude, orderBy: { submittedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.groupBy({ by: ["status"], where, _count: { _all: true } }),
      this.prisma.payment.aggregate({ where, _sum: { amount: true } })
    ]);
    return {
      rows: rows.map((payment) => ({ ...payment, amount: Number(payment.amount), billing: { ...payment.billing, amount: Number(payment.billing.amount), dueDate: payment.billing.dueDate.toISOString().slice(0, 10), student: { ...payment.billing.student, program: payment.billing.student.studyProgram } } })),
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      summary: {
        totalAmount: amount._sum.amount ?? 0,
        pending: groups.find((group) => group.status === FinancePaymentStatus.PENDING_VERIFICATION)?._count._all ?? 0,
        paid: groups.find((group) => group.status === FinancePaymentStatus.PAID)?._count._all ?? 0,
        rejected: groups.find((group) => group.status === FinancePaymentStatus.REJECTED)?._count._all ?? 0
      }
    };
  }

  async get(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { ...paymentInclude, history: { orderBy: { createdAt: "desc" } } } });
    if (!payment) throw new NotFoundException("Transaksi pembayaran tidak ditemukan.");
    return { ...payment, amount: Number(payment.amount), billing: { ...payment.billing, amount: Number(payment.billing.amount), dueDate: payment.billing.dueDate.toISOString().slice(0, 10), student: { ...payment.billing.student, program: payment.billing.student.studyProgram } } };
  }

  async getProof(id: string) {
    const proof = await this.prisma.paymentProof.findUnique({ where: { paymentId: id }, select: { fileName: true, mimeType: true, fileContent: true } });
    if (!proof) throw new NotFoundException("Bukti pembayaran tidak ditemukan.");
    return { fileName: proof.fileName, mimeType: proof.mimeType, body: proof.fileContent };
  }

  async submitStudentPayment(nim: string | undefined, billingId: string, paymentMethod: string, paymentReference: string, file?: UploadedProof) {
    if (process.env.NODE_ENV === "production") throw new ForbiddenException("Taruna authentication is required.");
    if (!nim || nim !== "202501001") throw new ForbiddenException("NIM demo tidak valid.");
    if (!file) throw new UnprocessableEntityException("Bukti pembayaran wajib diunggah.");
    if (!new Set(["application/pdf", "image/jpeg", "image/png"]).has(file.mimetype)) throw new UnprocessableEntityException("Bukti pembayaran harus PDF, JPG, atau PNG.");
    if (file.size < 1 || file.size > Number(process.env.PAYMENT_PROOF_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024)) throw new UnprocessableEntityException("Ukuran bukti pembayaran melebihi batas 10 MB.");
    if (!paymentMethod.trim()) throw new UnprocessableEntityException("Metode pembayaran wajib dipilih.");
    const billing = await this.prisma.billing.findUnique({ where: { id: billingId }, include: { student: { select: { studentNumber: true } }, payments: { where: { status: FinancePaymentStatus.PENDING_VERIFICATION }, select: { id: true } } } });
    if (!billing || billing.student.studentNumber !== nim) throw new NotFoundException("Tagihan tidak ditemukan untuk Taruna ini.");
    if (billing.status === BillingStatus.PAID || billing.status === BillingStatus.CANCELLED) throw new ConflictException("Tagihan lunas atau dibatalkan tidak dapat menerima pembayaran baru.");
    if (billing.payments.length) throw new ConflictException("Bukti pembayaran untuk tagihan ini sedang menunggu verifikasi.");
    const id = randomUUID();
    const transactionNumber = `TRX-${new Date().getFullYear()}-${id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const safeName = file.originalname.replace(/[\r\n"\\]/g, "_").slice(-255) || "bukti-pembayaran";
    return this.prisma.$transaction(async (transaction) => {
      const payment = await transaction.payment.create({ data: {
        id,
        transactionNumber,
        billingId,
        paymentReference: paymentReference.trim() || null,
        paymentMethod: paymentMethod.trim(),
        amount: billing.amount,
        status: FinancePaymentStatus.PENDING_VERIFICATION,
        proof: { create: { fileName: safeName, mimeType: file.mimetype, sizeBytes: file.size, fileContent: Uint8Array.from(file.buffer) } }
      }, include: paymentInclude });
      await transaction.billing.update({ where: { id: billingId }, data: { status: BillingStatus.PENDING_VERIFICATION } });
      await transaction.billingHistory.create({ data: { billingId, actorLabel: `Taruna ${nim}`, action: "SUBMIT_PAYMENT", newValue: { transactionNumber, amount: payment.amount, paymentMethod: payment.paymentMethod } } });
      await transaction.paymentHistory.create({ data: { paymentId: id, actorLabel: `Taruna ${nim}`, action: "SUBMIT_PAYMENT", newValue: { transactionNumber, amount: payment.amount, paymentMethod: payment.paymentMethod } } });
      return payment;
    });
  }

  async review(id: string, input: ReviewFinancePaymentDto, actor = "Administrator Back Office") {
    if (input.status !== FinancePaymentStatus.PAID && input.status !== FinancePaymentStatus.REJECTED) throw new UnprocessableEntityException("Status pembayaran hanya dapat disetujui atau ditolak.");
    if (input.status === FinancePaymentStatus.REJECTED && !input.reason?.trim()) throw new UnprocessableEntityException("Alasan penolakan wajib diisi.");
    const current = await this.prisma.payment.findUnique({ where: { id }, include: { billing: true, proof: true } });
    if (!current) throw new NotFoundException("Transaksi pembayaran tidak ditemukan.");
    if (current.status !== FinancePaymentStatus.PENDING_VERIFICATION) throw new ConflictException("Transaksi ini sudah pernah ditinjau.");
    if (input.status === FinancePaymentStatus.PAID && !current.proof) throw new UnprocessableEntityException("Pembayaran tidak dapat disetujui tanpa bukti transfer.");
    return this.prisma.$transaction(async (transaction) => {
      const saved = await transaction.payment.update({ where: { id }, data: {
        status: input.status,
        reviewedAt: new Date(),
        paidAt: input.status === FinancePaymentStatus.PAID ? new Date() : null,
        rejectionReason: input.status === FinancePaymentStatus.REJECTED ? input.reason!.trim() : null
      }, include: paymentInclude });
      const billingStatus = input.status === FinancePaymentStatus.PAID ? BillingStatus.PAID : BillingStatus.UNPAID;
      const updatedBilling = await transaction.billing.update({ where: { id: current.billingId }, data: { status: billingStatus }, include: { student: { select: { studentNumber: true } } } });
      await transaction.paymentHistory.create({ data: {
        paymentId: id,
        actorLabel: actor,
        action: input.status === FinancePaymentStatus.PAID ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
        oldValue: { status: current.status, billingStatus: current.billing.status },
        newValue: { status: input.status, billingStatus },
        reason: input.reason?.trim() || null
      } });
      await transaction.billingHistory.create({ data: {
        billingId: current.billingId,
        actorLabel: actor,
        action: input.status === FinancePaymentStatus.PAID ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
        oldValue: { status: current.billing.status },
        newValue: { status: updatedBilling.status },
        reason: input.reason?.trim() || null
      } });
      return { ...saved, billing: { ...saved.billing, status: updatedBilling.status } };
    });
  }
}