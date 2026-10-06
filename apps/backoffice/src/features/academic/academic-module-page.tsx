"use client";

import { Download, FilePlus2, Pencil, Printer, RotateCcw, Search, Trash2, Upload, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { academicWorkspaceSeed } from "./seed";
import type { AcademicCollection, AcademicWorkspaceData, KrsRecord } from "./domain";
import { academicStorageKey, academicModules, collectionLabels, createRecord, formatCell, getModuleRows, validateAcademicWorkspace, type AcademicModuleDefinition, type AcademicRow } from "./workspace";
import { activeAuthProvider } from "../auth/auth-provider";
import { DataImportDialog } from "./data-import-dialog";
import { importPermissionCodes, type ImportModuleId } from "./import-config";

const importTargets: Partial<Record<string, { moduleId: ImportModuleId; collection: AcademicCollection }>> = {
  mahasiswa: { moduleId: "mahasiswa", collection: "students" }, dosen: { moduleId: "dosen", collection: "lecturers" },
  "program-studi": { moduleId: "program-studi", collection: "programs" }, kurikulum: { moduleId: "kurikulum", collection: "curricula" },
  "mata-kuliah": { moduleId: "mata-kuliah", collection: "courses" }, "kelas-perkuliahan": { moduleId: "kelas-perkuliahan", collection: "offerings" },
  jadwal: { moduleId: "jadwal", collection: "schedules" }, krs: { moduleId: "krs", collection: "krs" }, nilai: { moduleId: "nilai", collection: "grades" },
  presensi: { moduleId: "presensi", collection: "attendanceRecords" }, kelulusan: { moduleId: "kelulusan", collection: "graduations" },
  wisuda: { moduleId: "wisuda", collection: "ceremonyRegistrations" }, "kalender-akademik": { moduleId: "kalender-akademik", collection: "calendarEvents" }
};

const labels: Record<string, string> = {
  nim: "NIM", nidn: "NIDN", nip: "NIP", name: "Nama", title: "Gelar", email: "Email", phone: "Nomor Telepon", programId: "Program Studi",
  headLecturerId: "Ketua Program Studi", code: "Kode", degree: "Jenjang", unit: "Unit", status: "Status", cohort: "Angkatan", semester: "Semester",
  className: "Nama Kelas", effectiveYear: "Tahun Berlaku", courseIds: "Mata Kuliah", credits: "SKS", kind: "Jenis", prerequisiteIds: "Prasyarat",
  courseId: "Mata Kuliah", lecturerId: "Dosen Pengampu", academicYear: "Tahun Akademik", term: "Semester Akademik", capacity: "Kapasitas",
  studentIds: "Mahasiswa", room: "Ruang", day: "Hari", start: "Waktu Mulai", end: "Waktu Selesai", offeringId: "Kelas Perkuliahan",
  studentId: "Mahasiswa", offeringIds: "Kelas Dipilih", rejectionReason: "Alasan Penolakan", assignment: "Nilai Tugas", midterm: "Nilai UTS",
  curriculumId: "Kurikulum", meetingNumber: "Pertemuan Ke",
  finalExam: "Nilai UAS", finalScore: "Nilai Akhir", grade: "Nilai Huruf", meetings: "Jumlah Pertemuan", present: "Hadir", excused: "Izin",
  sick: "Sakit", absent: "Alpa", programName: "Program Studi", minimumCredits: "SKS Minimum", minimumGpa: "IPK Minimum",
  minimumAttendancePercent: "Kehadiran Minimum (%)", requiredDocuments: "Dokumen Wajib", active: "Aturan Aktif", gpa: "IPK",
  attendancePercent: "Kehadiran (%)", outstandingRequirements: "Persyaratan Tertunda", nameForCeremony: "Nama Periode", date: "Tanggal Wisuda",
  location: "Lokasi", registrationStart: "Awal Pendaftaran", registrationEnd: "Akhir Pendaftaran", registrationIds: "Pendaftaran",
  ceremonyId: "Periode Wisuda", documentsReady: "Dokumen Lengkap", documentsRequired: "Dokumen Wajib", category: "Kategori",
  description: "Deskripsi", audience: "Audiens", attendanceRate: "Kehadiran (%)"
};

const optionsByField: Record<string, { id: string; label: string }[]> = {
  degree: ["D-III", "D-IV", "S-1"].map((value) => ({ id: value, label: value })),
  kind: ["WAJIB", "PILIHAN", "PRAKTIKUM"].map((value) => ({ id: value, label: value })),
  term: ["GANJIL", "GENAP"].map((value) => ({ id: value, label: value })),
  day: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].map((value) => ({ id: value, label: value })),
  category: ["KULIAH", "KRS", "UTS", "UAS", "LIBUR", "REGISTRASI", "WISUDA", "PENERIMAAN", "DEADLINE"].map((value) => ({ id: value, label: value })),
  status: []
};

const relationFields: Record<string, AcademicCollection> = {
  programId: "programs", headLecturerId: "lecturers", lecturerId: "lecturers", courseId: "courses", courseIds: "courses", prerequisiteIds: "courses",
  curriculumId: "curricula", studentId: "students", studentIds: "students", offeringId: "offerings", offeringIds: "offerings", ceremonyId: "ceremonies", registrationIds: "ceremonyRegistrations"
};

const columnSets: Partial<Record<AcademicCollection, { key: string; label: string }[]>> = {
  graduationRules: [{ key: "programId", label: "Program Studi" }, { key: "minimumCredits", label: "SKS Minimum" }, { key: "minimumGpa", label: "IPK Minimum" }, { key: "minimumAttendancePercent", label: "Kehadiran Minimum" }, { key: "requiredDocuments", label: "Dokumen Wajib" }, { key: "active", label: "Status" }],
  curriculumAssignments: [{ key: "curriculumId", label: "Kurikulum" }, { key: "courseId", label: "Mata Kuliah" }, { key: "semester", label: "Semester" }, { key: "nature", label: "Sifat" }, { key: "credits", label: "SKS" }],
  attendance: [{ key: "studentId", label: "Mahasiswa" }, { key: "offeringId", label: "Kelas" }, { key: "meetings", label: "Pertemuan" }, { key: "present", label: "Hadir" }, { key: "excused", label: "Izin" }, { key: "sick", label: "Sakit" }, { key: "absent", label: "Alpa" }],
  ceremonyRegistrations: [{ key: "studentId", label: "Mahasiswa" }, { key: "ceremonyId", label: "Periode Wisuda" }, { key: "documentsReady", label: "Dokumen Lengkap" }, { key: "documentsRequired", label: "Dokumen Wajib" }, { key: "status", label: "Status" }]
};

const transitions: Partial<Record<AcademicCollection, Record<string, string>>> = {
  krs: { SUBMITTED: "APPROVED", REJECTED: "SUBMITTED" },
  grades: { DRAFT: "SUBMITTED", SUBMITTED: "VERIFIED", VERIFIED: "PUBLISHED" },
  offerings: { OPEN: "ACTIVE", ACTIVE: "CLOSED" },
  graduations: { PENDING: "ELIGIBLE", ELIGIBLE: "VERIFIED", VERIFIED: "GRADUATED" },
  ceremonies: { DRAFT: "OPEN", OPEN: "VERIFICATION", VERIFICATION: "VERIFIED", VERIFIED: "CLOSED" },
  ceremonyRegistrations: { REGISTERED: "VERIFIED", REJECTED: "REGISTERED" },
  calendarEvents: { DRAFT: "PUBLISHED", PUBLISHED: "ARCHIVED" }
};

const statusChoices: Partial<Record<AcademicCollection, string[]>> = {
  programs: ["ACTIVE", "INACTIVE"], lecturers: ["ACTIVE", "INACTIVE"], students: ["AKTIF", "CUTI", "NONAKTIF", "LULUS", "DROP_OUT"],
  curricula: ["DRAFT", "ACTIVE", "INACTIVE", "ARCHIVED"], courses: ["ACTIVE", "INACTIVE"], offerings: ["OPEN", "ACTIVE", "CLOSED"],
  schedules: ["CONFIRMED", "CONFLICT"], krs: ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"], grades: ["DRAFT", "SUBMITTED", "VERIFIED", "PUBLISHED"],
  attendanceRecords: ["HADIR", "IZIN", "SAKIT", "ALPA"],
  graduations: ["NOT_ELIGIBLE", "PENDING", "ELIGIBLE", "VERIFIED", "GRADUATED"], ceremonies: ["DRAFT", "OPEN", "VERIFICATION", "VERIFIED", "CLOSED"],
  ceremonyRegistrations: ["REGISTERED", "VERIFIED", "REJECTED"], calendarEvents: ["DRAFT", "PUBLISHED", "ARCHIVED"]
};

const stateLabels: Record<string, string> = {
  AKTIF: "Aktif", CUTI: "Cuti", NONAKTIF: "Nonaktif", LULUS: "Lulus", DROP_OUT: "Drop Out", DRAFT: "Draf", SUBMITTED: "Diajukan",
  APPROVED: "Disetujui", REJECTED: "Ditolak", VERIFIED: "Terverifikasi", PUBLISHED: "Terbit", OPEN: "Dibuka", ACTIVE: "Aktif",
  CLOSED: "Ditutup", PENDING: "Menunggu", ELIGIBLE: "Memenuhi", GRADUATED: "Lulus", NOT_ELIGIBLE: "Belum Memenuhi", VERIFICATION: "Verifikasi",
  REGISTERED: "Terdaftar", ARCHIVED: "Diarsipkan", CONFLICT: "Bentrok", CONFIRMED: "Terkonfirmasi", GANJIL: "Ganjil", GENAP: "Genap",
  HADIR: "Hadir", IZIN: "Izin", SAKIT: "Sakit", ALPA: "Alpa", WAJIB: "Wajib", PILIHAN: "Pilihan"
};

function getColumns(definition: AcademicModuleDefinition, collection: AcademicCollection) {
  return collection === definition.collection ? definition.columns : columnSets[collection] ?? [];
}

function getRows(data: AcademicWorkspaceData, definition: AcademicModuleDefinition, collection: AcademicCollection): AcademicRow[] {
  if (collection === definition.collection) return getModuleRows(data, definition);
  return data[collection] as unknown as AcademicRow[];
}

function recordName(record: AcademicRow) {
  return String(record.name ?? record.title ?? record.nim ?? record.nidn ?? record.code ?? record.id);
}

function getFieldOptions(data: AcademicWorkspaceData, collection: AcademicCollection, field: string, rows: AcademicRow[]) {
  const relatedCollection = relationFields[field];
  if (relatedCollection) {
    return (data[relatedCollection] as unknown as AcademicRow[]).map((record) => ({ id: String(record.id), label: recordName(record) }));
  }
  if (field === "status") {
    const values = statusChoices[collection] ?? [...new Set(rows.map((record) => String(record.status ?? "")).filter(Boolean))];
    return values.map((value) => ({ id: value, label: stateLabels[value] ?? value.replaceAll("_", " ") }));
  }
  if (optionsByField[field]?.length) return optionsByField[field];
  return [];
}

function krsBlocker(data: AcademicWorkspaceData, row: AcademicRow) {
  const studentId = String(row.studentId ?? "");
  const student = data.students.find((item) => item.id === studentId);
  const selectedIds = Array.isArray(row.offeringIds) ? row.offeringIds.map(String) : [];
  if (!student || !selectedIds.length) return "Pilih mahasiswa dan minimal satu kelas terlebih dahulu.";
  const selected = data.offerings.filter((offering) => selectedIds.includes(offering.id));
  if (selected.length !== selectedIds.length) return "Satu atau lebih kelas sudah tidak tersedia.";
  for (const offering of selected) {
    const course = data.courses.find((item) => item.id === offering.courseId);
    if (!course || data.programs.find((program) => program.id === student.programId)?.id !== course.programId) return "Mata kuliah harus berasal dari program studi mahasiswa.";
    if (offering.status === "CLOSED") return `${course.name}: kelas sudah ditutup.`;
    if (!offering.studentIds.includes(studentId) && offering.studentIds.length >= offering.capacity) return `${course.name}: kapasitas kelas telah penuh.`;
    for (const prerequisiteId of course.prerequisiteIds) {
      const prerequisiteInKrs = selected.some((item) => item.courseId === prerequisiteId);
      const prerequisitePassed = data.grades.some((grade) => {
        if (grade.studentId !== studentId || grade.status !== "PUBLISHED" || grade.grade === "D" || grade.grade === "E") return false;
        return data.offerings.find((item) => item.id === grade.offeringId)?.courseId === prerequisiteId;
      });
      if (!prerequisiteInKrs && !prerequisitePassed) return `${course.name}: prasyarat belum lulus.`;
    }
  }
  return null;
}

function hasReferences(data: AcademicWorkspaceData, collection: AcademicCollection, id: string) {
  return (Object.entries(data) as [AcademicCollection, unknown][]).some(([key, entries]) => key !== collection && Array.isArray(entries) && entries.some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    return Object.entries(entry).some(([field, value]) => field !== "id" && (value === id || (Array.isArray(value) && value.includes(id))));
  }));
}

function gradeSummary(record: AcademicRow): AcademicRow {
  const assignment = Number(record.assignment ?? 0);
  const midterm = Number(record.midterm ?? 0);
  const finalExam = Number(record.finalExam ?? 0);
  const finalScore = Math.round(assignment * 0.3 + midterm * 0.3 + finalExam * 0.4);
  const grade = finalScore >= 85 ? "A" : finalScore >= 80 ? "A-" : finalScore >= 75 ? "B+" : finalScore >= 70 ? "B" : finalScore >= 65 ? "C+" : finalScore >= 60 ? "C" : finalScore >= 50 ? "D" : "E";
  return { ...record, finalScore, grade };
}

function restoreWorkspace(value: unknown): AcademicWorkspaceData | null {
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<AcademicWorkspaceData>;
  const restored: AcademicWorkspaceData = {
    ...academicWorkspaceSeed,
    ...saved,
    students: (saved.students ?? academicWorkspaceSeed.students).map((student) => ({ ...student })),
    lecturers: (saved.lecturers ?? academicWorkspaceSeed.lecturers).map((lecturer) => ({ ...lecturer })),
    curricula: (saved.curricula ?? academicWorkspaceSeed.curricula).map((curriculum) => ({ ...curriculum, code: curriculum.code ?? curriculum.id })),
    curriculumAssignments: saved.curriculumAssignments ?? academicWorkspaceSeed.curriculumAssignments,
    krs: (saved.krs ?? academicWorkspaceSeed.krs).map((record) => ({ ...record, academicYear: record.academicYear ?? "2025/2026", term: record.term ?? "GENAP" })),
    attendanceRecords: saved.attendanceRecords ?? [],
    ceremonies: (saved.ceremonies ?? academicWorkspaceSeed.ceremonies).map((ceremony) => ({ ...ceremony, code: ceremony.code ?? ceremony.id })),
    calendarEvents: (saved.calendarEvents ?? academicWorkspaceSeed.calendarEvents).map((event) => ({ ...event, academicYear: event.academicYear ?? "2025/2026" }))
  };
  return validateAcademicWorkspace(restored) ? null : restored;
}

function csvValue(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function AcademicModulePage({ moduleId }: { moduleId: string }) {
  const definition = academicModules.find((item) => item.id === moduleId);
  const [data, setData] = useState<AcademicWorkspaceData>(academicWorkspaceSeed);
  const [ready, setReady] = useState(false);
  const [activeCollection, setActiveCollection] = useState<AcademicCollection>(definition?.collection ?? "students");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editing, setEditing] = useState<AcademicRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importAuthorized, setImportAuthorized] = useState(false);
  const [importUsername, setImportUsername] = useState("Administrator SiAkad");

  useEffect(() => {
    let active = true;
    void activeAuthProvider.getSession().then((session) => {
      if (!active) return;
      const target = importTargets[moduleId];
      const permission = target ? importPermissionCodes[target.moduleId] : "";
      const permissions = Array.isArray(session?.user.permissions) ? session.user.permissions : [];
      setImportUsername(session?.user.name ?? "Administrator SiAkad");
      setImportAuthorized(session?.authenticated === true && (session.user.role === "SUPER_ADMIN" || Boolean(permission && permissions.includes(permission))));
    });
    return () => { active = false; };
  }, [moduleId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(academicStorageKey);
      if (saved) {
        const restored = restoreWorkspace(JSON.parse(saved) as unknown);
        if (restored) setData(restored);
      }
    } catch {
      window.localStorage.removeItem(academicStorageKey);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(academicStorageKey, JSON.stringify(data));
  }, [data, ready]);

  const relatedCollections = definition?.relatedCollections ?? [];
  useEffect(() => {
    setActiveCollection(definition?.collection ?? "students");
    setSearch("");
    setStatusFilter("ALL");
    setEditing(null);
    setIsCreating(false);
  }, [definition?.id, definition?.collection]);

  const rows = useMemo(() => definition ? getRows(data, definition, activeCollection) : [], [data, definition, activeCollection]);
  const columns = definition ? getColumns(definition, activeCollection) : [];
  const filteredRows = rows.filter((row) => {
    const matchesSearch = search.trim() === "" || columns.some(({ key }) => formatCell(data, key, row[key]).toLocaleLowerCase("id").includes(search.toLocaleLowerCase("id")));
    const matchesStatus = statusFilter === "ALL" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const stateCounts = rows.reduce<Record<string, number>>((counts, row) => {
    const state = typeof row.status === "string" ? row.status : "Tanpa Status";
    counts[state] = (counts[state] ?? 0) + 1;
    return counts;
  }, {});

  if (!definition) return <section className="academic-module"><h1>Modul tidak ditemukan</h1><a href="/dashboard">Kembali ke Dashboard</a></section>;

  function updateCollection(collection: AcademicCollection, transform: (current: AcademicRow[]) => AcademicRow[]) {
    setData((previous) => {
      const current = previous[collection] as unknown as AcademicRow[];
      const changed = transform(current);
      const next = { ...previous, [collection]: changed } as AcademicWorkspaceData;
      if (collection === "krs") {
        const changedKrs = changed as unknown as KrsRecord[];
        const affectedStudents = new Set([...previous.krs, ...changedKrs].map((entry) => entry.studentId));
        next.offerings = next.offerings.map((offering) => {
          const retained = offering.studentIds.filter((studentId) => !affectedStudents.has(studentId));
          const approved = changedKrs.filter((entry) => entry.status === "APPROVED" && affectedStudents.has(entry.studentId) && entry.offeringIds.includes(offering.id)).map((entry) => entry.studentId);
          return { ...offering, studentIds: [...new Set([...retained, ...approved])] };
        });
      }
      if (collection === "graduations") {
        const graduatedIds = new Set(changed.filter((entry) => entry.status === "GRADUATED").map((entry) => entry.studentId));
        next.students = next.students.map((student) => graduatedIds.has(student.id) ? { ...student, status: "LULUS" } : student);
      }
      if (collection === "ceremonyRegistrations") {
        next.ceremonies = next.ceremonies.map((ceremony) => ({ ...ceremony, registrationIds: changed.filter((entry) => entry.ceremonyId === ceremony.id).map((entry) => String(entry.id)) }));
      }
      const validation = validateAcademicWorkspace(next);
      if (validation) {
        setError(validation);
        return previous;
      }
      setError("");
      setMessage("Perubahan tersimpan pada data demo di browser ini.");
      return next;
    });
  }

  function openCreate() {
    setEditing(createRecord(activeCollection));
    setIsCreating(true);
    setError("");
  }

  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const nextRecord = activeCollection === "grades" ? gradeSummary(editing) : editing;
    const uniqueKey: Partial<Record<AcademicCollection, string>> = { students: "nim", lecturers: "nidn", programs: "code", courses: "code", offerings: "code" };
    const uniqueField = uniqueKey[activeCollection];
    if (uniqueField && rows.some((row) => row[uniqueField] === nextRecord[uniqueField] && row.id !== nextRecord.id)) {
      setError(`${labels[uniqueField] ?? uniqueField} sudah digunakan.`);
      return;
    }
    if (activeCollection === "krs" && nextRecord.status === "APPROVED") {
      const blocker = krsBlocker(data, nextRecord);
      if (blocker) {
        setError(blocker);
        return;
      }
    }
    updateCollection(activeCollection, (current) => isCreating ? [...current, nextRecord] : current.map((record) => record.id === nextRecord.id ? nextRecord : record));
    setEditing(null);
    setIsCreating(false);
  }

  function updateField(field: string, value: unknown) {
    setEditing((current) => current ? { ...current, [field]: value } : current);
  }

  function changeWorkflow(row: AcademicRow, forcedStatus?: string) {
    const currentState = String(row.status ?? "");
    const nextState = forcedStatus ?? transitions[activeCollection]?.[currentState];
    if (!nextState) return;
    const rejectionReason = activeCollection === "krs" && nextState === "REJECTED" ? window.prompt("Masukkan alasan penolakan KRS:")?.trim() : undefined;
    if (activeCollection === "krs" && nextState === "REJECTED" && !rejectionReason) return;
    if (activeCollection === "krs" && nextState === "APPROVED") {
      const blocker = krsBlocker(data, row);
      if (blocker) {
        setError(blocker);
        return;
      }
    }
    if (activeCollection === "graduations" && ["ELIGIBLE", "VERIFIED"].includes(nextState)) {
      const student = data.students.find((entry) => entry.id === row.studentId);
      const rule = data.graduationRules.find((entry) => entry.programId === student?.programId && entry.active);
      const credits = Number(row.credits ?? 0);
      const gpa = Number(row.gpa ?? 0);
      const attendance = Number(row.attendancePercent ?? 0);
      if (!rule || credits < rule.minimumCredits || gpa < rule.minimumGpa || attendance < rule.minimumAttendancePercent || (Array.isArray(row.outstandingRequirements) && row.outstandingRequirements.length > 0)) {
        setError("Mahasiswa belum memenuhi aturan kelulusan program studi.");
        return;
      }
    }
    if (activeCollection === "ceremonyRegistrations" && nextState === "VERIFIED") {
      const complete = Number(row.documentsReady) >= Number(row.documentsRequired);
      const registrationStudent = data.students.find((student) => student.id === row.studentId);
      const eligible = data.graduations.some((evaluation) => evaluation.studentId === row.studentId && ["ELIGIBLE", "VERIFIED", "GRADUATED"].includes(evaluation.status));
      if (!complete || registrationStudent?.status !== "LULUS" || !eligible) {
        setError("Verifikasi memerlukan dokumen lengkap serta mahasiswa berstatus lulus dan memenuhi syarat kelulusan.");
        return;
      }
    }
    updateCollection(activeCollection, (current) => current.map((entry) => entry.id === row.id ? { ...entry, status: nextState, ...(rejectionReason ? { rejectionReason } : {}) } : entry));
  }

  function deleteRecord(row: AcademicRow) {
    const inverseCeremonyRegistration = activeCollection === "ceremonyRegistrations";
    if (!inverseCeremonyRegistration && hasReferences(data, activeCollection, String(row.id))) {
      setError("Data ini masih dipakai oleh entitas akademik lain. Hapus atau ubah relasinya terlebih dahulu.");
      return;
    }
    if (!window.confirm("Hapus data ini? Tindakan ini tidak dapat dibatalkan.")) return;
    updateCollection(activeCollection, (current) => current.filter((entry) => entry.id !== row.id));
  }

  function exportCsv() {
    const content = [columns.map(({ label }) => csvValue(label)).join(","), ...filteredRows.map((row) => columns.map(({ key }) => csvValue(formatCell(data, key, row[key]))).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${moduleId}-${activeCollection}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function resetDemoData() {
    if (!window.confirm("Kembalikan seluruh data akademik demo ke kondisi awal?")) return;
    setData(academicWorkspaceSeed);
    setMessage("Data demo dikembalikan ke kondisi awal.");
    setError("");
  }

  function commitImportedData(next: AcademicWorkspaceData) {
    const validation = validateAcademicWorkspace(next);
    if (validation) return validation;
    setData(next);
    setMessage("Import berhasil disimpan pada data demo lokal.");
    setError("");
    return null;
  }

  const activeStatusOptions = [...new Set(rows.map((row) => typeof row.status === "string" ? row.status : "").filter(Boolean))];
  const pendingCount = Object.entries(stateCounts).filter(([status]) => ["SUBMITTED", "PENDING", "REGISTERED", "DRAFT"].includes(status)).reduce((sum, [, count]) => sum + count, 0);
  const formFields = editing ? Object.keys(editing).filter((field) => field !== "id" && field !== "finalScore" && field !== "grade" && field !== "attendanceRate" && field !== "registrationCount" && (field !== "status" || (!transitions[activeCollection] && activeCollection !== "schedules")) && !(definition.id === "khs-transkrip")) : [];

  return <section className="academic-module">
    <div className="academic-heading">
      <div><span className="academic-eyebrow">AKADEMIK / {collectionLabels[activeCollection]?.toLocaleUpperCase("id") ?? "DATA"}</span><h1>{activeCollection === definition.collection ? definition.title : collectionLabels[activeCollection] ?? definition.title}</h1><p>{activeCollection === definition.collection ? definition.description : `Kelola data ${collectionLabels[activeCollection]?.toLocaleLowerCase("id") ?? "akademik"} yang terhubung pada ${definition.title.toLocaleLowerCase("id")}.`}</p></div>
      <div className="academic-heading-actions"><button className="academic-icon-button" onClick={exportCsv} title="Ekspor CSV" type="button"><Download size={16} /><span>Ekspor</span></button>{definition.readOnly ? <button className="academic-icon-button" onClick={() => window.print()} title="Cetak ringkasan" type="button"><Printer size={16} /><span>Cetak</span></button> : <><button className="academic-primary-button" onClick={openCreate} type="button"><FilePlus2 size={16} /> Tambah</button>{importTargets[moduleId]?.collection === activeCollection && importAuthorized ? <button className="academic-icon-button" onClick={() => setImportOpen(true)} type="button"><Upload size={16} /> Import Data</button> : null}</>}</div>
    </div>
    {relatedCollections.length > 0 ? <div aria-label="Entitas akademik" className="academic-entity-tabs" role="tablist">
      {[definition.collection, ...relatedCollections].map((collection) => <button aria-selected={activeCollection === collection} className="academic-entity-tab" key={collection} onClick={() => { setActiveCollection(collection); setError(""); }} role="tab" type="button">{collectionLabels[collection] ?? collection}</button>)}
    </div> : null}
    <div className="academic-metrics">
      <div><span>RECORD</span><strong>{rows.length}</strong><small>{collectionLabels[activeCollection] ?? "Data akademik"}</small></div>
      <div><span>PERLU TINDAKAN</span><strong>{pendingCount}</strong><small>Draf, pengajuan, atau verifikasi</small></div>
      <div><span>TERTAMPIL</span><strong>{filteredRows.length}</strong><small>Sesuai pencarian dan filter</small></div>
      <div className="academic-demo-state"><span>SUMBER DATA</span><strong>DEMO LOKAL</strong><small>Perubahan tersimpan di browser ini</small></div>
    </div>
    <div className="academic-toolbar">
      <label className="academic-search"><Search aria-hidden="true" size={16} /><input aria-label="Cari data" onChange={(event) => setSearch(event.target.value)} placeholder="Cari berdasarkan data pada tabel..." value={search} /></label>
      {activeStatusOptions.length > 0 ? <label className="academic-filter"><span>Status</span><select aria-label="Filter status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="ALL">Semua status</option>{activeStatusOptions.map((value) => <option key={value} value={value}>{stateLabels[value] ?? value}</option>)}</select></label> : null}
      <button className="academic-reset-button" onClick={resetDemoData} type="button"><RotateCcw size={14} /> Reset demo</button>
    </div>
    {error ? <div className="academic-feedback is-error" role="alert">{error}</div> : message ? <div className="academic-feedback" role="status">{message}</div> : null}
    {!ready ? <div className="academic-empty">Memuat ruang kerja akademik...</div> : filteredRows.length === 0 ? <div className="academic-empty"><strong>Tidak ada data yang cocok.</strong><span>Ubah kata pencarian atau tambahkan data baru.</span></div> : <div className="academic-table-wrap"><table className="academic-table"><thead><tr>{columns.map(({ key, label }) => <th key={key} scope="col">{label}</th>)}{!definition.readOnly ? <th scope="col">Tindakan</th> : null}</tr></thead><tbody>
      {filteredRows.map((row) => {
        const nextStatus = transitions[activeCollection]?.[String(row.status ?? "")];
        return <tr key={String(row.id)}>{columns.map(({ key }) => <td key={key}>{key === "status" ? <span className={`academic-status status-${String(row[key]).toLowerCase().replaceAll("_", "-")}`}>{stateLabels[String(row[key])] ?? String(row[key] ?? "-")}</span> : key === "attendanceRate" && Number.parseInt(String(row[key]), 10) < 75 ? <span className="academic-status status-warning">{String(row[key])}</span> : formatCell(data, key, row[key])}</td>)}{!definition.readOnly ? <td><div className="academic-row-actions">{nextStatus ? <button className="academic-text-action" onClick={() => changeWorkflow(row)} type="button" title={`Ubah status menjadi ${stateLabels[nextStatus] ?? nextStatus}`}>{nextStatus === "APPROVED" ? "Setujui" : nextStatus === "VERIFIED" ? "Verifikasi" : nextStatus === "PUBLISHED" ? "Terbitkan" : nextStatus === "GRADUATED" ? "Tandai lulus" : nextStatus === "CLOSED" ? "Tutup" : nextStatus === "ACTIVE" ? "Aktifkan" : nextStatus === "OPEN" ? "Buka" : "Lanjutkan"}</button> : null}{activeCollection === "krs" && row.status === "SUBMITTED" ? <button className="academic-text-action is-reject" onClick={() => changeWorkflow(row, "REJECTED")} type="button">Tolak</button> : null}<button aria-label={`Edit ${recordName(row)}`} className="academic-small-icon" onClick={() => { setEditing({ ...row }); setIsCreating(false); setError(""); }} title="Edit data" type="button"><Pencil size={14} /></button><button aria-label={`Hapus ${recordName(row)}`} className="academic-small-icon is-danger" onClick={() => deleteRecord(row)} title="Hapus data" type="button"><Trash2 size={14} /></button></div></td> : null}</tr>;
      })}
    </tbody></table></div>}
    <div className="academic-footnote"><span>Data modul saling merujuk melalui ID entitas. Penghapusan ditolak selama record masih dipakai.</span><span>{filteredRows.length} dari {rows.length} record</span></div>
    {editing ? <div className="academic-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setEditing(null); setIsCreating(false); } }}>
      <section aria-labelledby="academic-form-title" aria-modal="true" className="academic-modal" role="dialog"><header><div><span className="academic-eyebrow">{collectionLabels[activeCollection]?.toLocaleUpperCase("id") ?? "DATA AKADEMIK"}</span><h2 id="academic-form-title">{isCreating ? "Tambah data" : "Ubah data"}</h2></div><button aria-label="Tutup formulir" className="academic-small-icon" onClick={() => { setEditing(null); setIsCreating(false); }} type="button"><X size={18} /></button></header>
        <form onSubmit={saveRecord}><div className="academic-form-grid">{formFields.map((field) => {
          const value = editing[field];
          const fieldLabel = labels[field] ?? field.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
          const fieldOptions = getFieldOptions(data, activeCollection, field, rows);
          const isMultiSelect = Array.isArray(value);
          const isCheckbox = typeof value === "boolean";
          const isNumber = typeof value === "number";
          const isSelect = fieldOptions.length > 0 || field === "status";
          const optional = field === "phone" || field === "rejectionReason" || field === "description" || field === "unit" || field === "title" || field === "nip" || field === "requiredDocuments" || field === "outstandingRequirements";
          return <label className={`academic-form-field${field === "description" || field === "rejectionReason" ? " is-wide" : ""}`} key={field}>
            {isCheckbox ? <span className="academic-checkbox-label"><input checked={Boolean(value)} onChange={(event) => updateField(field, event.target.checked)} type="checkbox" />{fieldLabel}</span> : <><span>{fieldLabel}{!optional ? <b> *</b> : null}</span>{isSelect || isMultiSelect ? <select aria-label={fieldLabel} multiple={isMultiSelect} onChange={(event) => updateField(field, isMultiSelect ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value)} required={!optional && !isMultiSelect} size={isMultiSelect ? Math.min(5, Math.max(3, fieldOptions.length)) : undefined} value={isMultiSelect ? (value as string[]) : String(value ?? "")}>
              {!isMultiSelect ? <option value="">Pilih {fieldLabel.toLocaleLowerCase("id")}</option> : null}{fieldOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select> : field === "description" || field === "rejectionReason" || field === "outstandingRequirements" || field === "requiredDocuments" ? <textarea onChange={(event) => updateField(field, ["outstandingRequirements", "requiredDocuments"].includes(field) ? event.target.value.split(",").map((item) => item.trim()).filter(Boolean) : event.target.value)} required={!optional} rows={3} value={Array.isArray(value) ? value.join(", ") : String(value ?? "")} /> : <input autoComplete="off" max={isNumber && field.includes("Score") ? 100 : undefined} min={isNumber ? 0 : undefined} onChange={(event) => updateField(field, isNumber ? Number(event.target.value) : event.target.value)} required={!optional} step={isNumber ? "any" : undefined} type={isNumber ? "number" : field === "start" || field === "end" ? activeCollection === "schedules" ? "time" : "date" : field.toLocaleLowerCase("id").includes("date") || field === "date" || field === "registrationStart" || field === "registrationEnd" ? "date" : field === "email" ? "email" : "text"} value={String(value ?? "")} />}</>}
          </label>;
        })}</div>
          <p className="academic-form-note">Perubahan pada mode demo hanya tersimpan di browser ini. Record produksi memerlukan endpoint API akademik.</p>
          {error ? <div className="academic-feedback is-error" role="alert">{error}</div> : null}
          <footer><button className="academic-secondary-button" onClick={() => { setEditing(null); setIsCreating(false); }} type="button">Batal</button><button className="academic-primary-button" type="submit">Simpan Perubahan</button></footer>
        </form>
      </section>
    </div> : null}
    {importOpen && importTargets[moduleId]?.collection === activeCollection ? <DataImportDialog authorized={importAuthorized} data={data} moduleId={importTargets[moduleId].moduleId} onClose={() => setImportOpen(false)} onCommit={commitImportedData} username={importUsername} /> : null}
  </section>;
}