import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { AdmissionPaymentStatus, AdmissionPeriodStatus, ApplicantDocumentStatus, ApplicationStatus, Prisma, RegistrationType, ReRegistrationStatus, SelectionResultStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ApplicationDataDto, CreateAdmissionPeriodDto, CreateAdmissionProgramDto, ReviewDocumentDto, ReviewPaymentDto, UpdateReRegistrationDto, UpdateSelectionResultDto } from "./dto/admissions.dto";

const jsonValue = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === "object" && !Array.isArray(value));
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const getNestedText = (value: unknown, key: string) => isRecord(value) ? text(value[key]) : "";

@Injectable()
export class AdmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicPeriods(registrationType?: RegistrationType) {
    const now = new Date();
    return this.prisma.admissionPeriod.findMany({
      where: { status: AdmissionPeriodStatus.OPEN, opensAt: { lte: now }, closesAt: { gte: now }, ...(registrationType ? { registrationType } : {}) },
      include: { programs: { include: { program: true } }, requirements: { orderBy: { sortOrder: "asc" } }, documents: { orderBy: { sortOrder: "asc" } }, fees: true, selectionStages: { orderBy: { sortOrder: "asc" } } },
      orderBy: { opensAt: "asc" }
    });
  }

  async getPublicPeriod(id: string) {
    const now = new Date();
    const period = await this.prisma.admissionPeriod.findFirst({
      where: { id, status: AdmissionPeriodStatus.OPEN, opensAt: { lte: now }, closesAt: { gte: now } },
      include: { programs: { include: { program: true } }, requirements: { orderBy: { sortOrder: "asc" } }, documents: { orderBy: { sortOrder: "asc" } }, fees: true, selectionStages: { orderBy: { sortOrder: "asc" } } }
    });
    if (!period) throw new NotFoundException("Periode pendaftaran aktif tidak ditemukan.");
    return period;
  }

  async listAdminPrograms() {
    return this.prisma.admissionProgram.findMany({ include: { studyProgram: true }, orderBy: [{ registrationType: "asc" }, { name: "asc" }] });
  }

  async createAdminProgram(input: CreateAdmissionProgramDto) {
    return this.prisma.admissionProgram.create({ data: { code: input.code.trim(), name: input.name.trim(), registrationType: input.registrationType, studyProgramId: input.studyProgramId ?? null, active: input.active ?? true }, include: { studyProgram: true } });
  }

  async listAdminPeriods() {
    return this.prisma.admissionPeriod.findMany({
      include: { programs: { include: { program: true } }, requirements: { orderBy: { sortOrder: "asc" } }, documents: { orderBy: { sortOrder: "asc" } }, fees: true, selectionStages: { orderBy: { sortOrder: "asc" } }, _count: { select: { applications: true } } },
      orderBy: [{ opensAt: "desc" }, { createdAt: "desc" }]
    });
  }

  async summary() {
    const [periods, statusGroups, documentsToReview, paymentsToReview, selectionPending, reRegistrations] = await Promise.all([
      this.prisma.admissionPeriod.count(),
      this.prisma.application.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.applicantDocument.count({ where: { status: { in: [ApplicantDocumentStatus.BELUM_DIVERIFIKASI, ApplicantDocumentStatus.DIPERIKSA] } } }),
      this.prisma.admissionPayment.count({ where: { status: AdmissionPaymentStatus.MENUNGGU_VERIFIKASI } }),
      this.prisma.selectionResult.count({ where: { status: SelectionResultStatus.PENDING } }),
      this.prisma.reRegistration.count({ where: { status: { notIn: [ReRegistrationStatus.SELESAI, ReRegistrationStatus.DIBATALKAN] } } })
    ]);
    return { periods, applicantsByStatus: Object.fromEntries(statusGroups.map((item) => [item.status, item._count._all])), documentsToReview, paymentsToReview, selectionPending, reRegistrations };
  }

  async createPeriod(input: CreateAdmissionPeriodDto) {
    if (new Date(input.closesAt) <= new Date(input.opensAt)) throw new UnprocessableEntityException("Tanggal selesai harus sesudah tanggal mulai.");
    const programs = input.programs ?? [];
    const ids = [...new Set(programs.map((item) => item.admissionProgramId))];
    const matchingPrograms = ids.length ? await this.prisma.admissionProgram.findMany({ where: { id: { in: ids }, active: true, registrationType: input.registrationType }, select: { id: true } }) : [];
    if (matchingPrograms.length !== ids.length) throw new UnprocessableEntityException("Program harus aktif dan memiliki jenis pendaftaran yang sama dengan periode.");
    return this.prisma.admissionPeriod.create({
      data: {
        code: input.code.trim(), name: input.name.trim(), academicYear: input.academicYear.trim(), registrationType: input.registrationType,
        description: input.description?.trim(), status: input.status ?? AdmissionPeriodStatus.DRAFT, opensAt: new Date(input.opensAt), closesAt: new Date(input.closesAt), quota: input.quota ?? null,
        studentNumberPrefix: input.studentNumberPrefix?.trim() || null, studentNumberNext: input.studentNumberNext ?? null, studentNumberWidth: input.studentNumberWidth ?? 6,
        registrationSettings: input.registrationSettings ? jsonValue(input.registrationSettings) : Prisma.JsonNull,
        programs: { create: programs.map((item) => ({ admissionProgramId: item.admissionProgramId, quota: item.quota ?? null })) },
        requirements: { create: (input.requirements ?? []).map((item, index) => ({ title: item.title.trim(), description: item.description.trim(), required: item.required ?? true, sortOrder: item.sortOrder ?? index })) },
        documents: { create: (input.documents ?? []).map((item, index) => ({ documentCode: item.documentCode.trim(), label: item.label.trim(), required: item.required ?? true, acceptedMimeTypes: item.acceptedMimeTypes, maxSizeBytes: item.maxSizeBytes ?? null, description: item.description?.trim(), sortOrder: item.sortOrder ?? index })) },
        fees: { create: (input.fees ?? []).map((item) => ({ code: item.code.trim(), name: item.name.trim(), amount: item.amount ?? null, currency: item.currency ?? "IDR", required: item.required ?? true, expiresAt: item.expiresAt ? new Date(item.expiresAt) : null })) },
        selectionStages: { create: (input.selectionStages ?? []).map((item) => ({ code: item.code.trim(), name: item.name.trim(), sortOrder: item.sortOrder, scoringModel: item.scoringModel, maximumScore: item.maximumScore ?? null, required: item.required ?? true })) }
      },
      include: { programs: { include: { program: true } }, requirements: true, documents: true, fees: true, selectionStages: true }
    });
  }

  async updatePeriod(id: string, input: CreateAdmissionPeriodDto) {
    const existing = await this.prisma.admissionPeriod.findUnique({ where: { id }, include: { _count: { select: { applications: true } } } });
    if (!existing) throw new NotFoundException("Periode pendaftaran tidak ditemukan.");
    if (existing._count.applications > 0 && (input.programs || input.documents || input.fees || input.selectionStages || input.requirements)) {
      throw new ConflictException("Konfigurasi relasi periode tidak dapat diganti setelah pendaftar dibuat. Perubahan memerlukan workflow revisi periode.");
    }
    if (input.opensAt && input.closesAt && new Date(input.closesAt) <= new Date(input.opensAt)) throw new UnprocessableEntityException("Tanggal selesai harus sesudah tanggal mulai.");
    const scalarData: Prisma.AdmissionPeriodUpdateInput = {
      ...(input.code ? { code: input.code.trim() } : {}), ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.academicYear ? { academicYear: input.academicYear.trim() } : {}), ...(input.registrationType ? { registrationType: input.registrationType } : {}),
      ...(input.description !== undefined ? { description: input.description.trim() } : {}), ...(input.status ? { status: input.status } : {}),
      ...(input.opensAt ? { opensAt: new Date(input.opensAt) } : {}), ...(input.closesAt ? { closesAt: new Date(input.closesAt) } : {}),
      ...(input.quota !== undefined ? { quota: input.quota } : {}),
      ...(input.studentNumberPrefix !== undefined ? { studentNumberPrefix: input.studentNumberPrefix.trim() || null } : {}),
      ...(input.studentNumberNext !== undefined ? { studentNumberNext: input.studentNumberNext } : {}),
      ...(input.studentNumberWidth !== undefined ? { studentNumberWidth: input.studentNumberWidth } : {}),
      ...(input.registrationSettings ? { registrationSettings: jsonValue(input.registrationSettings) } : {})
    };
    if (existing.status === AdmissionPeriodStatus.OPEN && input.status && input.status !== AdmissionPeriodStatus.OPEN) {
      const openApplications = await this.prisma.application.count({ where: { admissionPeriodId: id, status: { notIn: [ApplicationStatus.REGISTERED, ApplicationStatus.CANCELLED] } } });
      if (openApplications > 0 && input.status === AdmissionPeriodStatus.ARCHIVED) throw new ConflictException("Periode dengan pendaftar yang masih diproses tidak dapat diarsipkan.");
    }
    return this.prisma.admissionPeriod.update({ where: { id }, data: scalarData, include: { programs: { include: { program: true } }, requirements: true, documents: true, fees: true, selectionStages: true } });
  }

  async setPeriodStatus(id: string, status: AdmissionPeriodStatus) {
    const period = await this.prisma.admissionPeriod.findUnique({ where: { id }, include: { _count: { select: { programs: true } } } });
    if (!period) throw new NotFoundException("Periode pendaftaran tidak ditemukan.");
    if (status === AdmissionPeriodStatus.OPEN) {
      const now = new Date();
      if (period.closesAt <= now) throw new UnprocessableEntityException("Tanggal penutupan periode sudah lewat.");
      if (period.registrationSettings === null) throw new UnprocessableEntityException("Konfigurasi pendaftaran periode belum dilengkapi.");
      if (period._count.programs === 0) throw new UnprocessableEntityException("Tambahkan minimal satu program sebelum membuka periode.");
    }
    return this.prisma.admissionPeriod.update({ where: { id }, data: { status } });
  }

  async createDraft(registrationType: RegistrationType, admissionPeriodId: string) {
    const period = await this.getPublicPeriod(admissionPeriodId);
    if (period.registrationType !== registrationType) throw new UnprocessableEntityException("Jenis pendaftaran tidak sesuai dengan periode.");
    const registrationNumber = `REG-${period.academicYear.slice(0, 4)}-${randomBytes(4).toString("hex").toUpperCase()}`;
    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const applicant = await transaction.applicant.create({ data: {} });
      const application = await transaction.application.create({ data: { registrationNumber, applicantId: applicant.id, admissionPeriodId: period.id, registrationType, status: ApplicationStatus.DRAFT } });
      await transaction.applicationStatusHistory.create({ data: { applicationId: application.id, action: "CREATED", newStatus: ApplicationStatus.DRAFT, notes: "Draft dibuat melalui formulir publik." } });
      return { id: application.id, registrationNumber, createdAt: now.toISOString() };
    });
  }

  async getPublicDraft(applicationId: string) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId }, include: { applicant: true, admissionPeriod: { select: { name: true, status: true } }, documents: { orderBy: { uploadedAt: "desc" } }, payments: { include: { fee: true } } } });
    if (!application) throw new NotFoundException("Draft pendaftaran tidak ditemukan.");
    const data = (value: Prisma.JsonValue | null) => isRecord(value) ? value : {};
    return {
      id: application.id,
      registrationNumber: application.registrationNumber,
      registrationType: application.registrationType,
      admissionPeriodId: application.admissionPeriodId,
      period: application.admissionPeriod,
      status: application.status,
      personalData: data(application.personalData),
      parentData: data(application.parentData),
      educationData: data(application.educationData),
      physicalData: data(application.physicalData),
      professionalData: data(application.professionalData),
      programData: data(application.programData),
      documents: application.documents.map((item) => ({ id: item.id, configId: item.documentCode, label: item.label, fileName: item.fileName, mimeType: item.mimeType, sizeBytes: item.sizeBytes, uploadedAt: item.uploadedAt })),
      payment: application.payments[0] ? { method: application.payments[0].method ?? "", referenceNumber: application.payments[0].referenceNumber ?? "", status: application.payments[0].status } : {}
    };
  }

  async updateDraft(applicationId: string, input: ApplicationDataDto) {
    const application = await this.getDraft(applicationId);
    const personal = input.personal;
    const nationalId = getNestedText(personal, "nik");
    const fullName = getNestedText(personal, "fullName");
    const email = getNestedText(personal, "email");
    const phone = getNestedText(personal, "phone");
    const programId = getNestedText(input.education, "selectedProgramId") || getNestedText(input.program, "selectedProgramId");
    const admissionProgram = programId ? await this.resolvePeriodProgram(application.admissionPeriodId, programId) : null;
    const updateData: Prisma.ApplicationUpdateInput = {
      ...(input.personal ? { personalData: jsonValue(input.personal) } : {}),
      ...(input.parent ? { parentData: jsonValue(input.parent) } : {}),
      ...(input.education ? { educationData: jsonValue(input.education) } : {}),
      ...(input.physical ? { physicalData: jsonValue(input.physical) } : {}),
      ...(input.professional ? { professionalData: jsonValue(input.professional) } : {}),
      ...(input.program ? { programData: jsonValue(input.program) } : {}),
      ...(admissionProgram ? { admissionProgram: { connect: { id: admissionProgram.id } } } : {})
    };
    return this.prisma.$transaction(async (transaction) => {
      let applicantId = application.applicantId;
      if (nationalId) {
        const existingApplicant = await transaction.applicant.findUnique({ where: { nationalId } });
        if (existingApplicant && existingApplicant.id !== applicantId) {
          const placeholderId = applicantId;
          applicantId = existingApplicant.id;
          await transaction.applicant.update({ where: { id: applicantId }, data: { fullName: fullName || existingApplicant.fullName, email: email || existingApplicant.email, phone: phone || existingApplicant.phone } });
          await transaction.application.update({ where: { id: applicationId }, data: { applicantId } });
          const remaining = await transaction.application.count({ where: { applicantId: placeholderId } });
          if (remaining === 0) await transaction.applicant.delete({ where: { id: placeholderId } });
        } else {
          await transaction.applicant.update({ where: { id: applicantId }, data: { nationalId, fullName: fullName || undefined, email: email || undefined, phone: phone || undefined } });
        }
      } else if (fullName || email || phone) {
        await transaction.applicant.update({ where: { id: applicantId }, data: { fullName: fullName || undefined, email: email || undefined, phone: phone || undefined } });
      }
      return transaction.application.update({ where: { id: applicationId }, data: updateData });
    });
  }

  async uploadDocument(applicationId: string, documentCode: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId }, include: { admissionPeriod: { include: { documents: true, fees: true } } } });
    if (!application || !application.admissionPeriod) throw new NotFoundException("Draft pendaftaran tidak ditemukan.");
    const uploadStatuses: ApplicationStatus[] = [ApplicationStatus.DRAFT, ApplicationStatus.DOCUMENT_REVISION, ApplicationStatus.PAYMENT_PENDING];
    if (!uploadStatuses.includes(application.status)) throw new ConflictException("Dokumen tidak dapat diubah pada status pendaftaran saat ini.");
    const isPaymentProof = documentCode === "payment-proof";
    const requirement = application.admissionPeriod.documents.find((item) => item.documentCode === documentCode);
    if (!requirement && !(isPaymentProof && application.admissionPeriod.fees.length > 0)) throw new UnprocessableEntityException("Jenis dokumen tidak termasuk konfigurasi periode ini.");
    const allowedTypes = isPaymentProof ? ["application/pdf", "image/jpeg", "image/png"] : requirement?.acceptedMimeTypes ?? [];
    const maxSizeBytes = requirement?.maxSizeBytes ?? Number(process.env.ADMISSION_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
    if (!allowedTypes.includes(file.mimetype)) throw new UnprocessableEntityException("Format file tidak sesuai persyaratan dokumen.");
    if (file.size < 1 || file.size > maxSizeBytes) throw new UnprocessableEntityException("Ukuran file kosong atau melebihi batas konfigurasi.");
    if (!this.matchesFileSignature(file.mimetype, file.buffer)) throw new UnprocessableEntityException("Isi file tidak sesuai dengan tipe file.");
    const label = isPaymentProof ? "Bukti pembayaran" : requirement?.label ?? documentCode;
    const document = await this.prisma.applicantDocument.create({ data: {
      applicationId, documentCode, label, fileName: file.originalname.slice(0, 255), mimeType: file.mimetype, sizeBytes: file.size,
      fileContent: new Uint8Array(file.buffer), status: ApplicantDocumentStatus.BELUM_DIVERIFIKASI
    } });
    if (application.status === ApplicationStatus.DOCUMENT_REVISION) await this.setApplicationStatus(application.id, ApplicationStatus.DOCUMENT_VERIFICATION, "DOCUMENT_REPLACED", `Pengganti dokumen ${label} diunggah.`);
    return { id: document.id, configId: document.documentCode, fileName: document.fileName, label: document.label, mimeType: document.mimeType, sizeBytes: document.sizeBytes, uploadedAt: document.uploadedAt.toISOString() };
  }

  async submitDraft(applicationId: string, input: ApplicationDataDto) {
    await this.updateDraft(applicationId, input);
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        applicant: true,
        admissionPeriod: { include: { programs: true, documents: true, fees: true, selectionStages: { orderBy: { sortOrder: "asc" } } } },
        documents: { orderBy: { uploadedAt: "desc" } }
      }
    });
    if (!application || !application.admissionPeriod) throw new NotFoundException("Draft pendaftaran tidak ditemukan.");
    const period = application.admissionPeriod;
    await this.getPublicPeriod(application.admissionPeriodId!);
    if (application.applicant.nationalId?.length !== 16 || !application.applicant.fullName || !application.applicant.email || !application.applicant.phone) throw new UnprocessableEntityException("Data NIK, nama, email, dan nomor HP wajib lengkap.");
    const requiredDocuments = application.admissionPeriod.documents.filter((item) => item.required);
    const latestByCode = new Map<string, (typeof application.documents)[number]>();
    for (const document of application.documents) if (!latestByCode.has(document.documentCode)) latestByCode.set(document.documentCode, document);
    const missing = requiredDocuments.filter((item) => !latestByCode.has(item.documentCode));
    if (missing.length) throw new UnprocessableEntityException(`Dokumen wajib belum diunggah: ${missing.map((item) => item.label).join(", ")}.`);
    const selectedProgramId = application.admissionProgramId;
    if (application.admissionPeriod.programs.length && (!selectedProgramId || !application.admissionPeriod.programs.some((item) => item.admissionProgramId === selectedProgramId))) throw new UnprocessableEntityException("Program pilihan tidak termasuk periode ini.");
    const applicationStatus = ApplicationStatus.DOCUMENT_VERIFICATION;
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.application.update({ where: { id: applicationId }, data: { status: applicationStatus, submittedAt: new Date() } });
      await transaction.applicationStatusHistory.create({ data: { applicationId, action: "SUBMITTED", oldStatus: application.status, newStatus: applicationStatus, notes: "Pendaftaran diterima untuk verifikasi." } });
      for (const stage of period.selectionStages) await transaction.selectionResult.upsert({ where: { applicationId_selectionStageId: { applicationId, selectionStageId: stage.id } }, create: { applicationId, selectionStageId: stage.id }, update: {} });
      const proof = latestByCode.get("payment-proof");
      for (const fee of period.fees.filter((item) => item.required)) {
        await transaction.admissionPayment.upsert({ where: { applicationId_feeId: { applicationId, feeId: fee.id } }, create: { applicationId, feeId: fee.id, amount: fee.amount ?? 0, status: proof ? AdmissionPaymentStatus.MENUNGGU_VERIFIKASI : AdmissionPaymentStatus.BELUM_BAYAR, proofDocumentId: proof?.id }, update: {} });
      }
      return { ...updated, registrationNumber: application.registrationNumber };
    });
  }

  async getPublicApplicationStatus(registrationNumber: string, email: string) {
    const application = await this.prisma.application.findFirst({ where: { registrationNumber, applicant: { email: { equals: email, mode: "insensitive" } } }, include: {
      admissionPeriod: { select: { name: true } }, admissionProgram: { select: { name: true } }, documents: { orderBy: { uploadedAt: "desc" } },
      payments: { include: { fee: { select: { name: true, amount: true } } } }, selectionResults: { include: { selectionStage: { select: { name: true, sortOrder: true } } } }
    } });
    if (!application) throw new NotFoundException("Pendaftaran tidak ditemukan. Periksa nomor pendaftaran dan email.");
    const finalResult = application.status === ApplicationStatus.PASSED_SELECTION || application.status === ApplicationStatus.RE_REGISTRATION || application.status === ApplicationStatus.REGISTERED
      ? "LULUS"
      : application.status === ApplicationStatus.FAILED_SELECTION
        ? "TIDAK_LULUS"
        : null;
    return {
      registrationNumber: application.registrationNumber, registrationType: application.registrationType, status: application.status,
      finalResult, periodName: application.admissionPeriod?.name, programName: application.admissionProgram?.name,
      documents: application.documents.map((item) => ({ id: item.id, documentCode: item.documentCode, label: item.label, status: item.status, rejectionReason: item.status === ApplicantDocumentStatus.PERLU_PERBAIKAN || item.status === ApplicantDocumentStatus.DITOLAK ? item.rejectionReason : null, uploadedAt: item.uploadedAt })),
      payments: application.payments.map((item) => ({ feeName: item.fee.name, amount: item.amount, status: item.status, rejectionReason: item.status === AdmissionPaymentStatus.DITOLAK ? item.rejectionReason : null })),
      selection: application.selectionResults.sort((left, right) => left.selectionStage.sortOrder - right.selectionStage.sortOrder).map((item) => ({ stage: item.selectionStage.name, status: item.status, scheduledAt: item.scheduledAt }))
    };
  }

  async listApplicants(filters: { periodId?: string; registrationType?: RegistrationType; status?: ApplicationStatus; query?: string; programId?: string; from?: string; to?: string }) {
    const search = filters.query?.trim();
    return this.prisma.application.findMany({
      where: {
        ...(filters.periodId ? { admissionPeriodId: filters.periodId } : {}), ...(filters.registrationType ? { registrationType: filters.registrationType } : {}),
        ...(filters.status ? { status: filters.status } : {}), ...(filters.programId ? { admissionProgramId: filters.programId } : {}),
        ...(filters.from || filters.to ? { createdAt: { ...(filters.from ? { gte: new Date(filters.from) } : {}), ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}) } } : {}),
        ...(search ? { OR: [ { registrationNumber: { contains: search, mode: "insensitive" } }, { applicant: { nationalId: { contains: search } } }, { applicant: { fullName: { contains: search, mode: "insensitive" } } }, { applicant: { email: { contains: search, mode: "insensitive" } } }, { applicant: { phone: { contains: search } } } ] } : {})
      },
      include: {
        applicant: true,
        admissionPeriod: { include: { documents: { where: { required: true }, select: { documentCode: true } }, fees: { where: { required: true }, select: { id: true } }, selectionStages: { orderBy: { sortOrder: "asc" } } } },
        admissionProgram: { select: { id: true, name: true } },
        documents: { select: { documentCode: true, status: true } },
        payments: { select: { feeId: true, status: true } },
        selectionResults: { select: { selectionStageId: true, status: true } },
        _count: { select: { documents: true, payments: true } }
      },
      orderBy: { createdAt: "desc" }, take: 500
    });
  }

  async getApplicantDetail(applicationId: string) {
    const application = await this.prisma.application.findUnique({ where: { id: applicationId }, include: {
      applicant: true, admissionPeriod: { include: { programs: { include: { program: true } }, requirements: true, documents: true, fees: true, selectionStages: { orderBy: { sortOrder: "asc" } } } },
      admissionProgram: true, documents: { orderBy: { uploadedAt: "desc" } }, payments: { include: { fee: true, proofDocument: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploadedAt: true, status: true } } } },
      selectionResults: { include: { selectionStage: true } }, statusHistory: { include: { actor: { select: { email: true } } }, orderBy: { createdAt: "desc" } }, reRegistration: true
    } });
    if (!application) throw new NotFoundException("Pendaftar tidak ditemukan.");
    return application;
  }

  async listPayments(periodId?: string) {
    return this.prisma.admissionPayment.findMany({
      where: periodId ? { application: { admissionPeriodId: periodId } } : {},
      include: { fee: true, application: { include: { applicant: true, admissionPeriod: true, admissionProgram: true }, }, proofDocument: { select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploadedAt: true, status: true } } },
      orderBy: [{ status: "asc" }, { paidAt: "desc" }], take: 500
    });
  }

  async reviewDocument(documentId: string, input: ReviewDocumentDto, actorUserId?: string) {
    const reasonStatuses: ApplicantDocumentStatus[] = [ApplicantDocumentStatus.PERLU_PERBAIKAN, ApplicantDocumentStatus.DITOLAK];
    if (reasonStatuses.includes(input.status) && !input.reason?.trim()) throw new UnprocessableEntityException("Alasan perbaikan atau penolakan wajib diisi.");
    const document = await this.prisma.applicantDocument.findUnique({ where: { id: documentId }, include: { application: true } });
    if (!document) throw new NotFoundException("Dokumen pendaftar tidak ditemukan.");
    const now = new Date();
    const nextApplicationStatus = input.status === ApplicantDocumentStatus.PERLU_PERBAIKAN || input.status === ApplicantDocumentStatus.DITOLAK ? ApplicationStatus.DOCUMENT_REVISION : null;
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.applicantDocument.update({ where: { id: documentId }, data: { status: input.status, rejectionReason: input.reason?.trim() ?? null, reviewedAt: now } });
      if (nextApplicationStatus) await this.recordStatus(transaction, document.applicationId, document.application.status, nextApplicationStatus, "DOCUMENT_REVIEW", input.reason, actorUserId);
      else if (input.status === ApplicantDocumentStatus.TERVERIFIKASI) {
        await this.advanceAfterDocuments(transaction, document.applicationId, actorUserId);
      }
      return updated;
    });
  }

  async getDocumentFile(documentId: string) {
    const document = await this.prisma.applicantDocument.findUnique({ where: { id: documentId }, select: { fileName: true, mimeType: true, fileContent: true } });
    if (!document) throw new NotFoundException("File dokumen tidak ditemukan.");
    return { ...document, fileName: document.fileName, body: Buffer.from(document.fileContent) };
  }

  async reviewPayment(paymentId: string, input: ReviewPaymentDto, actorUserId?: string) {
    if (input.status === AdmissionPaymentStatus.DITOLAK && !input.reason?.trim()) throw new UnprocessableEntityException("Alasan penolakan pembayaran wajib diisi.");
    const payment = await this.prisma.admissionPayment.findUnique({ where: { id: paymentId }, include: { application: true } });
    if (!payment) throw new NotFoundException("Pembayaran pendaftar tidak ditemukan.");
    if (input.status === AdmissionPaymentStatus.LUNAS && !payment.proofDocumentId) throw new UnprocessableEntityException("Pembayaran tidak dapat diverifikasi lunas tanpa bukti pembayaran.");
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.admissionPayment.update({ where: { id: paymentId }, data: { status: input.status, rejectionReason: input.reason?.trim() ?? null, reviewedAt: new Date(), ...(input.status === AdmissionPaymentStatus.LUNAS ? { paidAt: payment.paidAt ?? new Date() } : {}) } });
      if (input.status === AdmissionPaymentStatus.DITOLAK) await this.recordStatus(transaction, payment.applicationId, payment.application.status, ApplicationStatus.PAYMENT_PENDING, "PAYMENT_REJECTED", input.reason, actorUserId);
      if (input.status === AdmissionPaymentStatus.LUNAS) await this.advanceAfterPayments(transaction, payment.applicationId, actorUserId);
      return updated;
    });
  }

  async listSelection(periodId?: string) {
    return this.prisma.selectionResult.findMany({ where: periodId ? { selectionStage: { admissionPeriodId: periodId } } : {}, include: { application: { include: { applicant: true, admissionProgram: true, admissionPeriod: true } }, selectionStage: true }, orderBy: [{ selectionStage: { sortOrder: "asc" } }, { scheduledAt: "asc" }] });
  }

  async updateSelectionResult(resultId: string, input: UpdateSelectionResultDto, actorUserId?: string) {
    const result = await this.prisma.selectionResult.findUnique({ where: { id: resultId }, include: { selectionStage: true, application: true } });
    if (!result) throw new NotFoundException("Peserta seleksi tidak ditemukan.");
    if (result.selectionStage.scoringModel === "PASS_FAIL" && input.score !== undefined) throw new UnprocessableEntityException("Tahap ini hanya mendukung lulus/gagal, bukan nilai angka.");
    if (result.selectionStage.scoringModel !== "PASS_FAIL" && input.score === undefined && input.status !== SelectionResultStatus.SCHEDULED && input.status !== SelectionResultStatus.PENDING) throw new UnprocessableEntityException("Nilai wajib diisi untuk tahap seleksi ini.");
    if (input.score !== undefined && result.selectionStage.maximumScore !== null && input.score > Number(result.selectionStage.maximumScore)) throw new UnprocessableEntityException("Nilai melampaui nilai maksimum tahap.");
    const completedStatuses: SelectionResultStatus[] = [SelectionResultStatus.PASSED, SelectionResultStatus.FAILED, SelectionResultStatus.ABSENT];
    const updated = await this.prisma.selectionResult.update({ where: { id: resultId }, data: { status: input.status, score: input.score ?? null, grade: input.grade?.trim() || null, notes: input.notes?.trim() || null, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined, completedAt: completedStatuses.includes(input.status) ? new Date() : null } });
    const selectionStartedStatuses: SelectionResultStatus[] = [SelectionResultStatus.SCHEDULED, SelectionResultStatus.PRESENT, SelectionResultStatus.PASSED, SelectionResultStatus.FAILED, SelectionResultStatus.ABSENT];
    if (selectionStartedStatuses.includes(input.status) && result.application.status === ApplicationStatus.READY_FOR_SELECTION) await this.setApplicationStatus(result.applicationId, ApplicationStatus.IN_SELECTION, "SELECTION_STARTED", `Tahap ${result.selectionStage.name} dimulai.`, actorUserId);
    return updated;
  }

  async publishFinalResult(applicationId: string, status: Extract<ApplicationStatus, "PASSED_SELECTION" | "FAILED_SELECTION">, confirm: boolean, notes?: string, actorUserId?: string) {
    if (!confirm) throw new UnprocessableEntityException("Konfirmasi perubahan hasil akhir wajib dilakukan.");
    const application = await this.prisma.application.findUnique({ where: { id: applicationId }, include: { admissionPeriod: { include: { selectionStages: true, documents: true, fees: true } }, documents: true, payments: { include: { fee: true } }, selectionResults: { include: { selectionStage: true } } } });
    if (!application?.admissionPeriod) throw new NotFoundException("Pendaftar atau periode tidak ditemukan.");
    if (status === ApplicationStatus.PASSED_SELECTION) {
      const requiredStages = application.admissionPeriod.selectionStages.filter((stage) => stage.required);
      const allStagesPassed = requiredStages.every((stage) => application.selectionResults.some((result) => result.selectionStageId === stage.id && result.status === SelectionResultStatus.PASSED));
      const requiredDocuments = application.admissionPeriod.documents.filter((item) => item.required);
      const documentsVerified = requiredDocuments.every((item) => application.documents.filter((doc) => doc.documentCode === item.documentCode).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0]?.status === ApplicantDocumentStatus.TERVERIFIKASI);
      const requiredFees = application.admissionPeriod.fees.filter((fee) => fee.required);
      const paymentsVerified = requiredFees.every((fee) => application.payments.some((payment) => payment.feeId === fee.id && payment.status === AdmissionPaymentStatus.LUNAS));
      if (!allStagesPassed || !documentsVerified || !paymentsVerified) throw new UnprocessableEntityException("Dokumen, pembayaran, atau tahapan seleksi wajib belum lengkap.");
    }
    const nextStatus = status === ApplicationStatus.PASSED_SELECTION ? ApplicationStatus.RE_REGISTRATION : ApplicationStatus.FAILED_SELECTION;
    return this.prisma.$transaction(async (transaction) => {
      const updated = await this.recordStatus(transaction, applicationId, application.status, nextStatus, "FINAL_RESULT", notes, actorUserId);
      if (nextStatus === ApplicationStatus.RE_REGISTRATION) await transaction.reRegistration.upsert({ where: { applicationId }, create: { applicationId }, update: {} });
      return updated;
    });
  }

  async listReRegistrations() {
    return this.prisma.reRegistration.findMany({ include: { application: { include: { applicant: true, admissionPeriod: true, admissionProgram: true } }, student: true }, orderBy: { application: { createdAt: "desc" } } });
  }

  async updateReRegistration(id: string, input: UpdateReRegistrationDto, actorUserId?: string) {
    const record = await this.prisma.reRegistration.findUnique({ where: { id }, include: { application: { include: { applicant: true, admissionPeriod: true, admissionProgram: { include: { studyProgram: true } } } } } });
    if (!record) throw new NotFoundException("Registrasi ulang tidak ditemukan.");
    if (input.status === ReRegistrationStatus.SELESAI) {
      const requiredChecklist = ["personal", "documents", "payment", "administration", "confirmation"];
      if (!requiredChecklist.every((key) => input.checklist[key] === true)) throw new UnprocessableEntityException("Seluruh checklist wajib harus selesai sebelum registrasi ulang ditutup.");
      if (record.application.registrationType === RegistrationType.DIKLAT) {
        return this.prisma.$transaction(async (transaction) => {
          const updated = await transaction.reRegistration.update({ where: { id }, data: { status: ReRegistrationStatus.SELESAI, checklist: jsonValue(input.checklist), completedAt: new Date() } });
          await this.recordStatus(transaction, record.applicationId, record.application.status, ApplicationStatus.REGISTERED, "DIKLAT_COMPLETED", "Program Diklat selesai; tidak dibuat Student/Taruna.", actorUserId);
          return updated;
        });
      }
      const period = record.application.admissionPeriod;
      const prefix = text(period?.studentNumberPrefix);
      const startNumber = Number(period?.studentNumberNext);
      const width = Number(period?.studentNumberWidth ?? 6);
      if (!period || !prefix || !Number.isInteger(startNumber) || startNumber < 1 || !Number.isInteger(width) || width < 1 || width > 12) throw new UnprocessableEntityException("Aturan generator NIM belum dikonfigurasi pada periode. Mahasiswa tidak dibuat.");
      if (!record.application.admissionProgram?.studyProgramId) throw new UnprocessableEntityException("Program pendaftar belum dipetakan ke Program Studi akademik.");
      const studyProgramId = record.application.admissionProgram.studyProgramId;
      const existingStudent = await this.prisma.student.findUnique({ where: { applicantId: record.application.applicantId } });
      if (existingStudent) throw new ConflictException("Applicant sudah memiliki record Student.");
      const personal = isRecord(record.application.personalData) ? record.application.personalData : {};
      const cohort = Number(record.application.admissionPeriod?.academicYear.slice(0, 4));
      return this.prisma.$transaction(async (transaction) => {
        const counter = await transaction.admissionPeriod.update({ where: { id: period.id }, data: { studentNumberNext: { increment: 1 } }, select: { studentNumberNext: true } });
        const number = `${prefix}${String((counter.studentNumberNext ?? startNumber + 1) - 1).padStart(width, "0")}`;
        const updatedReRegistration = await transaction.reRegistration.update({ where: { id }, data: { status: ReRegistrationStatus.SELESAI, checklist: jsonValue(input.checklist), completedAt: new Date() } });
        const student = await transaction.student.create({ data: {
          applicantId: record.application.applicantId, sourceApplicationId: record.applicationId, studentNumber: number,
          name: record.application.applicant.fullName, nationalId: record.application.applicant.nationalId,
          email: record.application.applicant.email, phone: record.application.applicant.phone,
          birthPlace: text(personal.birthPlace) || null, birthDate: text(personal.birthDate) ? new Date(`${text(personal.birthDate)}T00:00:00Z`) : null,
          gender: text(personal.gender) || null, religion: text(personal.religion) || null, address: text(personal.address) || null,
          province: text(personal.province) || null, regency: text(personal.city) || null, district: text(personal.district) || null,
          village: text(personal.village) || null, postalCode: text(personal.postalCode) || null,
          studyProgramId, cohort: Number.isFinite(cohort) ? cohort : null,
          academicStatus: "AKTIF"
        } });
        await transaction.reRegistration.update({ where: { id }, data: { studentId: student.id } });
        await this.recordStatus(transaction, record.applicationId, record.application.status, ApplicationStatus.REGISTERED, "STUDENT_CONVERTED", `Applicant dikonversi ke Student ${number}.`, actorUserId);
        return { reRegistration: updatedReRegistration, student };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    }
    return this.prisma.reRegistration.update({ where: { id }, data: { status: input.status, checklist: jsonValue(input.checklist) } });
  }

  private async getDraft(id: string) {
    const application = await this.prisma.application.findUnique({ where: { id } });
    if (!application) throw new NotFoundException("Draft pendaftaran tidak ditemukan.");
    if (application.status !== ApplicationStatus.DRAFT) throw new ConflictException("Pendaftaran ini tidak lagi berada dalam status draft.");
    return application;
  }

  private async resolvePeriodProgram(periodId: string | null, code: string) {
    if (!periodId) throw new UnprocessableEntityException("Periode pendaftaran tidak tersedia.");
    const program = await this.prisma.admissionPeriodProgram.findFirst({ where: { admissionPeriodId: periodId, program: { code } }, include: { program: true } });
    if (!program) throw new UnprocessableEntityException("Program pilihan tidak tersedia pada periode pendaftaran.");
    return program.program;
  }

  private matchesFileSignature(mime: string, bytes: Buffer) {
    if (mime === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    if (mime === "image/png") return Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).equals(bytes.subarray(0, 8));
    if (mime === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    return false;
  }

  private async advanceAfterDocuments(transaction: Prisma.TransactionClient, applicationId: string, actorUserId?: string) {
    const app = await transaction.application.findUnique({ where: { id: applicationId }, include: { admissionPeriod: { include: { documents: true, fees: true } }, documents: true, payments: true } });
    if (!app?.admissionPeriod) return;
    const allVerified = app.admissionPeriod.documents.filter((item) => item.required).every((requirement) => app.documents.filter((document) => document.documentCode === requirement.documentCode).sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())[0]?.status === ApplicantDocumentStatus.TERVERIFIKASI);
    if (!allVerified) return;
    const requiredFees = app.admissionPeriod.fees.filter((fee) => fee.required);
    const paymentsReady = requiredFees.length > 0;
    const next = paymentsReady ? ApplicationStatus.PAYMENT_PENDING : ApplicationStatus.READY_FOR_SELECTION;
    await this.recordStatus(transaction, applicationId, app.status, next, "DOCUMENTS_VERIFIED", "Dokumen wajib telah diverifikasi.", actorUserId);
  }

  private async advanceAfterPayments(transaction: Prisma.TransactionClient, applicationId: string, actorUserId?: string) {
    const app = await transaction.application.findUnique({ where: { id: applicationId }, include: { admissionPeriod: { include: { fees: true } }, payments: true } });
    if (!app?.admissionPeriod) return;
    const requiredFees = app.admissionPeriod.fees.filter((fee) => fee.required);
    const paid = requiredFees.every((fee) => app.payments.some((payment) => payment.feeId === fee.id && payment.status === AdmissionPaymentStatus.LUNAS));
    if (paid) await this.recordStatus(transaction, applicationId, app.status, ApplicationStatus.READY_FOR_SELECTION, "PAYMENTS_VERIFIED", "Seluruh biaya wajib telah lunas.", actorUserId);
  }

  private async setApplicationStatus(applicationId: string, status: ApplicationStatus, action: string, notes?: string, actorUserId?: string) {
    return this.prisma.$transaction((transaction) => this.recordStatus(transaction, applicationId, undefined, status, action, notes, actorUserId));
  }

  private async recordStatus(transaction: Prisma.TransactionClient, applicationId: string, knownOldStatus: ApplicationStatus | undefined, newStatus: ApplicationStatus, action: string, notes?: string, actorUserId?: string) {
    const oldStatus = knownOldStatus ?? (await transaction.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true } })).status;
    const updated = await transaction.application.update({ where: { id: applicationId }, data: { status: newStatus } });
    await transaction.applicationStatusHistory.create({ data: { applicationId, actorUserId: actorUserId ?? null, action, oldStatus, newStatus, notes: notes?.trim() || null } });
    return updated;
  }
}
