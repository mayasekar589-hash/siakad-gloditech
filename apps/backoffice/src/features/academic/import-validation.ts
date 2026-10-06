import type { AcademicCollection, AcademicWorkspaceData, KrsRecord } from "./domain";
import { importConfigs, type ImportFieldConfig, type ImportModuleId } from "./import-config";
import type { AcademicRow } from "./workspace";
import type { UploadedSheet } from "./spreadsheet";

export interface ImportIssue {
  row: number;
  sheet: string;
  column: string;
  value: string;
  message: string;
  suggestedFix: string;
}

export interface ImportReadyRow {
  rowNumber: number;
  sheetName: string;
  values: Record<string, unknown>;
  state: "VALID" | "WARNING" | "ERROR" | "SKIPPED";
  errors: ImportIssue[];
  warnings: ImportIssue[];
  payload?: { collection: AcademicCollection; record: AcademicRow; duplicateKey: string };
}

export interface ImportPreview {
  moduleId: ImportModuleId;
  rows: ImportReadyRow[];
  validCount: number;
  warningCount: number;
  errorCount: number;
  skippedCount: number;
}

const normalizedHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLocaleLowerCase("id").replace(/\s*\*$/, "").replace(/[\s_]+/g, " ");
const normalizedCode = (value: unknown) => String(value ?? "").trim().toLocaleUpperCase("id");
const stringValue = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").trim();
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

function issue(row: number, sheet: string, column: string, value: unknown, message: string, suggestedFix: string): ImportIssue {
  return { row, sheet, column, value: stringValue(value), message, suggestedFix };
}

function resolveValue(field: ImportFieldConfig, rawValue: unknown, row: number, sheet: string, errors: ImportIssue[], warnings: ImportIssue[]) {
  if (rawValue === "__FORMULA_CELL_NOT_ALLOWED__") {
    errors.push(issue(row, sheet, field.header, "formula", "Formula spreadsheet tidak diterima sebagai nilai input.", "Tempel hasil sebagai nilai biasa lalu unggah ulang."));
    return "";
  }
  if (rawValue === undefined || rawValue === null || stringValue(rawValue) === "") {
    if (field.required && !field.systemGenerated) errors.push(issue(row, sheet, field.header, rawValue, "Kolom wajib belum diisi.", `Isi ${field.header.replace(/\s\*$/, "")} sebelum import.`));
    return "";
  }
  if (field.systemGenerated) return rawValue;

  if (field.format.startsWith("Text") && typeof rawValue === "number") {
    errors.push(issue(row, sheet, field.header, rawValue, "Identifier harus bertipe teks agar angka nol di depan tidak hilang.", "Ubah format sel menjadi Text dan isi ulang nilai dari sumber asli."));
    return String(rawValue);
  }

  const value = stringValue(rawValue);
  if (field.enumValues) {
    const enumValue = value.toLocaleUpperCase("id");
    if (!field.enumValues.includes(enumValue)) errors.push(issue(row, sheet, field.header, value, "Nilai tidak ada pada daftar referensi.", `Gunakan salah satu: ${field.enumValues.join(", ")}.`));
    return enumValue;
  }
  if (field.format.startsWith("Integer")) {
    const parsed = Number(value);
    const bounds = field.format.match(/(\d+)-(\d+)/);
    const minimum = Number(bounds?.[1] ?? field.format.match(/(\d+)\+/)?.[1] ?? 0);
    if (!Number.isInteger(parsed) || parsed < minimum || (bounds && parsed > Number(bounds[2]))) {
      errors.push(issue(row, sheet, field.header, value, "Nilai harus berupa bilangan bulat dalam rentang yang ditentukan.", `Gunakan format ${field.format}.`));
    }
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.format.startsWith("Angka")) {
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) errors.push(issue(row, sheet, field.header, value, "Nilai harus berupa angka 0 sampai 100.", "Masukkan nilai numerik tanpa simbol persen."));
    return Number.isFinite(parsed) ? parsed : value;
  }
  if (field.format.startsWith("YYYY-MM-DD")) {
    const iso = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number.isNaN(Date.parse(`${iso}T00:00:00Z`)) || new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) !== iso) {
      errors.push(issue(row, sheet, field.header, value, "Tanggal tidak valid atau tidak memakai format YYYY-MM-DD.", "Contoh format yang diterima: 2026-08-17."));
    }
    return iso;
  }
  if (field.format === "HH:mm") {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) errors.push(issue(row, sheet, field.header, value, "Jam tidak valid.", "Gunakan format 24 jam HH:mm, contoh 08:30."));
    return value;
  }
  if (field.format.startsWith("YYYY/YYYY")) {
    const match = value.match(/^(\d{4})\/(\d{4})$/);
    if (!match || Number(match[2]) !== Number(match[1]) + 1) errors.push(issue(row, sheet, field.header, value, "Tahun akademik tidak valid.", "Gunakan dua tahun berurutan dalam format YYYY/YYYY, contoh 2025/2026."));
    return value;
  }
  if (field.format === "Integer YYYY" && (!/^\d{4}$/.test(value) || Number(value) < 1900)) errors.push(issue(row, sheet, field.header, value, "Tahun harus empat digit dan tidak lebih awal dari 1900.", "Gunakan format YYYY."));
  if (field.format === "Email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(issue(row, sheet, field.header, value, "Alamat email tidak valid.", "Periksa kembali format alamat email."));
  if (field.key === "gender" && !["L", "P"].includes(value.toLocaleUpperCase("id"))) errors.push(issue(row, sheet, field.header, value, "Jenis kelamin harus L atau P.", "Gunakan L untuk laki-laki atau P untuk perempuan."));
  if (field.key === "nik" && !/^\d{16}$/.test(value)) errors.push(issue(row, sheet, field.header, value, "NIK harus terdiri dari 16 digit.", "Pastikan kolom NIK disimpan sebagai teks 16 digit."));
  if (field.key === "endYear" && value && Number(value) < 1900) errors.push(issue(row, sheet, field.header, value, "Tahun selesai tidak valid.", "Gunakan tahun empat digit atau kosongkan."));
  if (field.key === "endYear" && value && Number(value) < Number(field.key === "endYear" ? 0 : value)) warnings.push(issue(row, sheet, field.header, value, "Periksa rentang tahun kurikulum.", "Tahun selesai harus sama atau sesudah tahun mulai."));
  return value;
}

function findProgram(data: AcademicWorkspaceData, code: unknown) {
  return data.programs.find((item) => normalizedCode(item.code) === normalizedCode(code));
}
function findLecturer(data: AcademicWorkspaceData, nidn: unknown) {
  return data.lecturers.find((item) => normalizedCode(item.nidn) === normalizedCode(nidn));
}
function findCourse(data: AcademicWorkspaceData, code: unknown) {
  return data.courses.find((item) => normalizedCode(item.code) === normalizedCode(code));
}
function findStudent(data: AcademicWorkspaceData, nim: unknown) {
  return data.students.find((item) => normalizedCode(item.nim) === normalizedCode(nim));
}
function findOffering(data: AcademicWorkspaceData, code: unknown) {
  return data.offerings.find((item) => normalizedCode(item.code) === normalizedCode(code));
}
function findCeremony(data: AcademicWorkspaceData, code: unknown) {
  return data.ceremonies.find((item) => normalizedCode(item.code ?? item.id) === normalizedCode(code));
}

function addReferenceError(row: ImportReadyRow, field: string, value: unknown, message: string, suggestedFix: string) {
  row.errors.push(issue(row.rowNumber, row.sheetName, field, value, message, suggestedFix));
}
function addWarning(row: ImportReadyRow, field: string, value: unknown, message: string, suggestedFix: string) {
  row.warnings.push(issue(row.rowNumber, row.sheetName, field, value, message, suggestedFix));
}

function mapRow(moduleId: ImportModuleId, row: ImportReadyRow, data: AcademicWorkspaceData, previousRows: ImportReadyRow[]): ImportReadyRow["payload"] {
  const value = row.values;
  const statusText = normalizedCode(value.status);
  const program = value.programCode ? findProgram(data, value.programCode) : undefined;
  const student = value.nim ? findStudent(data, value.nim) : undefined;
  const course = value.courseCode ? findCourse(data, value.courseCode) : undefined;
  const offering = value.offeringCode ? findOffering(data, value.offeringCode) : undefined;
  const lecturer = value.lecturerNidn ? findLecturer(data, value.lecturerNidn) : undefined;
  const term = value.term as "GANJIL" | "GENAP" | undefined;
  const assertReference = (target: unknown, field: string, raw: unknown, label: string) => {
    if (!target) addReferenceError(row, field, raw, `${label} tidak ditemukan.`, "Gunakan kode referensi yang tersedia pada sheet REFERENSI atau impor data induk terlebih dahulu.");
  };

  switch (moduleId) {
    case "mahasiswa": {
      assertReference(program, "Kode Program Studi *", value.programCode, "Program Studi");
      if (!program) return undefined;
      return { collection: "students", duplicateKey: normalizedCode(value.nim), record: {
        id: newId("mhs"), nim: stringValue(value.nim), name: stringValue(value.name), nik: stringValue(value.nik) || undefined,
        nickname: stringValue(value.nickname) || undefined, birthPlace: stringValue(value.birthPlace) || undefined, birthDate: stringValue(value.birthDate) || undefined,
        gender: stringValue(value.gender).toLocaleUpperCase("id") || undefined, religion: stringValue(value.religion) || undefined,
        email: stringValue(value.email) || "", phone: stringValue(value.phone) || "", address: stringValue(value.address) || undefined,
        province: stringValue(value.province) || undefined, regency: stringValue(value.regency) || undefined, district: stringValue(value.district) || undefined,
        village: stringValue(value.village) || undefined, postalCode: stringValue(value.postalCode) || undefined,
        programId: program.id, cohort: Number(value.cohort), semester: Number(value.semester || 1), className: stringValue(value.className), status: statusText
      } };
    }
    case "dosen": {
      assertReference(program, "Kode Program Studi *", value.programCode, "Program Studi");
      if (!program) return undefined;
      const titleFront = stringValue(value.titleFront);
      const titleBack = stringValue(value.titleBack);
      return { collection: "lecturers", duplicateKey: normalizedCode(value.nidn), record: {
        id: newId("dosen"), nidn: stringValue(value.nidn), nip: stringValue(value.nip) || undefined, name: stringValue(value.name), titleFront, titleBack,
        title: [titleFront, titleBack].filter(Boolean).join(", "), email: stringValue(value.email) || undefined, phone: stringValue(value.phone), programId: program.id,
        status: statusText === "AKTIF" ? "ACTIVE" : "INACTIVE"
      } };
    }
    case "program-studi": {
      const head = value.headLecturerNidn ? findLecturer(data, value.headLecturerNidn) : undefined;
      if (value.headLecturerNidn && !head) addReferenceError(row, "NIDN Ketua Program Studi", value.headLecturerNidn, "NIDN dosen tidak ditemukan.", "Gunakan NIDN dosen yang sudah terdaftar.");
      return { collection: "programs", duplicateKey: normalizedCode(value.code), record: {
        id: newId("prodi"), code: stringValue(value.code), name: stringValue(value.name), degree: stringValue(value.degree), unit: stringValue(value.unit) || "Poltektrans SDP Palembang",
        headLecturerId: head?.id, status: statusText === "AKTIF" ? "ACTIVE" : "INACTIVE"
      } };
    }
    case "kurikulum": {
      const sheet = row.sheetName;
      if (sheet === "KURIKULUM") {
        assertReference(program, "Kode Program Studi *", value.programCode, "Program Studi");
        if (!program) return undefined;
        if (value.endYear && Number(value.endYear) < Number(value.effectiveYear)) addReferenceError(row, "Tahun Selesai Berlaku", value.endYear, "Tahun selesai lebih awal dari tahun mulai.", "Gunakan tahun selesai yang sama atau sesudah tahun mulai.");
        return { collection: "curricula", duplicateKey: normalizedCode(value.code), record: {
          id: newId("kur"), code: stringValue(value.code), programId: program.id, name: stringValue(value.name), effectiveYear: Number(value.effectiveYear),
          endYear: value.endYear ? Number(value.endYear) : undefined, status: statusText, courseIds: []
        } };
      }
      const existingCurriculum = data.curricula.find((item) => normalizedCode(item.code ?? item.id) === normalizedCode(value.curriculumCode));
      const importedCurriculum = previousRows.find((item) => item.sheetName === "KURIKULUM" && normalizedCode(item.values.code) === normalizedCode(value.curriculumCode) && item.payload?.collection === "curricula")?.payload?.record;
      const curriculum = existingCurriculum ?? importedCurriculum as (typeof data.curricula)[number] | undefined;
      const relatedCourse = findCourse(data, value.courseCode);
      assertReference(curriculum, "Kode Kurikulum *", value.curriculumCode, "Kurikulum");
      assertReference(relatedCourse, "Kode Mata Kuliah *", value.courseCode, "Mata Kuliah");
      if (!curriculum || !relatedCourse) return undefined;
      if (existingCurriculum) addReferenceError(row, "Kode Kurikulum *", value.curriculumCode, "Kurikulum sudah ada; import tidak menambahkan atau menimpa assignment kurikulum yang sudah berjalan.", "Buat kode kurikulum baru atau kelola assignment melalui workflow Kurikulum.");
      const parentRow = previousRows.find((item) => item.sheetName === "KURIKULUM" && normalizedCode(item.values.code) === normalizedCode(value.curriculumCode));
      if (parentRow?.state === "SKIPPED") addReferenceError(row, "Kode Kurikulum *", value.curriculumCode, "Kurikulum duplikat dilewati; detail sheet tidak dapat diterapkan ke data lama.", "Gunakan kode kurikulum baru untuk import relasi mata kuliah.");
      const curriculumProgramId = "programId" in curriculum ? curriculum.programId : "";
      if (relatedCourse.programId !== curriculumProgramId) addReferenceError(row, "Kode Mata Kuliah *", value.courseCode, "Mata kuliah berasal dari program studi yang berbeda.", "Pilih mata kuliah dari program studi kurikulum.");
      const assignment: AcademicRow = { id: `${curriculum.id}:${relatedCourse.id}`, curriculumId: curriculum.id, courseId: relatedCourse.id, semester: Number(value.semester), nature: value.nature, credits: Number(value.credits) };
      return { collection: "curriculumAssignments", duplicateKey: `${curriculum.id}:${relatedCourse.id}`, record: assignment };
    }
    case "mata-kuliah": {
      assertReference(program, "Kode Program Studi *", value.programCode, "Program Studi");
      if (!program) return undefined;
      const curriculumSemesters = data.curriculumAssignments.filter((item) => data.curricula.find((curriculum) => curriculum.id === item.curriculumId)?.programId === program.id && item.courseId === course?.id).map((item) => item.semester);
      const semester = Number(value.semester || 0) || (curriculumSemesters.length ? Math.min(...curriculumSemesters) : 1);
      if (!value.semester) addWarning(row, "Semester Default", "", "Semester default tidak disediakan; digunakan 1 sampai kurikulum menetapkan penempatan resmi.", "Isi semester default jika katalog Anda memerlukannya.");
      return { collection: "courses", duplicateKey: normalizedCode(value.code), record: {
        id: newId("mk"), code: stringValue(value.code), name: stringValue(value.name), credits: Number(value.credits), semester,
        programId: program.id, kind: value.kind, prerequisiteIds: [], description: stringValue(value.description) || undefined, status: statusText === "AKTIF" ? "ACTIVE" : "INACTIVE"
      } };
    }
    case "kelas-perkuliahan": {
      assertReference(program, "Kode Program Studi *", value.programCode, "Program Studi");
      assertReference(course, "Kode Mata Kuliah *", value.courseCode, "Mata Kuliah");
      assertReference(lecturer, "NIDN Dosen *", value.lecturerNidn, "Dosen");
      if (!program || !course || !lecturer) return undefined;
      if (course.programId !== program.id || lecturer.programId !== program.id) addReferenceError(row, "Kode Program Studi *", value.programCode, "Program Studi tidak cocok dengan mata kuliah atau dosen.", "Samakan program studi, mata kuliah, dan dosen pengampu.");
      if (Number(value.capacity || 30) < 1 || Number(value.capacity || 30) > 500) addReferenceError(row, "Kapasitas", value.capacity, "Kapasitas kelas harus 1 sampai 500.", "Masukkan kapasitas kelas dalam rentang 1-500.");
      return { collection: "offerings", duplicateKey: normalizedCode(value.code), record: {
        id: newId("kelas"), code: stringValue(value.code), courseId: course.id, lecturerId: lecturer.id, academicYear: stringValue(value.academicYear), term,
        className: stringValue(value.code), capacity: Number(value.capacity || 30), studentIds: [], status: statusText
      } };
    }
    case "jadwal": {
      const scheduledOffering = findOffering(data, value.offeringCode);
      assertReference(scheduledOffering, "Kode Kelas *", value.offeringCode, "Kelas");
      if (!scheduledOffering) return undefined;
      if (scheduledOffering.academicYear !== value.academicYear || scheduledOffering.term !== term) addReferenceError(row, "Semester / Tahun Akademik", `${value.academicYear} ${term}`, "Kelas tidak termasuk periode akademik yang dipilih.", "Pilih periode yang sama dengan penawaran kelas.");
      if (stringValue(value.start) >= stringValue(value.end)) addReferenceError(row, "Jam Selesai *", value.end, "Jam selesai harus setelah jam mulai.", "Periksa rentang waktu HH:mm.");
      if (scheduledOffering.lecturerId !== lecturer?.id) addReferenceError(row, "NIDN Dosen *", value.lecturerNidn, "Dosen tidak sesuai dengan dosen pengampu kelas.", "Gunakan NIDN yang tercatat pada kelas.");
      assertReference(lecturer, "NIDN Dosen *", value.lecturerNidn, "Dosen");
      const candidate = { offeringId: scheduledOffering.id, day: stringValue(value.day), start: stringValue(value.start), end: stringValue(value.end), room: stringValue(value.room), status: "CONFIRMED" };
      const priorSchedules = [...data.schedules, ...previousRows.flatMap((item) => item.state !== "ERROR" && item.state !== "SKIPPED" && item.payload?.collection === "schedules" ? [item.payload.record as unknown as (typeof data.schedules)[number]] : [])];
      const conflict = priorSchedules.find((item) => {
        const priorOffering = data.offerings.find((entry) => entry.id === item.offeringId);
        return item.day === candidate.day && candidate.start < item.end && item.start < candidate.end
          && (item.room.toLocaleLowerCase("id") === candidate.room.toLocaleLowerCase("id") || priorOffering?.lecturerId === scheduledOffering.lecturerId || item.offeringId === scheduledOffering.id);
      });
      if (conflict) addReferenceError(row, "Jam / Ruang / Dosen", `${candidate.day} ${candidate.start}-${candidate.end} ${candidate.room}`, "Jadwal bentrok dengan penggunaan ruang, dosen, atau kelas lain.", "Pilih waktu atau ruang yang tidak beririsan; benturan tidak dapat diimport.");
      return { collection: "schedules", duplicateKey: `${scheduledOffering.id}:${candidate.day}:${candidate.start}:${candidate.end}`, record: { id: newId("jadwal"), ...candidate } };
    }
    case "krs": {
      assertReference(student, "NIM *", value.nim, "Mahasiswa");
      assertReference(course, "Kode Mata Kuliah *", value.courseCode, "Mata Kuliah");
      assertReference(offering, "Kode Kelas *", value.offeringCode, "Kelas");
      if (!student || !course || !offering) return undefined;
      if (student.status !== "AKTIF") addReferenceError(row, "NIM *", value.nim, "Mahasiswa tidak berstatus AKTIF.", "KRS hanya dapat diimport untuk mahasiswa aktif.");
      if (offering.courseId !== course.id) addReferenceError(row, "Kode Kelas *", value.offeringCode, "Kelas tidak menawarkan mata kuliah yang dipilih.", "Cocokkan Kode Mata Kuliah dan Kode Kelas.");
      if (offering.academicYear !== value.academicYear || offering.term !== term) addReferenceError(row, "Semester / Tahun Akademik", `${value.academicYear} ${term}`, "Kelas tidak termasuk periode akademik yang dipilih.", "Pilih periode yang sama dengan penawaran kelas.");
      const importedKrsStatus = statusText === "DIAJUKAN" ? "SUBMITTED" : statusText === "DISETUJUI" ? "APPROVED" : statusText === "DITOLAK" ? "REJECTED" : statusText;
      if (importedKrsStatus === "APPROVED" || importedKrsStatus === "REJECTED") addReferenceError(row, "Status *", statusText, "Status DISETUJUI/DITOLAK tidak dapat ditetapkan melalui import.", "Import sebagai DRAFT atau DIAJUKAN lalu selesaikan workflow KRS di modul.");
      const activeCurricula = data.curricula.filter((item) => item.programId === student.programId && item.status === "ACTIVE" && item.effectiveYear <= student.cohort);
      if (activeCurricula.length && !activeCurricula.some((item) => item.courseIds.includes(course.id))) addReferenceError(row, "Kode Mata Kuliah *", value.courseCode, "Mata kuliah tidak tersedia pada kurikulum aktif mahasiswa.", "Gunakan mata kuliah kurikulum mahasiswa atau perbaiki kurikulumnya.");
      if (!activeCurricula.length) addWarning(row, "Kode Mata Kuliah *", value.courseCode, "Kurikulum aktif untuk angkatan mahasiswa belum dikonfigurasi; kompatibilitas tidak dapat diperiksa.", "Pastikan kurikulum aktif sudah tersedia.");
      const groupKey = `${student.id}:${value.academicYear}:${term}`;
      const duplicateCourse = previousRows.some((item) => item.payload?.collection === "krs" && item.payload.duplicateKey === `${groupKey}:${course.id}`);
      if (duplicateCourse) addReferenceError(row, "Kode Mata Kuliah *", value.courseCode, "Mata kuliah muncul lebih dari sekali pada KRS yang sama di file.", "Hapus baris mata kuliah duplikat.");
      for (const prerequisiteId of course.prerequisiteIds) {
        const prerequisiteRegistered = previousRows.some((item) => item.payload?.collection === "krs" && item.payload.record.studentId === student.id && item.values.academicYear === value.academicYear && item.values.term === term && findCourse(data, item.values.courseCode)?.id === prerequisiteId);
        const prerequisitePassed = data.grades.some((grade) => grade.studentId === student.id && grade.status === "PUBLISHED" && !["D", "E"].includes(grade.grade) && data.offerings.find((entry) => entry.id === grade.offeringId)?.courseId === prerequisiteId);
        if (!prerequisiteRegistered && !prerequisitePassed) addReferenceError(row, "Kode Mata Kuliah *", value.courseCode, "Prasyarat mata kuliah belum lulus atau dipilih pada file KRS ini.", "Penuhi prasyarat sebelum mengajukan KRS.");
      }
      if (offering.status === "CLOSED") addReferenceError(row, "Kode Kelas *", value.offeringCode, "Kelas sudah ditutup.", "Pilih kelas yang masih dibuka.");
      const pendingSeats = new Set(previousRows.flatMap((item) => {
        if (item.state === "ERROR" || item.payload?.collection !== "krs") return [];
        const priorKrs = item.payload.record as unknown as KrsRecord;
        return ["DRAFT", "SUBMITTED"].includes(priorKrs.status) && priorKrs.offeringIds.includes(offering.id) ? [priorKrs.studentId] : [];
      }));
      if (!offering.studentIds.includes(student.id) && offering.studentIds.length + pendingSeats.size >= offering.capacity) addReferenceError(row, "Kode Kelas *", value.offeringCode, "Kapasitas kelas penuh setelah memperhitungkan baris sebelumnya pada file.", "Pilih kelas dengan kapasitas yang masih tersedia.");
      addWarning(row, "Kode Mata Kuliah *", value.courseCode, "Batas maksimum SKS belum dikonfigurasi; pemeriksaan batas SKS tidak dijalankan.", "Konfigurasikan kebijakan SKS sebelum persetujuan KRS.");
      if (importedKrsStatus === "SUBMITTED") addWarning(row, "Status *", statusText, "KRS akan diajukan, tetapi belum disetujui.", "Verifikasi kapasitas dan prasyarat sebelum persetujuan.");
      return { collection: "krs", duplicateKey: `${groupKey}:${course.id}`, record: {
        id: `krs-${groupKey}`, studentId: student.id, offeringIds: [offering.id], academicYear: stringValue(value.academicYear), term, status: importedKrsStatus
      } };
    }
    case "nilai": {
      assertReference(student, "NIM *", value.nim, "Mahasiswa");
      assertReference(course, "Kode Mata Kuliah *", value.courseCode, "Mata Kuliah");
      assertReference(offering, "Kode Kelas *", value.offeringCode, "Kelas");
      if (!student || !course || !offering) return undefined;
      if (offering.courseId !== course.id || offering.academicYear !== value.academicYear || offering.term !== term) addReferenceError(row, "Kode Kelas *", value.offeringCode, "Kelas tidak cocok dengan mata kuliah dan periode yang dipilih.", "Pastikan kode kelas, mata kuliah, tahun, dan semester sesuai.");
      const enrolled = offering.studentIds.includes(student.id) || data.krs.some((item) => item.studentId === student.id && item.status === "APPROVED" && item.offeringIds.includes(offering.id));
      if (!enrolled) addReferenceError(row, "NIM *", value.nim, "Mahasiswa belum terdaftar pada kelas.", "Pastikan KRS mahasiswa untuk kelas ini telah disetujui.");
      const assignment = Number(value.assignment || 0);
      const midterm = Number(value.midterm || 0);
      const finalExam = Number(value.finalExam || 0);
      const finalScore = Math.round(assignment * 0.3 + midterm * 0.3 + finalExam * 0.4);
      const grade = finalScore >= 85 ? "A" : finalScore >= 80 ? "A-" : finalScore >= 75 ? "B+" : finalScore >= 70 ? "B" : finalScore >= 65 ? "C+" : finalScore >= 60 ? "C" : finalScore >= 50 ? "D" : "E";
      if (value.finalScore !== "" && Number(value.finalScore) !== finalScore) addReferenceError(row, "Nilai Akhir", value.finalScore, "Nilai akhir tidak sesuai formula 30% tugas + 30% UTS + 40% UAS.", `Nilai akhir hasil perhitungan adalah ${finalScore}.`);
      if (value.grade && normalizedCode(value.grade) !== grade) addReferenceError(row, "Grade", value.grade, "Grade tidak sesuai nilai akhir terhitung.", `Grade yang sesuai adalah ${grade}.`);
      if (statusText && statusText !== "DRAFT") addReferenceError(row, "Status", statusText, "Nilai hasil import harus berstatus DRAFT.", "Gunakan DRAFT; verifikasi dan publikasi dilakukan di workflow Nilai.");
      return { collection: "grades", duplicateKey: `${student.id}:${offering.id}`, record: { id: newId("nilai"), studentId: student.id, offeringId: offering.id, assignment, midterm, finalExam, finalScore, grade, status: "DRAFT" } };
    }
    case "presensi": {
      assertReference(student, "NIM *", value.nim, "Mahasiswa");
      assertReference(offering, "Kode Kelas *", value.offeringCode, "Kelas");
      if (!student || !offering) return undefined;
      if (offering.academicYear !== value.academicYear || offering.term !== term) addReferenceError(row, "Semester / Tahun Akademik", `${value.academicYear} ${term}`, "Kelas tidak termasuk periode akademik yang dipilih.", "Pilih periode yang sama dengan kelas.");
      const enrolled = offering.studentIds.includes(student.id) || data.krs.some((item) => item.studentId === student.id && item.status === "APPROVED" && item.offeringIds.includes(offering.id));
      if (!enrolled) addReferenceError(row, "NIM *", value.nim, "Mahasiswa belum terdaftar pada kelas.", "Pastikan mahasiswa terdaftar atau memiliki KRS yang disetujui.");
      const date = new Date(`${value.date}T00:00:00Z`);
      const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const scheduledDay = dayNames[date.getUTCDay()];
      if (!data.schedules.some((item) => item.offeringId === offering.id && item.day === scheduledDay)) addReferenceError(row, "Tanggal *", value.date, "Tidak ada jadwal kelas pada hari tersebut.", `Gunakan tanggal pertemuan pada hari jadwal kelas (${scheduledDay}).`);
      const key = `${student.id}:${offering.id}:${value.meetingNumber}`;
      return { collection: "attendanceRecords", duplicateKey: key, record: { id: newId("presensi"), studentId: student.id, offeringId: offering.id, meetingNumber: Number(value.meetingNumber), date: stringValue(value.date), status: statusText, note: stringValue(value.note) || undefined } };
    }
    case "kelulusan": {
      assertReference(student, "NIM *", value.nim, "Mahasiswa");
      if (!student) return undefined;
      const rule = data.graduationRules.find((item) => item.programId === student.programId && item.active);
      const published = data.grades.filter((item) => item.studentId === student.id && item.status === "PUBLISHED");
      const gradePoints: Record<string, number> = { A: 4, "A-": 3.75, "B+": 3.5, B: 3, "B-": 2.75, "C+": 2.5, C: 2, D: 1, E: 0 };
      const credits = published.reduce((sum, grade) => sum + (data.courses.find((item) => item.id === data.offerings.find((entry) => entry.id === grade.offeringId)?.courseId)?.credits ?? 0), 0);
      const totalPoints = published.reduce((sum, grade) => sum + (gradePoints[grade.grade] ?? 0) * (data.courses.find((item) => item.id === data.offerings.find((entry) => entry.id === grade.offeringId)?.courseId)?.credits ?? 0), 0);
      const gpa = credits ? totalPoints / credits : 0;
      const attendanceRows = data.attendance.filter((item) => item.studentId === student.id);
      const attendanceTotal = attendanceRows.reduce((sum, item) => sum + item.meetings, 0);
      const attendancePercent = attendanceTotal ? attendanceRows.reduce((sum, item) => sum + item.present, 0) / attendanceTotal * 100 : 0;
      const meetsRules = Boolean(rule && credits >= rule.minimumCredits && gpa >= rule.minimumGpa && attendancePercent >= rule.minimumAttendancePercent);
      if (["MEMENUHI_SYARAT", "LULUS"].includes(statusText) && !meetsRules) addReferenceError(row, "Status Kelulusan *", statusText, "Status ini tidak sesuai dengan SKS, IPK, dan kehadiran mahasiswa.", "Gunakan BELUM_MEMENUHI/MENUNGGU_VERIFIKASI atau penuhi aturan program studi terlebih dahulu.");
      if (!rule) addReferenceError(row, "Status Kelulusan *", statusText, "Aturan kelulusan aktif untuk program studi belum tersedia.", "Konfigurasikan aturan kelulusan sebelum import evaluasi.");
      const mappedStatus = statusText === "LULUS" ? "GRADUATED" : statusText === "MEMENUHI_SYARAT" ? "ELIGIBLE" : statusText === "BELUM_MEMENUHI" ? "NOT_ELIGIBLE" : "PENDING";
      return { collection: "graduations", duplicateKey: `${student.id}:${value.academicYear}`, record: { id: newId("lulus"), studentId: student.id, academicYear: stringValue(value.academicYear), credits, gpa: Number(gpa.toFixed(2)), attendancePercent: Number(attendancePercent.toFixed(2)), outstandingRequirements: meetsRules ? [] : ["Belum memenuhi seluruh aturan akademik"], status: mappedStatus, verifiedAt: stringValue(value.verifiedAt) || undefined, note: stringValue(value.note) || undefined } };
    }
    case "wisuda": {
      const ceremony = findCeremony(data, value.ceremonyCode);
      assertReference(ceremony, "Kode Periode Wisuda *", value.ceremonyCode, "Periode Wisuda");
      assertReference(student, "NIM *", value.nim, "Mahasiswa");
      if (!ceremony || !student) return undefined;
      const eligible = student.status === "LULUS" && data.graduations.some((item) => item.studentId === student.id && ["ELIGIBLE", "VERIFIED", "GRADUATED"].includes(item.status));
      if (!eligible) addReferenceError(row, "NIM *", value.nim, "Mahasiswa belum memenuhi syarat kelulusan.", "Selesaikan evaluasi kelulusan sebelum mendaftarkan peserta wisuda.");
      if (ceremony.status === "CLOSED" || ceremony.registrationIds.length >= ceremony.capacity) addReferenceError(row, "Kode Periode Wisuda *", value.ceremonyCode, "Pendaftaran periode wisuda ditutup atau kapasitas penuh.", "Pilih periode yang masih terbuka dan memiliki kapasitas.");
      const pendingParticipants = previousRows.filter((item) => item.state !== "ERROR" && item.payload?.collection === "ceremonyRegistrations" && item.payload.record.ceremonyId === ceremony.id).length;
      if (ceremony.registrationIds.length + pendingParticipants >= ceremony.capacity) addReferenceError(row, "Kode Periode Wisuda *", value.ceremonyCode, "Kapasitas periode wisuda penuh setelah memperhitungkan baris sebelumnya.", "Pilih periode dengan kapasitas tersisa.");
      return { collection: "ceremonyRegistrations", duplicateKey: `${ceremony.id}:${student.id}`, record: { id: newId("daftar-wisuda"), ceremonyId: ceremony.id, studentId: student.id, status: "REGISTERED", documentsReady: 0, documentsRequired: 4, registrationDate: stringValue(value.registrationDate) || undefined, note: stringValue(value.note) || undefined } };
    }
    case "kalender-akademik": {
      const start = stringValue(value.start);
      const end = stringValue(value.end) || start;
      if (end < start) addReferenceError(row, "Tanggal Selesai", end, "Tanggal selesai lebih awal dari tanggal mulai.", "Atur tanggal selesai sama atau sesudah tanggal mulai.");
      const category = value.category;
      return { collection: "calendarEvents", duplicateKey: `${normalizedCode(value.academicYear)}:${normalizedCode(value.title)}:${start}:${end}`, record: { id: newId("kal"), academicYear: stringValue(value.academicYear), title: stringValue(value.title), category, start, end, description: stringValue(value.description), audience: stringValue(value.audience) || "Seluruh Taruna", status: statusText } };
    }
  }
}

function existingDuplicate(moduleId: ImportModuleId, key: string, row: ImportReadyRow, data: AcademicWorkspaceData) {
  switch (moduleId) {
    case "mahasiswa": return data.students.some((item) => normalizedCode(item.nim) === key);
    case "dosen": return data.lecturers.some((item) => normalizedCode(item.nidn) === key);
    case "program-studi": return data.programs.some((item) => normalizedCode(item.code) === key);
    case "kurikulum": return row.sheetName === "KURIKULUM"
      ? data.curricula.some((item) => normalizedCode(item.code ?? item.id) === key)
      : data.curriculumAssignments.some((item) => `${item.curriculumId}:${item.courseId}` === key);
    case "mata-kuliah": return data.courses.some((item) => normalizedCode(item.code) === key);
    case "kelas-perkuliahan": return data.offerings.some((item) => normalizedCode(item.code) === key);
    case "jadwal": return data.schedules.some((item) => `${item.offeringId}:${item.day}:${item.start}:${item.end}` === key);
    case "krs": {
      const [studentId, academicYear, term] = key.split(":");
      return data.krs.some((item) => item.studentId === studentId && item.academicYear === academicYear && item.term === term);
    }
    case "nilai": return data.grades.some((item) => `${item.studentId}:${item.offeringId}` === key);
    case "presensi": return data.attendanceRecords.some((item) => `${item.studentId}:${item.offeringId}:${item.meetingNumber}` === key);
    case "kelulusan": return data.graduations.some((item) => `${item.studentId}:${item.academicYear}` === key);
    case "wisuda": return data.ceremonyRegistrations.some((item) => `${item.ceremonyId}:${item.studentId}` === key);
    case "kalender-akademik": return data.calendarEvents.some((item) => `${normalizedCode(item.academicYear)}:${normalizedCode(item.title)}:${item.start}:${item.end}` === key);
  }
}

export function validateImport(moduleId: ImportModuleId, uploadedSheets: UploadedSheet[], data: AcademicWorkspaceData): ImportPreview {
  const config = importConfigs[moduleId];
  const results: ImportReadyRow[] = [];
  for (const sheetConfig of config.sheets) {
    const uploaded = uploadedSheets.find((item) => item.name.toLocaleUpperCase("id") === sheetConfig.name.toLocaleUpperCase("id"));
    if (!uploaded) {
      results.push({ rowNumber: 1, sheetName: sheetConfig.name, values: {}, state: "ERROR", errors: [issue(1, sheetConfig.name, "Sheet", "", `Sheet ${sheetConfig.name} tidak ditemukan.`, "Gunakan template resmi dan jangan mengganti nama sheet.")], warnings: [] });
      continue;
    }
    const headers = Object.keys(uploaded.rows[0]?.values ?? {});
    const unknownHeaders = headers.filter((header) => !sheetConfig.fields.some((field) => normalizedHeader(field.header) === normalizedHeader(header)));
    for (const field of sheetConfig.fields.filter((item) => item.required && !item.systemGenerated)) {
      if (!headers.some((header) => normalizedHeader(header) === normalizedHeader(field.header))) {
        results.push({ rowNumber: 1, sheetName: sheetConfig.name, values: {}, state: "ERROR", errors: [issue(1, sheetConfig.name, field.header, "", `Kolom wajib ${field.header} tidak ditemukan.`, "Unduh template resmi dan pertahankan nama kolom." )], warnings: [] });
      }
    }
    for (const raw of uploaded.rows) {
      const row: ImportReadyRow = { rowNumber: raw.rowNumber, sheetName: sheetConfig.name, values: {}, state: "VALID", errors: [], warnings: [] };
      unknownHeaders.forEach((header) => addReferenceError(row, header, raw.values[header], "Kolom tidak dikenal dan tidak akan diabaikan diam-diam.", "Gunakan template resmi dan hapus atau perbaiki kolom tambahan."));
      for (const field of sheetConfig.fields) {
        const header = Object.keys(raw.values).find((item) => normalizedHeader(item) === normalizedHeader(field.header));
        const rawValue = header ? raw.values[header] : "";
        row.values[field.key] = resolveValue(field, rawValue, raw.rowNumber, sheetConfig.name, row.errors, row.warnings);
        if (field.systemGenerated && rawValue !== undefined && stringValue(rawValue) !== "") addWarning(row, field.header, rawValue, "Nilai ini dihitung aplikasi dan tidak akan digunakan langsung.", "Biarkan kosong; nilai akhir/grade akan dihitung otomatis.");
      }
      row.payload = mapRow(moduleId, row, data, results);
      if (row.payload && !row.errors.length) {
        const isDuplicate = existingDuplicate(moduleId, row.payload.duplicateKey, row, data);
        const duplicateInFile = results.some((prior) => prior.state !== "ERROR" && prior.payload?.duplicateKey === row.payload?.duplicateKey && (moduleId !== "krs" || normalizedCode(prior.values.courseCode) === normalizedCode(row.values.courseCode)));
        if (duplicateInFile) addReferenceError(row, "", row.payload.duplicateKey, "Duplikat data ditemukan dalam file.", "Simpan satu baris untuk tiap identifier unik.");
        if (isDuplicate) {
          if (config.duplicatePolicy === "SKIP_EXISTING") addWarning(row, "", row.payload.duplicateKey, "Identifier sudah ada; baris akan dilewati tanpa menimpa data.", "Ubah identifier atau keluarkan baris ini dari file.");
          else addReferenceError(row, "", row.payload.duplicateKey, "Record sudah ada; overwrite diblokir untuk menjaga integritas akademik.", "Periksa record di sistem dan lakukan perubahan melalui workflow modul.");
        }
      }
      if (row.errors.length) row.state = "ERROR";
      else if (row.warnings.some((entry) => entry.message.includes("Identifier sudah ada"))) row.state = "SKIPPED";
      else if (row.warnings.length) row.state = "WARNING";
      results.push(row);
    }
  }
  const accepted = results.filter((row) => ["VALID", "WARNING"].includes(row.state));
  return {
    moduleId, rows: results, validCount: accepted.length, warningCount: results.filter((row) => row.state === "WARNING").length,
    errorCount: results.filter((row) => row.state === "ERROR").length, skippedCount: results.filter((row) => row.state === "SKIPPED").length
  };
}
