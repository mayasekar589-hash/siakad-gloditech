"use client";

import ExcelJS from "exceljs";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Check, Download, Eye, FileCheck2, Search, X } from "lucide-react";

type PaymentRow = {
  id: string;
  transactionNumber: string;
  paymentReference: string | null;
  paymentMethod: string;
  amount: number;
  status: "PENDING_VERIFICATION" | "PAID" | "REJECTED";
  submittedAt: string;
  paidAt: string | null;
  rejectionReason: string | null;
  proof: { id: string; fileName: string; mimeType: string; sizeBytes: number } | null;
  billing: { id: string; billingNumber: string; academicYear: string; semester: number; billingType: string; amount: number; student: { studentNumber: string | null; name: string | null; program?: { name: string } | null; studyProgram?: { name: string } | null } };
  history?: { id: string; action: string; actorLabel: string; reason: string | null; createdAt: string }[];
};
type PaymentResponse = { rows: PaymentRow[]; page: number; pageSize: number; total: number; pageCount: number; summary: { totalAmount: number; pending: number; paid: number; rejected: number } };
type Filters = { query: string; academicYear: string; paymentMethod: string; status: string; from: string; to: string };
const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const labels: Record<string, string> = { PENDING_VERIFICATION: "Menunggu Verifikasi", PAID: "Berhasil", REJECTED: "Ditolak" };
const emptyFilters: Filters = { query: "", academicYear: "", paymentMethod: "", status: "", from: "", to: "" };

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : `API pembayaran merespons ${response.status}.`);
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

function PaymentModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="academic-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-modal="true" className="academic-modal billing-modal-wide" role="dialog" aria-label={title}><header><div><span className="academic-eyebrow">KEUANGAN · PEMBAYARAN</span><h2>{title}</h2></div><button aria-label="Tutup" className="academic-small-icon" onClick={onClose} type="button"><X size={17} /></button></header>{children}</section></div>;
}

function statusClass(status: string) {
  return status === "PAID" ? "status-approved" : status === "REJECTED" ? "status-rejected" : "status-warning";
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function PaymentWorkspace() {
  const [data, setData] = useState<PaymentResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<PaymentRow | null>(null);
  const [review, setReview] = useState<"PAID" | "REJECTED" | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: "25" });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const response = await request<PaymentResponse>(`/finance/admin/payments?${params.toString()}`);
      setData(response);
      setPage(response.page);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Daftar pembayaran gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(1); }, 200);
    return () => window.clearTimeout(timer);
  }, [filters, load]);

  async function showDetail(row: PaymentRow) {
    setSelected(row);
    setReview(null);
    try {
      setSelected(await request<PaymentRow>(`/finance/admin/payments/${row.id}`));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Detail transaksi gagal dimuat.");
    }
  }

  async function showProof(payment: PaymentRow) {
    setBusy(true);
    setError("");
    const popup = window.open("about:blank", "_blank");
    if (!popup) {
      setError("Popup diblokir browser. Izinkan popup untuk melihat bukti bayar.");
      setBusy(false);
      return;
    }
    try {
      const response = await fetch(`${apiBase}/finance/admin/payments/${payment.id}/proof`, { headers: { "x-backoffice-demo": "true" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Bukti pembayaran merespons ${response.status}.`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      popup.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (failure) {
      popup.close();
      setError(failure instanceof Error ? failure.message : "Bukti pembayaran gagal dibuka.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !review) return;
    setBusy(true);
    setError("");
    try {
      await request(`/finance/admin/payments/${selected.id}/review`, { method: "PATCH", body: JSON.stringify({ status: review, reason: review === "REJECTED" ? reason.trim() : undefined }) });
      setNotice(review === "PAID" ? `Transaksi ${selected.transactionNumber} disetujui; tagihan menjadi lunas.` : `Transaksi ${selected.transactionNumber} ditolak; tagihan aktif kembali.`);
      setReview(null);
      setReason("");
      await load(page);
      const refreshed = await request<PaymentRow>(`/finance/admin/payments/${selected.id}`);
      setSelected(refreshed);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Review pembayaran gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function exportData(format: "csv" | "xlsx") {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "100" });
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      const response = await request<PaymentResponse>(`/finance/admin/payments?${params.toString()}`);
      const headers = ["Tanggal", "Nomor Transaksi", "Nomor Billing", "NIM", "Nama", "Nominal", "Metode Pembayaran", "Status"];
      const rows = response.rows.map((item) => [item.submittedAt, item.transactionNumber, item.billing.billingNumber, item.billing.student.studentNumber, item.billing.student.name, item.amount, item.paymentMethod, labels[item.status]]);
      if (format === "csv") {
        const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
        saveBlob(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), "pembayaran.csv");
      } else {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Pembayaran");
        sheet.addRow(headers);
        rows.forEach((row) => sheet.addRow(row));
        sheet.columns = headers.map((header) => ({ width: Math.max(16, header.length + 5) }));
        sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
        sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
        const buffer = await workbook.xlsx.writeBuffer();
        saveBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "pembayaran.xlsx");
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Export pembayaran gagal.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="academic-module finance-billing-workspace">
    <header className="academic-heading"><div><span className="academic-eyebrow">KEUANGAN · VERIFIKASI</span><h1>Pembayaran</h1><p>Periksa bukti pembayaran dan perbarui status tagihan mahasiswa.</p></div><div className="academic-heading-actions"><button className="academic-icon-button" disabled={busy} onClick={() => void exportData("csv")} type="button"><Download size={14} />Export CSV</button><button className="academic-icon-button" disabled={busy} onClick={() => void exportData("xlsx")} type="button"><Download size={14} />Export XLSX</button></div></header>
    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}{notice ? <p className="academic-feedback" role="status">{notice}</p> : null}
    <div className="academic-metrics finance-billing-metrics"><div><span>TOTAL TRANSAKSI</span><strong>{data?.total ?? 0}</strong><small>Dalam filter saat ini</small></div><div><span>BERHASIL</span><strong>{data?.summary.paid ?? 0}</strong><small>Sudah disetujui</small></div><div><span>MENUNGGU VERIFIKASI</span><strong>{data?.summary.pending ?? 0}</strong><small>Butuh review keuangan</small></div><div><span>DITOLAK</span><strong>{data?.summary.rejected ?? 0}</strong><small>{money.format(data?.summary.totalAmount ?? 0)} total tercatat</small></div></div>
    <div className="finance-billing-filter-panel"><div className="academic-toolbar finance-billing-toolbar"><label className="academic-search"><Search size={13} /><input aria-label="Cari transaksi" onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} placeholder="NIM, nama, nomor billing, atau transaksi..." value={filters.query} /></label><label className="academic-filter"><span>Periode</span><select aria-label="Filter tahun akademik" onChange={(event) => setFilters((current) => ({ ...current, academicYear: event.target.value }))} value={filters.academicYear}><option value="">Semua</option><option>2026/2027</option><option>2025/2026</option></select></label><label className="academic-filter"><span>Metode</span><input aria-label="Filter metode pembayaran" onChange={(event) => setFilters((current) => ({ ...current, paymentMethod: event.target.value }))} placeholder="Semua metode" value={filters.paymentMethod} /></label><label className="academic-filter"><span>Status</span><select aria-label="Filter status" onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} value={filters.status}><option value="">Semua</option>{Object.entries(labels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="finance-date-filter"><span>Dari</span><input aria-label="Tanggal dari" onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} type="date" value={filters.from} /></label><label className="finance-date-filter"><span>Sampai</span><input aria-label="Tanggal sampai" onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} type="date" value={filters.to} /></label><button className="academic-reset-button" onClick={() => setFilters(emptyFilters)} type="button">Reset</button></div></div>
    {loading ? <div className="academic-empty finance-loading"><span className="finance-loading-mark" />Memuat transaksi pembayaran...</div> : error && !data ? <div className="academic-empty" role="alert"><strong>Pembayaran tidak dapat dimuat</strong><button className="academic-secondary-button" onClick={() => void load(page)} type="button">Coba Lagi</button></div> : <><div className="finance-table-meta"><span>{data?.total ?? 0} transaksi ditemukan</span><button aria-label="Muat ulang pembayaran" className="academic-small-icon" onClick={() => void load(page)} type="button"><span aria-hidden="true">↻</span></button></div><div className="academic-table-wrap finance-billing-table-wrap"><table className="academic-table finance-payment-table"><thead><tr><th>TANGGAL</th><th>NOMOR TRANSAKSI</th><th>NOMOR BILLING</th><th>NIM</th><th>NAMA</th><th>NOMINAL</th><th>METODE</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{data?.rows.map((payment) => <tr key={payment.id}><td>{dateTime(payment.submittedAt)}</td><td>{payment.transactionNumber}</td><td>{payment.billing.billingNumber}</td><td>{payment.billing.student.studentNumber ?? "-"}</td><td>{payment.billing.student.name ?? "-"}</td><td className="finance-billing-amount">{money.format(payment.amount)}</td><td>{payment.paymentMethod}</td><td><span className={`academic-status ${statusClass(payment.status)}`}>{labels[payment.status]}</span></td><td><div className="academic-row-actions"><button className="academic-small-icon" onClick={() => void showDetail(payment)} title="Lihat detail" type="button"><Eye size={14} /></button>{payment.proof ? <button className="academic-small-icon" disabled={busy} onClick={() => void showProof(payment)} title="Lihat bukti bayar" type="button"><FileCheck2 size={14} /></button> : null}</div></td></tr>)}</tbody></table>{!data?.rows.length ? <div className="academic-empty finance-empty"><strong>Belum ada transaksi pembayaran</strong><span>Transaksi yang dikirim Taruna akan muncul di sini untuk diverifikasi.</span></div> : null}</div><footer className="finance-pagination"><span>Halaman {data?.page ?? 1} dari {Math.max(1, data?.pageCount ?? 0)}</span><div><button className="academic-secondary-button" disabled={page <= 1} onClick={() => void load(page - 1)} type="button">Sebelumnya</button><button className="academic-secondary-button" disabled={page >= (data?.pageCount ?? 1)} onClick={() => void load(page + 1)} type="button">Berikutnya</button></div></footer></>}
    {selected ? <PaymentModal title={`Transaksi ${selected.transactionNumber}`} onClose={() => { setSelected(null); setReview(null); }}><div className="finance-detail-content"><dl className="finance-detail-grid"><div><dt>Nomor Transaksi</dt><dd>{selected.transactionNumber}</dd></div><div><dt>Status</dt><dd><span className={`academic-status ${statusClass(selected.status)}`}>{labels[selected.status]}</span></dd></div><div><dt>Nomor Billing</dt><dd>{selected.billing.billingNumber}</dd></div><div><dt>Nomor Referensi</dt><dd>{selected.paymentReference || "-"}</dd></div><div><dt>Taruna</dt><dd>{selected.billing.student.studentNumber} · {selected.billing.student.name}</dd></div><div><dt>Program Studi</dt><dd>{(selected.billing.student.program ?? selected.billing.student.studyProgram)?.name ?? "-"}</dd></div><div><dt>Nominal</dt><dd>{money.format(selected.amount)}</dd></div><div><dt>Metode</dt><dd>{selected.paymentMethod}</dd></div><div><dt>Dikirim</dt><dd>{dateTime(selected.submittedAt)}</dd></div><div><dt>Jatuh Tempo Tagihan</dt><dd>{selected.billing.semester} · {selected.billing.academicYear}</dd></div>{selected.rejectionReason ? <div className="is-wide"><dt>Alasan Penolakan</dt><dd>{selected.rejectionReason}</dd></div> : null}</dl><section className="finance-history"><h3>Riwayat Review</h3>{selected.history?.map((entry) => <div key={entry.id}><strong>{entry.action.replaceAll("_", " ")}</strong><span>{entry.actorLabel} · {dateTime(entry.createdAt)}</span>{entry.reason ? <small>{entry.reason}</small> : null}</div>) ?? <p>Belum ada review tercatat.</p>}</section>{selected.status === "PENDING_VERIFICATION" && !review ? <div className="finance-review-actions"><button className="academic-secondary-button is-danger" onClick={() => setReview("REJECTED")} type="button">Tolak Pembayaran</button><button className="academic-primary-button" onClick={() => setReview("PAID")} type="button"><Check size={14} />Verifikasi Lunas</button></div> : null}{review ? <form className="finance-review-form" onSubmit={(event) => void decide(event)}><strong>{review === "PAID" ? "Konfirmasi pembayaran terverifikasi" : "Alasan penolakan wajib dicatat"}</strong>{review === "REJECTED" ? <label className="academic-form-field"><span>Alasan Penolakan</span><textarea minLength={3} onChange={(event) => setReason(event.target.value)} required rows={3} value={reason} /></label> : null}{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer><button className="academic-secondary-button" onClick={() => setReview(null)} type="button">Kembali</button><button className="academic-primary-button" disabled={busy || (review === "REJECTED" && reason.trim().length < 3)} type="submit">{busy ? "Menyimpan..." : review === "PAID" ? "Setujui & Lunasi" : "Simpan Penolakan"}</button></footer></form> : null}<footer><button className="academic-secondary-button" onClick={() => { setSelected(null); setReview(null); }} type="button">Tutup</button></footer></div></PaymentModal> : null}
  </section>;
}