"use client";

import ExcelJS from "exceljs";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Download, Eye, FileUp, Pencil, Plus, Search, Upload, X } from "lucide-react";
import { readTabularRows } from "../academic/spreadsheet";

type StudentOption = {
  id: string;
  studentNumber: string | null;
  name: string | null;
  cohort: number | null;
  semester: number | null;
  studyProgram: { id: string; code: string; name: string } | null;
};
type BillingRow = {
  id: string;
  billingNumber: string;
  academicYear: string;
  semester: number;
  billingType: string;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  note: string | null;
  cancellationReason: string | null;
  tariffId?: string | null;
  grossAmount?: number | null;
  discountAmount?: number;
  student: StudentOption & { program?: StudentOption["studyProgram"] };
  history?: { id: string; actorLabel: string; action: string; reason: string | null; createdAt: string }[];
};
type BillingListResponse = {
  rows: BillingRow[];
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
  summary: { totalAmount: number; unpaid: number; pendingVerification: number; paid: number; overdue: number };
};
type StudentSearchResponse = StudentOption[];
type ImportPreview = {
  rows: { rowNumber: number; value: Record<string, unknown>; errors: string[]; warnings: string[]; valid: boolean }[];
  total: number;
  valid: number;
  invalid: number;
  duplicate: number;
  warning: number;
};
type BillingForm = {
  studentId: string;
  studentSearch: string;
  tariffId: string;
  scholarshipId: string;
  academicYear: string;
  semester: string;
  billingType: string;
  description: string;
  amount: string;
  dueDate: string;
  note: string;
};
type BillingFilters = { query: string; academicYear: string; studyProgramId: string; billingType: string; status: string; from: string; to: string };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const importHeaders = ["nim", "tariff_code", "academic_year", "semester", "billing_type", "description", "amount", "due_date", "note"];
const emptyFilters: BillingFilters = { query: "", academicYear: "", studyProgramId: "", billingType: "", status: "", from: "", to: "" };
const emptyForm: BillingForm = { studentId: "", studentSearch: "", tariffId: "", scholarshipId: "", academicYear: "2026/2027", semester: "", billingType: "", description: "", amount: "", dueDate: "", note: "" };
const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const statusLabels: Record<string, string> = { UNPAID: "Menunggu Pembayaran", PENDING_VERIFICATION: "Menunggu Verifikasi", PAID: "Lunas", OVERDUE: "Terlambat", CANCELLED: "Dibatalkan" };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : `API keuangan merespons ${response.status}.`);
  }
  return body as T;
}

function statusClass(status: string) {
  if (status === "PAID") return "status-approved";
  if (status === "OVERDUE" || status === "CANCELLED") return "status-rejected";
  if (status === "UNPAID") return "status-warning";
  return "status-neutral";
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function displayName(student: StudentOption) {
  return `${student.studentNumber ?? "Tanpa NIM"} · ${student.name ?? "Nama belum tersedia"}`;
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return <div className="academic-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-modal="true" className={`academic-modal${wide ? " billing-modal-wide" : ""}`} role="dialog" aria-label={title}>
      <header><div><span className="academic-eyebrow">KEUANGAN · TAGIHAN</span><h2>{title}</h2></div><button aria-label="Tutup" className="academic-small-icon" onClick={onClose} type="button"><X size={17} /></button></header>
      {children}
    </section>
  </div>;
}

export function BillingWorkspace() {
  const [response, setResponse] = useState<BillingListResponse | null>(null);
  const [programs, setPrograms] = useState<{ id: string; name: string }[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [tariffs, setTariffs] = useState<{ id: string; code: string; name: string; kind: string; amount: number; semester: number; academicYear: string; studyProgramId: string | null }[]>([]);
  const [scholarships, setScholarships] = useState<{ id: string; kind: string; amount: number; provider: string; studentId: string }[]>([]);
  const [filters, setFilters] = useState<BillingFilters>(emptyFilters);
  const [form, setForm] = useState<BillingForm>(emptyForm);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<"choice" | "create" | "edit" | "detail" | "import" | "cancel" | null>(null);
  const [selected, setSelected] = useState<BillingRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirmWarnings, setConfirmWarnings] = useState(false);

  const loadBillings = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: "25" });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const data = await request<BillingListResponse>(`/finance/admin/billings?${params.toString()}`);
      setResponse(data);
      setPage(data.page);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Daftar tagihan gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    void request<{ id: string; name: string }[]>("/finance/admin/study-programs")
      .then((records) => { if (active) setPrograms(records); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Program studi gagal dimuat."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadBillings(1); }, 220);
    return () => window.clearTimeout(timer);
  }, [filters, loadBillings]);

  useEffect(() => {
    if (modal !== "create" && modal !== "edit") return;
    let active = true;
    const timer = window.setTimeout(() => {
      const query = form.studentSearch.trim();
      void request<StudentSearchResponse>(`/finance/admin/students${query ? `?query=${encodeURIComponent(query)}` : ""}`)
        .then((records) => { if (active) { setStudentOptions(records); setStudents((current) => [...new Map([...current, ...records].map((student) => [student.id, student])).values()]); } })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Daftar mahasiswa gagal dimuat."); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [modal, form.studentSearch]);

  useEffect(() => {
    if (modal !== "create") return;
    let active = true;
    const params = new URLSearchParams({ academicYear: form.academicYear, active: "true" });
    void request<typeof tariffs>(`/finance/admin/tariffs?${params.toString()}`)
      .then((records) => { if (active) setTariffs(records); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Tarif aktif gagal dimuat."); });
    return () => { active = false; };
  }, [modal, form.academicYear]);

  useEffect(() => {
    if (modal !== "create" || !form.studentId) { setScholarships([]); return; }
    let active = true;
    const nim = form.studentSearch.split(" · ")[0];
    const params = new URLSearchParams({ academicYear: form.academicYear, status: "ACTIVE", query: nim });
    void request<typeof scholarships>(`/finance/admin/scholarships?${params.toString()}`)
      .then((records) => { if (active) setScholarships(records.filter((record) => record.studentId === form.studentId)); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Beasiswa aktif gagal dimuat."); });
    return () => { active = false; };
  }, [modal, form.studentId, form.academicYear, form.studentSearch]);

  async function reload() {
    await loadBillings(page);
  }

  function openCreateChoice() {
    setError("");
    setNotice("");
    setModal("choice");
  }

  function openManualCreate() {
    setSelected(null);
    setStudents([]);
    setStudentOptions([]);
    setForm(emptyForm);
    setError("");
    setModal("create");
  }

  function openEdit(billing: BillingRow) {
    setSelected(billing);
    const student = billing.student;
    setStudents((current) => [...new Map([...current, student].map((item) => [item.id, item])).values()]);
    setForm({
      studentId: student.id,
      studentSearch: displayName(student),
      tariffId: billing.tariffId ?? "",
      scholarshipId: "",
      academicYear: billing.academicYear,
      semester: String(billing.semester),
      billingType: billing.billingType,
      description: billing.description,
      amount: String(billing.amount),
      dueDate: billing.dueDate.slice(0, 10),
      note: billing.note ?? ""
    });
    setError("");
    setModal("edit");
  }

  async function openDetail(billing: BillingRow) {
    setError("");
    setSelected(billing);
    setModal("detail");
    try {
      const detail = await request<BillingRow>(`/finance/admin/billings/${billing.id}`);
      setSelected(detail);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Detail tagihan gagal dimuat.");
    }
  }

  async function saveBilling(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...(modal === "create" ? { studentId: form.studentId } : {}),
      ...(modal === "create" ? { tariffId: form.tariffId, scholarshipId: form.scholarshipId || undefined } : {}),
      academicYear: form.academicYear,
      semester: Number(form.semester),
      billingType: form.billingType.trim(),
      description: form.description.trim(),
      amount: Number(form.amount),
      dueDate: form.dueDate,
      note: form.note.trim() || undefined
    };
    try {
      if (modal === "edit" && selected) await request(`/finance/admin/billings/${selected.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await request("/finance/admin/billings", { method: "POST", body: JSON.stringify(payload) });
      setModal(null);
      setNotice(modal === "edit" ? "Perubahan tagihan tersimpan." : "Tagihan berhasil dibuat dan tersedia melalui API Taruna.");
      await loadBillings(page);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tagihan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelBilling() {
    if (!selected || cancelReason.trim().length < 3) return;
    setSaving(true);
    setError("");
    try {
      await request(`/finance/admin/billings/${selected.id}/cancel`, { method: "POST", body: JSON.stringify({ reason: cancelReason.trim() }) });
      setModal(null);
      setCancelReason("");
      setNotice(`Tagihan ${selected.billingNumber} dibatalkan dan tercatat pada histori.`);
      await loadBillings(page);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tagihan gagal dibatalkan.");
    } finally {
      setSaving(false);
    }
  }

  async function downloadTemplate(format: "xlsx" | "csv") {
    if (format === "csv") {
      saveBlob(new Blob(["\uFEFF", importHeaders.join(",") + "\r\n"], { type: "text/csv;charset=utf-8" }), "template-tagihan.csv");
      return;
    }
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "SiAkad Back Office";
    workbook.subject = "Template import billing akademik";
    const sheet = workbook.addWorksheet("Tagihan");
    sheet.columns = importHeaders.map((header) => ({ header, key: header, width: Math.max(18, header.length + 5) }));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: importHeaders.length } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
    const buffer = await workbook.xlsx.writeBuffer();
    saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "template-tagihan.xlsx");
  }

  async function previewImport(nextFile: File) {
    setFile(nextFile);
    setPreview(null);
    setError("");
    if (!/\.(csv|xlsx)$/i.test(nextFile.name)) { setError("File import harus berformat CSV atau XLSX."); return; }
    if (nextFile.size > 5 * 1024 * 1024) { setError("Ukuran file maksimum 5 MB."); return; }
    setSaving(true);
    try {
      const parsed = await readTabularRows(nextFile, importHeaders);
      if (!parsed.length) throw new Error("File tidak berisi baris tagihan.");
      const result = await request<ImportPreview>("/finance/admin/billings/import/validate", { method: "POST", body: JSON.stringify({ rows: parsed.map((row) => row.values) }) });
      setPreview(result);
      setConfirmWarnings(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "File tidak dapat divalidasi.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmImport() {
    if (!preview || !file || preview.invalid > 0 || (preview.warning > 0 && !confirmWarnings)) return;
    setSaving(true);
    setError("");
    try {
      const parsed = await readTabularRows(file, importHeaders);
      const result = await request<{ imported: number }>("/finance/admin/billings/import/confirm", { method: "POST", body: JSON.stringify({ rows: parsed.map((row) => row.values), confirmWarnings }) });
      setModal(null);
      setFile(null);
      setPreview(null);
      setNotice(`${result.imported} tagihan berhasil diimpor.`);
      await loadBillings(1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Import gagal. Validasi ulang file sebelum mencoba kembali.");
    } finally {
      setSaving(false);
    }
  }

  function filteredQuery() {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    return params;
  }

  async function exportRows(format: "csv" | "xlsx") {
    setSaving(true);
    setError("");
    try {
      const params = filteredQuery();
      params.set("page", "1");
      params.set("pageSize", "100");
      let result = await request<BillingListResponse>(`/finance/admin/billings?${params.toString()}`);
      const rows = [...result.rows];
      while (rows.length < result.total) {
        params.set("page", String(Math.floor(rows.length / 100) + 1));
        result = await request<BillingListResponse>(`/finance/admin/billings?${params.toString()}`);
        if (!result.rows.length) break;
        rows.push(...result.rows);
      }
      const exportRows = rows.map((billing) => [billing.billingNumber, billing.student.studentNumber ?? "", billing.student.name ?? "", (billing.student.program ?? billing.student.studyProgram)?.name ?? "", billing.billingType, `${billing.semester} · ${billing.academicYear}`, billing.amount, billing.dueDate, statusLabels[billing.status] ?? billing.status]);
      const headers = ["Nomor Billing", "NIM", "Nama", "Program Studi", "Jenis Tagihan", "Semester", "Nominal", "Jatuh Tempo", "Status"];
      if (format === "csv") {
        const csv = [headers, ...exportRows].map((row) => row.map(csvCell).join(",")).join("\r\n");
        saveBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), "tagihan-export.csv");
      } else {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Tagihan");
        sheet.addRow(headers);
        exportRows.forEach((row) => sheet.addRow(row));
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
        sheet.columns = headers.map((header) => ({ width: Math.max(16, header.length + 5) }));
        const buffer = await workbook.xlsx.writeBuffer();
        saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "tagihan-export.xlsx");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Export gagal.");
    } finally {
      setSaving(false);
    }
  }

  const rows = response?.rows ?? [];
  const summary = response?.summary;
  const programList = programs.length ? programs : [...new Map(students.flatMap((student) => student.studyProgram ? [[student.studyProgram.id, { id: student.studyProgram.id, name: student.studyProgram.name }] as const] : [])).values()];

  return <section className="academic-module finance-billing-workspace">
    <header className="academic-heading">
      <div><span className="academic-eyebrow">KEUANGAN · OPERASIONAL</span><h1>Tagihan</h1><p>Kelola tagihan akademik dan biaya mahasiswa.</p></div>
      <div className="academic-heading-actions">
        <button className="academic-icon-button" disabled={saving} onClick={() => void exportRows("csv")} type="button"><Download size={14} />Export CSV</button>
        <button className="academic-icon-button" disabled={saving} onClick={() => void exportRows("xlsx")} type="button"><Download size={14} />Export XLSX</button>
        <button className="academic-secondary-button" disabled={saving} onClick={() => { setFile(null); setPreview(null); setError(""); setModal("import"); }} type="button"><Upload size={14} />Import Data</button>
        <button className="academic-primary-button" onClick={openCreateChoice} type="button"><Plus size={14} />Buat Tagihan</button>
      </div>
    </header>

    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}
    {notice ? <p className="academic-feedback" role="status">{notice}</p> : null}

    <div className="academic-metrics finance-billing-metrics">
      <div><span>NILAI TAGIHAN TERFILTER</span><strong>{rupiah.format(summary?.totalAmount ?? 0)}</strong><small>Perhitungan sesuai filter aktif</small></div>
      <div><span>MENUNGGU PEMBAYARAN</span><strong>{summary?.unpaid ?? 0}</strong><small>Tagihan belum lunas</small></div>
      <div><span>MENUNGGU VERIFIKASI</span><strong>{summary?.pendingVerification ?? 0}</strong><small>Pembayaran dalam tinjauan</small></div>
      <div><span>LUNAS / TERLAMBAT</span><strong>{summary?.paid ?? 0} / {summary?.overdue ?? 0}</strong><small>Jumlah status terfilter</small></div>
    </div>

    <div className="finance-billing-filter-panel">
      <div className="academic-toolbar finance-billing-toolbar">
        <label className="academic-search"><Search size={13} /><input aria-label="Cari tagihan" onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="Cari NIM, nama, atau nomor billing..." value={filters.query} /></label>
        <label className="academic-filter"><span>Periode</span><select aria-label="Filter tahun akademik" onChange={(event) => setFilters((current) => ({ ...current, academicYear: event.target.value }))} value={filters.academicYear}><option value="">Semua</option><option>2026/2027</option><option>2025/2026</option><option>2024/2025</option></select></label>
        <label className="academic-filter"><span>Program</span><select aria-label="Filter program studi" onChange={(event) => setFilters((current) => ({ ...current, studyProgramId: event.target.value }))} value={filters.studyProgramId}><option value="">Semua program</option>{programList.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <label className="academic-filter"><span>Jenis</span><input aria-label="Filter jenis tagihan" list="finance-billing-types" onChange={(event) => setFilters((current) => ({ ...current, billingType: event.target.value }))} placeholder="Semua jenis" value={filters.billingType} /><datalist id="finance-billing-types">{[...new Set(rows.map((row) => row.billingType))].map((type) => <option key={type} value={type} />)}</datalist></label>
        <label className="academic-filter"><span>Status</span><select aria-label="Filter status tagihan" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}><option value="">Semua</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="finance-date-filter"><span>Dari</span><input aria-label="Tanggal jatuh tempo dari" onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} /></label>
        <label className="finance-date-filter"><span>Sampai</span><input aria-label="Tanggal jatuh tempo sampai" onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} /></label>
        <button className="academic-reset-button" onClick={() => { setFilters(emptyFilters); setPage(1); }} type="button">Reset</button>
      </div>
    </div>

    {loading ? <div aria-live="polite" className="academic-empty finance-loading"><span className="finance-loading-mark" />Memuat data tagihan dari API...</div> : error && !response ? <div className="academic-empty" role="alert"><strong>Tagihan tidak dapat dimuat</strong><span>Periksa koneksi API, lalu coba muat ulang.</span><button className="academic-secondary-button" onClick={() => void reload()} type="button">Coba Lagi</button></div> : <>
      <div className="finance-table-meta"><span>{response?.total ?? 0} tagihan ditemukan</span><button aria-label="Muat ulang tagihan" className="academic-small-icon" disabled={loading} onClick={() => void reload()} type="button"><span aria-hidden="true">↻</span></button></div>
      <div className="academic-table-wrap finance-billing-table-wrap">
        <table className="academic-table finance-billing-table">
          <thead><tr><th>NOMOR BILLING</th><th>NIM</th><th>NAMA</th><th>PROGRAM STUDI</th><th>JENIS TAGIHAN</th><th>SEMESTER</th><th>NOMINAL</th><th>JATUH TEMPO</th><th>STATUS</th><th>AKSI</th></tr></thead>
          <tbody>{rows.map((billing) => {
            const program = billing.student.program ?? billing.student.studyProgram;
            return <tr key={billing.id}>
              <td>{billing.billingNumber}</td>
              <td>{billing.student.studentNumber ?? "-"}</td>
              <td>{billing.student.name ?? "-"}</td>
              <td>{program?.name ?? "-"}</td>
              <td>{billing.billingType}</td>
              <td>{billing.semester} · {billing.academicYear}</td>
              <td className="finance-billing-amount">{rupiah.format(billing.amount)}</td>
              <td>{displayDate(billing.dueDate)}</td>
              <td><span className={`academic-status ${statusClass(billing.status)}`}>{statusLabels[billing.status] ?? billing.status}</span></td>
              <td><div className="academic-row-actions"><button aria-label={`Lihat ${billing.billingNumber}`} className="academic-small-icon" onClick={() => void openDetail(billing)} title={billing.status === "PAID" ? "Lihat Bukti Bayar" : "Lihat Tagihan"} type="button"><Eye size={14} /></button>{!["PAID", "CANCELLED"].includes(billing.status) ? <><button aria-label={`Edit ${billing.billingNumber}`} className="academic-small-icon" onClick={() => openEdit(billing)} title="Edit" type="button"><Pencil size={13} /></button><button className="academic-text-action is-cancel" onClick={() => { setSelected(billing); setCancelReason(""); setModal("cancel"); }} type="button">Batalkan</button></> : null}</div></td>
            </tr>;
          })}</tbody>
        </table>
        {!rows.length ? <div className="academic-empty finance-empty"><strong>{filters.query || filters.status || filters.academicYear ? "Tidak ada tagihan yang cocok" : "Belum ada tagihan"}</strong><span>{filters.query || filters.status || filters.academicYear ? "Ubah filter atau pencarian untuk menampilkan data." : "Tagihan yang dibuat atau diimpor akan tersimpan di database bersama dan tampil di portal Taruna."}</span>{!filters.query && !filters.status && !filters.academicYear ? <button className="academic-primary-button" onClick={openCreateChoice} type="button"><Plus size={14} />Buat Tagihan</button> : null}</div> : null}
      </div>
      <footer className="finance-pagination"><span>Halaman {response?.page ?? 1} dari {Math.max(1, response?.pageCount ?? 0)}</span><div><button className="academic-secondary-button" disabled={page <= 1 || loading} onClick={() => { const next = page - 1; setPage(next); void loadBillings(next); }} type="button">Sebelumnya</button><button className="academic-secondary-button" disabled={page >= (response?.pageCount ?? 1) || loading} onClick={() => { const next = page + 1; setPage(next); void loadBillings(next); }} type="button">Berikutnya</button></div></footer>
    </>}

    {modal === "choice" ? <Modal title="Buat Tagihan" onClose={() => setModal(null)}><div className="finance-choice-list"><button onClick={openManualCreate} type="button"><span><Plus size={17} /></span><strong>Buat Manual</strong><small>Isi data satu tagihan dengan memilih mahasiswa dari data SiAkad.</small></button><button onClick={() => { setPreview(null); setFile(null); setError(""); setModal("import"); }} type="button"><span><FileUp size={17} /></span><strong>Import Data</strong><small>Unggah CSV atau XLSX, periksa hasil validasi, lalu konfirmasi.</small></button></div></Modal> : null}

    {modal === "create" || modal === "edit" ? <Modal title={modal === "create" ? "Buat Tagihan Manual" : `Edit ${selected?.billingNumber ?? "Tagihan"}`} onClose={() => setModal(null)} wide><form className="academic-modal-form" onSubmit={(event) => void saveBilling(event)}><div className="academic-form-grid finance-billing-form-grid">
      {modal === "create" ? <label className="academic-form-field is-wide"><span>Mahasiswa / NIM <b>*</b></span><input autoComplete="off" list="finance-student-options" onChange={(event) => { const match = studentOptions.find((student) => displayName(student) === event.target.value || student.studentNumber === event.target.value); setForm((current) => ({ ...current, studentSearch: event.target.value, studentId: match?.id ?? "", semester: match?.semester ? String(match.semester) : current.semester })); }} placeholder="Cari NIM atau nama mahasiswa..." required value={form.studentSearch} /><datalist id="finance-student-options">{studentOptions.map((student) => <option key={student.id} value={displayName(student)} />)}</datalist>{form.studentSearch && !form.studentId ? <small className="finance-field-help">Pilih mahasiswa dari hasil pencarian yang tersedia.</small> : null}</label> : <div className="finance-selected-student"><span>Mahasiswa</span><strong>{form.studentSearch}</strong></div>}
      <div className="finance-student-facts"><div><span>Nama</span><strong>{students.find((student) => student.id === form.studentId)?.name ?? selected?.student.name ?? "Pilih mahasiswa"}</strong></div><div><span>Program Studi</span><strong>{(students.find((student) => student.id === form.studentId)?.studyProgram ?? selected?.student.studyProgram)?.name ?? "-"}</strong></div><div><span>Angkatan</span><strong>{students.find((student) => student.id === form.studentId)?.cohort ?? selected?.student.cohort ?? "-"}</strong></div><div><span>Semester Taruna</span><strong>{students.find((student) => student.id === form.studentId)?.semester ?? selected?.student.semester ?? "-"}</strong></div></div>
      <label className="academic-form-field"><span>Tahun Akademik <b>*</b></span><input pattern="20[0-9]{2}/20[0-9]{2}" placeholder="2026/2027" required value={form.academicYear} onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))} /></label>
      <label className="academic-form-field"><span>Semester <b>*</b></span><input max="14" min="1" required type="number" value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} /></label>
      {modal === "create" ? <label className="academic-form-field is-wide"><span>Tarif Master <b>*</b></span><select required value={form.tariffId} onChange={(event) => { const tariff = tariffs.find((item) => item.id === event.target.value); setForm((current) => ({ ...current, tariffId: event.target.value, billingType: tariff?.kind ?? current.billingType, semester: tariff ? String(tariff.semester) : current.semester, amount: tariff ? String(tariff.amount) : "", scholarshipId: "" })); }}><option value="">Pilih tarif aktif</option>{tariffs.filter((tariff) => !tariff.studyProgramId || tariff.studyProgramId === students.find((student) => student.id === form.studentId)?.studyProgram?.id).map((tariff) => <option key={tariff.id} value={tariff.id}>{tariff.code} · {tariff.name} · {rupiah.format(tariff.amount)} · Semester {tariff.semester}</option>)}</select></label> : null}
      {modal === "create" && form.tariffId ? <label className="academic-form-field is-wide"><span>Beasiswa Aktif (opsional)</span><select value={form.scholarshipId} onChange={(event) => setForm((current) => ({ ...current, scholarshipId: event.target.value }))}><option value="">Tanpa potongan beasiswa</option>{scholarships.map((scholarship) => <option key={scholarship.id} value={scholarship.id}>{scholarship.kind} · {scholarship.provider} · potongan {rupiah.format(scholarship.amount)}</option>)}</select>{form.scholarshipId ? <small className="finance-field-help">Tagihan akhir dihitung server dari tarif dikurangi beasiswa aktif.</small> : null}</label> : null}
      <label className="academic-form-field"><span>Jenis Tagihan <b>*</b></span><input required value={form.billingType} onChange={(event) => setForm((current) => ({ ...current, billingType: event.target.value }))} /></label>
      <label className="academic-form-field"><span>{form.tariffId ? "Tarif Master (Rp)" : "Nominal (Rp)"} <b>*</b></span><input min="1" readOnly={Boolean(form.tariffId)} required type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} /></label>
      <label className="academic-form-field"><span>Jatuh Tempo <b>*</b></span><input required type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} /></label>
      <label className="academic-form-field"><span>Status</span><select disabled value="UNPAID"><option value="UNPAID">Menunggu Pembayaran · otomatis</option></select></label>
      <label className="academic-form-field is-wide"><span>Deskripsi <b>*</b></span><textarea required rows={2} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
      <label className="academic-form-field is-wide"><span>Catatan</span><textarea rows={2} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} /></label>
    </div><p className="academic-form-note">Nomor billing dibuat otomatis API. Nominal dihitung dari master Tarif dikurangi Beasiswa aktif; tahun akademik dan semester saat ini memakai field langsung karena master AcademicPeriod belum tersedia.</p>{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer><button className="academic-secondary-button" onClick={() => setModal(null)} type="button">Batal</button><button className="academic-primary-button" disabled={saving || (modal === "create" && (!form.studentId || !form.tariffId))} type="submit">{saving ? "Menyimpan..." : modal === "edit" ? "Simpan Perubahan" : "Buat Tagihan"}</button></footer></form></Modal> : null}

    {modal === "import" ? <Modal title="Import Data Tagihan" onClose={() => setModal(null)} wide><div className="finance-import-content"><div className="finance-import-toolbar"><p>Unggah file yang sesuai template. Validasi diperiksa kembali server-side saat konfirmasi.</p><div><button className="academic-secondary-button" onClick={() => void downloadTemplate("xlsx")} type="button"><Download size={13} />Download Template XLSX</button><button className="academic-secondary-button" onClick={() => void downloadTemplate("csv")} type="button"><Download size={13} />Template CSV</button></div></div><label className="finance-file-drop"><Upload size={18} /><strong>{file?.name ?? "Pilih file CSV atau XLSX"}</strong><span>Maksimum 5 MB · header sesuai template · billing number dibuat otomatis</span><input accept=".csv,.xlsx" onChange={(event) => { const nextFile = event.target.files?.[0]; if (nextFile) void previewImport(nextFile); }} type="file" /></label>
      {preview ? <><div className="academic-metrics finance-import-metrics"><div><span>TOTAL DATA</span><strong>{preview.total}</strong></div><div><span>VALID</span><strong>{preview.valid}</strong></div><div><span>INVALID</span><strong>{preview.invalid}</strong></div><div><span>DUPLIKAT / WARNING</span><strong>{preview.duplicate} / {preview.warning}</strong></div></div><div className="academic-table-wrap finance-import-table"><table className="academic-table"><thead><tr><th>BARIS</th><th>NIM</th><th>TAHUN AKADEMIK</th><th>JENIS TAGIHAN</th><th>NOMINAL</th><th>STATUS VALIDASI</th><th>ERROR / WARNING</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{String(row.value.nim ?? "-")}</td><td>{String(row.value.academic_year ?? "-")}</td><td>{String(row.value.billing_type ?? "-")}</td><td>{row.value.amount == null ? "-" : rupiah.format(Number(row.value.amount))}</td><td><span className={`academic-status ${row.valid ? "status-approved" : "status-rejected"}`}>{row.valid ? "Valid" : "Invalid"}</span></td><td>{[...row.errors, ...row.warnings].join(" · ") || "-"}</td></tr>)}</tbody></table></div>{preview.warning > 0 ? <label className="finance-warning-confirm"><input checked={confirmWarnings} onChange={(event) => setConfirmWarnings(event.target.checked)} type="checkbox" />Saya sudah meninjau warning dan tetap ingin mengimpor baris yang valid.</label> : null}</> : null}
      {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer className="finance-import-footer"><button className="academic-secondary-button" onClick={() => { setFile(null); setPreview(null); setError(""); }} type="button">Kembali</button><button className="academic-primary-button" disabled={saving || !preview || preview.invalid > 0 || (preview.warning > 0 && !confirmWarnings)} onClick={() => void confirmImport()} type="button">{saving ? "Memproses..." : `Import ${preview?.valid ?? 0} Data`}</button></footer></div></Modal> : null}

    {modal === "detail" && selected ? <Modal title={`Detail ${selected.billingNumber}`} onClose={() => setModal(null)} wide><div className="finance-detail-content"><dl className="finance-detail-grid"><div><dt>Nomor Billing</dt><dd>{selected.billingNumber}</dd></div><div><dt>Status</dt><dd><span className={`academic-status ${statusClass(selected.status)}`}>{statusLabels[selected.status] ?? selected.status}</span></dd></div><div><dt>NIM / Nama</dt><dd>{selected.student.studentNumber} · {selected.student.name}</dd></div><div><dt>Program Studi</dt><dd>{(selected.student.program ?? selected.student.studyProgram)?.name ?? "-"}</dd></div><div><dt>Tahun Akademik / Semester</dt><dd>{selected.academicYear} · Semester {selected.semester}</dd></div><div><dt>Jenis Tagihan</dt><dd>{selected.billingType}</dd></div><div><dt>Nominal</dt><dd>{rupiah.format(selected.amount)}</dd></div><div><dt>Jatuh Tempo</dt><dd>{displayDate(selected.dueDate)}</dd></div><div className="is-wide"><dt>Deskripsi</dt><dd>{selected.description}</dd></div><div className="is-wide"><dt>Catatan</dt><dd>{selected.note || "-"}</dd></div>{selected.cancellationReason ? <div className="is-wide"><dt>Alasan Pembatalan</dt><dd>{selected.cancellationReason}</dd></div> : null}</dl><section className="finance-history"><h3>Riwayat Perubahan</h3>{selected.history?.length ? selected.history.map((entry) => <div key={entry.id}><strong>{entry.action.replaceAll("_", " ")}</strong><span>{entry.actorLabel} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.createdAt))}</span>{entry.reason ? <small>{entry.reason}</small> : null}</div>) : <p>Belum ada histori yang dimuat.</p>}</section><footer><button className="academic-secondary-button" onClick={() => setModal(null)} type="button">Tutup</button>{!["PAID", "CANCELLED"].includes(selected.status) ? <button className="academic-primary-button" onClick={() => openEdit(selected)} type="button"><Pencil size={13} />Edit Tagihan</button> : null}</footer></div></Modal> : null}

    {modal === "cancel" && selected ? <Modal title="Batalkan Tagihan" onClose={() => setModal(null)}><div className="finance-cancel-content"><p>Tagihan <strong>{selected.billingNumber}</strong> akan ditandai dibatalkan. Tindakan ini tercatat di histori dan tidak menghapus data.</p><label className="academic-form-field"><span>Alasan Pembatalan <b>*</b></span><textarea minLength={3} onChange={(event) => setCancelReason(event.target.value)} required rows={3} value={cancelReason} /></label>{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer><button className="academic-secondary-button" onClick={() => setModal(null)} type="button">Kembali</button><button className="academic-primary-button" disabled={saving || cancelReason.trim().length < 3} onClick={() => void cancelBilling()} type="button">{saving ? "Memproses..." : "Konfirmasi Pembatalan"}</button></footer></div></Modal> : null}
  </section>;
}