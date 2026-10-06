"use client";

import { type FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowRight, CalendarDays, Check, CheckCircle2,
  Clock3, Copy, Download, FileCheck2, Info, Printer, ReceiptText, Search, ShieldCheck, X
} from "lucide-react";
import { Button } from "@siakad/ui";
import { getStudentBillingData, type StudentBillingData } from "../../../lib/api/student-api";
import { DocumentInfoGrid, DocumentLayout, DocumentPaymentBox, DocumentSection, DocumentTable } from "../../../components/documents/document-layout";
import { printDocument } from "../../../lib/print/print-document";
import type { Billing, BillingStatus, Payment } from "../../demo/types";

const currency = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatDate(value: string, withYear = true) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return `${day} ${monthNames[month - 1]}${withYear ? ` ${year}` : ""}`;
}

function formatDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("day")} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")} WIB`;
}

function semesterLabel(billing: Billing) {
  return `Semester ${billing.semester} · ${billing.academicYear}`;
}

const statusCopy: Record<BillingStatus, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  PAID: { label: "Lunas", className: "is-paid", Icon: CheckCircle2 },
  UNPAID: { label: "Menunggu Pembayaran", className: "is-unpaid", Icon: Clock3 },
  PENDING_VERIFICATION: { label: "Menunggu Verifikasi", className: "is-verification", Icon: Clock3 },
  OVERDUE: { label: "Terlambat", className: "is-overdue", Icon: AlertTriangle }
};

function BillingStatus({ status }: { status: BillingStatus }) {
  const { label, className, Icon } = statusCopy[status];
  return <span className={`billing-status ${className}`}><Icon size={14} aria-hidden="true" />{label}</span>;
}

function BillingHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <header className="billing-page-heading">
    <div><p className="portal-eyebrow">Administrasi · Data SiAkad</p><h1>{title}</h1><p>{description}</p></div>
    {action}
  </header>;
}

type BillingModalType = "billing" | "receipt" | "detail";

function paymentAction(billing: Billing) {
  if (billing.status === "PAID") return { label: "Lihat Bukti Bayar", type: "receipt" as const, Icon: FileCheck2 };
  if (billing.status === "PENDING_VERIFICATION") return { label: "Lihat Detail", type: "detail" as const, Icon: ArrowRight };
  return { label: "Lihat Tagihan", type: "billing" as const, Icon: ArrowRight };
}

function BillingModal({ open, title, description, onClose, children }: { open: boolean; title: string; description: string; onClose: () => void; children: React.ReactNode }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])")];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return <div className="billing-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-labelledby={titleId} aria-describedby={descriptionId} aria-modal="true" className="billing-modal" role="dialog" ref={dialogRef} tabIndex={-1}>
      <header className="billing-modal-header"><div><h2 id={titleId}>{title}</h2><p id={descriptionId}>{description}</p></div><button aria-label="Tutup" className="billing-modal-close" onClick={onClose} ref={closeButtonRef} type="button"><X size={17} aria-hidden="true" /></button></header>
      <div className="billing-modal-content">{children}</div>
    </section>
  </div>;
}

export function BillingOverview() {
  const [semester, setSemester] = useState("ALL");
  const [query, setQuery] = useState("");
  const [billingData, setBillingData] = useState<StudentBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedBilling, setSelectedBilling] = useState<Billing | null>(null);
  const [modalType, setModalType] = useState<BillingModalType | null>(null);
  const closeModal = useCallback(() => {
    setModalType(null);
    setSelectedBilling(null);
  }, []);
  function openModal(billing: Billing, type: BillingModalType) {
    setSelectedBilling(billing);
    setModalType(type);
  }
  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    void getStudentBillingData("202501001")
      .then((result) => { if (active) setBillingData(result); })
      .catch((reason: unknown) => { if (active) setLoadError(reason instanceof Error ? reason.message : "Tagihan gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const billingHistory = billingData?.billings;
  const filteredBills = useMemo(() => (billingHistory ?? []).filter((billing) => {
    const matchesSemester = semester === "ALL" || String(billing.semester) === semester;
    const matchesQuery = `${billing.type} ${billing.billingNumber} ${billing.status} ${billingData?.student.nim ?? ""} ${billingData?.student.name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesSemester && matchesQuery;
  }), [billingHistory, semester, query, billingData?.student.nim, billingData?.student.name]);

  const summary = [
    { label: "Total Tagihan", value: currency.format(billingData?.summary.total ?? 0), detail: `${billingHistory?.length ?? 0} tagihan`, Icon: ReceiptText, tone: "blue" },
    { label: "Sudah Dibayar", value: currency.format(billingData?.summary.paid ?? 0), detail: `${billingData?.payments.filter((payment) => payment.status === "PAID").length ?? 0} transaksi lunas`, Icon: CheckCircle2, tone: "green" },
    { label: "Sisa Tagihan", value: currency.format(billingData?.summary.outstanding ?? 0), detail: `${billingHistory?.filter((billing) => ["UNPAID", "OVERDUE", "PENDING_VERIFICATION"].includes(billing.status)).length ?? 0} tagihan aktif`, Icon: Clock3, tone: "amber" },
    { label: "Status Pembayaran", value: billingData?.summary.outstanding ? "Ada Tagihan" : "Tidak Ada Tagihan", detail: loading ? "Memuat status..." : "Status dari data SiAkad.", Icon: ShieldCheck, tone: "navy" }
  ];
  const selectedPayment = selectedBilling && modalType === "receipt" ? billingData?.payments.find((payment) => payment.billingId === selectedBilling.id) : undefined;

  async function refreshBillingData() {
    const result = await getStudentBillingData("202501001");
    setBillingData(result);
    if (selectedBilling) {
      const refreshed = result.billings.find((billing) => billing.id === selectedBilling.id);
      if (refreshed) setSelectedBilling(refreshed);
    }
  }

  return <div className="portal-page billing-page">
    <BillingHeading title="Tagihan Akademik" description="Informasi tagihan dan riwayat pembayaran biaya pendidikan Anda." action={<label className="billing-semester-select"><span>Semester</span><select aria-label="Filter semester ringkasan" value={semester} onChange={(event) => setSemester(event.target.value)}><option value="ALL">Semua Semester</option><option value="4">Semester 4 · 2026/2027</option><option value="3">Semester 3 · 2025/2026</option></select></label>} />

    {loadError ? <p className="billing-information-banner" role="alert"><Info size={17} />{loadError}</p> : null}
    <section className="billing-summary-grid" aria-label="Ringkasan tagihan" aria-busy={loading}>
      {summary.map(({ label, value, detail, Icon, tone }) => <article className={`billing-summary-card tone-${tone}`} key={label}>
        <span className="billing-summary-icon"><Icon size={18} aria-hidden="true" /></span>
        <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
      </article>)}
    </section>

    <section className="billing-history-section">
      <div className="billing-history-header">
        <div><p className="portal-eyebrow">Administrasi akademik</p><h2>Riwayat Tagihan</h2></div>
        <div className="billing-table-controls">
          <label className="billing-filter-select"><span className="sr-only">Filter semester riwayat</span><select aria-label="Filter semester riwayat" value={semester} onChange={(event) => setSemester(event.target.value)}><option value="ALL">Semua Semester</option><option value="4">Semester 4 · 2026/2027</option><option value="3">Semester 3 · 2025/2026</option></select></label>
          <label className="billing-search"><Search size={16} aria-hidden="true" /><input aria-label="Cari tagihan" placeholder="Cari tagihan..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
      </div>
      <div className="billing-table-wrap" role="region" aria-label="Riwayat tagihan, geser tabel untuk melihat semua kolom" tabIndex={0}>
        {loading ? <p className="billing-empty-state" aria-live="polite">Memuat tagihan dari SiAkad...</p> : null}
        <table className="billing-table">
          <thead><tr><th>No</th><th>Semester</th><th>Jenis Tagihan</th><th>Nominal</th><th>Status</th><th>Jatuh Tempo</th><th>Aksi</th></tr></thead>
          <tbody>{filteredBills.map((billing, index) => {
            const action = paymentAction(billing);
            const ActionIcon = action.Icon;
            return <tr key={billing.id}>
              <td>{index + 1}</td>
              <td><span className="billing-semester-cell">{semesterLabel(billing)}</span></td>
              <td><span className="billing-type-cell">{billing.type}</span><small className="billing-number-cell">{billing.billingNumber}</small></td>
              <td className="billing-amount-cell">{currency.format(billing.amount)}</td>
              <td><BillingStatus status={billing.status} /></td>
              <td>{formatDate(billing.dueDate)}</td>
              <td><button className="billing-row-action" onClick={() => openModal(billing, action.type)} type="button">{action.label}<ActionIcon size={14} aria-hidden="true" /></button></td>
            </tr>;
          })}</tbody>
        </table>
        {!loading && filteredBills.length === 0 ? <p className="billing-empty-state">{loadError ? "Tagihan belum dapat dimuat dari server." : "Tidak ada tagihan yang sesuai dengan pencarian."}</p> : null}
      </div>
    </section>

    <aside className="billing-information-banner">
      <Info size={18} aria-hidden="true" />
      <div><strong>Informasi Pembayaran</strong><p>Pastikan pembayaran dilakukan sebelum tanggal jatuh tempo. Bukti transfer yang dikirim akan diperiksa oleh Bagian Keuangan.</p><small>Tagihan dan status pembayaran bersumber dari database SiAkad.</small></div>
    </aside>
    {selectedBilling && modalType ? <BillingModal open title={modalType === "billing" ? "E-Billing" : modalType === "receipt" ? "Bukti Pembayaran" : "Detail Pembayaran"} description={modalType === "billing" ? "Detail tagihan dan kode pembayaran." : modalType === "receipt" ? "Detail transaksi pembayaran." : "Informasi pembayaran yang sedang diverifikasi."} onClose={closeModal}>
      {modalType === "billing" ? <EBillingContent billing={selectedBilling} student={billingData?.student} onPaymentSubmitted={() => void refreshBillingData()} /> : modalType === "receipt" ? <PaymentReceiptContent billing={selectedBilling} payment={selectedPayment} student={billingData?.student} /> : <PaymentDetailContent billing={selectedBilling} />}
    </BillingModal> : null}
    {selectedBilling && selectedPayment && billingData?.student && modalType === "receipt" ? <PaymentReceiptDocument data={{ billing: selectedBilling, payment: selectedPayment, student: billingData.student }} /> : null}
  </div>;
}

function BillingIdentity({ billing, student }: { billing: Billing; student?: StudentBillingData["student"] }) {
  return <DocumentInfoGrid className="billing-identity-grid" items={[{ label: "NIM", value: student?.nim ?? "-" }, { label: "Nama", value: student?.name ?? "-" }, { label: "Program Studi", value: student?.programStudy ?? "-" }, { label: "Semester", value: `${billing.semester} (${billing.academicYear})` }]} />;
}

function PaymentCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setError(false);
    } catch {
      setCopied(false);
      setError(true);
    }
  }
  return <section className="billing-code-panel">
    <div><p className="portal-eyebrow">Virtual account</p><h2>Kode Pembayaran</h2><code>{code}</code></div>
    <Button className="billing-copy-button no-print" variant="secondary" onClick={copyCode} type="button"><Copy size={15} />{copied ? "Tersalin" : "Salin Kode"}</Button>
    <p>Gunakan kode pembayaran ini saat melakukan pembayaran melalui ATM, Mobile Banking, atau kanal pembayaran lainnya.</p>
    {error ? <small className="billing-copy-error" role="status">Clipboard tidak tersedia di browser ini.</small> : null}
  </section>;
}

function DueDate({ billing }: { billing: Billing }) {
  const dueDate = new Date(`${billing.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remainingDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86_400_000) + 1;
  const isOverdue = billing.status === "OVERDUE" || remainingDays < 0;
  return <aside className={`billing-due-date${isOverdue ? " is-overdue" : ""}`}>
    <CalendarDays size={18} aria-hidden="true" /><div><span>Jatuh Tempo</span><strong>{formatDate(billing.dueDate)}</strong><small>{isOverdue ? `Terlambat ${Math.abs(remainingDays)} hari` : `Sisa ${Math.max(remainingDays, 0)} hari`}</small></div>
  </aside>;
}

function EBillingContent({ billing, student, onPaymentSubmitted }: { billing: Billing; student?: StudentBillingData["student"]; onPaymentSubmitted: () => void }) {
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [paymentReference, setPaymentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitNotice, setSubmitNotice] = useState("");

  async function submitProof(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!proofFile || !student?.nim) return;
    setSubmitting(true);
    setSubmitError("");
    setSubmitNotice("");
    const body = new FormData();
    body.set("proof", proofFile);
    body.set("paymentMethod", paymentMethod);
    body.set("paymentReference", paymentReference);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
      const response = await fetch(`${apiBase}/students/demo/billings/${billing.id}/payments`, { method: "POST", headers: { "x-student-demo-nim": student.nim }, body, cache: "no-store" });
      const result = await response.json().catch(() => null) as { message?: string | string[] } | null;
      if (!response.ok) {
        const message = result?.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || `Pengiriman bukti bayar gagal (${response.status}).`);
      }
      setSubmitNotice("Bukti pembayaran tersimpan dan menunggu verifikasi Bagian Keuangan.");
      setProofFile(null);
      onPaymentSubmitted();
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : "Bukti pembayaran gagal dikirim.");
    } finally {
      setSubmitting(false);
    }
  }

  return <DocumentLayout className="billing-document" documentNumber={`Nomor Billing · ${billing.billingNumber}`} documentType="E_BILLING" screenPreview subtitle={`${billing.type} · ${semesterLabel(billing)}`} title="E-BILLING">
      <div className="billing-document-title"><BillingStatus status={billing.status} /></div>
      <BillingIdentity billing={billing} student={student} />
      <section className="billing-line-items"><div className="billing-section-heading"><h2>Rincian Tagihan</h2><span>{billing.lineItems.length} komponen biaya</span></div><DocumentTable><thead><tr><th>No</th><th>Komponen Biaya</th><th>Nominal</th></tr></thead><tbody>{billing.lineItems.map((item, index) => <tr key={`${item.label}-${index}`}><td>{index + 1}</td><td>{item.label}</td><td>{currency.format(item.amount)}</td></tr>)}</tbody><tfoot><tr><th colSpan={2}>Total Tagihan</th><th>{currency.format(billing.amount)}</th></tr></tfoot></DocumentTable></section>
      <div className="billing-payment-layout">{billing.paymentCode ? <PaymentCode code={billing.paymentCode} /> : <aside className="billing-demo-notice"><Info size={15} />Kode pembayaran belum tersedia karena payment provider belum terhubung.</aside>}<DueDate billing={billing} /></div>
      {["UNPAID", "OVERDUE"].includes(billing.status) ? <form className="billing-proof-form no-print" onSubmit={(event) => void submitProof(event)}><div><strong>Kirim Bukti Pembayaran</strong><p>Unggah bukti transfer yang dapat dibaca. Status tagihan akan menunggu verifikasi petugas keuangan.</p></div><label><span>Metode Pembayaran</span><select onChange={(event) => setPaymentMethod(event.target.value)} value={paymentMethod}><option>Transfer Bank</option><option>Setor Tunai</option><option>Virtual Account</option><option>QRIS</option></select></label><label><span>Nomor Referensi (opsional)</span><input onChange={(event) => setPaymentReference(event.target.value)} placeholder="Nomor referensi transaksi" value={paymentReference} /></label><label className="billing-proof-file"><span>Bukti transfer · PDF/JPG/PNG · maks. 10 MB</span><input accept="application/pdf,image/jpeg,image/png" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} required type="file" /></label>{submitError ? <p className="billing-proof-feedback is-error" role="alert">{submitError}</p> : null}{submitNotice ? <p className="billing-proof-feedback" role="status">{submitNotice}</p> : null}<button className="billing-primary-action" disabled={submitting || !proofFile || !student?.nim} type="submit">{submitting ? "Mengirim..." : "Kirim untuk Verifikasi"}</button></form> : null}
      {billing.status === "PENDING_VERIFICATION" ? <p className="billing-proof-feedback" role="status">Bukti pembayaran sudah diterima dan sedang ditinjau Bagian Keuangan.</p> : null}
      <footer className="billing-document-actions no-print"><small><ShieldCheck size={14} /> Tagihan diterbitkan oleh database SiAkad.</small><div><Button className="billing-secondary-action" variant="secondary" onClick={() => printDocument("E_BILLING")} type="button"><Download size={15} />Download PDF</Button><Button className="billing-primary-action" onClick={() => printDocument("E_BILLING")} type="button"><Printer size={15} />Cetak</Button></div></footer>
    </DocumentLayout>;
}

function ReceiptDetails({ billing, payment, student }: { billing: Billing; payment: Payment; student: StudentBillingData["student"] }) {
  const fields = [
    ["Nomor Transaksi", payment.transactionNumber], ["Nomor Billing", billing.billingNumber], ["NIM", student.nim ?? "-"],
    ["Nama", student.name ?? "-"], ["Program Studi", student.programStudy], ["Jenis Tagihan", billing.type],
    ["Semester", `${billing.semester} (${billing.academicYear})`], ["Metode Pembayaran", payment.paymentMethod],
    ["Nomor Referensi", payment.paymentReference], ["Tanggal & Waktu Bayar", formatDateTime(payment.paidAt)]
  ];
  return <DocumentInfoGrid className="billing-receipt-details" items={[...fields.map(([label, value]) => ({ label, value })), { label: "Status", value: <BillingStatus status={billing.status} /> }]} />;
}

function PaymentReceiptDocument({ data }: { data: { billing: Billing; payment: Payment; student: StudentBillingData["student"] } }) {
  const { billing, payment, student } = data;
  return <DocumentLayout className="billing-receipt-document print-only" documentNumber={`No. Transaksi ${payment.transactionNumber}`} documentType="BUKTI_PEMBAYARAN" subtitle="Transaksi berhasil" title="BUKTI PEMBAYARAN">
    <DocumentSection title="Informasi Transaksi"><ReceiptDetails billing={billing} payment={payment} student={student} /></DocumentSection>
    <DocumentSection title="Rincian Pembayaran"><DocumentTable><thead><tr><th>No</th><th>Komponen Pembayaran</th><th>Nominal</th></tr></thead><tbody>{billing.lineItems.map((item, index) => <tr key={`${item.label}-${index}`}><td>{index + 1}</td><td>{item.label}</td><td>{currency.format(item.amount)}</td></tr>)}</tbody></DocumentTable></DocumentSection>
    <DocumentPaymentBox amount={currency.format(payment.amount)} className="billing-receipt-total" label="Total dibayarkan" status={<BillingStatus status={billing.status} />} />
    <p className="billing-receipt-note">Bukti pembayaran ini diterbitkan melalui sistem SiAkad Taruna Poltektrans SDP Palembang.</p>
  </DocumentLayout>;
}

function PaymentReceiptContent({ billing, payment, student }: { billing: Billing; payment?: Payment; student?: StudentBillingData["student"] }) {
  if (!payment) return <p className="billing-empty-state" role="status">Bukti pembayaran belum tersedia.</p>;
  if (!student) return <p className="billing-empty-state" role="status">Data identitas Taruna belum tersedia.</p>;
  return <>
    <section className="billing-success-banner"><span><Check size={20} /></span><div><strong>Pembayaran Berhasil</strong><p>Tagihan telah lunas. Terima kasih atas pembayaran Anda.</p></div><BillingStatus status={billing.status} /></section>
    <section className="billing-receipt-details-panel"><div className="billing-section-heading"><div><p className="portal-eyebrow">Transaksi terverifikasi</p><h2>Detail Transaksi</h2></div><strong>{currency.format(payment.amount)}</strong></div><ReceiptDetails billing={billing} payment={payment} student={student} /></section>
    <div className="billing-bottom-actions no-print"><Button className="billing-secondary-action" variant="secondary" onClick={() => printDocument("BUKTI_PEMBAYARAN")} type="button"><Download size={15} />Download PDF</Button><Button className="billing-primary-action" onClick={() => printDocument("BUKTI_PEMBAYARAN")} type="button"><Printer size={15} />Cetak</Button></div>
  </>;
}

function PaymentDetailContent({ billing }: { billing: Billing }) {
  return <div className="billing-verification-modal-content">
    <div className="billing-verification-status"><BillingStatus status={billing.status} /><span>Pembayaran Anda sudah diterima dan sedang diverifikasi oleh bagian keuangan.</span></div>
    <dl className="billing-verification-details">
      <div><dt>Jenis Tagihan</dt><dd>{billing.type}</dd></div>
      <div><dt>Nominal</dt><dd>{currency.format(billing.amount)}</dd></div>
      <div><dt>Nomor Billing</dt><dd>{billing.billingNumber}</dd></div>
      <div><dt>Tanggal Pembayaran</dt><dd>{formatDate(billing.dueDate)}</dd></div>
      <div><dt>Metode Pembayaran</dt><dd>Transfer Bank</dd></div>
    </dl>
    <p className="billing-demo-notice"><Info size={15} />Bukti transfer sudah tercatat dan sedang menunggu verifikasi petugas keuangan.</p>
  </div>;
}
