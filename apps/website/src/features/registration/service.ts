import type { AdmissionDocumentConfig, RegistrationFormData, RegistrationQuestion, RegistrationReceipt, RegistrationType } from "@/features/registration/types";

export interface RegistrationDocumentUploadResult {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface RegistrationService {
  createDraft(registrationType: RegistrationType, admissionPeriodId: string | null): Promise<{ id: string }>;
  updateDraft(draftId: string, data: RegistrationFormData): Promise<void>;
  uploadRegistrationDocument(file: File, config: AdmissionDocumentConfig): Promise<RegistrationDocumentUploadResult>;
  getApplication(applicationId: string): Promise<null>;
  submit(draftId: string, registrationType: RegistrationType, data: RegistrationFormData): Promise<RegistrationReceipt>;
  submitQuestion(question: RegistrationQuestion): Promise<{ mode: "MOCK" }>;
}

export type RegistrationApiAdapter = RegistrationService;

function createId(prefix: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${suffix}`;
}

export function validateRegistrationDocument(file: File, config: AdmissionDocumentConfig): string | null {
  if (!config.acceptedTypes.includes(file.type)) return "File yang diunggah tidak sesuai format.";
  if (config.maxSizeBytes !== null && file.size > config.maxSizeBytes) return "Ukuran file melebihi batas yang dikonfigurasi.";
  return null;
}

export function createMockRegistrationService(): RegistrationService {
  return {
    async createDraft() {
      return { id: createId("draft") };
    },
    async updateDraft() {
      return;
    },
    async uploadRegistrationDocument(file, config) {
      const validationError = validateRegistrationDocument(file, config);
      if (validationError) throw new Error(validationError);
      const body = new FormData();
      body.set("file", file, file.name);
      body.set("documentId", config.id);
      const response = await fetch("/api/registration/documents", { method: "POST", body, cache: "no-store" });
      const result = await response.json() as RegistrationDocumentUploadResult & { message?: string };
      if (!response.ok) throw new Error(result.message ?? "File tidak dapat diproses.");
      return result;
    },
    async getApplication() {
      return null;
    },
    async submit(_draftId, registrationType, data) {
      return {
        registrationNumber: `DEMO-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        registrationType,
        programId: data.program.selectedProgramId,
        applicantName: data.personal.fullName?.trim() ?? "Peserta",
        status: "SUBMITTED",
        mode: "MOCK"
      };
    },
    async submitQuestion() {
      return { mode: "MOCK" };
    }
  };
}

export const registrationService = createMockRegistrationService();