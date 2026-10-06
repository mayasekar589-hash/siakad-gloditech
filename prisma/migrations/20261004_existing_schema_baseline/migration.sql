-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."academic_calendar_category" AS ENUM ('KULIAH', 'KRS', 'UTS', 'UAS', 'LIBUR', 'REGISTRASI', 'WISUDA', 'PENERIMAAN', 'PENERIMAAN_MAHASISWA', 'DEADLINE', 'LAINNYA');

-- CreateEnum
CREATE TYPE "public"."academic_record_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."academic_term" AS ENUM ('GANJIL', 'GENAP');

-- CreateEnum
CREATE TYPE "public"."admission_payment_status" AS ENUM ('BELUM_BAYAR', 'MENUNGGU_VERIFIKASI', 'LUNAS', 'DITOLAK', 'KADALUARSA');

-- CreateEnum
CREATE TYPE "public"."admission_period_status" AS ENUM ('DRAFT', 'UPCOMING', 'OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."applicant_document_status" AS ENUM ('BELUM_DIVERIFIKASI', 'DIPERIKSA', 'TERVERIFIKASI', 'PERLU_PERBAIKAN', 'DITOLAK');

-- CreateEnum
CREATE TYPE "public"."application_status" AS ENUM ('DRAFT', 'SUBMITTED', 'DOCUMENT_VERIFICATION', 'DOCUMENT_REVISION', 'DOCUMENT_VERIFIED', 'PAYMENT_PENDING', 'PAYMENT_VERIFICATION', 'PAYMENT_VERIFIED', 'READY_FOR_SELECTION', 'IN_SELECTION', 'PASSED_SELECTION', 'FAILED_SELECTION', 'RE_REGISTRATION', 'REGISTERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."attendance_record_status" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPA');

-- CreateEnum
CREATE TYPE "public"."calendar_event_status" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ceremony_registration_status" AS ENUM ('REGISTERED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."ceremony_status" AS ENUM ('DRAFT', 'OPEN', 'VERIFICATION', 'VERIFIED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."course_kind" AS ENUM ('WAJIB', 'PILIHAN', 'PRAKTIKUM');

-- CreateEnum
CREATE TYPE "public"."curriculum_course_nature" AS ENUM ('WAJIB', 'PILIHAN');

-- CreateEnum
CREATE TYPE "public"."curriculum_status" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."grade_status" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "public"."graduation_status" AS ENUM ('NOT_ELIGIBLE', 'PENDING', 'ELIGIBLE', 'VERIFIED', 'GRADUATED');

-- CreateEnum
CREATE TYPE "public"."krs_status" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."offering_status" AS ENUM ('OPEN', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."re_registration_status" AS ENUM ('BELUM_REGISTRASI', 'DALAM_PROSES', 'DOKUMEN_LENGKAP', 'SELESAI', 'DIBATALKAN');

-- CreateEnum
CREATE TYPE "public"."registration_type" AS ENUM ('POLA_PEMBIBITAN', 'NON_POLA_PEMBIBITAN', 'DIKLAT');

-- CreateEnum
CREATE TYPE "public"."schedule_status" AS ENUM ('CONFIRMED', 'CONFLICT');

-- CreateEnum
CREATE TYPE "public"."selection_result_status" AS ENUM ('SCHEDULED', 'PRESENT', 'ABSENT', 'PASSED', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."selection_scoring_model" AS ENUM ('PASS_FAIL', 'SCORE', 'SCORE_AND_PASS');

-- CreateEnum
CREATE TYPE "public"."student_academic_status" AS ENUM ('AKTIF', 'CUTI', 'NONAKTIF', 'LULUS', 'DROP_OUT');

-- CreateTable
CREATE TABLE "public"."academic_calendar_events" (
    "id" UUID NOT NULL,
    "academic_year" VARCHAR(20),
    "title" VARCHAR(180) NOT NULL,
    "category" "public"."academic_calendar_category" NOT NULL,
    "start" DATE NOT NULL,
    "end" DATE NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "audience" VARCHAR(180) NOT NULL,
    "status" "public"."calendar_event_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "academic_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_document_requirements" (
    "id" UUID NOT NULL,
    "admission_period_id" UUID NOT NULL,
    "document_code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "accepted_mime_types" TEXT[],
    "max_size_bytes" INTEGER,
    "description" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admission_document_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_fees" (
    "id" UUID NOT NULL,
    "admission_period_id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "amount" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'IDR',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(3),

    CONSTRAINT "admission_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_payments" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "fee_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" VARCHAR(80),
    "reference_number" VARCHAR(120),
    "proof_document_id" UUID,
    "status" "public"."admission_payment_status" NOT NULL DEFAULT 'BELUM_BAYAR',
    "rejection_reason" VARCHAR(1000),
    "paid_at" TIMESTAMPTZ(3),
    "reviewed_at" TIMESTAMPTZ(3),

    CONSTRAINT "admission_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_period_programs" (
    "admission_period_id" UUID NOT NULL,
    "admission_program_id" UUID NOT NULL,
    "quota" INTEGER,

    CONSTRAINT "admission_period_programs_pkey" PRIMARY KEY ("admission_period_id","admission_program_id")
);

-- CreateTable
CREATE TABLE "public"."admission_periods" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "registration_type" "public"."registration_type" NOT NULL,
    "description" VARCHAR(1000),
    "status" "public"."admission_period_status" NOT NULL DEFAULT 'DRAFT',
    "opens_at" TIMESTAMPTZ(3) NOT NULL,
    "closes_at" TIMESTAMPTZ(3) NOT NULL,
    "quota" INTEGER,
    "student_number_prefix" VARCHAR(20),
    "student_number_next" INTEGER,
    "student_number_width" INTEGER NOT NULL DEFAULT 6,
    "registration_settings" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admission_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_programs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "registrationType" "public"."registration_type" NOT NULL,
    "study_program_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "admission_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admission_requirements" (
    "id" UUID NOT NULL,
    "admission_period_id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "admission_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applicant_documents" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "document_code" VARCHAR(80) NOT NULL,
    "label" VARCHAR(180) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_content" BYTEA NOT NULL,
    "status" "public"."applicant_document_status" NOT NULL DEFAULT 'BELUM_DIVERIFIKASI',
    "rejection_reason" VARCHAR(1000),
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ(3),

    CONSTRAINT "applicant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applicants" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "national_id" VARCHAR(20),
    "full_name" VARCHAR(180),
    "email" VARCHAR(320),
    "phone" VARCHAR(30),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."application_status_history" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "actor_user_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "old_status" "public"."application_status",
    "new_status" "public"."application_status",
    "notes" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."applications" (
    "id" UUID NOT NULL,
    "registration_number" VARCHAR(40) NOT NULL,
    "applicant_id" UUID NOT NULL,
    "admission_period_id" UUID,
    "registration_type" "public"."registration_type",
    "admission_program_id" UUID,
    "status" "public"."application_status" NOT NULL DEFAULT 'DRAFT',
    "personal_data" JSONB,
    "parent_data" JSONB,
    "education_data" JSONB,
    "physical_data" JSONB,
    "professional_data" JSONB,
    "program_data" JSONB,
    "submitted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "meeting_number" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "status" "public"."attendance_record_status" NOT NULL,
    "note" VARCHAR(500),

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_summaries" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "meetings" INTEGER NOT NULL DEFAULT 0,
    "present" INTEGER NOT NULL DEFAULT 0,
    "excused" INTEGER NOT NULL DEFAULT 0,
    "sick" INTEGER NOT NULL DEFAULT 0,
    "absent" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "attendance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ceremony_periods" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40),
    "name" VARCHAR(180) NOT NULL,
    "date" DATE NOT NULL,
    "location" VARCHAR(240) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "registration_start" DATE NOT NULL,
    "registration_end" DATE NOT NULL,
    "status" "public"."ceremony_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ceremony_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ceremony_registrations" (
    "id" UUID NOT NULL,
    "ceremony_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "public"."ceremony_registration_status" NOT NULL DEFAULT 'REGISTERED',
    "documents_ready" INTEGER NOT NULL DEFAULT 0,
    "documents_required" INTEGER NOT NULL DEFAULT 0,
    "registration_date" DATE,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ceremony_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_offerings" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "course_id" UUID NOT NULL,
    "lecturer_id" UUID NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "term" "public"."academic_term" NOT NULL,
    "class_name" VARCHAR(80) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "public"."offering_status" NOT NULL DEFAULT 'OPEN',
    "room" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "class_offerings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."class_schedules" (
    "id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "day" VARCHAR(12) NOT NULL,
    "start" VARCHAR(5) NOT NULL,
    "end" VARCHAR(5) NOT NULL,
    "room" VARCHAR(100) NOT NULL,
    "status" "public"."schedule_status" NOT NULL DEFAULT 'CONFIRMED',

    CONSTRAINT "class_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_prerequisites" (
    "course_id" UUID NOT NULL,
    "prerequisite_id" UUID NOT NULL,

    CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("course_id","prerequisite_id")
);

-- CreateTable
CREATE TABLE "public"."courses" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "credits" INTEGER NOT NULL,
    "semester" INTEGER NOT NULL,
    "study_program_id" UUID NOT NULL,
    "kind" "public"."course_kind" NOT NULL,
    "description" VARCHAR(1000),
    "status" "public"."academic_record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curricula" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40),
    "study_program_id" UUID NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "effective_year" INTEGER NOT NULL,
    "end_year" INTEGER,
    "status" "public"."curriculum_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "curricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curriculum_courses" (
    "curriculum_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "semester" INTEGER,
    "nature" "public"."curriculum_course_nature",
    "credits" INTEGER,

    CONSTRAINT "curriculum_courses_pkey" PRIMARY KEY ("curriculum_id","course_id")
);

-- CreateTable
CREATE TABLE "public"."grade_records" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,
    "assignment" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "midterm" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "final_exam" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "final_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "grade" VARCHAR(3) NOT NULL DEFAULT '-',
    "status" "public"."grade_status" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "grade_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graduation_evaluations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "credits" INTEGER NOT NULL,
    "gpa" DECIMAL(3,2) NOT NULL,
    "attendance_percent" DECIMAL(5,2) NOT NULL,
    "outstanding_requirements" TEXT[],
    "status" "public"."graduation_status" NOT NULL DEFAULT 'PENDING',
    "verified_at" DATE,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "graduation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."graduation_rules" (
    "id" UUID NOT NULL,
    "study_program_id" UUID NOT NULL,
    "minimum_credits" INTEGER NOT NULL,
    "minimum_gpa" DECIMAL(3,2) NOT NULL,
    "minimum_attendance_percent" DECIMAL(5,2) NOT NULL,
    "required_documents" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "graduation_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."krs_items" (
    "krs_id" UUID NOT NULL,
    "offering_id" UUID NOT NULL,

    CONSTRAINT "krs_items_pkey" PRIMARY KEY ("krs_id","offering_id")
);

-- CreateTable
CREATE TABLE "public"."krs_records" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year" VARCHAR(20) NOT NULL,
    "term" "public"."academic_term" NOT NULL,
    "status" "public"."krs_status" NOT NULL DEFAULT 'DRAFT',
    "rejection_reason" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "krs_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."krs_status_history" (
    "id" UUID NOT NULL,
    "krs_id" UUID NOT NULL,
    "old_status" "public"."krs_status" NOT NULL,
    "new_status" "public"."krs_status" NOT NULL,
    "reason" VARCHAR(500),
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "krs_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lecturers" (
    "id" UUID NOT NULL,
    "nidn" VARCHAR(30) NOT NULL,
    "nip" VARCHAR(30),
    "name" VARCHAR(180) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "title_front" VARCHAR(80),
    "title_back" VARCHAR(80),
    "email" VARCHAR(320),
    "phone" VARCHAR(30),
    "study_program_id" UUID NOT NULL,
    "status" "public"."academic_record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "lecturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."re_registrations" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "status" "public"."re_registration_status" NOT NULL DEFAULT 'BELUM_REGISTRASI',
    "checklist" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMPTZ(3),
    "student_id" UUID,

    CONSTRAINT "re_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."selection_results" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "selection_stage_id" UUID NOT NULL,
    "status" "public"."selection_result_status" NOT NULL DEFAULT 'PENDING',
    "scheduled_at" TIMESTAMPTZ(3),
    "score" DECIMAL(7,2),
    "grade" VARCHAR(20),
    "notes" VARCHAR(1000),
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "selection_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."selection_stages" (
    "id" UUID NOT NULL,
    "admission_period_id" UUID NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "scoring_model" "public"."selection_scoring_model" NOT NULL,
    "maximum_score" DECIMAL(7,2),
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "selection_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_status_history" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "old_status" "public"."student_academic_status" NOT NULL,
    "new_status" "public"."student_academic_status" NOT NULL,
    "effective_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "notes" VARCHAR(1000),
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" UUID NOT NULL,
    "applicant_id" UUID NOT NULL,
    "source_application_id" UUID NOT NULL,
    "name" VARCHAR(180),
    "student_number" VARCHAR(30),
    "national_id" VARCHAR(20),
    "nickname" VARCHAR(100),
    "birth_place" VARCHAR(120),
    "birth_date" DATE,
    "gender" VARCHAR(1),
    "religion" VARCHAR(50),
    "email" VARCHAR(320),
    "phone" VARCHAR(30),
    "address" VARCHAR(500),
    "province" VARCHAR(100),
    "regency" VARCHAR(100),
    "district" VARCHAR(100),
    "village" VARCHAR(100),
    "postal_code" VARCHAR(12),
    "study_program_id" UUID,
    "cohort" INTEGER,
    "semester" INTEGER,
    "class_name" VARCHAR(80),
    "academic_status" "public"."student_academic_status" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."study_programs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "degree" VARCHAR(20) NOT NULL,
    "unit" VARCHAR(180) NOT NULL,
    "head_lecturer_id" UUID,
    "status" "public"."academic_record_status" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "academic_calendar_events_start_end_idx" ON "public"."academic_calendar_events"("start" ASC, "end" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_document_requirements_admission_period_id_documen_key" ON "public"."admission_document_requirements"("admission_period_id" ASC, "document_code" ASC);

-- CreateIndex
CREATE INDEX "admission_document_requirements_admission_period_id_sort_or_idx" ON "public"."admission_document_requirements"("admission_period_id" ASC, "sort_order" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_fees_admission_period_id_code_key" ON "public"."admission_fees"("admission_period_id" ASC, "code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_payments_application_id_fee_id_key" ON "public"."admission_payments"("application_id" ASC, "fee_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_payments_proof_document_id_key" ON "public"."admission_payments"("proof_document_id" ASC);

-- CreateIndex
CREATE INDEX "admission_payments_status_paid_at_idx" ON "public"."admission_payments"("status" ASC, "paid_at" ASC);

-- CreateIndex
CREATE INDEX "admission_periods_academic_year_status_idx" ON "public"."admission_periods"("academic_year" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_periods_code_key" ON "public"."admission_periods"("code" ASC);

-- CreateIndex
CREATE INDEX "admission_periods_registration_type_status_opens_at_closes__idx" ON "public"."admission_periods"("registration_type" ASC, "status" ASC, "opens_at" ASC, "closes_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "admission_programs_code_key" ON "public"."admission_programs"("code" ASC);

-- CreateIndex
CREATE INDEX "admission_programs_registrationType_active_idx" ON "public"."admission_programs"("registrationType" ASC, "active" ASC);

-- CreateIndex
CREATE INDEX "admission_requirements_admission_period_id_sort_order_idx" ON "public"."admission_requirements"("admission_period_id" ASC, "sort_order" ASC);

-- CreateIndex
CREATE INDEX "applicant_documents_application_id_status_idx" ON "public"."applicant_documents"("application_id" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "applicants_email_idx" ON "public"."applicants"("email" ASC);

-- CreateIndex
CREATE INDEX "applicants_full_name_idx" ON "public"."applicants"("full_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "applicants_national_id_key" ON "public"."applicants"("national_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "applicants_user_id_key" ON "public"."applicants"("user_id" ASC);

-- CreateIndex
CREATE INDEX "application_status_history_application_id_created_at_idx" ON "public"."application_status_history"("application_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "applications_admission_period_id_status_created_at_idx" ON "public"."applications"("admission_period_id" ASC, "status" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "applications_applicant_id_created_at_idx" ON "public"."applications"("applicant_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE INDEX "applications_applicant_id_status_idx" ON "public"."applications"("applicant_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "applications_registration_number_key" ON "public"."applications"("registration_number" ASC);

-- CreateIndex
CREATE INDEX "applications_registration_type_status_idx" ON "public"."applications"("registration_type" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "attendance_records_offering_id_date_idx" ON "public"."attendance_records"("offering_id" ASC, "date" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_student_id_offering_id_meeting_number_key" ON "public"."attendance_records"("student_id" ASC, "offering_id" ASC, "meeting_number" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_summaries_student_id_offering_id_key" ON "public"."attendance_summaries"("student_id" ASC, "offering_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ceremony_periods_code_key" ON "public"."ceremony_periods"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ceremony_registrations_ceremony_id_student_id_key" ON "public"."ceremony_registrations"("ceremony_id" ASC, "student_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "class_offerings_code_key" ON "public"."class_offerings"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "class_offerings_course_id_academic_year_term_class_name_key" ON "public"."class_offerings"("course_id" ASC, "academic_year" ASC, "term" ASC, "class_name" ASC);

-- CreateIndex
CREATE INDEX "class_offerings_lecturer_id_academic_year_term_idx" ON "public"."class_offerings"("lecturer_id" ASC, "academic_year" ASC, "term" ASC);

-- CreateIndex
CREATE INDEX "class_schedules_day_start_end_idx" ON "public"."class_schedules"("day" ASC, "start" ASC, "end" ASC);

-- CreateIndex
CREATE INDEX "class_schedules_room_day_idx" ON "public"."class_schedules"("room" ASC, "day" ASC);

-- CreateIndex
CREATE INDEX "course_prerequisites_prerequisite_id_idx" ON "public"."course_prerequisites"("prerequisite_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "public"."courses"("code" ASC);

-- CreateIndex
CREATE INDEX "courses_study_program_id_semester_idx" ON "public"."courses"("study_program_id" ASC, "semester" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "curricula_code_key" ON "public"."curricula"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "curricula_study_program_id_effective_year_key" ON "public"."curricula"("study_program_id" ASC, "effective_year" ASC);

-- CreateIndex
CREATE INDEX "curriculum_courses_course_id_idx" ON "public"."curriculum_courses"("course_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "grade_records_student_id_offering_id_key" ON "public"."grade_records"("student_id" ASC, "offering_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "graduation_evaluations_student_id_academic_year_key" ON "public"."graduation_evaluations"("student_id" ASC, "academic_year" ASC);

-- CreateIndex
CREATE INDEX "graduation_rules_study_program_id_active_idx" ON "public"."graduation_rules"("study_program_id" ASC, "active" ASC);

-- CreateIndex
CREATE INDEX "krs_items_offering_id_idx" ON "public"."krs_items"("offering_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "krs_records_student_id_academic_year_term_key" ON "public"."krs_records"("student_id" ASC, "academic_year" ASC, "term" ASC);

-- CreateIndex
CREATE INDEX "krs_status_history_krs_id_created_at_idx" ON "public"."krs_status_history"("krs_id" ASC, "created_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_email_key" ON "public"."lecturers"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_nidn_key" ON "public"."lecturers"("nidn" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "lecturers_nip_key" ON "public"."lecturers"("nip" ASC);

-- CreateIndex
CREATE INDEX "lecturers_study_program_id_status_idx" ON "public"."lecturers"("study_program_id" ASC, "status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "re_registrations_application_id_key" ON "public"."re_registrations"("application_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "re_registrations_student_id_key" ON "public"."re_registrations"("student_id" ASC);

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "public"."role_permissions"("permission_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "public"."roles"("code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "selection_results_application_id_selection_stage_id_key" ON "public"."selection_results"("application_id" ASC, "selection_stage_id" ASC);

-- CreateIndex
CREATE INDEX "selection_results_selection_stage_id_status_scheduled_at_idx" ON "public"."selection_results"("selection_stage_id" ASC, "status" ASC, "scheduled_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "selection_stages_admission_period_id_code_key" ON "public"."selection_stages"("admission_period_id" ASC, "code" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "selection_stages_admission_period_id_sort_order_key" ON "public"."selection_stages"("admission_period_id" ASC, "sort_order" ASC);

-- CreateIndex
CREATE INDEX "student_status_history_student_id_effective_at_idx" ON "public"."student_status_history"("student_id" ASC, "effective_at" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "students_applicant_id_key" ON "public"."students"("applicant_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "students_source_application_id_key" ON "public"."students"("source_application_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "students_student_number_key" ON "public"."students"("student_number" ASC);

-- CreateIndex
CREATE INDEX "students_study_program_id_academic_status_idx" ON "public"."students"("study_program_id" ASC, "academic_status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "study_programs_code_key" ON "public"."study_programs"("code" ASC);

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "public"."user_roles"("role_id" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email" ASC);

-- AddForeignKey
ALTER TABLE "public"."admission_document_requirements" ADD CONSTRAINT "admission_document_requirements_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_fees" ADD CONSTRAINT "admission_fees_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_payments" ADD CONSTRAINT "admission_payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_payments" ADD CONSTRAINT "admission_payments_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "public"."admission_fees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_payments" ADD CONSTRAINT "admission_payments_proof_document_id_fkey" FOREIGN KEY ("proof_document_id") REFERENCES "public"."applicant_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_period_programs" ADD CONSTRAINT "admission_period_programs_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_period_programs" ADD CONSTRAINT "admission_period_programs_admission_program_id_fkey" FOREIGN KEY ("admission_program_id") REFERENCES "public"."admission_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_programs" ADD CONSTRAINT "admission_programs_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admission_requirements" ADD CONSTRAINT "admission_requirements_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applicant_documents" ADD CONSTRAINT "applicant_documents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applicants" ADD CONSTRAINT "applicants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."application_status_history" ADD CONSTRAINT "application_status_history_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."application_status_history" ADD CONSTRAINT "application_status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_admission_program_id_fkey" FOREIGN KEY ("admission_program_id") REFERENCES "public"."admission_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."applications" ADD CONSTRAINT "applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_summaries" ADD CONSTRAINT "attendance_summaries_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_summaries" ADD CONSTRAINT "attendance_summaries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ceremony_registrations" ADD CONSTRAINT "ceremony_registrations_ceremony_id_fkey" FOREIGN KEY ("ceremony_id") REFERENCES "public"."ceremony_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ceremony_registrations" ADD CONSTRAINT "ceremony_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_offerings" ADD CONSTRAINT "class_offerings_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_offerings" ADD CONSTRAINT "class_offerings_lecturer_id_fkey" FOREIGN KEY ("lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."class_schedules" ADD CONSTRAINT "class_schedules_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curricula" ADD CONSTRAINT "curricula_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curriculum_courses" ADD CONSTRAINT "curriculum_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."curriculum_courses" ADD CONSTRAINT "curriculum_courses_curriculum_id_fkey" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curricula"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grade_records" ADD CONSTRAINT "grade_records_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grade_records" ADD CONSTRAINT "grade_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_evaluations" ADD CONSTRAINT "graduation_evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."graduation_rules" ADD CONSTRAINT "graduation_rules_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."krs_items" ADD CONSTRAINT "krs_items_krs_id_fkey" FOREIGN KEY ("krs_id") REFERENCES "public"."krs_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."krs_items" ADD CONSTRAINT "krs_items_offering_id_fkey" FOREIGN KEY ("offering_id") REFERENCES "public"."class_offerings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."krs_records" ADD CONSTRAINT "krs_records_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."krs_status_history" ADD CONSTRAINT "krs_status_history_krs_id_fkey" FOREIGN KEY ("krs_id") REFERENCES "public"."krs_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lecturers" ADD CONSTRAINT "lecturers_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."re_registrations" ADD CONSTRAINT "re_registrations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."re_registrations" ADD CONSTRAINT "re_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."selection_results" ADD CONSTRAINT "selection_results_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."selection_results" ADD CONSTRAINT "selection_results_selection_stage_id_fkey" FOREIGN KEY ("selection_stage_id") REFERENCES "public"."selection_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."selection_stages" ADD CONSTRAINT "selection_stages_admission_period_id_fkey" FOREIGN KEY ("admission_period_id") REFERENCES "public"."admission_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_status_history" ADD CONSTRAINT "student_status_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_source_application_id_fkey" FOREIGN KEY ("source_application_id") REFERENCES "public"."applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."study_programs" ADD CONSTRAINT "study_programs_head_lecturer_id_fkey" FOREIGN KEY ("head_lecturer_id") REFERENCES "public"."lecturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
