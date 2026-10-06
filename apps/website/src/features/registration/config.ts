import { programs as publicPrograms } from "@/lib/constants";
import { sipencatarRequirements } from "@/features/registration/data/admission-requirements";
import { sipencatarSchedules } from "@/features/registration/data/admission-schedules";
import type { AdmissionDocumentConfig, AdmissionProgram, RegistrationConfiguration, RegistrationField, RegistrationStepKey, RegistrationType } from "@/features/registration/types";

const genderOptions = [
  { label: "Laki-laki", value: "LAKI_LAKI" },
  { label: "Perempuan", value: "PEREMPUAN" }
] as const;

const maritalOptions = [
  { label: "Belum menikah", value: "BELUM_MENIKAH" },
  { label: "Menikah", value: "MENIKAH" },
  { label: "Lainnya", value: "LAINNYA" }
] as const;

const schoolOptions = [
  { label: "SMA", value: "SMA" },
  { label: "SMK", value: "SMK" },
  { label: "MA", value: "MA" },
  { label: "Lainnya", value: "LAINNYA" }
] as const;

const religionOptions = ["Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Khonghucu", "Lainnya"].map((value) => ({ label: value, value }));

export const registrationSystemMaxUploadBytes = 10 * 1024 * 1024;

export const baseDocuments: readonly AdmissionDocumentConfig[] = [
  { id: "photo", label: "Pas foto", required: false, acceptedTypes: ["image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes, description: "Dokumen opsional sampai persyaratan periode dikonfigurasi." },
  { id: "identity", label: "KTP / identitas", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "family-card", label: "Kartu Keluarga", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "birth-certificate", label: "Akta kelahiran", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "diploma", label: "Ijazah", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "transcript", label: "Daftar nilai", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "additional", label: "Dokumen tambahan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes }
];

const polaDocuments: readonly AdmissionDocumentConfig[] = [
  ...baseDocuments,
  { id: "marital-statement", label: "Surat keterangan status perkawinan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "declaration", label: "Surat pernyataan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "financial-capability", label: "Dokumen kemampuan biaya pendidikan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes }
];

const nonPolaDocuments: readonly AdmissionDocumentConfig[] = [
  ...baseDocuments,
  { id: "declaration", label: "Surat pernyataan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "financial-capability", label: "Dokumen kemampuan biaya pendidikan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes }
];

const diklatDocuments: readonly AdmissionDocumentConfig[] = [
  ...baseDocuments.filter((document) => document.id !== "family-card" && document.id !== "birth-certificate"),
  { id: "seafarer-book", label: "Buku pelaut", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "seafarer-certificate", label: "Sertifikat kompetensi", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes },
  { id: "company-letter", label: "Surat dari perusahaan", required: false, acceptedTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: registrationSystemMaxUploadBytes }
];

export const paymentProofDocument: AdmissionDocumentConfig = {
  id: "payment-proof",
  label: "Bukti pembayaran",
  required: false,
  acceptedTypes: ["application/pdf", "image/jpeg", "image/png"],
  maxSizeBytes: registrationSystemMaxUploadBytes,
  description: "Unggah hanya setelah menerima instruksi pembayaran resmi."
};

const personalFields: readonly RegistrationField[] = [
  { id: "nik", label: "NIK", kind: "text", required: true, validation: "nik", placeholder: "16 digit NIK" },
  { id: "familyCardNumber", label: "Nomor KK", kind: "text", required: true, validation: "nik", placeholder: "16 digit nomor KK" },
  { id: "fullName", label: "Nama lengkap", kind: "text", required: true },
  { id: "preferredName", label: "Nama panggilan", kind: "text", required: false },
  { id: "birthPlace", label: "Tempat lahir", kind: "text", required: true },
  { id: "birthDate", label: "Tanggal lahir", kind: "date", required: true },
  { id: "gender", label: "Jenis kelamin", kind: "select", required: true, options: genderOptions },
  { id: "religion", label: "Agama", kind: "select", required: false, options: religionOptions },
  { id: "maritalStatus", label: "Status perkawinan", kind: "select", required: false, options: maritalOptions },
  { id: "phone", label: "Nomor HP", kind: "tel", required: true, validation: "phone", placeholder: "+62..." },
  { id: "email", label: "Email", kind: "email", required: true, placeholder: "nama@email.com" },
  { id: "address", label: "Alamat lengkap", kind: "textarea", required: true },
  { id: "province", label: "Provinsi", kind: "text", required: true },
  { id: "city", label: "Kabupaten / kota", kind: "text", required: true },
  { id: "district", label: "Kecamatan", kind: "text", required: true },
  { id: "village", label: "Kelurahan / desa", kind: "text", required: true },
  { id: "postalCode", label: "Kode pos", kind: "text", required: true, validation: "postal" }
];

const parentFields: readonly RegistrationField[] = [
  { id: "father.name", label: "Nama ayah", kind: "text", required: false },
  { id: "father.nik", label: "NIK ayah", kind: "text", required: false, validation: "nik" },
  { id: "father.occupation", label: "Pekerjaan ayah", kind: "text", required: false },
  { id: "father.phone", label: "Nomor HP ayah", kind: "tel", required: false, validation: "phone" },
  { id: "mother.name", label: "Nama ibu", kind: "text", required: false },
  { id: "mother.nik", label: "NIK ibu", kind: "text", required: false, validation: "nik" },
  { id: "mother.occupation", label: "Pekerjaan ibu", kind: "text", required: false },
  { id: "mother.phone", label: "Nomor HP ibu", kind: "tel", required: false, validation: "phone" },
  { id: "guardian.name", label: "Nama wali", kind: "text", required: false, visibleWhen: { field: "hasGuardian", equals: "true" } },
  { id: "guardian.relationship", label: "Hubungan dengan peserta", kind: "text", required: false, visibleWhen: { field: "hasGuardian", equals: "true" } },
  { id: "guardian.phone", label: "Nomor HP wali", kind: "tel", required: false, validation: "phone", visibleWhen: { field: "hasGuardian", equals: "true" } },
  { id: "guardian.address", label: "Alamat wali", kind: "textarea", required: false, visibleWhen: { field: "hasGuardian", equals: "true" } }
];

const educationFields: readonly RegistrationField[] = [
  { id: "schoolName", label: "Nama sekolah", kind: "text", required: true },
  { id: "schoolType", label: "Jenis sekolah", kind: "select", required: true, options: schoolOptions },
  { id: "major", label: "Jurusan", kind: "text", required: false },
  { id: "graduationYear", label: "Tahun lulus", kind: "text", required: true, validation: "year", placeholder: "YYYY" },
  { id: "certificateNumber", label: "Nomor ijazah", kind: "text", required: false },
  { id: "averageGrade", label: "Nilai rata-rata", kind: "number", required: false, validation: "positive-number" }
];

export const admissionPrograms: readonly AdmissionProgram[] = publicPrograms.map(({ slug, name }) => ({ id: slug, name, code: slug.toUpperCase(), active: true }));

const sipencatarProgramFields: readonly RegistrationField[] = [
  { id: "selectedProgramId", label: "Program studi pilihan", kind: "select", required: true, options: admissionPrograms.map((program) => ({ label: program.name, value: program.id })) }
];

const physicalFields: readonly RegistrationField[] = [
  { id: "heightCm", label: "Tinggi badan (cm)", kind: "number", required: true, validation: "positive-number" },
  { id: "weightKg", label: "Berat badan (kg)", kind: "number", required: true, validation: "positive-number" },
  { id: "bloodType", label: "Golongan darah", kind: "select", required: false, options: ["A", "B", "AB", "O", "Belum diketahui"].map((value) => ({ label: value, value })) }
];

const programFields: readonly RegistrationField[] = [
  { id: "programType", label: "Jenis diklat", kind: "text", required: true, placeholder: "Masukkan jenis diklat" },
  { id: "programName", label: "Nama program", kind: "text", required: true, placeholder: "Masukkan nama program" },
  { id: "period", label: "Periode", kind: "text", required: false, placeholder: "Belum dikonfigurasi" },
  { id: "date", label: "Tanggal", kind: "date", required: false },
  { id: "location", label: "Lokasi", kind: "text", required: false, placeholder: "Belum dikonfigurasi" }
];

const professionalFields: readonly RegistrationField[] = [
  { id: "hasSeafarerDocuments", label: "Apakah Anda memiliki data buku pelaut atau sertifikat?", kind: "select", required: true, options: [{ label: "Ya", value: "YA" }, { label: "Tidak", value: "TIDAK" }] },
  { id: "seafarerBookNumber", label: "Nomor buku pelaut", kind: "text", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } },
  { id: "certificateNumber", label: "Nomor sertifikat", kind: "text", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } },
  { id: "rank", label: "Jabatan / rank", kind: "text", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } },
  { id: "companyName", label: "Nama perusahaan", kind: "text", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } },
  { id: "seafarerNumber", label: "Nomor pelaut", kind: "text", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } },
  { id: "certificateExpiry", label: "Masa berlaku sertifikat", kind: "date", required: false, visibleWhen: { field: "hasSeafarerDocuments", equals: "YA" } }
];

const diklatPersonalFields: readonly RegistrationField[] = [
  ...personalFields.filter((field) => ["fullName", "nik", "birthPlace", "birthDate", "gender", "phone", "email", "address", "province", "city", "district", "village", "postalCode"].includes(field.id))
];

const registrationSteps: Record<RegistrationType, readonly RegistrationStepKey[]> = {
  POLA_PEMBIBITAN: ["personal", "parent", "education", "program", "physical", "documents", "confirmation"],
  NON_POLA_PEMBIBITAN: ["personal", "parent", "education", "program", "documents", "payment", "confirmation"],
  DIKLAT: ["program", "personal", "professional", "documents", "payment", "confirmation"]
};

function createConfiguration(registrationType: RegistrationType, title: string, description: string): RegistrationConfiguration {
  const isDiklat = registrationType === "DIKLAT";
  const isPola = registrationType === "POLA_PEMBIBITAN";

  return {
    registrationType,
    title,
    description,
    steps: registrationSteps[registrationType],
    period: null,
    programs: isDiklat ? [] : admissionPrograms,
    requirements: isDiklat ? [] : sipencatarRequirements,
    documents: isDiklat ? diklatDocuments : isPola ? polaDocuments : nonPolaDocuments,
    fees: [],
    schedules: isDiklat ? [] : sipencatarSchedules,
    fields: {
      personal: isDiklat ? diklatPersonalFields : personalFields,
      parent: isDiklat ? [] : parentFields,
      education: isDiklat ? [] : educationFields,
      physical: isPola ? physicalFields : [],
      program: isDiklat ? programFields : sipencatarProgramFields,
      professional: isDiklat ? professionalFields : [],
      documents: [],
      payment: [],
      confirmation: []
    }
  };
}

export const registrationConfig: Record<RegistrationType, RegistrationConfiguration> = {
  POLA_PEMBIBITAN: createConfiguration("POLA_PEMBIBITAN", "Jalur Pola Pembibitan", "Penerimaan calon taruna melalui jalur pola pembibitan Kementerian Perhubungan."),
  NON_POLA_PEMBIBITAN: createConfiguration("NON_POLA_PEMBIBITAN", "Jalur Non Pola Pembibitan", "Penerimaan calon taruna melalui jalur mandiri (non pola pembibitan)."),
  DIKLAT: createConfiguration("DIKLAT", "Pendaftaran Diklat", "Pendidikan dan pelatihan untuk pengembangan kompetensi di sektor transportasi.")
};

export const registrationStepLabels: Record<RegistrationStepKey, string> = {
  program: "Program",
  personal: "Data peserta",
  parent: "Orang tua / wali",
  education: "Pendidikan",
  physical: "Data fisik",
  professional: "Profesional",
  documents: "Dokumen",
  payment: "Pembayaran",
  confirmation: "Konfirmasi"
};

export const informationCategories = ["Persyaratan", "Jadwal", "Program Studi", "Biaya", "Dokumen", "Lainnya"] as const;