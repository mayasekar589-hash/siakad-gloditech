import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { BillingStatus, Prisma, ReconciliationStatus, ScholarshipStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { BillingImportDto, CreateBillingDto, UpdateBillingDto } from "./dto/billing.dto";
import type { CreateScholarshipDto, CreateTariffDto, ReviewScholarshipDto } from "./dto/master-data.dto";

type BillingFilters = {
  query?: string;
  academicYear?: string;
  studyProgramId?: string;
  billingType?: string;
  status?: BillingStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

type ImportRow = {
  nim: string;
  tariffCode: string;
  tariffId?: string | null;
  academicYear: string;
  semester: number;
  billingType: string;
  description: string;
  amount: number;
  dueDate: string;
  note?: string;
};

const billingInclude = {
  student: { include: { studyProgram: { select: { id: true, code: true, name: true } } } },
  tariff: { select: { id: true, code: true, name: true, amount: true } },
  payments: { orderBy: { submittedAt: "desc" }, take: 1, select: { id: true, transactionNumber: true, paymentReference: true, paymentMethod: true, amount: true, status: true, paidAt: true, submittedAt: true } }
} satisfies Prisma.BillingInclude;

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validAcademicYear(value: string) {
  const match = /^(20\d{2})\/(20\d{2})$/.exec(value);
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
}

function billingNumber(id: string, academicYear: string) {
  return `BILL-${academicYear.slice(0, 4)}-${id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function serializeBilling(billing: Prisma.BillingGetPayload<{ include: typeof billingInclude }>) {
  return {
    ...billing,
    amount: Number(billing.amount),
    dueDate: billing.dueDate.toISOString().slice(0, 10),
    student: {
      ...billing.student,
      program: billing.student.studyProgram
    }
  };
}

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async listBillings(filters: BillingFilters) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const search = filters.query?.trim();
    const where: Prisma.BillingWhereInput = {
      ...(filters.academicYear ? { academicYear: filters.academicYear } : {}),
      ...(filters.studyProgramId ? { student: { studyProgramId: filters.studyProgramId } } : {}),
      ...(filters.billingType ? { billingType: filters.billingType } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.from || filters.to ? { dueDate: { ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}) } } : {}),
      ...(search ? { OR: [
        { billingNumber: { contains: search, mode: "insensitive" } },
        { billingType: { contains: search, mode: "insensitive" } },
        { student: { studentNumber: { contains: search, mode: "insensitive" } } },
        { student: { name: { contains: search, mode: "insensitive" } } }
      ] } : {})
    };
    const [rows, total, amountSummary, statusCounts] = await Promise.all([
      this.prisma.billing.findMany({ where, include: billingInclude, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.billing.count({ where }),
      this.prisma.billing.aggregate({ where, _sum: { amount: true } }),
      this.prisma.billing.groupBy({ by: ["status"], where, _count: { _all: true } })
    ]);
    return {
      rows: rows.map(serializeBilling),
      page,
      pageSize,
      total,
      pageCount: Math.ceil(total / pageSize),
      summary: {
        totalAmount: amountSummary._sum.amount ?? 0,
        unpaid: statusCounts.find((entry) => entry.status === BillingStatus.UNPAID)?._count._all ?? 0,
        pendingVerification: statusCounts.find((entry) => entry.status === BillingStatus.PENDING_VERIFICATION)?._count._all ?? 0,
        paid: statusCounts.find((entry) => entry.status === BillingStatus.PAID)?._count._all ?? 0,
        overdue: statusCounts.find((entry) => entry.status === BillingStatus.OVERDUE)?._count._all ?? 0
      }
    };
  }

  async listStudents(query = "") {
    const search = query.trim();
    return this.prisma.student.findMany({
      where: search ? { OR: [
        { studentNumber: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { studyProgram: { name: { contains: search, mode: "insensitive" } } }
      ] } : { academicStatus: "AKTIF" },
      select: { id: true, studentNumber: true, name: true, cohort: true, semester: true, academicStatus: true, studyProgram: { select: { id: true, code: true, name: true } } },
      orderBy: [{ studentNumber: "asc" }, { name: "asc" }],
      take: 20
    });
  }

  listStudyPrograms() {
    return this.prisma.studyProgram.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, code: true, name: true },
      orderBy: { name: "asc" }
    });
  }

  async getBilling(id: string) {
    const billing = await this.prisma.billing.findUnique({ where: { id }, include: { ...billingInclude, history: { orderBy: { createdAt: "desc" } } } });
    if (!billing) throw new NotFoundException("Tagihan tidak ditemukan.");
    return { ...serializeBilling(billing), history: billing.history };
  }

  async createBilling(input: CreateBillingDto, actor = "Administrator Back Office") {
    this.validatePeriod(input.academicYear, input.semester);
    if (!validDate(input.dueDate)) throw new BadRequestException("Tanggal jatuh tempo tidak valid.");
    const student = await this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true, academicStatus: true } });
    if (!student) throw new UnprocessableEntityException("Mahasiswa tidak ditemukan.");
    if (!input.tariffId) throw new UnprocessableEntityException("Tagihan wajib menggunakan tarif master aktif.");
    let amount = input.amount;
    let grossAmount: number | null = null;
    let discountAmount = 0;
    if (input.scholarshipId && !input.tariffId) throw new UnprocessableEntityException("Beasiswa hanya dapat mengurangi tagihan yang dibuat dari tarif master.");
    if (input.tariffId) {
      const tariff = await this.prisma.tariff.findUnique({ where: { id: input.tariffId } });
      if (!tariff || !tariff.active || tariff.academicYear !== input.academicYear || tariff.semester !== input.semester) throw new UnprocessableEntityException("Tarif aktif tidak cocok dengan periode tagihan.");
      const studentProgram = await this.prisma.student.findUnique({ where: { id: input.studentId }, select: { studyProgramId: true } });
      if (tariff.studyProgramId && tariff.studyProgramId !== studentProgram?.studyProgramId) throw new UnprocessableEntityException("Tarif ini tidak berlaku untuk program studi mahasiswa.");
      grossAmount = tariff.amount;
      if (input.scholarshipId) {
        const scholarship = await this.prisma.scholarship.findFirst({ where: { id: input.scholarshipId, studentId: input.studentId, academicYear: input.academicYear, status: ScholarshipStatus.ACTIVE } });
        if (!scholarship) throw new UnprocessableEntityException("Beasiswa aktif yang dipilih tidak berlaku untuk mahasiswa/periode ini.");
        discountAmount = Math.min(scholarship.amount, grossAmount);
      }
      amount = grossAmount - discountAmount;
    }
    if (!amount || !Number.isSafeInteger(amount) || amount < 1) throw new UnprocessableEntityException("Nominal tagihan harus positif setelah pengurangan beasiswa.");
    const id = randomUUID();
    try {
      const billing = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.billing.create({
          data: {
            id,
            billingNumber: billingNumber(id, input.academicYear),
            studentId: input.studentId,
            academicYear: input.academicYear,
            semester: input.semester,
            billingType: input.billingType.trim(),
            description: input.description.trim(),
            amount: input.amount,
            ...(input.tariffId ? { tariffId: input.tariffId, scholarshipId: input.scholarshipId, grossAmount, discountAmount, amount } : {}),
            dueDate: new Date(`${input.dueDate}T00:00:00.000Z`),
            note: input.note?.trim() || null
          },
          include: billingInclude
        });
        await transaction.billingHistory.create({ data: { billingId: created.id, actorLabel: actor, action: "CREATE_BILLING", newValue: this.jsonValue(created) } });
        return created;
      });
      return serializeBilling(billing);
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new ConflictException("Tagihan dengan jenis dan periode tersebut sudah tersedia untuk mahasiswa ini.");
      throw error;
    }
  }

  async updateBilling(id: string, input: UpdateBillingDto, actor = "Administrator Back Office") {
    const previous = await this.prisma.billing.findUnique({ where: { id }, include: billingInclude });
    if (!previous) throw new NotFoundException("Tagihan tidak ditemukan.");
    if (previous.status === BillingStatus.PAID || previous.status === BillingStatus.CANCELLED) throw new ConflictException("Tagihan lunas atau dibatalkan tidak dapat diubah.");
    if (previous.tariffId && ((input.academicYear && input.academicYear !== previous.academicYear) || (input.semester !== undefined && input.semester !== previous.semester) || (input.billingType && input.billingType !== previous.billingType) || input.amount !== undefined)) {
      throw new ConflictException("Periode, jenis, dan nominal tagihan berbasis tarif master tidak dapat diubah manual.");
    }
    const academicYear = input.academicYear ?? previous.academicYear;
    const semester = input.semester ?? previous.semester;
    this.validatePeriod(academicYear, semester);
    if (input.dueDate && !validDate(input.dueDate)) throw new BadRequestException("Tanggal jatuh tempo tidak valid.");
    const updated = await this.prisma.$transaction(async (transaction) => {
      const saved = await transaction.billing.update({ where: { id }, data: {
        ...(input.academicYear ? { academicYear: input.academicYear } : {}),
        ...(input.semester !== undefined ? { semester: input.semester } : {}),
        ...(input.billingType ? { billingType: input.billingType.trim() } : {}),
        ...(input.description ? { description: input.description.trim() } : {}),
        ...(input.amount !== undefined ? { amount: input.amount } : {}),
        ...(input.dueDate ? { dueDate: new Date(`${input.dueDate}T00:00:00.000Z`) } : {}),
        ...(input.note !== undefined ? { note: input.note.trim() || null } : {})
      }, include: billingInclude });
      await transaction.billingHistory.create({ data: { billingId: id, actorLabel: actor, action: "EDIT_BILLING", oldValue: this.jsonValue(previous), newValue: this.jsonValue(saved) } });
      return saved;
    });
    return serializeBilling(updated);
  }

  async cancelBilling(id: string, reason: string, actor = "Administrator Back Office") {
    const previous = await this.prisma.billing.findUnique({ where: { id }, include: billingInclude });
    if (!previous) throw new NotFoundException("Tagihan tidak ditemukan.");
    if (previous.status === BillingStatus.PAID) throw new ConflictException("Tagihan lunas tidak dapat dibatalkan.");
    if (previous.status === BillingStatus.CANCELLED) throw new ConflictException("Tagihan sudah dibatalkan.");
    if (previous.payments.some((payment) => payment.status === "PENDING_VERIFICATION")) throw new ConflictException("Tagihan dengan pembayaran yang menunggu verifikasi tidak dapat dibatalkan.");
    const updated = await this.prisma.$transaction(async (transaction) => {
      const saved = await transaction.billing.update({ where: { id }, data: { status: BillingStatus.CANCELLED, cancelledAt: new Date(), cancellationReason: reason.trim() }, include: billingInclude });
      await transaction.billingHistory.create({ data: { billingId: id, actorLabel: actor, action: "CANCEL_BILLING", oldValue: this.jsonValue(previous), newValue: this.jsonValue(saved), reason: reason.trim() } });
      return saved;
    });
    return serializeBilling(updated);
  }

  async validateImport(rows: unknown[]) {
    const prepared = this.prepareImport(rows);
    const nims = [...new Set(prepared.map((item) => item.value.nim).filter(Boolean))];
    const tariffCodes = [...new Set(prepared.map((item) => item.value.tariffCode).filter(Boolean))];
    const students = await this.prisma.student.findMany({ where: { studentNumber: { in: nims } }, select: { id: true, studentNumber: true, studyProgramId: true } });
    const studentByNim = new Map(students.flatMap((student) => student.studentNumber ? [[student.studentNumber, student] as const] : []));
    const tariffs = await this.prisma.tariff.findMany({ where: { code: { in: tariffCodes }, active: true } });
    const tariffByCode = new Map(tariffs.map((tariff) => [tariff.code.toLowerCase(), tariff]));
    const duplicateKeys = new Set<string>();
    const seenKeys = new Set<string>();
    const keys = prepared.map(({ value, rowNumber }) => ({ value, rowNumber, studentId: studentByNim.get(value.nim)?.id }));
    for (const { value, studentId } of keys) {
      if (!studentId) continue;
      const key = `${studentId}:${value.academicYear}:${value.semester}:${value.billingType.toLocaleLowerCase("id-ID")}`;
      if (seenKeys.has(key)) duplicateKeys.add(key);
      seenKeys.add(key);
    }
    const existing = keys.filter((item) => item.studentId).length
      ? await this.prisma.billing.findMany({ where: { OR: keys.filter((item) => item.studentId).map(({ value, studentId }) => ({ studentId: studentId!, academicYear: value.academicYear, semester: value.semester, billingType: value.billingType })) }, select: { studentId: true, academicYear: true, semester: true, billingType: true } })
      : [];
    const existingKeys = new Set(existing.map((item) => `${item.studentId}:${item.academicYear}:${item.semester}:${item.billingType.toLocaleLowerCase("id-ID")}`));
    const result = prepared.map(({ value, rowNumber, errors }) => {
      const student = studentByNim.get(value.nim);
      const tariff = tariffByCode.get(value.tariffCode.toLowerCase());
      if (value.nim && !student) errors.push("NIM tidak ditemukan.");
      if (!tariff) errors.push("Kode tarif master aktif tidak ditemukan.");
      if (!validAcademicYear(value.academicYear)) errors.push("Tahun akademik tidak valid; gunakan format YYYY/YYYY berurutan.");
      if (!Number.isInteger(value.semester) || value.semester < 1 || value.semester > 14) errors.push("Semester harus berupa angka 1 sampai 14.");
      if (tariff && (tariff.academicYear !== value.academicYear || tariff.semester !== value.semester)) errors.push("Periode tarif tidak cocok dengan periode tagihan.");
      if (tariff && tariff.studyProgramId && tariff.studyProgramId !== student?.studyProgramId) errors.push("Tarif tidak berlaku untuk program studi mahasiswa.");
      if (!value.billingType || (tariff && value.billingType.toLowerCase() !== tariff.kind.toLowerCase())) errors.push("Jenis tagihan harus sama dengan jenis pada tarif master.");
      if (!value.description) errors.push("Deskripsi wajib diisi.");
      if (!Number.isSafeInteger(value.amount) || value.amount < 1) errors.push("Nominal harus berupa bilangan rupiah positif.");
      if (tariff && value.amount !== tariff.amount) errors.push(`Nominal harus sama dengan tarif master (${tariff.amount}).`);
      if (!validDate(value.dueDate)) errors.push("Tanggal jatuh tempo tidak valid; gunakan YYYY-MM-DD.");
      const studentId = student?.id;
      const key = studentId ? `${studentId}:${value.academicYear}:${value.semester}:${value.billingType.toLocaleLowerCase("id-ID")}` : "";
      if (key && (duplicateKeys.has(key) || existingKeys.has(key))) errors.push("Billing duplicate untuk mahasiswa, periode, dan jenis tagihan ini.");
      return { rowNumber, value: { ...value, tariffId: tariff?.id ?? null, amount: tariff?.amount ?? value.amount }, studentId: studentId ?? null, errors, warnings: [] as string[], valid: errors.length === 0 };
    });
    return {
      rows: result,
      total: result.length,
      valid: result.filter((row) => row.valid).length,
      invalid: result.filter((row) => !row.valid).length,
      duplicate: result.filter((row) => row.errors.some((error) => error.includes("duplicate"))).length,
      warning: result.reduce((count, row) => count + row.warnings.length, 0)
    };
  }

  async confirmImport(input: BillingImportDto, actor = "Administrator Back Office") {
    const preview = await this.validateImport(input.rows);
    if (preview.invalid > 0) throw new UnprocessableEntityException({ message: "Perbaiki baris tidak valid sebelum import.", preview });
    if (preview.warning > 0 && !input.confirmWarnings) throw new UnprocessableEntityException({ message: "Konfirmasi warning diperlukan sebelum import.", preview });
    const ids = preview.rows.map(() => randomUUID());
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const created = [];
        for (const [index, row] of preview.rows.entries()) {
          const value = row.value as ImportRow;
          const id = ids[index];
          const billing = await transaction.billing.create({ data: {
            id,
            billingNumber: billingNumber(id, value.academicYear),
            studentId: row.studentId!,
            tariffId: value.tariffId!,
            grossAmount: value.amount,
            discountAmount: 0,
            academicYear: value.academicYear,
            semester: value.semester,
            billingType: value.billingType,
            description: value.description,
            amount: value.amount,
            dueDate: new Date(`${value.dueDate}T00:00:00.000Z`),
            note: value.note || null
          }, include: billingInclude });
          await transaction.billingHistory.create({ data: { billingId: billing.id, actorLabel: actor, action: "IMPORT_BILLING", newValue: this.jsonValue(billing) } });
          created.push(serializeBilling(billing));
        }
        return { imported: created.length, rows: created };
      });
    } catch (error) {
      if (this.isUniqueConstraint(error)) throw new ConflictException("Data berubah setelah preview; validasi ulang file sebelum import.");
      throw error;
    }
  }

  async getStudentBillings(nim: string | undefined) {
    if (process.env.NODE_ENV === "production") throw new ForbiddenException("Taruna authentication is required.");
    if (!nim || nim !== "202501001") throw new ForbiddenException("NIM demo tidak valid.");
    const student = await this.prisma.student.findUnique({ where: { studentNumber: nim }, include: { studyProgram: { select: { id: true, code: true, name: true } } } });
    if (!student) throw new NotFoundException("Data Taruna demo belum tersedia di database akademik.");
    const billings = await this.prisma.billing.findMany({ where: { studentId: student.id }, include: { payments: { orderBy: { submittedAt: "desc" }, take: 1 } }, orderBy: [{ academicYear: "desc" }, { semester: "desc" }, { dueDate: "desc" }] });
    const active = billings.filter((billing) => billing.status !== BillingStatus.CANCELLED);
    return {
      student: { id: student.id, nim: student.studentNumber, name: student.name, cohort: student.cohort, semester: student.semester, programStudy: student.studyProgram?.name ?? "" },
      billings: active.map((billing) => ({ ...billing, amount: Number(billing.amount), dueDate: billing.dueDate.toISOString().slice(0, 10), type: billing.billingType, lineItems: [{ label: billing.description, amount: Number(billing.amount) }], paymentCode: null })),
      summary: {
        total: active.reduce((sum, billing) => sum + billing.amount, 0),
        paid: active.filter((billing) => billing.status === BillingStatus.PAID).reduce((sum, billing) => sum + billing.amount, 0),
        outstanding: active.filter((billing) => billing.status === BillingStatus.UNPAID || billing.status === BillingStatus.OVERDUE || billing.status === BillingStatus.PENDING_VERIFICATION).reduce((sum, billing) => sum + billing.amount, 0)
      },
      payments: active.flatMap((billing) => billing.payments.map((payment) => ({
        id: payment.id,
        billingId: billing.id,
        transactionNumber: payment.transactionNumber,
        paymentReference: payment.paymentReference ?? "",
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt?.toISOString() ?? payment.submittedAt.toISOString(),
        amount: Number(payment.amount),
        status: payment.status
      })))
    };
  }

  async listTariffs(query = "", academicYear?: string, studyProgramId?: string, active?: boolean) {
    const search = query.trim();
    return this.prisma.tariff.findMany({
      where: {
        ...(academicYear ? { academicYear } : {}),
        ...(studyProgramId ? { studyProgramId } : {}),
        ...(active !== undefined ? { active } : {}),
        ...(search ? { OR: [{ code: { contains: search, mode: "insensitive" } }, { name: { contains: search, mode: "insensitive" } }, { kind: { contains: search, mode: "insensitive" } }] } : {})
      },
      include: { studyProgram: { select: { id: true, code: true, name: true } } },
      orderBy: [{ academicYear: "desc" }, { name: "asc" }]
    });
  }

  async createTariff(input: CreateTariffDto) {
    return this.prisma.$transaction(async (transaction) => {
      const tariff = await transaction.tariff.create({ data: { ...input, code: input.code.trim().toUpperCase(), name: input.name.trim(), kind: input.kind.trim(), pathway: input.pathway?.trim() || null }, include: { studyProgram: { select: { id: true, code: true, name: true } } } });
      await transaction.tariffHistory.create({ data: { tariffId: tariff.id, action: "CREATE_TARIFF", newValue: this.jsonValue(tariff) } });
      return tariff;
    });
  }

  async updateTariff(id: string, input: CreateTariffDto) {
    const tariff = await this.prisma.tariff.findUnique({ where: { id } });
    if (!tariff) throw new NotFoundException("Tarif akademik tidak ditemukan.");
    if (await this.prisma.billing.count({ where: { tariffId: id, status: { in: [BillingStatus.PAID, BillingStatus.PENDING_VERIFICATION] } } })) throw new ConflictException("Tarif yang sudah digunakan tagihan lunas/menunggu pembayaran tidak dapat diubah.");
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.tariff.update({ where: { id }, data: { ...input, code: input.code.trim().toUpperCase(), name: input.name.trim(), kind: input.kind.trim(), pathway: input.pathway?.trim() || null }, include: { studyProgram: { select: { id: true, code: true, name: true } } } });
      await transaction.tariffHistory.create({ data: { tariffId: id, action: "UPDATE_TARIFF", oldValue: this.jsonValue(tariff), newValue: this.jsonValue(updated) } });
      return updated;
    });
  }

  async listScholarships(query = "", academicYear?: string, studyProgramId?: string, status?: ScholarshipStatus) {
    const search = query.trim();
    return this.prisma.scholarship.findMany({
      where: {
        ...(academicYear ? { academicYear } : {}),
        ...(status ? { status } : {}),
        ...(studyProgramId ? { student: { studyProgramId } } : {}),
        ...(search ? { OR: [{ kind: { contains: search, mode: "insensitive" } }, { student: { studentNumber: { contains: search, mode: "insensitive" } } }, { student: { name: { contains: search, mode: "insensitive" } } }] } : {})
      },
      include: { student: { include: { studyProgram: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" }
    });
  }

  async createScholarship(input: CreateScholarshipDto) {
    if (new Date(input.endsAt) < new Date(input.startsAt)) throw new UnprocessableEntityException("Tanggal selesai beasiswa harus setelah tanggal mulai.");
    const student = await this.prisma.student.findUnique({ where: { id: input.studentId }, select: { id: true } });
    if (!student) throw new NotFoundException("Mahasiswa tidak ditemukan.");
    return this.prisma.$transaction(async (transaction) => {
      const scholarship = await transaction.scholarship.create({ data: { ...input, startsAt: new Date(`${input.startsAt.slice(0, 10)}T00:00:00.000Z`), endsAt: new Date(`${input.endsAt.slice(0, 10)}T00:00:00.000Z`), provider: input.provider.trim(), kind: input.kind.trim(), note: input.note?.trim() || null, documentName: input.documentName?.trim() || null } });
      await transaction.scholarshipHistory.create({ data: { scholarshipId: scholarship.id, action: "CREATE_SCHOLARSHIP", newValue: this.jsonValue(scholarship) } });
      return scholarship;
    });
  }

  async reviewScholarship(id: string, input: ReviewScholarshipDto, reason?: string) {
    const scholarship = await this.prisma.scholarship.findUnique({ where: { id } });
    if (!scholarship) throw new NotFoundException("Beasiswa tidak ditemukan.");
    if (input.status === ScholarshipStatus.REJECTED && !reason?.trim()) throw new UnprocessableEntityException("Alasan penolakan beasiswa wajib diisi.");
    if (scholarship.status !== ScholarshipStatus.PENDING_VERIFICATION) throw new ConflictException("Beasiswa ini sudah diproses.");
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.scholarship.update({ where: { id }, data: { status: input.status, note: input.status === ScholarshipStatus.REJECTED ? reason!.trim() : scholarship.note } });
      await transaction.scholarshipHistory.create({ data: { scholarshipId: id, action: input.status === ScholarshipStatus.ACTIVE ? "APPROVE_SCHOLARSHIP" : "REJECT_SCHOLARSHIP", oldValue: this.jsonValue(scholarship), newValue: this.jsonValue(updated), reason: input.status === ScholarshipStatus.REJECTED ? reason!.trim() : null } });
      return updated;
    });
  }

  async validateTariffImport(rows: unknown[]) {
    const programs = await this.prisma.studyProgram.findMany({ select: { id: true, code: true } });
    const programByCode = new Map(programs.map((program) => [program.code.toLowerCase(), program.id]));
    const existing = await this.prisma.tariff.findMany({ select: { code: true } });
    const existingCodes = new Set(existing.map((item) => item.code.toLowerCase()));
    const seen = new Set<string>();
    const result = rows.map((source, index) => {
      const row = source && typeof source === "object" ? source as Record<string, unknown> : {};
      const code = String(row.code ?? "").trim().toUpperCase();
      const name = String(row.name ?? "").trim();
      const kind = String(row.kind ?? "").trim();
      const studyProgramCode = String(row.study_program_code ?? "").trim();
      const pathway = String(row.pathway ?? "").trim();
      const semester = Number(row.semester);
      const academicYear = String(row.academic_year ?? "").trim();
      const amount = Number(String(row.amount ?? "").replace(/[.\s]/g, ""));
      const active = row.active === undefined || row.active === "" ? true : [true, "true", "1", "ACTIVE"].includes(row.active as string | boolean);
      const errors: string[] = [];
      if (!code || !name || !kind) errors.push("Kode, nama, dan jenis tarif wajib diisi.");
      if (studyProgramCode && !programByCode.has(studyProgramCode.toLowerCase())) errors.push("Kode program studi tidak ditemukan.");
      if (!Number.isInteger(semester) || semester < 1 || semester > 14) errors.push("Semester harus antara 1 dan 14.");
      if (!/^20\d{2}\/20\d{2}$/.test(academicYear)) errors.push("Tahun akademik tidak valid.");
      if (!Number.isSafeInteger(amount) || amount < 1) errors.push("Nominal harus berupa rupiah positif.");
      if (existingCodes.has(code.toLowerCase()) || seen.has(code.toLowerCase())) errors.push("Kode tarif duplikat.");
      seen.add(code.toLowerCase());
      return { row: index + 2, value: { code, name, kind, studyProgramCode, studyProgramId: programByCode.get(studyProgramCode.toLowerCase()) ?? null, pathway, semester, academicYear, amount, active }, errors, valid: errors.length === 0 };
    });
    return { rows: result, total: result.length, valid: result.filter((row) => row.valid).length, invalid: result.filter((row) => !row.valid).length };
  }

  async confirmTariffImport(rows: unknown[]) {
    const preview = await this.validateTariffImport(rows);
    if (preview.invalid) throw new UnprocessableEntityException({ message: "Perbaiki data tarif yang invalid sebelum import.", preview });
    return this.prisma.$transaction(async (transaction) => {
      for (const row of preview.rows) {
        const tariff = await transaction.tariff.create({ data: row.value });
        await transaction.tariffHistory.create({ data: { tariffId: tariff.id, action: "IMPORT_TARIFF", newValue: this.jsonValue(tariff) } });
      }
      return { imported: preview.rows.length };
    });
  }

  async validateScholarshipImport(rows: unknown[]) {
    const nims = rows.flatMap((source) => source && typeof source === "object" ? [String((source as Record<string, unknown>).nim ?? "").trim()] : []);
    const students = await this.prisma.student.findMany({ where: { studentNumber: { in: nims } }, select: { id: true, studentNumber: true } });
    const studentByNim = new Map(students.flatMap((student) => student.studentNumber ? [[student.studentNumber, student.id] as const] : []));
    const existing = await this.prisma.scholarship.findMany({ where: { student: { studentNumber: { in: nims } } }, select: { academicYear: true, kind: true, student: { select: { studentNumber: true } } } });
    const existingKeys = new Set(existing.map((item) => `${item.student.studentNumber}:${item.academicYear}:${item.kind.toLowerCase()}`));
    const seen = new Set<string>();
    const result = rows.map((source, index) => {
      const row = source && typeof source === "object" ? source as Record<string, unknown> : {};
      const nim = String(row.nim ?? "").trim();
      const kind = String(row.kind ?? "").trim();
      const academicYear = String(row.academic_year ?? "").trim();
      const amount = Number(String(row.amount ?? "").replace(/[.\s]/g, ""));
      const provider = String(row.provider ?? "").trim();
      const startsAt = String(row.starts_at ?? "").slice(0, 10);
      const endsAt = String(row.ends_at ?? "").slice(0, 10);
      const errors: string[] = [];
      if (!studentByNim.has(nim)) errors.push("NIM tidak ditemukan.");
      if (!kind || !provider) errors.push("Jenis beasiswa dan provider wajib diisi.");
      if (!/^20\d{2}\/20\d{2}$/.test(academicYear)) errors.push("Tahun akademik tidak valid.");
      if (!Number.isSafeInteger(amount) || amount < 1) errors.push("Nominal bantuan tidak valid.");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startsAt) || !/^\d{4}-\d{2}-\d{2}$/.test(endsAt) || endsAt < startsAt) errors.push("Rentang tanggal beasiswa tidak valid.");
      const key = `${nim}:${academicYear}:${kind.toLowerCase()}`;
      if (existingKeys.has(key) || seen.has(key)) errors.push("Beasiswa duplikat untuk mahasiswa, jenis, dan periode ini.");
      seen.add(key);
      return { row: index + 2, value: { nim, studentId: studentByNim.get(nim), kind, academicYear, amount, provider, startsAt, endsAt, documentName: String(row.document_name ?? "").trim(), note: String(row.note ?? "").trim() }, errors, valid: errors.length === 0 };
    });
    return { rows: result, total: result.length, valid: result.filter((row) => row.valid).length, invalid: result.filter((row) => !row.valid).length };
  }

  async confirmScholarshipImport(rows: unknown[]) {
    const preview = await this.validateScholarshipImport(rows);
    if (preview.invalid) throw new UnprocessableEntityException({ message: "Perbaiki data beasiswa yang invalid sebelum import.", preview });
    return this.prisma.$transaction(async (transaction) => {
      for (const row of preview.rows) {
        const scholarship = await transaction.scholarship.create({ data: { studentId: row.value.studentId!, kind: row.value.kind, academicYear: row.value.academicYear, amount: row.value.amount, provider: row.value.provider, startsAt: new Date(`${row.value.startsAt}T00:00:00.000Z`), endsAt: new Date(`${row.value.endsAt}T00:00:00.000Z`), documentName: row.value.documentName || null, note: row.value.note || null } });
        await transaction.scholarshipHistory.create({ data: { scholarshipId: scholarship.id, action: "IMPORT_SCHOLARSHIP", newValue: this.jsonValue(scholarship) } });
      }
      return { imported: preview.rows.length };
    });
  }

  async listReconciliations(query = "", status?: ReconciliationStatus, from?: string, to?: string) {
    return this.prisma.reconciliation.findMany({ where: {
      ...(status ? { status } : {}),
      ...(from || to ? { transactionDate: { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) } } : {}),
      ...(query.trim() ? { OR: [{ externalReference: { contains: query.trim(), mode: "insensitive" } }, { billingNumber: { contains: query.trim(), mode: "insensitive" } }, { studentNim: { contains: query.trim(), mode: "insensitive" } }] } : {})
    }, orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }] });
  }

  async validateReconciliationImport(rows: unknown[]) {
    const issues: { row: number; message: string }[] = [];
    const normalized = rows.map((value, index) => {
      const row = value && typeof value === "object" ? value as Record<string, unknown> : {};
      const transactionDate = String(row.transaction_date ?? "");
      const externalReference = String(row.external_reference ?? "").trim();
      const billingNumber = String(row.billing_number ?? "").trim();
      const studentNim = String(row.student_nim ?? "").trim();
      const externalAmount = Number(String(row.amount ?? "").replace(/[.\s]/g, ""));
      const paymentMethod = String(row.payment_method ?? "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || !Number.isFinite(new Date(transactionDate).getTime())) issues.push({ row: index + 2, message: "Tanggal transaksi tidak valid." });
      if (!externalReference || !billingNumber || !studentNim || !paymentMethod) issues.push({ row: index + 2, message: "Reference, billing, NIM, dan metode pembayaran wajib diisi." });
      if (!Number.isSafeInteger(externalAmount) || externalAmount < 0) issues.push({ row: index + 2, message: "Nominal eksternal tidak valid." });
      return { row: index + 2, transactionDate, externalReference, billingNumber, studentNim, externalAmount, paymentMethod };
    });
    const candidates = await this.prisma.payment.findMany({ where: { OR: normalized.map((row) => ({ OR: [{ transactionNumber: row.externalReference }, { paymentReference: row.externalReference }] })) }, include: { billing: { include: { student: { select: { studentNumber: true } } } } } });
    const byReference = new Map(candidates.flatMap((payment) => [[payment.transactionNumber, payment], ...(payment.paymentReference ? [[payment.paymentReference, payment] as const] : [])]));
    const existingRows = await this.prisma.reconciliation.findMany({ select: { externalReference: true, paymentMethod: true } });
    const existingKeys = new Set(existingRows.map((row) => `${row.externalReference}:${row.paymentMethod.toLowerCase()}`));
    const result = normalized.map((row) => {
      const payment = byReference.get(row.externalReference);
      const match = payment && payment.billing.billingNumber === row.billingNumber && payment.billing.student.studentNumber === row.studentNim;
      const status = !payment ? ReconciliationStatus.UNMATCHED : payment.amount !== row.externalAmount ? ReconciliationStatus.DIFFERENCE : match ? ReconciliationStatus.MATCHED : ReconciliationStatus.UNMATCHED;
      const duplicate = existingKeys.has(`${row.externalReference}:${row.paymentMethod.toLowerCase()}`);
      return { ...row, internalAmount: payment?.amount ?? null, paymentId: payment?.id ?? null, status: duplicate ? "DUPLICATE" : status, difference: payment ? row.externalAmount - payment.amount : null, error: duplicate ? "Referensi rekonsiliasi sudah pernah diimpor." : null };
    });
    return { rows: result, total: result.length, valid: result.filter((row) => !row.error && !issues.some((issue) => issue.row === row.row)).length, invalid: issues.length + result.filter((row) => row.error).length, issues };
  }

  async confirmReconciliationImport(rows: unknown[]) {
    const preview = await this.validateReconciliationImport(rows);
    if (preview.invalid) throw new UnprocessableEntityException({ message: "Perbaiki data rekonsiliasi yang invalid atau duplikat.", preview });
    return this.prisma.$transaction(async (transaction) => {
      for (const row of preview.rows) {
        const reconciliation = await transaction.reconciliation.create({ data: {
        transactionDate: new Date(`${row.transactionDate}T00:00:00.000Z`),
        externalReference: row.externalReference,
        billingNumber: row.billingNumber,
        studentNim: row.studentNim,
        externalAmount: row.externalAmount,
        internalAmount: row.internalAmount,
        paymentMethod: row.paymentMethod,
        status: row.status as ReconciliationStatus,
        paymentId: row.paymentId
        } });
        await transaction.reconciliationHistory.create({ data: { reconciliationId: reconciliation.id, action: "IMPORT_RECONCILIATION", newValue: this.jsonValue(reconciliation) } });
      }
      return { imported: preview.rows.length, rows: preview.rows };
    });
  }

  private prepareImport(rows: unknown[]) {
    return rows.map((input, index) => {
      const record = input && typeof input === "object" && !Array.isArray(input) ? input as Record<string, unknown> : {};
      const rawAmount = record.amount;
      const amount = typeof rawAmount === "number" ? rawAmount : typeof rawAmount === "string" && rawAmount.trim() ? Number(rawAmount.replace(/[.\s]/g, "")) : Number.NaN;
      const rawSemester = record.semester;
      const semester = typeof rawSemester === "number" ? rawSemester : typeof rawSemester === "string" && rawSemester.trim() ? Number(rawSemester) : Number.NaN;
      const value: ImportRow = {
        nim: String(record.nim ?? "").trim(),
        tariffCode: String(record.tariff_code ?? "").trim(),
        academicYear: String(record.academic_year ?? "").trim(),
        semester,
        billingType: String(record.billing_type ?? "").trim(),
        description: String(record.description ?? "").trim(),
        amount,
        dueDate: String(record.due_date ?? "").trim(),
        note: String(record.note ?? "").trim() || undefined
      };
      const errors: string[] = [];
      return { rowNumber: index + 2, value, errors };
    });
  }

  private validatePeriod(academicYear: string, semester: number) {
    if (!validAcademicYear(academicYear)) throw new BadRequestException("Tahun akademik harus berurutan dengan format YYYY/YYYY.");
    if (!Number.isInteger(semester) || semester < 1 || semester > 14) throw new BadRequestException("Semester harus berupa angka 1 sampai 14.");
  }

  private jsonValue(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value, (_key, item) => item instanceof Date ? item.toISOString() : item)) as Prisma.InputJsonValue;
  }

  private isUniqueConstraint(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
  }
}