-- CreateEnum
CREATE TYPE "scholarship_status" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'COMPLETED');
CREATE TYPE "reconciliation_status" AS ENUM ('MATCHED', 'UNMATCHED', 'DIFFERENCE', 'PENDING');

-- AlterTable
ALTER TABLE "billings" ADD COLUMN "discount_amount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "billings" ADD COLUMN "gross_amount" INTEGER;
ALTER TABLE "billings" ADD COLUMN "tariff_id" UUID;

-- CreateTable
CREATE TABLE "tariffs" (
    "id" UUID NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "kind" VARCHAR(80) NOT NULL,
    "study_program_id" UUID,
    "pathway" VARCHAR(120),
    "semester" INTEGER NOT NULL,
    "academic_year" VARCHAR(9) NOT NULL,
    "amount" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scholarships" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "kind" VARCHAR(120) NOT NULL,
    "academic_year" VARCHAR(9) NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" VARCHAR(180) NOT NULL,
    "starts_at" DATE NOT NULL,
    "ends_at" DATE NOT NULL,
    "status" "scholarship_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "document_name" VARCHAR(255),
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reconciliations" (
    "id" UUID NOT NULL,
    "transaction_date" DATE NOT NULL,
    "external_reference" VARCHAR(120) NOT NULL,
    "billing_number" VARCHAR(40) NOT NULL,
    "student_nim" VARCHAR(30) NOT NULL,
    "internal_amount" INTEGER,
    "external_amount" INTEGER NOT NULL,
    "payment_method" VARCHAR(80) NOT NULL,
    "status" "reconciliation_status" NOT NULL DEFAULT 'PENDING',
    "payment_id" UUID,
    "note" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tariffs_code_key" ON "tariffs"("code");
CREATE INDEX "tariffs_academic_year_study_program_id_active_idx" ON "tariffs"("academic_year", "study_program_id", "active");
CREATE INDEX "scholarships_academic_year_status_idx" ON "scholarships"("academic_year", "status");
CREATE INDEX "scholarships_student_id_academic_year_idx" ON "scholarships"("student_id", "academic_year");
CREATE INDEX "reconciliations_transaction_date_status_idx" ON "reconciliations"("transaction_date", "status");
CREATE INDEX "reconciliations_payment_id_idx" ON "reconciliations"("payment_id");
CREATE UNIQUE INDEX "reconciliations_external_reference_payment_method_key" ON "reconciliations"("external_reference", "payment_method");
CREATE INDEX "billings_tariff_id_idx" ON "billings"("tariff_id");

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tariffs" ADD CONSTRAINT "tariffs_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "study_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;