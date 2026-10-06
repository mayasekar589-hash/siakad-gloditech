-- AlterTable
ALTER TABLE "billings" ADD COLUMN "scholarship_id" UUID;

-- CreateTable
CREATE TABLE "tariff_history" (
    "id" UUID NOT NULL,
    "tariff_id" UUID NOT NULL,
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator Back Office',
    "action" VARCHAR(80) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tariff_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scholarship_history" (
    "id" UUID NOT NULL,
    "scholarship_id" UUID NOT NULL,
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator Back Office',
    "action" VARCHAR(80) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scholarship_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reconciliation_history" (
    "id" UUID NOT NULL,
    "reconciliation_id" UUID NOT NULL,
    "actor_label" VARCHAR(180) NOT NULL DEFAULT 'Administrator Back Office',
    "action" VARCHAR(80) NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "reason" VARCHAR(1000),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reconciliation_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tariff_history_tariff_id_created_at_idx" ON "tariff_history"("tariff_id", "created_at");
CREATE INDEX "scholarship_history_scholarship_id_created_at_idx" ON "scholarship_history"("scholarship_id", "created_at");
CREATE INDEX "reconciliation_history_reconciliation_id_created_at_idx" ON "reconciliation_history"("reconciliation_id", "created_at");

-- AddForeignKey
ALTER TABLE "billings" ADD CONSTRAINT "billings_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tariff_history" ADD CONSTRAINT "tariff_history_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scholarship_history" ADD CONSTRAINT "scholarship_history_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "scholarships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reconciliation_history" ADD CONSTRAINT "reconciliation_history_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;