import type { AcademicWorkspaceData } from "./domain";

export const academicWorkspaceSeed: AcademicWorkspaceData = {
  programs: [
    { id: "prodi-nautika", code: "D3-NAU", name: "D-III Studi Nautika", degree: "D-III", unit: "Poltektrans SDP Palembang", headLecturerId: "dosen-ahmad", status: "ACTIVE" },
    { id: "prodi-teknika", code: "D3-TEK", name: "D-III Studi Teknika", degree: "D-III", unit: "Poltektrans SDP Palembang", headLecturerId: "dosen-budi", status: "ACTIVE" },
    { id: "prodi-kalk", code: "D3-KALK", name: "D-III Manajemen Transportasi Perairan", degree: "D-III", unit: "Poltektrans SDP Palembang", headLecturerId: "dosen-rina", status: "ACTIVE" }
  ],
  lecturers: [
    { id: "dosen-ahmad", nidn: "0012047801", nip: "198204122009121001", name: "Ahmad Fauzi", title: "Capt., M.Mar.", titleFront: "Capt.", titleBack: "M.Mar.", email: "ahmad.fauzi@poltektrans.ac.id", phone: "0711-555-210", programId: "prodi-nautika", status: "ACTIVE" },
    { id: "dosen-dimas", nidn: "0018118202", nip: "198211182010121002", name: "Dimas Prasetyo", title: "Capt., M.Mar.", titleFront: "Capt.", titleBack: "M.Mar.", email: "dimas.prasetyo@poltektrans.ac.id", phone: "0711-555-214", programId: "prodi-nautika", status: "ACTIVE" },
    { id: "dosen-budi", nidn: "0007087503", nip: "197507082005011003", name: "Budi Santoso", title: "Dr., M.T.", titleFront: "Dr.", titleBack: "M.T.", email: "budi.santoso@poltektrans.ac.id", phone: "0711-555-220", programId: "prodi-teknika", status: "ACTIVE" },
    { id: "dosen-rina", nidn: "0021068104", nip: "198106212011012004", name: "Rina Kurnia", title: "M.Pd.", titleBack: "M.Pd.", email: "rina.kurnia@poltektrans.ac.id", phone: "0711-555-231", programId: "prodi-kalk", status: "ACTIVE" }
  ],
  students: [
    { id: "mhs-202501001", nim: "202501001", name: "Muhammad Rizky Pratama", email: "rizky.pratama@poltektrans.ac.id", phone: "0812-0000-1001", programId: "prodi-nautika", cohort: 2025, semester: 4, className: "Nautika 4A", status: "AKTIF" },
    { id: "mhs-202501002", nim: "202501002", name: "Nadia Putri Maharani", email: "nadia.maharani@poltektrans.ac.id", phone: "0812-0000-1002", programId: "prodi-nautika", cohort: 2025, semester: 4, className: "Nautika 4A", status: "AKTIF" },
    { id: "mhs-202401017", nim: "202401017", name: "Fajar Ramadhan", email: "fajar.ramadhan@poltektrans.ac.id", phone: "0812-0000-1017", programId: "prodi-nautika", cohort: 2024, semester: 6, className: "Nautika 6A", status: "AKTIF" },
    { id: "mhs-202301009", nim: "202301009", name: "Siti Aisyah", email: "siti.aisyah@poltektrans.ac.id", phone: "0812-0000-1009", programId: "prodi-nautika", cohort: 2023, semester: 8, className: "Nautika 8A", status: "AKTIF" },
    { id: "mhs-202501101", nim: "202501101", name: "Andika Saputra", email: "andika.saputra@poltektrans.ac.id", phone: "0812-0000-1101", programId: "prodi-teknika", cohort: 2025, semester: 4, className: "Teknika 4A", status: "AKTIF" },
    { id: "mhs-202401108", nim: "202401108", name: "Dewi Lestari", email: "dewi.lestari@poltektrans.ac.id", phone: "0812-0000-1108", programId: "prodi-teknika", cohort: 2024, semester: 6, className: "Teknika 6A", status: "CUTI" },
    { id: "mhs-202501201", nim: "202501201", name: "Rafi Maulana", email: "rafi.maulana@poltektrans.ac.id", phone: "0812-0000-1201", programId: "prodi-kalk", cohort: 2025, semester: 4, className: "KALK 4A", status: "AKTIF" },
    { id: "mhs-202301207", nim: "202301207", name: "Intan Permata", email: "intan.permata@poltektrans.ac.id", phone: "0812-0000-1207", programId: "prodi-kalk", cohort: 2023, semester: 8, className: "KALK 8A", status: "LULUS" }
  ],
  curricula: [
    { id: "kur-nautika-2023", programId: "prodi-nautika", name: "Kurikulum Nautika 2023", effectiveYear: 2023, status: "ACTIVE", courseIds: ["mk-nau401", "mk-nau402", "mk-nau403", "mk-nau404"] },
    { id: "kur-nautika-2025", programId: "prodi-nautika", name: "Kurikulum Nautika 2025", effectiveYear: 2025, status: "DRAFT", courseIds: ["mk-nau401", "mk-nau402", "mk-nau403", "mk-nau404"] },
    { id: "kur-teknika-2023", programId: "prodi-teknika", name: "Kurikulum Teknika 2023", effectiveYear: 2023, status: "ACTIVE", courseIds: ["mk-tek401", "mk-tek402"] },
    { id: "kur-kalk-2023", programId: "prodi-kalk", name: "Kurikulum KALK 2023", effectiveYear: 2023, status: "ACTIVE", courseIds: ["mk-kalk401"] }
  ],
  curriculumAssignments: [
    { id: "kur-nautika-2023:mk-nau401", curriculumId: "kur-nautika-2023", courseId: "mk-nau401", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2023:mk-nau402", curriculumId: "kur-nautika-2023", courseId: "mk-nau402", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2023:mk-nau403", curriculumId: "kur-nautika-2023", courseId: "mk-nau403", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2023:mk-nau404", curriculumId: "kur-nautika-2023", courseId: "mk-nau404", semester: 4, nature: "WAJIB", credits: 2 },
    { id: "kur-nautika-2025:mk-nau401", curriculumId: "kur-nautika-2025", courseId: "mk-nau401", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2025:mk-nau402", curriculumId: "kur-nautika-2025", courseId: "mk-nau402", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2025:mk-nau403", curriculumId: "kur-nautika-2025", courseId: "mk-nau403", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-nautika-2025:mk-nau404", curriculumId: "kur-nautika-2025", courseId: "mk-nau404", semester: 4, nature: "WAJIB", credits: 2 },
    { id: "kur-teknika-2023:mk-tek401", curriculumId: "kur-teknika-2023", courseId: "mk-tek401", semester: 4, nature: "WAJIB", credits: 3 },
    { id: "kur-teknika-2023:mk-tek402", curriculumId: "kur-teknika-2023", courseId: "mk-tek402", semester: 4, nature: "WAJIB", credits: 2 },
    { id: "kur-kalk-2023:mk-kalk401", curriculumId: "kur-kalk-2023", courseId: "mk-kalk401", semester: 4, nature: "WAJIB", credits: 3 }
  ],
  courses: [
    { id: "mk-nau401", code: "NAU401", name: "Navigasi Lanjutan", credits: 3, semester: 4, programId: "prodi-nautika", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" },
    { id: "mk-nau402", code: "NAU402", name: "Meteorologi Maritim", credits: 3, semester: 4, programId: "prodi-nautika", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" },
    { id: "mk-nau403", code: "NAU403", name: "Keselamatan Pelayaran", credits: 3, semester: 4, programId: "prodi-nautika", kind: "PRAKTIKUM", prerequisiteIds: ["mk-nau401"], status: "ACTIVE" },
    { id: "mk-nau404", code: "NAU404", name: "Komunikasi Maritim", credits: 2, semester: 4, programId: "prodi-nautika", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" },
    { id: "mk-tek401", code: "TEK401", name: "Mesin Kapal", credits: 3, semester: 4, programId: "prodi-teknika", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" },
    { id: "mk-tek402", code: "TEK402", name: "Praktik Permesinan", credits: 2, semester: 4, programId: "prodi-teknika", kind: "PRAKTIKUM", prerequisiteIds: ["mk-tek401"], status: "ACTIVE" },
    { id: "mk-kalk401", code: "KAL401", name: "Manajemen Logistik", credits: 3, semester: 4, programId: "prodi-kalk", kind: "WAJIB", prerequisiteIds: [], status: "ACTIVE" }
  ],
  offerings: [
    { id: "kelas-nau401-4a", code: "NAU401-4A-2526", courseId: "mk-nau401", lecturerId: "dosen-ahmad", academicYear: "2025/2026", term: "GENAP", className: "Nautika 4A", capacity: 30, studentIds: ["mhs-202501001", "mhs-202501002"], status: "ACTIVE", room: "Simulator Nautika" },
    { id: "kelas-nau402-4a", code: "NAU402-4A-2526", courseId: "mk-nau402", lecturerId: "dosen-budi", academicYear: "2025/2026", term: "GENAP", className: "Nautika 4A", capacity: 30, studentIds: ["mhs-202501001", "mhs-202501002"], status: "ACTIVE", room: "Ruang 204" },
    { id: "kelas-nau403-4a", code: "NAU403-4A-2526", courseId: "mk-nau403", lecturerId: "dosen-dimas", academicYear: "2025/2026", term: "GENAP", className: "Nautika 4A", capacity: 24, studentIds: ["mhs-202501001"], status: "OPEN", room: "Laboratorium Keselamatan" },
    { id: "kelas-tek401-4a", code: "TEK401-4A-2526", courseId: "mk-tek401", lecturerId: "dosen-budi", academicYear: "2025/2026", term: "GENAP", className: "Teknika 4A", capacity: 28, studentIds: ["mhs-202501101", "mhs-202401108"], status: "ACTIVE", room: "Ruang Mesin" },
    { id: "kelas-tek402-4a", code: "TEK402-4A-2526", courseId: "mk-tek402", lecturerId: "dosen-budi", academicYear: "2025/2026", term: "GENAP", className: "Teknika 4A", capacity: 20, studentIds: ["mhs-202501101"], status: "OPEN", room: "Bengkel Mesin" },
    { id: "kelas-kalk401-4a", code: "KAL401-4A-2526", courseId: "mk-kalk401", lecturerId: "dosen-rina", academicYear: "2025/2026", term: "GENAP", className: "KALK 4A", capacity: 30, studentIds: ["mhs-202501201"], status: "ACTIVE", room: "Ruang 301" }
  ],
  schedules: [
    { id: "jadwal-1", offeringId: "kelas-nau401-4a", day: "Senin", start: "08:00", end: "09:40", room: "Simulator Nautika", status: "CONFIRMED" },
    { id: "jadwal-2", offeringId: "kelas-nau402-4a", day: "Senin", start: "10:00", end: "11:40", room: "Ruang 204", status: "CONFIRMED" },
    { id: "jadwal-3", offeringId: "kelas-nau403-4a", day: "Rabu", start: "13:00", end: "14:40", room: "Laboratorium Keselamatan", status: "CONFIRMED" },
    { id: "jadwal-4", offeringId: "kelas-tek401-4a", day: "Selasa", start: "08:00", end: "09:40", room: "Ruang Mesin", status: "CONFIRMED" },
    { id: "jadwal-5", offeringId: "kelas-tek402-4a", day: "Kamis", start: "13:00", end: "15:30", room: "Bengkel Mesin", status: "CONFIRMED" },
    { id: "jadwal-6", offeringId: "kelas-kalk401-4a", day: "Jumat", start: "09:00", end: "11:30", room: "Ruang 301", status: "CONFIRMED" }
  ],
  krs: [
    { id: "krs-202501001-2526", studentId: "mhs-202501001", offeringIds: ["kelas-nau401-4a", "kelas-nau402-4a", "kelas-nau403-4a"], academicYear: "2025/2026", term: "GENAP", status: "SUBMITTED" },
    { id: "krs-202501002-2526", studentId: "mhs-202501002", offeringIds: ["kelas-nau401-4a", "kelas-nau402-4a"], academicYear: "2025/2026", term: "GENAP", status: "APPROVED" },
    { id: "krs-202501101-2526", studentId: "mhs-202501101", offeringIds: ["kelas-tek401-4a", "kelas-tek402-4a"], academicYear: "2025/2026", term: "GENAP", status: "REJECTED", rejectionReason: "Prasyarat praktik belum terpenuhi." },
    { id: "krs-202501201-2526", studentId: "mhs-202501201", offeringIds: ["kelas-kalk401-4a"], academicYear: "2025/2026", term: "GENAP", status: "DRAFT" }
  ],
  grades: [
    { id: "nilai-1", studentId: "mhs-202501001", offeringId: "kelas-nau401-4a", assignment: 86, midterm: 82, finalExam: 88, finalScore: 86, grade: "A-", status: "PUBLISHED" },
    { id: "nilai-2", studentId: "mhs-202501001", offeringId: "kelas-nau402-4a", assignment: 78, midterm: 74, finalExam: 81, finalScore: 78, grade: "B+", status: "VERIFIED" },
    { id: "nilai-3", studentId: "mhs-202501002", offeringId: "kelas-nau401-4a", assignment: 91, midterm: 88, finalExam: 93, finalScore: 91, grade: "A", status: "SUBMITTED" },
    { id: "nilai-4", studentId: "mhs-202501101", offeringId: "kelas-tek401-4a", assignment: 0, midterm: 0, finalExam: 0, finalScore: 0, grade: "-", status: "DRAFT" }
  ],
  attendance: [
    { id: "presensi-1", studentId: "mhs-202501001", offeringId: "kelas-nau401-4a", meetings: 12, present: 11, excused: 1, sick: 0, absent: 0 },
    { id: "presensi-2", studentId: "mhs-202501002", offeringId: "kelas-nau401-4a", meetings: 12, present: 9, excused: 1, sick: 0, absent: 2 },
    { id: "presensi-3", studentId: "mhs-202501001", offeringId: "kelas-nau402-4a", meetings: 12, present: 10, excused: 0, sick: 1, absent: 1 },
    { id: "presensi-4", studentId: "mhs-202501101", offeringId: "kelas-tek401-4a", meetings: 12, present: 8, excused: 1, sick: 0, absent: 3 }
  ],
  attendanceRecords: [],
  graduationRules: [
    { id: "aturan-nautika", programId: "prodi-nautika", minimumCredits: 144, minimumGpa: 2.5, minimumAttendancePercent: 75, requiredDocuments: ["Bebas Perpustakaan", "Bebas Administrasi"], active: true },
    { id: "aturan-teknika", programId: "prodi-teknika", minimumCredits: 144, minimumGpa: 2.5, minimumAttendancePercent: 75, requiredDocuments: ["Bebas Perpustakaan", "Bebas Administrasi"], active: true },
    { id: "aturan-kalk", programId: "prodi-kalk", minimumCredits: 144, minimumGpa: 2.5, minimumAttendancePercent: 75, requiredDocuments: ["Bebas Perpustakaan", "Bebas Administrasi"], active: true }
  ],
  graduations: [
    { id: "lulus-202301009", studentId: "mhs-202301009", academicYear: "2025/2026", credits: 142, gpa: 3.24, attendancePercent: 92, outstandingRequirements: ["2 SKS belum terpenuhi"], status: "NOT_ELIGIBLE" },
    { id: "lulus-202301207", studentId: "mhs-202301207", academicYear: "2025/2026", credits: 146, gpa: 3.51, attendancePercent: 96, outstandingRequirements: [], status: "ELIGIBLE" },
    { id: "lulus-202401017", studentId: "mhs-202401017", academicYear: "2025/2026", credits: 126, gpa: 3.44, attendancePercent: 88, outstandingRequirements: ["18 SKS belum terpenuhi"], status: "PENDING" }
  ],
  ceremonies: [
    { id: "wisuda-2026-1", code: "WSD-2026-01", name: "Wisuda Poltektrans 2026", date: "2026-12-12", location: "Auditorium Poltektrans SDP Palembang", capacity: 180, registrationStart: "2026-10-01", registrationEnd: "2026-11-15", status: "OPEN", registrationIds: ["daftar-wisuda-1"] },
    { id: "wisuda-2026-2", code: "WSD-2027-01", name: "Wisuda Poltektrans 2026 Gelombang II", date: "2027-03-20", location: "Auditorium Poltektrans SDP Palembang", capacity: 120, registrationStart: "2027-01-01", registrationEnd: "2027-02-15", status: "DRAFT", registrationIds: [] }
  ],
  ceremonyRegistrations: [
    { id: "daftar-wisuda-1", ceremonyId: "wisuda-2026-1", studentId: "mhs-202301207", status: "REGISTERED", documentsReady: 2, documentsRequired: 4 }
  ],
  calendarEvents: [
    { id: "kal-1", academicYear: "2025/2026", title: "Perkuliahan Semester Genap", category: "KULIAH", start: "2026-02-02", end: "2026-06-20", description: "Periode perkuliahan semester genap tahun akademik 2025/2026.", audience: "Seluruh Taruna", status: "PUBLISHED" },
    { id: "kal-2", academicYear: "2025/2026", title: "Pengisian KRS", category: "KRS", start: "2026-01-19", end: "2026-01-30", description: "Periode pengajuan Kartu Rencana Studi.", audience: "Taruna Aktif", status: "PUBLISHED" },
    { id: "kal-3", academicYear: "2025/2026", title: "Ujian Tengah Semester", category: "UTS", start: "2026-04-06", end: "2026-04-11", description: "Pelaksanaan UTS semester genap.", audience: "Taruna Aktif", status: "PUBLISHED" },
    { id: "kal-4", academicYear: "2025/2026", title: "Batas Verifikasi KRS", category: "DEADLINE", start: "2026-02-02", end: "2026-02-02", description: "Batas akhir persetujuan KRS oleh program studi.", audience: "Akademik", status: "DRAFT" }
  ]
};
