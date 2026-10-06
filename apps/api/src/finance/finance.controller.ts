import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { BillingStatus, ReconciliationStatus, ScholarshipStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";
import { AdmissionsAdminGuard } from "../admissions/admissions-admin.guard";
import { BillingImportDto, CancelBillingDto, CreateBillingDto, UpdateBillingDto } from "./dto/billing.dto";
import { CreateScholarshipDto, CreateTariffDto, MasterDataImportDto, ReconciliationImportDto, ReviewScholarshipDto } from "./dto/master-data.dto";
import { FinanceService } from "./finance.service";

class BillingListQuery {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() academicYear?: string;
  @IsOptional() @IsUUID() studyProgramId?: string;
  @IsOptional() @IsString() billingType?: string;
  @IsOptional() @IsEnum(BillingStatus) status?: BillingStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @Min(1) @Max(1000000) page?: number;
  @IsOptional() @Type(() => Number) @Min(1) @Max(100) pageSize?: number;
}

class StudentSearchQuery {
  @IsOptional() @IsString() query?: string;
}

class TariffListQuery extends StudentSearchQuery {
  @IsOptional() @IsString() academicYear?: string;
  @IsOptional() @IsUUID() studyProgramId?: string;
  @IsOptional() @Transform(({ value }) => value === "true" || value === true) @IsBoolean() active?: boolean;
}

class ScholarshipListQuery extends StudentSearchQuery {
  @IsOptional() @IsString() academicYear?: string;
  @IsOptional() @IsUUID() studyProgramId?: string;
  @IsOptional() @IsEnum(ScholarshipStatus) status?: ScholarshipStatus;
}

class ReconciliationListQuery extends StudentSearchQuery {
  @IsOptional() @IsEnum(ReconciliationStatus) status?: ReconciliationStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
}

@Controller("finance/admin")
@UseGuards(AdmissionsAdminGuard)
export class FinanceAdminController {
  constructor(private readonly finance: FinanceService) {}

  @Get("students")
  students(@Query() query: StudentSearchQuery) {
    return this.finance.listStudents(query.query);
  }

  @Get("study-programs")
  studyPrograms() {
    return this.finance.listStudyPrograms();
  }

  @Get("billings")
  billings(@Query() query: BillingListQuery) {
    return this.finance.listBillings(query);
  }

  @Get("billings/:id")
  billing(@Param("id", ParseUUIDPipe) id: string) {
    return this.finance.getBilling(id);
  }

  @Post("billings")
  createBilling(@Body() body: CreateBillingDto) {
    return this.finance.createBilling(body);
  }

  @Patch("billings/:id")
  updateBilling(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateBillingDto) {
    return this.finance.updateBilling(id, body);
  }

  @Post("billings/:id/cancel")
  cancelBilling(@Param("id", ParseUUIDPipe) id: string, @Body() body: CancelBillingDto) {
    return this.finance.cancelBilling(id, body.reason);
  }

  @Post("billings/import/validate")
  validateImport(@Body() body: BillingImportDto) {
    return this.finance.validateImport(body.rows);
  }

  @Post("billings/import/confirm")
  confirmImport(@Body() body: BillingImportDto) {
    return this.finance.confirmImport(body);
  }

  @Get("tariffs")
  tariffs(@Query() query: TariffListQuery) {
    return this.finance.listTariffs(query.query, query.academicYear, query.studyProgramId, query.active);
  }

  @Post("tariffs")
  createTariff(@Body() body: CreateTariffDto) {
    return this.finance.createTariff(body);
  }

  @Patch("tariffs/:id")
  updateTariff(@Param("id", ParseUUIDPipe) id: string, @Body() body: CreateTariffDto) {
    return this.finance.updateTariff(id, body);
  }

  @Post("tariffs/import/validate")
  validateTariffImport(@Body() body: MasterDataImportDto) {
    return this.finance.validateTariffImport(body.rows);
  }

  @Post("tariffs/import/confirm")
  confirmTariffImport(@Body() body: MasterDataImportDto) {
    return this.finance.confirmTariffImport(body.rows);
  }

  @Get("scholarships")
  scholarships(@Query() query: ScholarshipListQuery) {
    return this.finance.listScholarships(query.query, query.academicYear, query.studyProgramId, query.status);
  }

  @Post("scholarships")
  createScholarship(@Body() body: CreateScholarshipDto) {
    return this.finance.createScholarship(body);
  }

  @Post("scholarships/import/validate")
  validateScholarshipImport(@Body() body: MasterDataImportDto) {
    return this.finance.validateScholarshipImport(body.rows);
  }

  @Post("scholarships/import/confirm")
  confirmScholarshipImport(@Body() body: MasterDataImportDto) {
    return this.finance.confirmScholarshipImport(body.rows);
  }

  @Patch("scholarships/:id/review")
  reviewScholarship(@Param("id", ParseUUIDPipe) id: string, @Body() body: ReviewScholarshipDto) {
    return this.finance.reviewScholarship(id, body, body.reason);
  }

  @Get("reconciliations")
  reconciliations(@Query() query: ReconciliationListQuery) {
    return this.finance.listReconciliations(query.query, query.status, query.from, query.to);
  }

  @Post("reconciliations/import/validate")
  validateReconciliationImport(@Body() body: ReconciliationImportDto) {
    return this.finance.validateReconciliationImport(body.rows);
  }

  @Post("reconciliations/import/confirm")
  confirmReconciliationImport(@Body() body: ReconciliationImportDto) {
    return this.finance.confirmReconciliationImport(body.rows);
  }
}

@Controller("students/demo")
export class DemoStudentFinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get("billing")
  billing(@Headers("x-student-demo-nim") nim?: string) {
    return this.finance.getStudentBillings(nim);
  }
}