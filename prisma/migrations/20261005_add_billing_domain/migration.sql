-- CreateEnum
CREATE TYPE "billing_status" AS ENUM ('UNPAID', 'PENDING_VERIFICATION', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "billings" (
    "id" UUID NOT NULL,
    "billing_number" VARCHAR(40) NOT NULL,
    "student_id" UUID NOT NULL,
    "academic_year" VARCHAR(9) NOT NULL,
    "semester" INTEGER NOT NULL,
    "billing_type" VARCHAR(120) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "amount" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "billing_status" NOT NULL DEFAULT 'UNPAID',
    "note" VARCHAR(1000),
    "cancelled_at" TIMESTAMPTZ(3),
    "cancellation_reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_history" (
    "id" UUID NOT NULL,
    "billing_id" UUID NOT NULL,
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator Back Office',
    "action" VARCHAR(80) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billings_billing_number_key" ON "billings"("billing_number");
CREATE INDEX "billings_status_due_date_idx" ON "billings"("status", "due_date");
CREATE INDEX "billings_academic_year_semester_status_idx" ON "billings"("academic_year", "semester", "status");
CREATE UNIQUE INDEX "billings_student_id_academic_year_semester_billing_type_key" ON "billings"("student_id", "academic_year", "semester", "billing_type");
CREATE INDEX "billing_history_billing_id_created_at_idx" ON "billing_history"("billing_id", "created_at");

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "billing_history" ADD CONSTRAINT "billing_history_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE CASCADE ON UPDATE CASCADE;