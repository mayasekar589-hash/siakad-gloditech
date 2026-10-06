"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldCheck, X } from "lucide-react";

type StudentStatus = "AKTIF" | "CUTI" | "NONAKTIF" | "LULUS" | "DROP_OUT";
type StudyProgram = { id: string; code?: string; name: string } | null;
type KrsStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
type KrsHistory = { id: string; oldStatus: KrsStatus; newStatus: KrsStatus; reason: string | null; actorLabel: string; createdAt: string };
type KrsItem = { offering: { course: { code: string; name: string; credits: number }; lecturer?: { name: string } | null; schedules?: { day: string; start: string; end: string; room: string }[] } };
type KrsRecord = { id: string; academicYear: string; term: string; status: KrsStatus; rejectionReason: string | null; updatedAt: string; items?: KrsItem[]; statusHistory?: KrsHistory[] };
type StatusHistory = { id: string; oldStatus: StudentStatus; newStatus: StudentStatus; effectiveAt: string; reason: string; notes: string | null; actorLabel: string; createdAt: string };
type Student = {
  id: string; studentNumber: string | null; name: string | null; academicStatus: StudentStatus; cohort: number | null; semester: number | null; className: string | null;
  updatedAt?: string;
  email?: string | null; phone?: string | null; studyProgram: StudyProgram; krsRecords?: KrsRecord[]; statusHistory?: StatusHistory[]; grades?: { finalScore: number; grade: string }[];
  applicant?: { email: string | null; phone: string | null } | null; sourceApplication?: { registrationNumber: string; status: string } | null;
};
type Workspace = "status-mahasiswa" | "registrasi-akademik";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const academicStatuses: StudentStatus[] = ["AKTIF", "CUTI", "NONAKTIF", "LULUS", "DROP_OUT"];
const krsStatuses: KrsStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];
const statusLabels: Record<string, string> = { AKTIF: "Aktif", CUTI: "Cuti", NONAKTIF: "Nonaktif", LULUS: "Lulus", DROP_OUT: "Drop Out", DRAFT: "Draf", SUBMITTED: "Menunggu Verifikasi", APPROVED: "Disetujui", REJECTED: "Ditolak" };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || `API merespons ${response.status}.`);
  }
  return body as T;
}

function badge(status: string) {
  const tone = ["AKTIF", "APPROVED", "LULUS"].includes(status) ? "status-approved" : ["DROP_OUT", "REJECTED"].includes(status) ? "status-rejected" : ["CUTI", "DRAFT", "SUBMITTED"].includes(status) ? "status-warning" : "status-neutral";
  return `academic-status ${tone}`;
}

function dateLabel(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function StudentLifeWorkspace({ workspace }: { workspace: Workspace }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [krsRows, setKrsRows] = useState<KrsRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedKrs, setSelectedKrs] = useState<KrsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [programFilter, setProgramFilter] = useState("semua");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusForm, setStatusForm] = useState({ status: "AKTIF" as StudentStatus, effectiveAt: new Date().toISOString().slice(0, 10), reason: "", notes: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [reviewTarget, setReviewTarget] = useState<KrsRecord | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    if (workspace === "status-mahasiswa") {
      const records = await request<Student[]>("/students/admin");
      setStudents(records);
      return;
    }
    const records = await request<KrsRecord[]>("/krs/admin");
    setKrsRows(records);
  }, [workspace]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void reload().catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Data tidak dapat dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  const visibleStudents = useMemo(() => students.filter((student) => {
    const matchesSearch = !query || `${student.studentNumber ?? ""} ${student.name ?? ""} ${student.studyProgram?.name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (statusFilter === "semua" || student.academicStatus === statusFilter) && (programFilter === "semua" || student.studyProgram?.id === programFilter);
  }), [students, query, statusFilter, programFilter]);
  const programs = Array.from(new Map(students.flatMap((student) => student.studyProgram ? [[student.studyProgram.id, student.studyProgram] as const] : [])).values());
  const visibleKrs = useMemo(() => krsRows.filter((record) => {
    const student = (record as KrsRecord & { student?: Student }).student;
    const matchesSearch = !query || `${student?.studentNumber ?? ""} ${student?.name ?? ""} ${student?.studyProgram?.name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (statusFilter === "semua" || record.status === statusFilter) && (programFilter === "semua" || student?.studyProgram?.id === programFilter);
  }), [krsRows, query, statusFilter, programFilter]);

  async function showStudent(studentId: string) {
    setSaving(true);
    setError(null);
    try {
      const detail = await request<Student>(`/students/admin/${studentId}`);
      setSelectedStudent(detail);
      setStatusForm({ status: detail.academicStatus, effectiveAt: new Date().toISOString().slice(0, 10), reason: "", notes: "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Detail mahasiswa tidak dapat dibuka.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await request(`/students/admin/${selectedStudent.id}/status`, { method: "PATCH", body: JSON.stringify(statusForm) });
      const detail = await request<Student>(`/students/admin/${selectedStudent.id}`);
      setSelectedStudent(detail);
      await reload();
      setNotice(`Status ${detail.studentNumber} diperbarui dan dicatat di riwayat.`);
      setStatusForm((current) => ({ ...current, reason: "", notes: "" }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status mahasiswa tidak dapat diperbarui.");
    } finally {
      setSaving(false);
    }
  }

  async function reviewKrs(krsId: string, status: KrsStatus, reason = "") {
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await request(`/krs/admin/${krsId}/review`, { method: "PATCH", body: JSON.stringify({ status, reason }) });
      await reload();
      setNotice(`Status KRS diperbarui menjadi ${statusLabels[status]}.`);
      setSelectedKrs(null);
      setReviewTarget(null);
      setRejectReason("");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "KRS tidak dapat diproses.");
    } finally {
      setSaving(false);
    }
  }

  const title = workspace === "status-mahasiswa" ? "Status Mahasiswa" : "Registrasi Akademik";
  const activeStudents = students.filter((student) => student.academicStatus === "AKTIF").length;

  return <section className="academic-module">
    <header className="academic-heading"><div><span className="academic-eyebrow">KEMAHASISWAAN · DATA AKADEMIK</span><h1>{title}</h1><p>{workspace === "status-mahasiswa" ? "Kelola status akademik pada record mahasiswa kanonis dan tinjau riwayat perubahan." : "Tinjau registrasi semester dan KRS dari record akademik yang sama dengan portal Taruna."}</p></div><div className="academic-heading-actions"><button className="academic-secondary-button" disabled={loading || saving} onClick={() => void reload().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Muat ulang gagal."))} type="button"><ShieldCheck size={14} /> Muat Ulang</button></div></header>
    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}{notice ? <p className="academic-feedback" role="status">{notice}</p> : null}
    {workspace === "status-mahasiswa" ? <>
      <div className="academic-metrics">{[["TOTAL MAHASISWA", students.length], ["AKTIF", activeStudents], ["CUTI", students.filter((student) => student.academicStatus === "CUTI").length], ["NONAKTIF / LAINNYA", students.filter((student) => !["AKTIF", "CUTI"].includes(student.academicStatus)).length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Student API · sumber data kanonis</small></div>)}</div>
      <div className="academic-toolbar admissions-filters"><label className="academic-search"><Search size={12} /><input aria-label="Cari mahasiswa" onChange={(event) => setQuery(event.target.value)} placeholder="NIM, nama, atau program studi..." value={query} /></label><label className="academic-filter"><span>Status</span><select aria-label="Filter status mahasiswa" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="semua">Semua</option>{academicStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label className="academic-filter"><span>Program Studi</span><select aria-label="Filter program studi mahasiswa" onChange={(event) => setProgramFilter(event.target.value)} value={programFilter}><option value="semua">Semua</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label><button className="academic-reset-button" onClick={() => { setQuery(""); setStatusFilter("semua"); setProgramFilter("semua"); }} type="button">Reset</button></div>
      <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NIM</th><th>NAMA</th><th>PROGRAM STUDI</th><th>ANGKATAN</th><th>SEMESTER</th><th>KELAS</th><th>STATUS</th><th>UPDATED</th><th>AKSI</th></tr></thead><tbody>{visibleStudents.map((student) => <tr key={student.id}><td>{student.studentNumber ?? "-"}</td><td>{student.name ?? "-"}</td><td>{student.studyProgram?.name ?? "-"}</td><td>{student.cohort ?? "-"}</td><td>{student.semester ?? "-"}</td><td>{student.className ?? "-"}</td><td><span className={badge(student.academicStatus)}>{statusLabels[student.academicStatus]}</span></td><td>{dateLabel(student.updatedAt)}</td><td><button className="academic-text-action" disabled={saving} onClick={() => void showStudent(student.id)} type="button">Lihat</button></td></tr>)}</tbody></table>{!loading && visibleStudents.length === 0 ? <div className="academic-empty"><strong>Tidak ada mahasiswa pada filter ini</strong><span>Data ditampilkan dari Student API, bukan seed UI.</span></div> : null}</div>
      {selectedStudent ? <div className="academic-modal-backdrop" onClick={() => setSelectedStudent(null)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">IDENTITAS MAHASISWA · {selectedStudent.studentNumber}</span><h2>{selectedStudent.name ?? "Nama belum tersedia"}</h2><p>{selectedStudent.studyProgram?.name ?? "Program studi belum ditetapkan"} · Angkatan {selectedStudent.cohort ?? "-"}</p></div><button aria-label="Tutup detail mahasiswa" className="academic-small-icon" onClick={() => setSelectedStudent(null)} type="button"><X size={18} /></button></header><div className="admissions-detail-body"><div className="admissions-summary-grid"><div><span>NIM</span><b>{selectedStudent.studentNumber ?? "-"}</b></div><div><span>Program Studi</span><b>{selectedStudent.studyProgram?.name ?? "-"}</b></div><div><span>Angkatan</span><b>{selectedStudent.cohort ?? "-"}</b></div><div><span>Semester</span><b>{selectedStudent.semester ?? "-"}</b></div><div><span>Kelas</span><b>{selectedStudent.className ?? "-"}</b></div><div><span>Status Akademik</span><b><span className={badge(selectedStudent.academicStatus)}>{statusLabels[selectedStudent.academicStatus]}</span></b></div><div><span>Status Registrasi</span><b>{statusLabels[selectedStudent.krsRecords?.[0]?.status ?? "DRAFT"]}</b></div><div><span>KRS Terakhir</span><b>{selectedStudent.krsRecords?.[0] ? `${selectedStudent.krsRecords[0].academicYear} · ${selectedStudent.krsRecords[0].term}` : "Belum ada"}</b></div><div><span>Rata-rata nilai tersedia</span><b>{selectedStudent.grades?.length ?? 0} nilai</b></div><div><span>Email / Telepon</span><b>{selectedStudent.applicant?.email ?? selectedStudent.email ?? "-"} / {selectedStudent.applicant?.phone ?? selectedStudent.phone ?? "-"}</b></div></div><h3>Riwayat Status</h3><div className="admissions-history">{selectedStudent.statusHistory?.map((entry) => <article key={entry.id}><time>{dateLabel(entry.effectiveAt)} · dicatat {dateLabel(entry.createdAt)}</time><strong>{statusLabels[entry.oldStatus]} → {statusLabels[entry.newStatus]}</strong><span>{entry.actorLabel}</span><p>{entry.reason}{entry.notes ? ` · ${entry.notes}` : ""}</p></article>)}{!selectedStudent.statusHistory?.length ? <article><strong>{statusLabels[selectedStudent.academicStatus]}</strong><span>Status saat ini pada data mahasiswa.</span></article> : null}</div><h3>Ubah Status</h3><form className="academic-form-grid" onSubmit={(event) => void saveStatus(event)}><label className="academic-form-field"><span>Status baru</span><select onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value as StudentStatus }))} value={statusForm.status}>{academicStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label className="academic-form-field"><span>Tanggal efektif</span><input onChange={(event) => setStatusForm((current) => ({ ...current, effectiveAt: event.target.value }))} required type="date" value={statusForm.effectiveAt} /></label><label className="academic-form-field is-wide"><span>Alasan</span><input onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))} required value={statusForm.reason} /></label><label className="academic-form-field is-wide"><span>Catatan</span><textarea onChange={(event) => setStatusForm((current) => ({ ...current, notes: event.target.value }))} value={statusForm.notes} /></label><div className="academic-modal-actions is-wide"><button className="academic-primary-button" disabled={saving || !statusForm.reason.trim()} type="submit">{saving ? "Menyimpan..." : "Ubah Status &amp; Catat Riwayat"}</button></div></form></div></div></div> : null}
    </> : <>
      <div className="academic-metrics">{[["TOTAL REGISTRASI", krsRows.length], ["MENUNGGU", krsRows.filter((record) => record.status === "SUBMITTED").length], ["DISETUJUI", krsRows.filter((record) => record.status === "APPROVED").length], ["DITOLAK", krsRows.filter((record) => record.status === "REJECTED").length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Data KrsRecord</small></div>)}</div>
      <div className="academic-toolbar admissions-filters"><label className="academic-search"><Search size={12} /><input aria-label="Cari registrasi akademik" onChange={(event) => setQuery(event.target.value)} placeholder="NIM, nama, atau program studi..." value={query} /></label><label className="academic-filter"><span>Status KRS</span><select aria-label="Filter status KRS" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="semua">Semua</option>{krsStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></label><label className="academic-filter"><span>Program Studi</span><select aria-label="Filter program studi registrasi" onChange={(event) => setProgramFilter(event.target.value)} value={programFilter}><option value="semua">Semua</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label><button className="academic-reset-button" onClick={() => { setQuery(""); setStatusFilter("semua"); setProgramFilter("semua"); }} type="button">Reset</button></div>
      <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NIM</th><th>NAMA</th><th>PROGRAM STUDI</th><th>SEMESTER</th><th>TAHUN AKADEMIK</th><th>STATUS AKADEMIK</th><th>STATUS KRS</th><th>TANGGAL</th><th>AKSI</th></tr></thead><tbody>{visibleKrs.map((record) => { const student = (record as KrsRecord & { student?: Student }).student; return <tr key={record.id}><td>{student?.studentNumber ?? "-"}</td><td>{student?.name ?? "-"}</td><td>{student?.studyProgram?.name ?? "-"}</td><td>{student?.semester ?? "-"} · {record.term}</td><td>{record.academicYear}</td><td><span className={badge(student?.academicStatus ?? "NONAKTIF")}>{statusLabels[student?.academicStatus ?? "NONAKTIF"]}</span></td><td><span className={badge(record.status)}>{statusLabels[record.status]}</span>{record.rejectionReason ? <small className="admissions-reason">{record.rejectionReason}</small> : null}</td><td>{dateLabel(record.updatedAt)}</td><td><button className="academic-text-action" onClick={() => setSelectedKrs(record)} type="button">Lihat KRS</button>{record.status === "SUBMITTED" ? <div className="academic-row-actions"><button className="academic-text-action" disabled={student?.academicStatus !== "AKTIF" || saving} onClick={() => void reviewKrs(record.id, "APPROVED")} type="button">Setujui</button><button className="academic-text-action is-reject" disabled={saving} onClick={() => { setReviewTarget(record); setRejectReason(""); }} type="button">Tolak</button></div> : null}</td></tr>; })}</tbody></table>{!loading && visibleKrs.length === 0 ? <div className="academic-empty"><strong>Tidak ada registrasi akademik</strong><span>Daftar ini membaca KrsRecord yang sama dengan endpoint Taruna.</span></div> : null}</div>
      {selectedKrs ? <div className="academic-modal-backdrop" onClick={() => setSelectedKrs(null)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">REGISTRASI AKADEMIK · {selectedKrs.academicYear} · {selectedKrs.term}</span><h2>Kartu Rencana Studi</h2></div><button aria-label="Tutup detail KRS" className="academic-small-icon" onClick={() => setSelectedKrs(null)} type="button"><X size={18} /></button></header><div className="admissions-detail-body"><p>Status: <span className={badge(selectedKrs.status)}>{statusLabels[selectedKrs.status]}</span></p>{selectedKrs.rejectionReason ? <p>Alasan: {selectedKrs.rejectionReason}</p> : null}<div className="academic-table-wrap"><table className="academic-table"><thead><tr><th>KODE</th><th>MATA KULIAH</th><th>SKS</th></tr></thead><tbody>{selectedKrs.items?.map((item) => <tr key={item.offering.course.code}><td>{item.offering.course.code}</td><td>{item.offering.course.name}</td><td>{item.offering.course.credits}</td></tr>)}</tbody></table></div>{selectedKrs.statusHistory?.length ? <div className="admissions-history">{selectedKrs.statusHistory.map((entry) => <article key={entry.id}><time>{dateLabel(entry.createdAt)}</time><strong>{statusLabels[entry.oldStatus]} → {statusLabels[entry.newStatus]}</strong><span>{entry.actorLabel}</span>{entry.reason ? <p>{entry.reason}</p> : null}</article>)}</div> : null}</div></div></div> : null}
      {reviewTarget ? <div className="academic-modal-backdrop" onClick={() => setReviewTarget(null)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">PENOLAKAN KRS</span><h2>Alasan penolakan</h2></div><button aria-label="Tutup penolakan KRS" className="academic-small-icon" onClick={() => setReviewTarget(null)} type="button"><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void reviewKrs(reviewTarget.id, "REJECTED", rejectReason); }}><label className="academic-form-field"><span>Alasan wajib</span><textarea onChange={(event) => setRejectReason(event.target.value)} required value={rejectReason} /></label><footer><button className="academic-secondary-button" onClick={() => setReviewTarget(null)} type="button">Batal</button><button className="academic-primary-button" disabled={saving || !rejectReason.trim()} type="submit">Simpan Penolakan</button></footer></form></div></div> : null}
    </>}
    {loading ? <div className="academic-empty">Memuat data mahasiswa dari API...</div> : null}
    <div className="academic-footnote"><span>Perubahan status dan keputusan KRS tersimpan pada audit history API.</span><span>Data source: Student / KrsRecord</span></div>
  </section>;
}
