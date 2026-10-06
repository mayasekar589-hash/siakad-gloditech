"use client";

import ExcelJS from "exceljs";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Download, Plus, Search, Upload, X } from "lucide-react";
import { readTabularRows } from "../academic/spreadsheet";

type ModuleId = "tarif-akademik" | "beasiswa" | "rekonsiliasi";
type Program = { id: string; code: string; name: string };
type MasterRecord = {
  id: string;
  code?: string;
  name?: string;
  kind?: string;
  studyProgramId?: string | null;
  studyProgram?: Program | null;
  pathway?: string | null;
  semester?: number;
  academicYear?: string;
  amount: number;
  active?: boolean;
  studentNim?: string;
  externalAmount: number;
  internalAmount?: number | null;
  transactionDate?: string;
  externalReference?: string;
  billingNumber?: string;
  status: string;
  provider?: string;
  studentNumber?: string | null;
  startsAt?: string;
  endsAt?: string;
  student?: { studentNumber?: string | null; name?: string | null; studyProgram?: { name: string } | null };
};
type ReconciliationPreview = { rows: { row: number; transactionDate: string; externalReference: string; billingNumber: string; studentNim: string; externalAmount: number; internalAmount: number | null; paymentMethod: string; status: string; difference: number | null; error: string | null }[]; total: number; valid: number; invalid: number; issues: { row: number; message: string }[] };
type MasterImportPreview = { rows: { row: number; value: Record<string, unknown>; errors: string[]; valid: boolean }[]; total: number; valid: number; invalid: number };
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const reconHeaders = ["transaction_date", "external_reference", "billing_number", "student_nim", "amount", "payment_method"];
const tariffHeaders = ["code", "name", "kind", "study_program_code", "pathway", "semester", "academic_year", "amount", "active"];
const scholarshipHeaders = ["nim", "kind", "academic_year", "amount", "provider", "starts_at", "ends_at", "document_name", "note"];
const configs = {
  "tarif-akademik": { title: "Tarif Akademik", description: "Master tarif yang menjadi dasar pembentukan tagihan.", columns: ["Kode Tarif", "Nama Tarif", "Jenis", "Program Studi", "Jalur", "Semester", "Tahun Akademik", "Nominal", "Status"] },
  beasiswa: { title: "Beasiswa", description: "Kelola penerima dan status bantuan mahasiswa.", columns: ["NIM", "Nama", "Program Studi", "Jenis Beasiswa", "Periode", "Nominal Bantuan", "Provider", "Status"] },
  rekonsiliasi: { title: "Rekonsiliasi", description: "Cocokkan transaksi internal dengan mutasi bank/provider.", columns: ["Tanggal", "Reference", "Nomor Billing", "NIM", "Internal Amount", "External Amount", "Difference", "Status"] }
} satisfies Record<ModuleId, { title: string; description: string; columns: string[] }>;
const apiStatuses: Record<string, string> = { ACTIVE: "Aktif", PENDING_VERIFICATION: "Menunggu Verifikasi", REJECTED: "Ditolak", COMPLETED: "Selesai", MATCHED: "Matched", UNMATCHED: "Unmatched", DIFFERENCE: "Selisih", PENDING: "Pending" };

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : `API keuangan merespons ${response.status}.`);
  }
  return body as T;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "-"; }

function MasterModal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) {
  return <div className="academic-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section aria-modal="true" aria-label={title} className="academic-modal billing-modal-wide" role="dialog"><header><div><span className="academic-eyebrow">KEUANGAN · MASTER DATA</span><h2>{title}</h2></div><button aria-label="Tutup" className="academic-small-icon" onClick={close} type="button"><X size={17} /></button></header>{children}</section></div>;
}

export function FinanceMasterWorkspace({ moduleId }: { moduleId: ModuleId }) {
  const config = configs[moduleId];
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [students, setStudents] = useState<MasterRecord[]>([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [reconImportOpen, setReconImportOpen] = useState(false);
  const [masterImportOpen, setMasterImportOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ReconciliationPreview | null>(null);
  const [masterPreview, setMasterPreview] = useState<MasterImportPreview | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (year) params.set("academicYear", year);
      if (status) params.set("status", status);
      const path = moduleId === "tarif-akademik" ? "/finance/admin/tariffs" : moduleId === "beasiswa" ? "/finance/admin/scholarships" : "/finance/admin/reconciliations";
      setRows(await request<MasterRecord[]>(`${path}${params.size ? `?${params}` : ""}`));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `${config.title} gagal dimuat.`);
    } finally {
      setLoading(false);
    }
  }, [config.title, moduleId, query, status, year]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (moduleId === "rekonsiliasi") return;
    void Promise.all([
      request<Program[]>("/finance/admin/study-programs"),
      moduleId === "beasiswa" ? request<MasterRecord[]>("/finance/admin/students") : Promise.resolve([])
    ]).then(([nextPrograms, nextStudents]) => { setPrograms(nextPrograms); setStudents(nextStudents); }).catch((failure: unknown) => setError(failure instanceof Error ? failure.message : "Data referensi gagal dimuat."));
  }, [moduleId]);

  function openCreate() {
    setError("");
    setForm(moduleId === "tarif-akademik"
      ? { code: "", name: "", kind: "", studyProgramId: "", pathway: "", semester: "1", academicYear: "2026/2027", amount: "", active: "true" }
      : { studentId: "", kind: "", academicYear: "2026/2027", amount: "", provider: "", startsAt: "", endsAt: "", documentName: "", note: "" });
    setFormOpen(true);
  }

  async function saveMaster(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = moduleId === "tarif-akademik"
        ? { code: form.code, name: form.name, kind: form.kind, studyProgramId: form.studyProgramId || undefined, pathway: form.pathway || undefined, semester: Number(form.semester), academicYear: form.academicYear, amount: Number(form.amount), active: form.active === "true" }
        : { studentId: form.studentId, kind: form.kind, academicYear: form.academicYear, amount: Number(form.amount), provider: form.provider, startsAt: form.startsAt, endsAt: form.endsAt, documentName: form.documentName || undefined, note: form.note || undefined };
      await request(moduleId === "tarif-akademik" ? "/finance/admin/tariffs" : "/finance/admin/scholarships", { method: "POST", body: JSON.stringify(payload) });
      setFormOpen(false);
      setNotice(`${config.title} berhasil disimpan.`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : `${config.title} gagal disimpan.`);
    } finally {
      setBusy(false);
    }
  }

  async function reviewScholarship(id: string, nextStatus: "ACTIVE" | "REJECTED") {
    const reason = nextStatus === "REJECTED" ? window.prompt("Alasan penolakan beasiswa:") : undefined;
    if (nextStatus === "REJECTED" && !reason?.trim()) return;
    setBusy(true);
    try {
      await request(`/finance/admin/scholarships/${id}/review`, { method: "PATCH", body: JSON.stringify({ status: nextStatus, reason }) });
      setNotice(nextStatus === "ACTIVE" ? "Beasiswa disetujui." : "Beasiswa ditolak dengan alasan tercatat.");
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Review beasiswa gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadMasterTemplate(format: "csv" | "xlsx") {
    const headers = moduleId === "tarif-akademik" ? tariffHeaders : scholarshipHeaders;
    const filename = moduleId === "tarif-akademik" ? "template-tarif-akademik" : "template-beasiswa";
    if (format === "csv") {
      saveBlob(new Blob(["\uFEFF", headers.join(",") + "\r\n"], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(config.title);
    sheet.columns = headers.map((header) => ({ header, key: header, width: Math.max(18, header.length + 5) }));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
    const buffer = await workbook.xlsx.writeBuffer();
    saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${filename}.xlsx`);
  }

  async function previewMasterImport(nextFile: File) {
    const headers = moduleId === "tarif-akademik" ? tariffHeaders : scholarshipHeaders;
    setFile(nextFile);
    setError("");
    setBusy(true);
    try {
      if (nextFile.size > 5 * 1024 * 1024) throw new Error("Ukuran file maksimum 5 MB.");
      const parsed = await readTabularRows(nextFile, headers);
      const path = moduleId === "tarif-akademik" ? "/finance/admin/tariffs/import/validate" : "/finance/admin/scholarships/import/validate";
      setMasterPreview(await request<MasterImportPreview>(path, { method: "POST", body: JSON.stringify({ rows: parsed.map((item) => item.values) }) }));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "File gagal divalidasi.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmMasterImport() {
    if (!file || !masterPreview || masterPreview.invalid) return;
    setBusy(true);
    setError("");
    try {
      const headers = moduleId === "tarif-akademik" ? tariffHeaders : scholarshipHeaders;
      const parsed = await readTabularRows(file, headers);
      const path = moduleId === "tarif-akademik" ? "/finance/admin/tariffs/import/confirm" : "/finance/admin/scholarships/import/confirm";
      const result = await request<{ imported: number }>(path, { method: "POST", body: JSON.stringify({ rows: parsed.map((item) => item.values) }) });
      setMasterImportOpen(false);
      setMasterPreview(null);
      setFile(null);
      setNotice(`${result.imported} data ${config.title.toLowerCase()} berhasil diimpor.`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Import gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadReconTemplate(format: "csv" | "xlsx") {
    if (format === "csv") { saveBlob(new Blob(["\uFEFF", reconHeaders.join(",") + "\r\n"], { type: "text/csv;charset=utf-8" }), "template-rekonsiliasi.csv"); return; }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rekonsiliasi");
    sheet.columns = reconHeaders.map((header) => ({ header, key: header, width: Math.max(18, header.length + 4) }));
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
    const buffer = await workbook.xlsx.writeBuffer();
    saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "template-rekonsiliasi.xlsx");
  }

  async function previewRecon(nextFile: File) {
    setFile(nextFile);
    setError("");
    setBusy(true);
    try {
      const parsed = await readTabularRows(nextFile, reconHeaders);
      const result = await request<ReconciliationPreview>("/finance/admin/reconciliations/import/validate", { method: "POST", body: JSON.stringify({ rows: parsed.map((item) => item.values) }) });
      setPreview(result);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "File rekonsiliasi gagal divalidasi.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReconImport() {
    if (!file || !preview || preview.invalid) return;
    setBusy(true);
    try {
      const parsed = await readTabularRows(file, reconHeaders);
      const result = await request<{ imported: number }>("/finance/admin/reconciliations/import/confirm", { method: "POST", body: JSON.stringify({ rows: parsed.map((item) => item.values) }) });
      setReconImportOpen(false);
      setPreview(null);
      setFile(null);
      setNotice(`${result.imported} baris rekonsiliasi disimpan.`);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Import rekonsiliasi gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function exportRows(format: "csv" | "xlsx") {
    const headers = config.columns;
    const data = filteredRows.map((row) => moduleId === "tarif-akademik"
      ? [row.code, row.name, row.kind, row.studyProgram?.name, row.pathway, row.semester, row.academicYear, row.amount, row.active ? "Aktif" : "Nonaktif"]
      : moduleId === "beasiswa"
        ? [row.student?.studentNumber, row.student?.name, row.student?.studyProgram?.name, row.kind, row.academicYear, row.amount, row.provider, apiStatuses[row.status] ?? row.status]
        : [row.transactionDate, row.externalReference, row.billingNumber, row.studentNim, row.internalAmount, row.externalAmount, row.internalAmount == null ? "-" : row.externalAmount - row.internalAmount, apiStatuses[row.status] ?? row.status]);
    if (format === "csv") {
      const csv = [headers, ...data].map((line) => line.map(csvCell).join(",")).join("\r\n");
      saveBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), `${moduleId}.csv`);
    } else {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(config.title);
      sheet.addRow(headers);
      data.forEach((row) => sheet.addRow(row));
      sheet.columns = headers.map((header) => ({ width: Math.max(16, header.length + 5) }));
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
      const buffer = await workbook.xlsx.writeBuffer();
      saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${moduleId}.xlsx`);
    }
  }

  const totalAmount = rows.reduce((sum, row) => sum + Number(moduleId === "rekonsiliasi" ? row.externalAmount : row.amount), 0);
  const summary = moduleId === "tarif-akademik"
    ? [["TARIF AKTIF", rows.filter((row) => row.active).length], ["PROGRAM TERCAKUP", new Set(rows.map((row) => row.studyProgramId).filter(Boolean)).size], ["JENIS TARIF", new Set(rows.map((row) => row.kind)).size], ["TOTAL NOMINAL", currency.format(totalAmount)]]
    : moduleId === "beasiswa"
      ? [["TOTAL PENERIMA", rows.length], ["AKTIF", rows.filter((row) => row.status === "ACTIVE").length], ["MENUNGGU VERIFIKASI", rows.filter((row) => row.status === "PENDING_VERIFICATION").length], ["TOTAL BANTUAN", currency.format(totalAmount)]]
      : [["TOTAL INTERNAL", currency.format(rows.reduce((sum, row) => sum + Number(row.internalAmount ?? 0), 0))], ["TOTAL EKSTERNAL", currency.format(totalAmount)], ["MATCHED", rows.filter((row) => row.status === "MATCHED").length], ["BELUM COCOK", rows.filter((row) => row.status !== "MATCHED").length]];

  function cells(row: MasterRecord) {
    if (moduleId === "tarif-akademik") return [row.code, row.name, row.kind, row.studyProgram?.name ?? "Semua Program", row.pathway || "-", row.semester, row.academicYear, currency.format(row.amount), row.active ? "Aktif" : "Nonaktif"];
    if (moduleId === "beasiswa") return [row.student?.studentNumber ?? "-", row.student?.name ?? "-", row.student?.studyProgram?.name ?? "-", row.kind, row.academicYear, currency.format(row.amount), row.provider, apiStatuses[row.status] ?? row.status];
    return [formatDate(row.transactionDate), row.externalReference, row.billingNumber, row.studentNim, row.internalAmount == null ? "-" : currency.format(row.internalAmount), currency.format(row.externalAmount), row.internalAmount == null ? "-" : currency.format(row.externalAmount - row.internalAmount), apiStatuses[row.status] ?? row.status];
  }

  const filteredRows = rows.filter((row) =>
    (!programFilter || row.studyProgramId === programFilter || row.student?.studyProgram?.name === programs.find((program) => program.id === programFilter)?.name)
    && (!kindFilter || row.kind === kindFilter)
  );
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  return <section className="academic-module finance-billing-workspace">
    <header className="academic-heading">
      <div><span className="academic-eyebrow">KEUANGAN · PENGELOLAAN</span><h1>{config.title}</h1><p>{config.description}</p></div>
      <div className="academic-heading-actions">
        <button className="academic-icon-button" onClick={() => void exportRows("csv")} type="button"><Download size={14} />Export CSV</button>
        <button className="academic-icon-button" onClick={() => void exportRows("xlsx")} type="button"><Download size={14} />Export XLSX</button>
        {moduleId === "rekonsiliasi" ? <button className="academic-secondary-button" onClick={() => { setReconImportOpen(true); setPreview(null); setFile(null); }} type="button"><Upload size={14} />Import Data</button> : <>
          <button className="academic-secondary-button" onClick={() => { setMasterImportOpen(true); setMasterPreview(null); setFile(null); setError(""); }} type="button"><Upload size={14} />Import Data</button>
          <button className="academic-primary-button" onClick={openCreate} type="button"><Plus size={14} />{moduleId === "tarif-akademik" ? "Tambah Tarif" : "Tambah Beasiswa"}</button>
        </>}
      </div>
    </header>
    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}{notice ? <p className="academic-feedback" role="status">{notice}</p> : null}
    <div className="academic-metrics finance-billing-metrics">{summary.map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong><small>{config.title} dari API SiAkad</small></div>)}</div>
    <div className="finance-billing-filter-panel"><div className="academic-toolbar finance-billing-toolbar"><label className="academic-search"><Search size={13} /><input aria-label={`Cari ${config.title}`} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder={moduleId === "tarif-akademik" ? "Kode, nama tarif, jenis..." : moduleId === "beasiswa" ? "NIM, nama, atau beasiswa..." : "Reference, billing, atau NIM..."} value={query} /></label>{moduleId !== "rekonsiliasi" ? <label className="academic-filter"><span>Periode</span><select aria-label="Filter tahun akademik" onChange={(event) => { setYear(event.target.value); setPage(1); }} value={year}><option value="">Semua</option><option>2026/2027</option><option>2025/2026</option><option>2024/2025</option></select></label> : null}{moduleId !== "rekonsiliasi" ? <label className="academic-filter"><span>Program</span><select aria-label="Filter program studi" onChange={(event) => { setProgramFilter(event.target.value); setPage(1); }} value={programFilter}><option value="">Semua Program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label> : null}{moduleId !== "rekonsiliasi" ? <label className="academic-filter"><span>Jenis</span><select aria-label="Filter jenis" onChange={(event) => { setKindFilter(event.target.value); setPage(1); }} value={kindFilter}><option value="">Semua Jenis</option>{[...new Set(rows.map((row) => row.kind).filter(Boolean))].map((kind) => <option key={kind} value={kind}>{kind}</option>)}</select></label> : null}{moduleId === "rekonsiliasi" || moduleId === "beasiswa" ? <label className="academic-filter"><span>Status</span><select aria-label="Filter status" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}><option value="">Semua</option>{(moduleId === "rekonsiliasi" ? ["MATCHED", "UNMATCHED", "DIFFERENCE", "PENDING"] : ["ACTIVE", "PENDING_VERIFICATION", "REJECTED", "COMPLETED"]).map((value) => <option key={value} value={value}>{apiStatuses[value]}</option>)}</select></label> : null}<button className="academic-reset-button" onClick={() => { setQuery(""); setYear(""); setStatus(""); setProgramFilter(""); setKindFilter(""); setPage(1); }} type="button">Reset</button></div></div>
    {loading ? <div className="academic-empty finance-loading"><span className="finance-loading-mark" />Memuat {config.title.toLowerCase()}...</div> : error && !rows.length ? <div className="academic-empty" role="alert"><strong>{config.title} tidak dapat dimuat</strong><button className="academic-secondary-button" onClick={() => void load()} type="button">Coba Lagi</button></div> : <><div className="finance-table-meta"><span>{rows.length} data ditemukan</span><button aria-label={`Muat ulang ${config.title}`} className="academic-small-icon" onClick={() => void load()} type="button"><span aria-hidden="true">↻</span></button></div><div className="academic-table-wrap finance-billing-table-wrap"><table className="academic-table finance-master-table"><thead><tr>{config.columns.map((column) => <th key={column}>{column}</th>)}{moduleId === "beasiswa" ? <th>AKSI</th> : null}</tr></thead><tbody>{visibleRows.map((row) => <tr key={row.id}>{cells(row).map((cell, index) => <td key={`${row.id}-${index}`}>{index === cells(row).length - 1 && moduleId !== "tarif-akademik" ? <span className={`academic-status ${row.status === "ACTIVE" || row.status === "MATCHED" ? "status-approved" : row.status === "REJECTED" || row.status === "DIFFERENCE" || row.status === "UNMATCHED" ? "status-rejected" : "status-warning"}`}>{cell}</span> : cell}</td>)}{moduleId === "beasiswa" ? <td><div className="academic-row-actions">{row.status === "PENDING_VERIFICATION" ? <><button className="academic-text-action" disabled={busy} onClick={() => void reviewScholarship(row.id, "ACTIVE")} type="button">Setujui</button><button className="academic-text-action is-cancel" disabled={busy} onClick={() => void reviewScholarship(row.id, "REJECTED")} type="button">Tolak</button></> : <span>-</span>}</div></td> : null}</tr>)}</tbody></table>{!rows.length ? <div className="academic-empty finance-empty"><strong>{config.title} belum memiliki data</strong><span>{moduleId === "rekonsiliasi" ? "Import mutasi bank untuk memulai pencocokan dengan transaksi SiAkad." : "Data yang dibuat di sini tersimpan pada domain database yang digunakan SiAkad."}</span></div> : null}</div><footer className="finance-pagination"><span>Halaman {page} dari {pageCount}</span><div><button className="academic-secondary-button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} type="button">Sebelumnya</button><button className="academic-secondary-button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} type="button">Berikutnya</button></div></footer></>}
    {formOpen ? <MasterModal title={moduleId === "tarif-akademik" ? "Tambah Tarif Akademik" : "Tambah Beasiswa"} close={() => setFormOpen(false)}><form className="academic-modal-form" onSubmit={(event) => void saveMaster(event)}><div className="academic-form-grid">{moduleId === "tarif-akademik" ? <>
      <label className="academic-form-field"><span>Kode Tarif *</span><input required value={form.code ?? ""} onChange={(event) => setForm((value) => ({ ...value, code: event.target.value }))} /></label><label className="academic-form-field"><span>Nama Tarif *</span><input required value={form.name ?? ""} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} /></label><label className="academic-form-field"><span>Jenis *</span><input required value={form.kind ?? ""} onChange={(event) => setForm((value) => ({ ...value, kind: event.target.value }))} /></label><label className="academic-form-field"><span>Program Studi</span><select value={form.studyProgramId ?? ""} onChange={(event) => setForm((value) => ({ ...value, studyProgramId: event.target.value }))}><option value="">Semua program</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label><label className="academic-form-field"><span>Jalur</span><input value={form.pathway ?? ""} onChange={(event) => setForm((value) => ({ ...value, pathway: event.target.value }))} /></label><label className="academic-form-field"><span>Semester *</span><input min="1" required type="number" value={form.semester ?? "1"} onChange={(event) => setForm((value) => ({ ...value, semester: event.target.value }))} /></label><label className="academic-form-field"><span>Tahun Akademik *</span><input pattern="20[0-9]{2}/20[0-9]{2}" required value={form.academicYear ?? ""} onChange={(event) => setForm((value) => ({ ...value, academicYear: event.target.value }))} /></label><label className="academic-form-field"><span>Nominal (Rp) *</span><input min="1" required type="number" value={form.amount ?? ""} onChange={(event) => setForm((value) => ({ ...value, amount: event.target.value }))} /></label>
      </> : <><label className="academic-form-field is-wide"><span>Mahasiswa / NIM *</span><select required value={form.studentId ?? ""} onChange={(event) => setForm((value) => ({ ...value, studentId: event.target.value }))}><option value="">Pilih mahasiswa</option>{students.map((student) => <option key={student.id} value={student.id}>{student.studentNumber} · {student.name}</option>)}</select></label><label className="academic-form-field"><span>Jenis Beasiswa *</span><input required value={form.kind ?? ""} onChange={(event) => setForm((value) => ({ ...value, kind: event.target.value }))} /></label><label className="academic-form-field"><span>Tahun Akademik *</span><input pattern="20[0-9]{2}/20[0-9]{2}" required value={form.academicYear ?? ""} onChange={(event) => setForm((value) => ({ ...value, academicYear: event.target.value }))} /></label><label className="academic-form-field"><span>Nominal Bantuan *</span><input min="1" required type="number" value={form.amount ?? ""} onChange={(event) => setForm((value) => ({ ...value, amount: event.target.value }))} /></label><label className="academic-form-field"><span>Provider *</span><input required value={form.provider ?? ""} onChange={(event) => setForm((value) => ({ ...value, provider: event.target.value }))} /></label><label className="academic-form-field"><span>Tanggal Mulai *</span><input required type="date" value={form.startsAt ?? ""} onChange={(event) => setForm((value) => ({ ...value, startsAt: event.target.value }))} /></label><label className="academic-form-field"><span>Tanggal Selesai *</span><input required type="date" value={form.endsAt ?? ""} onChange={(event) => setForm((value) => ({ ...value, endsAt: event.target.value }))} /></label><label className="academic-form-field is-wide"><span>Nama Dokumen Pendukung</span><input value={form.documentName ?? ""} onChange={(event) => setForm((value) => ({ ...value, documentName: event.target.value }))} /></label><label className="academic-form-field is-wide"><span>Catatan</span><textarea rows={2} value={form.note ?? ""} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} /></label></>}</div>{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer><button className="academic-secondary-button" onClick={() => setFormOpen(false)} type="button">Batal</button><button className="academic-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Simpan"}</button></footer></form></MasterModal> : null}
    {masterImportOpen ? <MasterModal title={`Import ${config.title}`} close={() => setMasterImportOpen(false)}><div className="finance-import-content">
      <div className="finance-import-toolbar"><p>Validasi dilakukan terhadap referensi Program Studi / NIM dari database. Baris invalid tidak dapat diimpor.</p><div><button className="academic-secondary-button" onClick={() => void downloadMasterTemplate("xlsx")} type="button"><Download size={13} />Template XLSX</button><button className="academic-secondary-button" onClick={() => void downloadMasterTemplate("csv")} type="button"><Download size={13} />Template CSV</button></div></div>
      <label className="finance-file-drop"><Upload size={18} /><strong>{file?.name ?? "Pilih file CSV atau XLSX"}</strong><span>Header mengikuti schema Tarif/Beasiswa · maksimum 5 MB</span><input accept=".csv,.xlsx" onChange={(event) => { const next = event.target.files?.[0]; if (next) void previewMasterImport(next); }} type="file" /></label>
      {masterPreview ? <><div className="academic-metrics finance-import-metrics"><div><span>TOTAL DATA</span><strong>{masterPreview.total}</strong></div><div><span>VALID</span><strong>{masterPreview.valid}</strong></div><div><span>INVALID</span><strong>{masterPreview.invalid}</strong></div><div><span>DITOLAK</span><strong>{masterPreview.invalid}</strong></div></div><div className="academic-table-wrap finance-import-table"><table className="academic-table"><thead><tr><th>BARIS</th><th>IDENTIFIER</th><th>NAMA / JENIS</th><th>PERIODE</th><th>NOMINAL</th><th>VALIDASI</th><th>ERROR</th></tr></thead><tbody>{masterPreview.rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{String(row.value.code ?? row.value.nim ?? "-")}</td><td>{String(row.value.name ?? row.value.kind ?? "-")}</td><td>{String(row.value.academic_year ?? "-")}</td><td>{row.value.amount == null ? "-" : currency.format(Number(row.value.amount))}</td><td><span className={`academic-status ${row.valid ? "status-approved" : "status-rejected"}`}>{row.valid ? "Valid" : "Invalid"}</span></td><td>{row.errors.join(" · ") || "-"}</td></tr>)}</tbody></table></div></> : null}
      {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer className="finance-import-footer"><button className="academic-secondary-button" onClick={() => { setFile(null); setMasterPreview(null); }} type="button">Kembali</button><button className="academic-primary-button" disabled={busy || !masterPreview || masterPreview.invalid > 0} onClick={() => void confirmMasterImport()} type="button">{busy ? "Memproses..." : `Import ${masterPreview?.valid ?? 0} Data`}</button></footer>
    </div></MasterModal> : null}
    {reconImportOpen ? <MasterModal title="Import Mutasi Rekonsiliasi" close={() => setReconImportOpen(false)}><div className="finance-import-content"><div className="finance-import-toolbar"><p>Data akan dicocokkan ke PaymentReference/nomor transaksi, billing, NIM, dan nominal.</p><div><button className="academic-secondary-button" onClick={() => void downloadReconTemplate("xlsx")} type="button"><Download size={13} />Template XLSX</button><button className="academic-secondary-button" onClick={() => void downloadReconTemplate("csv")} type="button"><Download size={13} />Template CSV</button></div></div><label className="finance-file-drop"><Upload size={18} /><strong>{file?.name ?? "Pilih file mutasi CSV/XLSX"}</strong><span>Header: {reconHeaders.join(", ")}</span><input accept=".csv,.xlsx" onChange={(event) => { const next = event.target.files?.[0]; if (next) void previewRecon(next); }} type="file" /></label>{preview ? <><div className="academic-metrics finance-import-metrics"><div><span>TOTAL</span><strong>{preview.total}</strong></div><div><span>VALID</span><strong>{preview.valid}</strong></div><div><span>INVALID</span><strong>{preview.invalid}</strong></div><div><span>COCOK / TINDAKAN</span><strong>{preview.rows.filter((row) => row.status === "MATCHED").length} / {preview.rows.filter((row) => row.status !== "MATCHED").length}</strong></div></div><div className="academic-table-wrap finance-import-table"><table className="academic-table"><thead><tr><th>BARIS</th><th>REFERENCE</th><th>BILLING</th><th>NIM</th><th>INTERNAL</th><th>EKSTERNAL</th><th>SELISIH</th><th>STATUS / ERROR</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.externalReference}</td><td>{row.billingNumber}</td><td>{row.studentNim}</td><td>{row.internalAmount == null ? "-" : currency.format(row.internalAmount)}</td><td>{currency.format(row.externalAmount)}</td><td>{row.difference == null ? "-" : currency.format(row.difference)}</td><td>{row.error ?? apiStatuses[row.status] ?? row.status}</td></tr>)}</tbody></table></div></> : null}{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer className="finance-import-footer"><button className="academic-secondary-button" onClick={() => { setFile(null); setPreview(null); }} type="button">Kembali</button><button className="academic-primary-button" disabled={busy || !preview || preview.invalid > 0} onClick={() => void confirmReconImport()} type="button">{busy ? "Memproses..." : `Konfirmasi ${preview?.valid ?? 0} Baris`}</button></footer></div></MasterModal> : null}
  </section>;
}