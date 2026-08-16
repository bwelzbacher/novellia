-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "sex" TEXT NOT NULL,
    "weight_lbs" DOUBLE PRECISION,
    "microchip_id" TEXT,
    "owner_name" TEXT NOT NULL,
    "owner_email" TEXT,
    "owner_phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "inactive_reason" TEXT,
    "photo_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reaction" TEXT,
    "notes" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vet_records" (
    "id" TEXT NOT NULL,
    "office_name" TEXT NOT NULL,
    "address" TEXT,
    "phone_number" TEXT,
    "hours" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conditions" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "diagnosing_physician" TEXT,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "vet_record_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "source_system" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_records" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "condition_id" TEXT,
    "time" TEXT NOT NULL,
    "vet" TEXT,
    "reason" TEXT NOT NULL,
    "weight_lbs" DOUBLE PRECISION,
    "temperature_f" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_notes" (
    "id" TEXT NOT NULL,
    "appointment_record_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointment_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vaccine_records" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "administered_date" TIMESTAMP(3) NOT NULL,
    "next_due_date" TIMESTAMP(3),
    "notes" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccine_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medication_records" (
    "id" TEXT NOT NULL,
    "medical_record_id" TEXT NOT NULL,
    "condition_id" TEXT,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "duration" TEXT,
    "prescriber" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pets_microchip_id_key" ON "pets"("microchip_id");

-- CreateIndex
CREATE INDEX "allergies_pet_id_idx" ON "allergies"("pet_id");

-- CreateIndex
CREATE INDEX "conditions_pet_id_idx" ON "conditions"("pet_id");

-- CreateIndex
CREATE INDEX "medical_records_pet_id_idx" ON "medical_records"("pet_id");

-- CreateIndex
CREATE INDEX "medical_records_vet_record_id_idx" ON "medical_records"("vet_record_id");

-- CreateIndex
CREATE INDEX "medical_records_date_idx" ON "medical_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_records_medical_record_id_key" ON "appointment_records"("medical_record_id");

-- CreateIndex
CREATE INDEX "appointment_records_condition_id_idx" ON "appointment_records"("condition_id");

-- CreateIndex
CREATE INDEX "appointment_notes_appointment_record_id_idx" ON "appointment_notes"("appointment_record_id");

-- CreateIndex
CREATE INDEX "vaccine_records_medical_record_id_idx" ON "vaccine_records"("medical_record_id");

-- CreateIndex
CREATE INDEX "medication_records_medical_record_id_idx" ON "medication_records"("medical_record_id");

-- CreateIndex
CREATE INDEX "medication_records_condition_id_idx" ON "medication_records"("condition_id");

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conditions" ADD CONSTRAINT "conditions_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_vet_record_id_fkey" FOREIGN KEY ("vet_record_id") REFERENCES "vet_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_records" ADD CONSTRAINT "appointment_records_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_records" ADD CONSTRAINT "appointment_records_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_notes" ADD CONSTRAINT "appointment_notes_appointment_record_id_fkey" FOREIGN KEY ("appointment_record_id") REFERENCES "appointment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaccine_records" ADD CONSTRAINT "vaccine_records_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_records" ADD CONSTRAINT "medication_records_medical_record_id_fkey" FOREIGN KEY ("medical_record_id") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medication_records" ADD CONSTRAINT "medication_records_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
