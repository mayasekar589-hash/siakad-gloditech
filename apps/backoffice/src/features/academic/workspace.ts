import type { AcademicCollection, AcademicWorkspaceData, GraduationRule } from "./domain";

export const academicStorageKey = "siakad.backoffice.academic.v1";
export type AcademicRow = Record<string, unknown>;

export interface AcademicModuleDefinition {
  id: string;
  title: string;
  description: string;
  collection: AcademicCollection;
  columns: { key: string; label: string }[];
  readOnly?: boolean;
  relatedCollections?: AcademicCollection[];
}

export const academicModules: AcademicModuleDefinition[] = [
  { id: "mahasiswa", title: "Data Mahasiswa", description: "Data induk taruna yang menjadi referensi KRS, nilai, presensi, dan kelulusan.", collection: "students", columns: [{ key: "nim", label: "NIM" }, { key: "name", label: "Nama" }, { key: "programId", label: "Program Studi" }, { key: "cohort", label: "Angkatan" }, { key: "semester", label: "Semester" }, { key: "className", label: "Kelas" }, { key: "status", label: "Status" }] },
  { id: "dosen", title: "Data Dosen", description: "Dosen pengampu terhubung langsung ke penawaran kelas dan jadwal perkuliahan.", collection: "lecturers", columns: [{ key: "nidn", label: "NIDN" }, { key: "name", label: "Nama" }, { key: "title", label: "Gelar" }, { key: "programId", label: "Program Studi" }, { key: "email", label: "Email" }, { key: "status", label: "Status" }] },
  { id: "program-studi", title: "Program Studi", description: "Unit akademik dan pimpinan program studi untuk kurikulum serta data induk.", collection: "programs", columns: [{ key: "code", label: "Kode" }, { key: "name", label: "Program Studi" }, { key: "degree", label: "Jenjang" }, { key: "headLecturerId", label: "Ketua Program Studi" }, { key: "status", label: "Status" }], relatedCollections: ["lecturers"] },
  { id: "kurikulum", title: "Kurikulum", description: "Versi kurikulum mengelompokkan mata kuliah menurut program studi dan tahun berlaku.", collection: "curricula", columns: [{ key: "name", label: "Nama Kurikulum" }, { key: "programId", label: "Program Studi" }, { key: "effectiveYear", label: "Tahun Berlaku" }, { key: "courseIds", label: "Mata Kuliah" }, { key: "status", label: "Status" }], relatedCollections: ["curriculumAssignments", "courses"] },
  { id: "mata-kuliah", title: "Mata Kuliah", description: "Katalog mata kuliah, bobot SKS, semester, dan prasyarat yang dipakai kurikulum serta kelas.", collection: "courses", columns: [{ key: "code", label: "Kode" }, { key: "name", label: "Mata Kuliah" }, { key: "credits", label: "SKS" }, { key: "semester", label: "Semester" }, { key: "programId", label: "Program Studi" }, { key: "kind", label: "Jenis" }, { key: "prerequisiteIds", label: "Prasyarat" }] },
  { id: "kelas-perkuliahan", title: "Kelas Perkuliahan", description: "Penawaran mata kuliah per periode, dosen, rombongan, dan kapasitas kelas.", collection: "offerings", columns: [{ key: "code", label: "Kode Kelas" }, { key: "courseId", label: "Mata Kuliah" }, { key: "lecturerId", label: "Dosen" }, { key: "academicYear", label: "Tahun Akademik" }, { key: "className", label: "Rombongan" }, { key: "capacity", label: "Kapasitas" }, { key: "studentIds", label: "Terdaftar" }, { key: "status", label: "Status" }], relatedCollections: ["students"] },
  { id: "jadwal", title: "Jadwal Perkuliahan", description: "Jadwal terhubung ke kelas, ruang, dan jam; benturan waktu diperiksa saat disimpan.", collection: "schedules", columns: [{ key: "day", label: "Hari" }, { key: "start", label: "Mulai" }, { key: "end", label: "Selesai" }, { key: "offeringId", label: "Kelas" }, { key: "room", label: "Ruang" }, { key: "status", label: "Validasi" }] },
  { id: "krs", title: "Kartu Rencana Studi", description: "Verifikasi pengajuan KRS terhadap kelas tersedia dan prasyarat mata kuliah.", collection: "krs", columns: [{ key: "studentId", label: "Mahasiswa" }, { key: "offeringIds", label: "Kelas Dipilih" }, { key: "status", label: "Status Pengajuan" }, { key: "rejectionReason", label: "Catatan" }] },
  { id: "nilai", title: "Pengelolaan Nilai", description: "Nilai tugas, UTS, dan UAS melalui alur draf, pengajuan, verifikasi, dan publikasi.", collection: "grades", columns: [{ key: "studentId", label: "Mahasiswa" }, { key: "offeringId", label: "Kelas" }, { key: "assignment", label: "Tugas" }, { key: "midterm", label: "UTS" }, { key: "finalExam", label: "UAS" }, { key: "finalScore", label: "Nilai Akhir" }, { key: "grade", label: "Huruf" }, { key: "status", label: "Status" }] },
  { id: "presensi", title: "Presensi Perkuliahan", description: "Presensi per pertemuan; ringkasan kehadiran dihitung dari catatan kelas.", collection: "attendanceRecords", columns: [{ key: "date", label: "Tanggal" }, { key: "offeringId", label: "Kelas" }, { key: "studentId", label: "Mahasiswa" }, { key: "meetingNumber", label: "Pertemuan" }, { key: "status", label: "Status" }, { key: "note", label: "Keterangan" }], relatedCollections: ["attendance"] },
  { id: "khs-transkrip", title: "KHS & Transkrip", description: "Ringkasan hasil studi dihitung langsung dari nilai yang sudah dipublikasikan.", collection: "grades", columns: [{ key: "nim", label: "NIM" }, { key: "studentName", label: "Nama" }, { key: "programName", label: "Program Studi" }, { key: "publishedCourses", label: "Nilai Terbit" }, { key: "credits", label: "SKS Tercatat" }, { key: "gpa", label: "IPS" }], readOnly: true },
  { id: "kelulusan", title: "Evaluasi Kelulusan", description: "Evaluasi mahasiswa dibandingkan dengan aturan kelulusan program studi.", collection: "graduations", columns: [{ key: "studentId", label: "Mahasiswa" }, { key: "credits", label: "SKS" }, { key: "gpa", label: "IPK" }, { key: "attendancePercent", label: "Kehadiran" }, { key: "outstandingRequirements", label: "Persyaratan" }, { key: "status", label: "Status" }], relatedCollections: ["graduationRules"] },
  { id: "wisuda", title: "Wisuda", description: "Periode dan pendaftaran wisuda terhubung ke status kelulusan serta kelengkapan berkas.", collection: "ceremonies", columns: [{ key: "name", label: "Periode" }, { key: "date", label: "Tanggal" }, { key: "location", label: "Lokasi" }, { key: "capacity", label: "Kapasitas" }, { key: "registrationCount", label: "Pendaftar" }, { key: "status", label: "Status" }], relatedCollections: ["ceremonyRegistrations"] },
  { id: "kalender-akademik", title: "Kalender Akademik", description: "Kelola periode kuliah, KRS, ujian, libur, wisuda, dan tenggat akademik.", collection: "calendarEvents", columns: [{ key: "title", label: "Kegiatan" }, { key: "category", label: "Kategori" }, { key: "start", label: "Mulai" }, { key: "end", label: "Selesai" }, { key: "audience", label: "Audiens" }, { key: "status", label: "Publikasi" }] }
];

export const createRecord = (collection: AcademicCollection): AcademicRow => {
  const id = `${collection}-${crypto.randomUUID()}`;
  const defaults: Record<AcademicCollection, AcademicRow> = {
    programs: { id, code: "", name: "", degree: "D-III", unit: "Poltektrans SDP Palembang", headLecturerId: "", status: "ACTIVE" },
    lecturers: { id, nidn: "", nip: "", name: "", title: "", email: "", phone: "", programId: "", status: "ACTIVE" },
    students: { id, nim: "", name: "", email: "", phone: "", programId: "", cohort: 2026, semester: 1, className: "", status: "AKTIF" },
    curricula: { id, programId: "", name: "", effectiveYear: 2026, status: "DRAFT", courseIds: [] },
    curriculumAssignments: { id, curriculumId: "", courseId: "", semester: 1, nature: "WAJIB", credits: 2 },
    courses: { id, code: "", name: "", credits: 2, semester: 1, programId: "", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" },
    offerings: { id, code: "", courseId: "", lecturerId: "", academicYear: "2025/2026", term: "GENAP", className: "", capacity: 30, studentIds: [], status: "OPEN", room: "" },
    schedules: { id, offeringId: "", day: "Senin", start: "08:00", end: "09:40", room: "", status: "CONFIRMED" },
    krs: { id, studentId: "", offeringIds: [], status: "DRAFT" },
    grades: { id, studentId: "", offeringId: "", assignment: 0, midterm: 0, finalExam: 0, finalScore: 0, grade: "-", status: "DRAFT" },
    attendance: { id, studentId: "", offeringId: "", meetings: 0, present: 0, excused: 0, sick: 0, absent: 0 },
    attendanceRecords: { id, studentId: "", offeringId: "", meetingNumber: 1, date: "2026-02-02", status: "HADIR", note: "" },
    graduationRules: { id, programId: "", minimumCredits: 144, minimumGpa: 2.5, minimumAttendancePercent: 75, requiredDocuments: [], active: true } satisfies GraduationRule,
    graduations: { id, studentId: "", academicYear: "2025/2026", credits: 0, gpa: 0, attendancePercent: 0, outstandingRequirements: [], status: "PENDING" },
    ceremonies: { id, name: "", date: "2026-12-12", location: "", capacity: 120, registrationStart: "2026-10-01", registrationEnd: "2026-11-15", status: "DRAFT", registrationIds: [] },
    ceremonyRegistrations: { id, ceremonyId: "", studentId: "", status: "REGISTERED", documentsReady: 0, documentsRequired: 4 },
    calendarEvents: { id, title: "", category: "KULIAH", start: "2026-02-02", end: "2026-02-02", description: "", audience: "Seluruh Taruna", status: "DRAFT" }
  };
  return defaults[collection];
};

const names = (data: AcademicWorkspaceData) => {
  const byId = new Map<string, string>();
  for (const record of [...data.programs, ...data.lecturers, ...data.students, ...data.courses, ...data.offerings, ...data.ceremonies]) {
    const item = record as { id: string; name?: string; code?: string; nim?: string; title?: string };
    byId.set(item.id, item.name ?? item.nim ?? item.code ?? item.title ?? item.id);
  }
  return byId;
};

export function getModuleRows(data: AcademicWorkspaceData, definition: AcademicModuleDefinition): AcademicRow[] {
  const relationNames = names(data);
  if (definition.id === "khs-transkrip") {
    return data.students.map((student) => {
      const published = data.grades.filter((grade) => grade.studentId === student.id && grade.status === "PUBLISHED");
      const gradePoints: Record<string, number> = { A: 4, "A-": 3.75, "B+": 3.5, B: 3, "B-": 2.75, "C+": 2.5, C: 2, D: 1, E: 0 };
      const offeringIds = new Set(published.map((grade) => grade.offeringId));
      const credits = data.offerings.filter((offering) => offeringIds.has(offering.id)).reduce((sum, offering) => {
        const course = data.courses.find((item) => item.id === offering.courseId);
        return sum + (course?.credits ?? 0);
      }, 0);
      const weighted = published.reduce((sum, grade) => {
        const course = data.courses.find((item) => item.id === data.offerings.find((offering) => offering.id === grade.offeringId)?.courseId);
        return sum + (gradePoints[grade.grade] ?? 0) * (course?.credits ?? 0);
      }, 0);
      return { id: student.id, nim: student.nim, studentName: student.name, programName: relationNames.get(student.programId), publishedCourses: published.length, credits, gpa: credits ? (weighted / credits).toFixed(2) : "-" };
    });
  }
  if (definition.id === "wisuda") {
    return data.ceremonies.map((ceremony) => ({ ...ceremony, registrationCount: ceremony.registrationIds.length }));
  }
  return data[definition.collection] as unknown as AcademicRow[];
}

export function formatCell(data: AcademicWorkspaceData, key: string, value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  if (Array.isArray(value)) {
    if (key === "studentIds" || key === "offeringIds" || key === "courseIds" || key === "prerequisiteIds" || key === "registrationIds") {
      if (key === "offeringIds") return value.map((id) => {
        const offering = data.offerings.find((item) => item.id === id);
        const course = data.courses.find((item) => item.id === offering?.courseId);
        return course?.code ?? String(id);
      }).join(", ") || "Belum ada";
      return `${value.length} item`;
    }
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "Aktif" : "Nonaktif";
  if (typeof value === "number") return key === "minimumGpa" || key === "gpa" ? value.toFixed(2) : String(value);
  const relation = data.programs.find((item) => item.id === value)
    ?? data.lecturers.find((item) => item.id === value)
    ?? data.students.find((item) => item.id === value)
    ?? data.courses.find((item) => item.id === value)
    ?? data.offerings.find((item) => item.id === value)
    ?? data.ceremonies.find((item) => item.id === value);
  if (relation) {
    if ("nim" in relation) return `${relation.name} (${relation.nim})`;
    if ("name" in relation) return "code" in relation ? `${relation.name} (${relation.code})` : relation.name;
    return relation.code;
  }
  return String(value).replaceAll("_", " ");
}

export function validateAcademicWorkspace(data: AcademicWorkspaceData): string | null {
  const validIds = (collection: AcademicCollection, values: string[]) => {
    const ids = new Set((data[collection] as { id: string }[]).map((item) => item.id));
    return values.every((id) => ids.has(id));
  };
  if (data.students.some((student) => !validIds("programs", [student.programId]))) return "Setiap mahasiswa harus terhubung ke program studi yang tersedia.";
  if (data.lecturers.some((lecturer) => !validIds("programs", [lecturer.programId]))) return "Setiap dosen harus terhubung ke program studi yang tersedia.";
  if (data.courses.some((course) => !validIds("programs", [course.programId]) || !validIds("courses", course.prerequisiteIds.filter((id) => id !== course.id)))) return "Program studi atau prasyarat mata kuliah tidak valid.";
  if (data.offerings.some((offering) => !validIds("courses", [offering.courseId]) || !validIds("lecturers", [offering.lecturerId]) || !validIds("students", offering.studentIds) || offering.studentIds.length > offering.capacity)) return "Kelas harus memiliki mata kuliah, dosen, dan mahasiswa yang valid serta tidak melebihi kapasitas.";
  if (data.schedules.some((schedule) => !validIds("offerings", [schedule.offeringId]) || schedule.start >= schedule.end)) return "Jadwal harus terhubung ke kelas dan memiliki rentang waktu yang valid.";
  for (const [index, schedule] of data.schedules.entries()) {
    const offering = data.offerings.find((item) => item.id === schedule.offeringId);
    const conflict = data.schedules.slice(index + 1).some((other) => {
      if (other.day !== schedule.day || !(schedule.start < other.end && other.start < schedule.end)) return false;
      const otherOffering = data.offerings.find((item) => item.id === other.offeringId);
      return schedule.offeringId === other.offeringId || schedule.room === other.room || offering?.lecturerId === otherOffering?.lecturerId;
    });
    if (conflict) return `Benturan jadwal terdeteksi pada hari ${schedule.day}: ruang atau dosen telah digunakan.`;
  }
  if (data.krs.some((entry) => !validIds("students", [entry.studentId]) || !validIds("offerings", entry.offeringIds))) return "KRS harus memiliki mahasiswa dan seluruh kelas yang valid.";
  if (data.grades.some((grade) => !validIds("students", [grade.studentId]) || !validIds("offerings", [grade.offeringId]))) return "Nilai harus terhubung ke mahasiswa dan kelas yang valid.";
  if (data.attendance.some((entry) => !validIds("students", [entry.studentId]) || !validIds("offerings", [entry.offeringId]) || entry.present + entry.excused + entry.sick + entry.absent > entry.meetings)) return "Presensi harus valid dan jumlah status kehadiran tidak boleh melampaui pertemuan.";
  if (data.graduations.some((entry) => !validIds("students", [entry.studentId]))) return "Evaluasi kelulusan harus terhubung ke mahasiswa.";
  if (data.ceremonies.some((ceremony) => !validIds("ceremonyRegistrations", ceremony.registrationIds))) return "Daftar wisuda merujuk ke pendaftaran yang tidak tersedia.";
  if (data.ceremonyRegistrations.some((entry) => !validIds("ceremonies", [entry.ceremonyId]) || !validIds("students", [entry.studentId]))) return "Pendaftaran wisuda harus terhubung ke periode dan mahasiswa.";
  if (data.curricula.some((curriculum) => !validIds("programs", [curriculum.programId]) || !validIds("courses", curriculum.courseIds))) return "Kurikulum harus terhubung ke program studi dan mata kuliah yang valid.";
  if (data.curriculumAssignments.some((assignment) => !validIds("curricula", [assignment.curriculumId]) || !validIds("courses", [assignment.courseId]) || assignment.semester < 1 || assignment.semester > 8 || assignment.credits < 1)) return "Penempatan mata kuliah kurikulum memiliki referensi atau nilai SKS/semester yang tidak valid.";
  if (new Set(data.curriculumAssignments.map((assignment) => `${assignment.curriculumId}:${assignment.courseId}`)).size !== data.curriculumAssignments.length) return "Mata kuliah yang sama tidak boleh ditugaskan dua kali pada satu kurikulum.";
  if (data.attendanceRecords.some((record) => !validIds("students", [record.studentId]) || !validIds("offerings", [record.offeringId]) || record.meetingNumber < 1 || !/^\d{4}-\d{2}-\d{2}$/.test(record.date))) return "Catatan presensi harus memiliki mahasiswa, kelas, pertemuan, dan tanggal yang valid.";
  if (new Set(data.attendanceRecords.map((record) => `${record.studentId}:${record.offeringId}:${record.meetingNumber}`)).size !== data.attendanceRecords.length) return "Satu mahasiswa hanya boleh memiliki satu presensi per pertemuan kelas.";
  return null;
}

export const collectionLabels: Partial<Record<AcademicCollection, string>> = {
  programs: "Program Studi", lecturers: "Dosen", students: "Mahasiswa", courses: "Mata Kuliah", offerings: "Kelas Perkuliahan", curricula: "Kurikulum", schedules: "Jadwal", krs: "KRS", grades: "Nilai", attendance: "Presensi", graduations: "Evaluasi Kelulusan", ceremonies: "Periode Wisuda", ceremonyRegistrations: "Pendaftaran Wisuda", graduationRules: "Aturan Kelulusan", calendarEvents: "Kalender Akademik"
};
