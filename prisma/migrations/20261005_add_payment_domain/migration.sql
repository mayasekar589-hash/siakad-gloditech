-- CreateEnum
CREATE TYPE "finance_payment_status" AS ENUM ('PENDING_VERIFICATION', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "transaction_number" VARCHAR(40) NOT NULL,
    "billing_id" UUID NOT NULL,
    "payment_reference" VARCHAR(120),
    "payment_method" VARCHAR(80) NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "finance_payment_status" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(3),
    "reviewed_at" TIMESTAMPTZ(3),
    "rejection_reason" VARCHAR(1000),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_proofs" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "mime_type" VARCHAR(120) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "file_content" BYTEA NOT NULL,
    "uploaded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator Back Office',
    "action" VARCHAR(80) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_number_key" ON "payments"("transaction_number");
CREATE INDEX "payments_status_submitted_at_idx" ON "payments"("status", "submitted_at");
CREATE INDEX "payments_billing_id_submitted_at_idx" ON "payments"("billing_id", "submitted_at");
CREATE UNIQUE INDEX "payment_proofs_payment_id_key" ON "payment_proofs"("payment_id");
CREATE INDEX "payment_history_payment_id_created_at_idx" ON "payment_history"("payment_id", "created_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_proofs" ADD CONSTRAINT "payment_proofs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;