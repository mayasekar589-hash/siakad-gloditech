import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AdmissionPeriodStatus, ApplicationStatus, RegistrationType } from "@prisma/client";
import { AdmissionsAdminGuard } from "./admissions-admin.guard";
import { AdmissionsService } from "./admissions.service";
import { ApplicationDataDto, CreateAdmissionPeriodDto, CreateAdmissionProgramDto, CreateApplicationDraftDto, PublishApplicationResultDto, PublicStatusQueryDto, ReviewDocumentDto, ReviewPaymentDto, UpdateReRegistrationDto, UpdateSelectionResultDto } from "./dto/admissions.dto";

class ApplicantFilterQuery {
  @IsOptional() @IsUUID() periodId?: string;
  @IsOptional() @IsEnum(RegistrationType) registrationType?: RegistrationType;
  @IsOptional() @IsEnum(ApplicationStatus) status?: ApplicationStatus;
  @IsOptional() @IsUUID() programId?: string;
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

class PeriodStatusDto {
  @IsEnum(AdmissionPeriodStatus) status!: AdmissionPeriodStatus;
}

class SelectionPeriodQuery {
  @IsOptional() @IsUUID() periodId?: string;
}

interface UploadedAdmissionsFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller("admissions/public")
export class PublicAdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get("periods")
  listOpenPeriods(@Query("registrationType") registrationType?: RegistrationType) {
    return this.admissions.listPublicPeriods(registrationType);
  }

  @Get("periods/:periodId")
  getPeriod(@Param("periodId", ParseUUIDPipe) periodId: string) {
    return this.admissions.getPublicPeriod(periodId);
  }

  @Post("applications/drafts")
  createDraft(@Body() body: CreateApplicationDraftDto) {
    return this.admissions.createDraft(body.registrationType, body.admissionPeriodId);
  }

  @Get("applications/:applicationId")
  getApplication(@Param("applicationId", ParseUUIDPipe) applicationId: string) {
    return this.admissions.getPublicDraft(applicationId);
  }

  @Patch("applications/:applicationId")
  updateDraft(@Param("applicationId", ParseUUIDPipe) applicationId: string, @Body() body: ApplicationDataDto) {
    return this.admissions.updateDraft(applicationId, body);
  }

  @Post("applications/:applicationId/documents")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: Number(process.env.ADMISSION_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024) } }))
  uploadDocument(@Param("applicationId", ParseUUIDPipe) applicationId: string, @Body("documentCode") documentCode: string, @UploadedFile() file?: UploadedAdmissionsFile) {
    if (!file) throw new BadRequestException("File wajib diunggah.");
    return this.admissions.uploadDocument(applicationId, documentCode, file);
  }

  @Post("applications/:applicationId/submit")
  submit(@Param("applicationId", ParseUUIDPipe) applicationId: string, @Body() body: ApplicationDataDto) {
    return this.admissions.submitDraft(applicationId, body);
  }

  @Get("status")
  getPublicStatus(@Query() query: PublicStatusQueryDto) {
    return this.admissions.getPublicApplicationStatus(query.registrationNumber, query.email);
  }
}

@Controller("admissions/admin")
@UseGuards(AdmissionsAdminGuard)
export class AdminAdmissionsController {
  constructor(private readonly admissions: AdmissionsService) {}

  @Get("summary")
  summary() {
    return this.admissions.summary();
  }

  @Get("programs")
  programs() {
    return this.admissions.listAdminPrograms();
  }

  @Post("programs")
  createProgram(@Body() body: CreateAdmissionProgramDto) {
    return this.admissions.createAdminProgram(body);
  }

  @Get("periods")
  periods() {
    return this.admissions.listAdminPeriods();
  }

  @Post("periods")
  createPeriod(@Body() body: CreateAdmissionPeriodDto) {
    return this.admissions.createPeriod(body);
  }

  @Patch("periods/:id")
  updatePeriod(@Param("id", ParseUUIDPipe) id: string, @Body() body: CreateAdmissionPeriodDto) {
    return this.admissions.updatePeriod(id, body);
  }

  @Patch("periods/:id/status")
  setPeriodStatus(@Param("id", ParseUUIDPipe) id: string, @Body() body: PeriodStatusDto) {
    return this.admissions.setPeriodStatus(id, body.status);
  }

  @Get("applicants")
  applicants(@Query() query: ApplicantFilterQuery) {
    return this.admissions.listApplicants(query);
  }

  @Get("applicants/:id")
  applicant(@Param("id", ParseUUIDPipe) id: string) {
    return this.admissions.getApplicantDetail(id);
  }

  @Patch("applicants/:id/final-result")
  finalResult(@Param("id", ParseUUIDPipe) id: string, @Body() body: PublishApplicationResultDto) {
    return this.admissions.publishFinalResult(id, body.status, body.confirm, body.notes);
  }

  @Patch("documents/:id/review")
  reviewDocument(@Param("id", ParseUUIDPipe) id: string, @Body() body: ReviewDocumentDto) {
    return this.admissions.reviewDocument(id, body);
  }

  @Get("documents/:id/file")
  async documentFile(@Param("id", ParseUUIDPipe) id: string) {
    const file = await this.admissions.getDocumentFile(id);
    const safeName = file.fileName.replace(/[\r\n"\\]/g, "_");
    return new StreamableFile(file.body, { type: file.mimeType, disposition: `inline; filename="${safeName}"` });
  }

  @Get("payments")
  payments(@Query("periodId") periodId?: string) {
    return this.admissions.listPayments(periodId);
  }

  @Patch("payments/:id/review")
  reviewPayment(@Param("id", ParseUUIDPipe) id: string, @Body() body: ReviewPaymentDto) {
    return this.admissions.reviewPayment(id, body);
  }

  @Get("selection")
  selection(@Query() query: SelectionPeriodQuery) {
    return this.admissions.listSelection(query.periodId);
  }

  @Patch("selection/:id")
  updateSelection(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateSelectionResultDto) {
    return this.admissions.updateSelectionResult(id, body);
  }

  @Get("re-registrations")
  reRegistrations() {
    return this.admissions.listReRegistrations();
  }

  @Patch("re-registrations/:id")
  updateReRegistration(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateReRegistrationDto) {
    return this.admissions.updateReRegistration(id, body);
  }
}