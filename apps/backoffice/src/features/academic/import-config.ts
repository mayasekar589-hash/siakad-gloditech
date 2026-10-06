export type ImportModuleId =
  | "mahasiswa" | "dosen" | "program-studi" | "kurikulum" | "mata-kuliah" | "kelas-perkuliahan"
  | "jadwal" | "krs" | "nilai" | "presensi" | "kelulusan" | "wisuda" | "kalender-akademik";

export type ImportDuplicatePolicy = "SKIP_EXISTING" | "BLOCK_EXISTING";

export interface ImportFieldConfig {
  key: string;
  header: string;
  required: boolean;
  format: string;
  description: string;
  example?: string | number;
  enumValues?: readonly string[];
  reference?: "programs" | "lecturers" | "courses" | "curricula" | "offerings" | "students" | "ceremonies";
  systemGenerated?: boolean;
}

export interface ImportSheetConfig {
  name: string;
  fields: ImportFieldConfig[];
}

export interface ImportModuleConfig {
  id: ImportModuleId;
  title: string;
  filename: string;
  duplicatePolicy: ImportDuplicatePolicy;
  csv: boolean;
  sheets: ImportSheetConfig[];
  instructions: string[];
}

const field = (key: string, header: string, required: boolean, format: string, description: string, extra: Partial<ImportFieldConfig> = {}): ImportFieldConfig => ({ key, header, required, format, description, ...extra });
const academicYears = "YYYY/YYYY, contoh 2025/2026";
const semesterValues = ["GANJIL", "GENAP"] as const;
const studentStatuses = ["AKTIF", "CUTI", "NONAKTIF", "LULUS", "DROP_OUT"] as const;
const activeStatuses = ["AKTIF", "NONAKTIF"] as const;
const calendarCategories = ["KULIAH", "KRS", "UTS", "UAS", "REGISTRASI", "LIBUR", "WISUDA", "PENERIMAAN_MAHASISWA", "DEADLINE", "LAINNYA"] as const;
const calendarStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const importInstructions = [
  "Urutan import: Program Studi, Dosen, Mata Kuliah, Mahasiswa, Kurikulum, Kelas Perkuliahan, Jadwal, KRS, Presensi, Nilai, Kelulusan, Wisuda, Kalender Akademik.",
  "Gunakan kode/NIM/NIDN sebagai referensi; nama hanya untuk tampilan.",
  "Periksa semua error pada preview. Baris error tidak dapat diimport; baris valid dapat diproses parsial dan hasilnya dicatat.",
  "Duplikat existing akan dilewati untuk data master tertentu. KRS, nilai, presensi, kelulusan, dan peserta wisuda menolak duplikat.",
  "Status nilai hasil import selalu DRAFT. Status kelulusan LULUS hanya diterima jika seluruh aturan akademik terpenuhi.",
  "Tanggal memakai YYYY-MM-DD dan jam memakai HH:mm. Jangan mengisi kolom SYSTEM GENERATED."
];

const statusField = (key = "status", header = "Status *", values: readonly string[] = activeStatuses): ImportFieldConfig => field(key, header, true, values.join(" | "), "Pilih salah satu nilai referensi.", { enumValues: values, example: values[0] });
const programField = () => field("programCode", "Kode Program Studi *", true, "Text", "Harus cocok dengan kode Program Studi yang sudah terdaftar.", { reference: "programs", example: "D3-NAU" });

export const importConfigs: Record<ImportModuleId, ImportModuleConfig> = {
  mahasiswa: {
    id: "mahasiswa", title: "Mahasiswa", filename: "mahasiswa_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("nim", "NIM *", true, "Text", "Nomor induk unik; simpan sebagai teks.", { example: "202601001" }),
      field("nik", "NIK", false, "Text 16 digit", "Nomor induk kependudukan."),
      field("name", "Nama Lengkap *", true, "Text", "Nama resmi mahasiswa.", { example: "Alya Putri" }),
      field("nickname", "Nama Panggilan", false, "Text", "Nama panggilan."),
      field("birthPlace", "Tempat Lahir", false, "Text", "Kota/kabupaten tempat lahir."),
      field("birthDate", "Tanggal Lahir", false, "YYYY-MM-DD", "Contoh 2007-03-21."),
      field("gender", "Jenis Kelamin", false, "L / P", "Gunakan L atau P.", { enumValues: ["L", "P"] }),
      field("religion", "Agama", false, "Text", "Agama mahasiswa."),
      field("email", "Email", false, "Email", "Alamat email aktif."),
      field("phone", "Nomor HP", false, "Text", "Nomor telepon; simpan sebagai teks."),
      field("address", "Alamat", false, "Text", "Alamat jalan."),
      field("province", "Provinsi", false, "Text", "Provinsi."),
      field("regency", "Kota/Kabupaten", false, "Text", "Kota atau kabupaten."),
      field("district", "Kecamatan", false, "Text", "Kecamatan."),
      field("village", "Kelurahan", false, "Text", "Kelurahan atau desa."),
      field("postalCode", "Kode Pos", false, "Text", "Kode pos."),
      programField(),
      field("cohort", "Angkatan *", true, "Integer YYYY", "Tahun angkatan.", { example: 2026 }),
      field("semester", "Semester", false, "Integer 1-8", "Semester berjalan; default 1 bila kosong."),
      field("className", "Kelas", false, "Text", "Nama rombongan kelas."),
      statusField("status", "Status *", studentStatuses)
    ] }]
  },
  dosen: {
    id: "dosen", title: "Dosen", filename: "dosen_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("nidn", "NIDN *", true, "Text", "Nomor induk dosen nasional; kunci duplikat.", { example: "0012047801" }),
      field("nip", "NIP", false, "Text", "Nomor induk pegawai."),
      field("name", "Nama Lengkap *", true, "Text", "Nama dosen.", { example: "Ahmad Fauzi" }),
      field("titleFront", "Gelar Depan", false, "Text", "Gelar sebelum nama."),
      field("titleBack", "Gelar Belakang", false, "Text", "Gelar setelah nama."),
      field("email", "Email", false, "Email", "Email dosen."),
      field("phone", "Nomor HP", false, "Text", "Nomor telepon."),
      programField(), statusField()
    ] }]
  },
  "program-studi": {
    id: "program-studi", title: "Program Studi", filename: "program_studi_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("code", "Kode Program Studi *", true, "Text", "Kode unik yang menjadi referensi modul lain.", { example: "D3-NAU" }),
      field("name", "Nama Program Studi *", true, "Text", "Nama resmi program studi."),
      field("degree", "Jenjang *", true, "D-III / D-IV / S-1", "Jenjang program.", { enumValues: ["D-III", "D-IV", "S-1"], example: "D-III" }),
      field("unit", "Unit/Fakultas", false, "Text", "Unit institusi."),
      field("headLecturerNidn", "NIDN Ketua Program Studi", false, "Text", "NIDN dosen yang sudah terdaftar.", { reference: "lecturers" }),
      statusField()
    ] }]
  },
  kurikulum: {
    id: "kurikulum", title: "Kurikulum", filename: "kurikulum_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: false, instructions: importInstructions,
    sheets: [
      { name: "KURIKULUM", fields: [
        field("code", "Kode Kurikulum *", true, "Text", "Kode unik kurikulum.", { example: "KUR-NAU-2026" }), programField(),
        field("name", "Nama Kurikulum *", true, "Text", "Nama kurikulum."),
        field("effectiveYear", "Tahun Mulai Berlaku *", true, "Integer YYYY", "Tahun mulai berlaku."),
        field("endYear", "Tahun Selesai Berlaku", false, "Integer YYYY", "Kosongkan jika belum ditentukan."),
        statusField("status", "Status *", ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"])
      ] },
      { name: "KURIKULUM_MATA_KULIAH", fields: [
        field("curriculumCode", "Kode Kurikulum *", true, "Text", "Kode kurikulum pada sheet KURIKULUM.", { reference: "curricula" }),
        field("courseCode", "Kode Mata Kuliah *", true, "Text", "Kode mata kuliah yang telah terdaftar.", { reference: "courses" }),
        field("semester", "Semester *", true, "Integer 1-8", "Semester mata kuliah dalam kurikulum."),
        field("nature", "Sifat *", true, "WAJIB / PILIHAN", "Sifat mata kuliah.", { enumValues: ["WAJIB", "PILIHAN"], example: "WAJIB" }),
        field("credits", "SKS *", true, "Integer 1+", "SKS yang ditetapkan pada kurikulum.")
      ] }
    ]
  },
  "mata-kuliah": {
    id: "mata-kuliah", title: "Mata Kuliah", filename: "mata_kuliah_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("code", "Kode Mata Kuliah *", true, "Text", "Kode unik mata kuliah.", { example: "NAU401" }),
      field("name", "Nama Mata Kuliah *", true, "Text", "Nama mata kuliah."),
      field("credits", "SKS *", true, "Integer 1+", "Bobot SKS."),
      field("semester", "Semester Default", false, "Integer 1-8", "Semester default katalog; kurikulum tetap menjadi penempatan resmi."),
      programField(),
      field("kind", "Jenis *", true, "WAJIB / PILIHAN / PRAKTIKUM", "Jenis mata kuliah.", { enumValues: ["WAJIB", "PILIHAN", "PRAKTIKUM"], example: "WAJIB" }),
      field("description", "Deskripsi", false, "Text", "Deskripsi mata kuliah."),
      statusField()
    ] }]
  },
  "kelas-perkuliahan": {
    id: "kelas-perkuliahan", title: "Kelas Perkuliahan", filename: "kelas_perkuliahan_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026.", { example: "2025/2026" }),
      field("term", "Semester *", true, "GANJIL / GENAP", "Semester akademik.", { enumValues: semesterValues, example: "GENAP" }), programField(),
      field("courseCode", "Kode Mata Kuliah *", true, "Text", "Kode mata kuliah terdaftar.", { reference: "courses" }),
      field("code", "Kode Kelas *", true, "Text", "Kode unik penawaran kelas.", { example: "NAU401-4A-2526" }),
      field("lecturerNidn", "NIDN Dosen *", true, "Text", "NIDN dosen pengampu.", { reference: "lecturers" }),
      field("capacity", "Kapasitas", false, "Integer 1+", "Default 30 bila kosong."), statusField("status", "Status *", ["OPEN", "ACTIVE", "CLOSED"])
    ] }]
  },
  jadwal: {
    id: "jadwal", title: "Jadwal", filename: "jadwal_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."),
      field("term", "Semester *", true, "GANJIL / GENAP", "Semester akademik.", { enumValues: semesterValues }),
      field("offeringCode", "Kode Kelas *", true, "Text", "Kode kelas yang telah terdaftar.", { reference: "offerings" }),
      field("day", "Hari *", true, "Senin-Sabtu", "Hari perkuliahan."),
      field("start", "Jam Mulai *", true, "HH:mm", "Waktu 24 jam."), field("end", "Jam Selesai *", true, "HH:mm", "Harus setelah jam mulai."),
      field("room", "Ruang *", true, "Text", "Nama ruang."), field("lecturerNidn", "NIDN Dosen *", true, "Text", "NIDN dosen kelas tersebut.", { reference: "lecturers" }),
      statusField("status", "Status *", ["CONFIRMED"])
    ] }]
  },
  krs: {
    id: "krs", title: "KRS", filename: "krs_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."), field("term", "Semester *", true, "GANJIL / GENAP", "Semester akademik.", { enumValues: semesterValues }),
      field("nim", "NIM *", true, "Text", "NIM mahasiswa terdaftar.", { reference: "students" }), field("courseCode", "Kode Mata Kuliah *", true, "Text", "Kode mata kuliah."),
      field("offeringCode", "Kode Kelas *", true, "Text", "Kode kelas yang menawarkan mata kuliah.", { reference: "offerings" }),
      statusField("status", "Status *", ["DRAFT", "DIAJUKAN", "DISETUJUI", "DITOLAK"])
    ] }]
  },
  nilai: {
    id: "nilai", title: "Nilai", filename: "nilai_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."), field("term", "Semester *", true, "GANJIL / GENAP", "Semester akademik.", { enumValues: semesterValues }),
      field("nim", "NIM *", true, "Text", "NIM mahasiswa.", { reference: "students" }), field("courseCode", "Kode Mata Kuliah *", true, "Text", "Kode mata kuliah."),
      field("offeringCode", "Kode Kelas *", true, "Text", "Kode kelas.", { reference: "offerings" }), field("assignment", "Nilai Tugas", false, "Angka 0-100", "Komponen bobot 30%."),
      field("midterm", "Nilai UTS", false, "Angka 0-100", "Komponen bobot 30%."), field("finalExam", "Nilai UAS", false, "Angka 0-100", "Komponen bobot 40%."),
      field("finalScore", "Nilai Akhir", false, "SYSTEM GENERATED", "Dihitung 30% tugas + 30% UTS + 40% UAS.", { systemGenerated: true }),
      field("grade", "Grade", false, "SYSTEM GENERATED", "Ditentukan dari nilai akhir.", { systemGenerated: true }),
      field("status", "Status", false, "DRAFT", "Nilai hasil import selalu berstatus DRAFT.", { enumValues: ["DRAFT"], example: "DRAFT" })
    ] }]
  },
  presensi: {
    id: "presensi", title: "Presensi", filename: "presensi_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."), field("term", "Semester *", true, "GANJIL / GENAP", "Semester akademik.", { enumValues: semesterValues }),
      field("offeringCode", "Kode Kelas *", true, "Text", "Kode kelas.", { reference: "offerings" }), field("nim", "NIM *", true, "Text", "NIM yang terdaftar pada kelas.", { reference: "students" }),
      field("meetingNumber", "Pertemuan Ke *", true, "Integer 1+", "Nomor pertemuan yang harus tersedia pada jadwal kelas."), field("date", "Tanggal *", true, "YYYY-MM-DD", "Tanggal pertemuan."),
      field("status", "Status *", true, "HADIR / IZIN / SAKIT / ALPA", "Status kehadiran.", { enumValues: ["HADIR", "IZIN", "SAKIT", "ALPA"], example: "HADIR" }),
      field("note", "Keterangan", false, "Text", "Catatan presensi.")
    ] }]
  },
  kelulusan: {
    id: "kelulusan", title: "Kelulusan", filename: "kelulusan_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("nim", "NIM *", true, "Text", "NIM mahasiswa.", { reference: "students" }), field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."),
      field("status", "Status Kelulusan *", true, "BELUM_MEMENUHI / MEMENUHI_SYARAT / MENUNGGU_VERIFIKASI / LULUS", "LULUS hanya jika rule akademik terpenuhi.", { enumValues: ["BELUM_MEMENUHI", "MEMENUHI_SYARAT", "MENUNGGU_VERIFIKASI", "LULUS"] }),
      field("verifiedAt", "Tanggal Verifikasi", false, "YYYY-MM-DD", "Tanggal verifikasi administratif."), field("note", "Catatan", false, "Text", "Catatan verifikasi.")
    ] }]
  },
  wisuda: {
    id: "wisuda", title: "Peserta Wisuda", filename: "wisuda_peserta_template.xlsx", duplicatePolicy: "BLOCK_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("ceremonyCode", "Kode Periode Wisuda *", true, "Text", "Kode periode; tidak menggunakan nama bebas.", { reference: "ceremonies" }),
      field("nim", "NIM *", true, "Text", "NIM mahasiswa yang memenuhi syarat kelulusan.", { reference: "students" }),
      field("status", "Status Peserta", false, "REGISTERED", "Status peserta; default REGISTERED.", { enumValues: ["REGISTERED"], example: "REGISTERED" }), field("registrationDate", "Tanggal Pendaftaran", false, "YYYY-MM-DD", "Tanggal registrasi."),
      field("note", "Catatan", false, "Text", "Catatan administrasi.")
    ] }]
  },
  "kalender-akademik": {
    id: "kalender-akademik", title: "Kalender Akademik", filename: "kalender_akademik_template.xlsx", duplicatePolicy: "SKIP_EXISTING", csv: true, instructions: importInstructions,
    sheets: [{ name: "DATA", fields: [
      field("academicYear", "Tahun Akademik *", true, academicYears, "Contoh 2025/2026."), field("title", "Judul *", true, "Text", "Judul agenda."),
      field("category", "Kategori *", true, calendarCategories.join(" / "), "Pilih kategori referensi.", { enumValues: calendarCategories }),
      field("start", "Tanggal Mulai *", true, "YYYY-MM-DD", "Tanggal mulai."), field("end", "Tanggal Selesai", false, "YYYY-MM-DD", "Kosongkan untuk kegiatan satu hari."),
      field("description", "Deskripsi", false, "Text", "Deskripsi agenda."), field("audience", "Target/Audience", false, "Text", "Audiens kegiatan."), statusField("status", "Status *", calendarStatuses)
    ] }]
  }
};

export const importModuleOrder: ImportModuleId[] = ["program-studi", "dosen", "mata-kuliah", "mahasiswa", "kurikulum", "kelas-perkuliahan", "jadwal", "krs", "presensi", "nilai", "kelulusan", "wisuda", "kalender-akademik"];

export const importPermissionCodes: Record<ImportModuleId, string> = {
  mahasiswa: "student.import", dosen: "lecturer.import", "program-studi": "program.import", kurikulum: "curriculum.import",
  "mata-kuliah": "course.import", "kelas-perkuliahan": "class.import", jadwal: "schedule.import", krs: "krs.import",
  nilai: "grade.import", presensi: "attendance.import", kelulusan: "graduation.import", wisuda: "ceremony.import", "kalender-akademik": "calendar.import"
};

const configuredImportLimit = Number(process.env.NEXT_PUBLIC_IMPORT_MAX_FILE_SIZE_BYTES);
export const maxImportFileSizeBytes = Number.isSafeInteger(configuredImportLimit) && configuredImportLimit > 0 ? configuredImportLimit : 10 * 1024 * 1024;
