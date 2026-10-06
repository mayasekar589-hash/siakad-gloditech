"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCheck, Download, Eye, FileText, Search, ShieldCheck, X } from "lucide-react";

type JsonRecord = Record<string, unknown>;
type Workspace = "pendaftar" | "seleksi" | "registrasi-ulang";
type SelectionStage = { id: string; name: string; sortOrder: number; required: boolean; scoringModel: string; maximumScore: number | null };
type Period = { id: string; name: string; academicYear: string; registrationType: string; status: string; documents?: { documentCode: string }[]; fees?: { id: string }[]; selectionStages?: SelectionStage[] };
type DocumentRecord = { id: string; documentCode: string; label: string; status: string; rejectionReason: string | null; fileName: string; mimeType: string; uploadedAt: string };
type PaymentRecord = { id: string; feeId: string; amount: number | string; status: string; method: string | null; referenceNumber: string | null; paidAt: string | null; rejectionReason: string | null; proofDocumentId: string | null; proofDocument?: { id: string; fileName: string; mimeType?: string } | null; fee: { name: string } };
type SelectionRecord = { id: string; selectionStageId: string; status: string; score: number | string | null; scheduledAt: string | null; notes: string | null; selectionStage: SelectionStage };
type Applicant = {
  id: string;
  registrationNumber: string;
  registrationType: string | null;
  status: string;
  createdAt: string;
  applicant: { fullName: string | null; nationalId: string | null; email: string | null; phone: string | null };
  admissionPeriod: Period | null;
  admissionProgram: { id: string; name: string } | null;
  documents?: { documentCode: string; status: string }[];
  payments?: Pick<PaymentRecord, "feeId" | "status">[];
  selectionResults?: Pick<SelectionRecord, "selectionStageId" | "status">[];
  _count?: { documents: number; payments: number };
};
type ApplicantDetail = Omit<Applicant, "documents" | "payments" | "selectionResults" | "admissionPeriod"> & JsonRecord & {
  personalData: JsonRecord | null;
  parentData: JsonRecord | null;
  educationData: JsonRecord | null;
  physicalData: JsonRecord | null;
  professionalData: JsonRecord | null;
  documents: DocumentRecord[];
  payments: PaymentRecord[];
  selectionResults: SelectionRecord[];
  statusHistory: HistoryRecord[];
  admissionPeriod: (Period & { documents: JsonRecord[]; fees: JsonRecord[]; selectionStages: SelectionStage[] }) | null;
};
type HistoryRecord = { id: string; action: string; oldStatus: string | null; newStatus: string; notes: string | null; createdAt: string; actor?: { email: string | null } | null };
type SelectionItem = SelectionRecord & { application: Applicant };
type ReRegistration = { id: string; status: string; checklist: Record<string, boolean> | null; student?: { studentNumber: string } | null; application: Applicant };

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const applicationStatusLabels: Record<string, string> = {
  DRAFT: "Draf", SUBMITTED: "Pendaftaran Baru", DOCUMENT_VERIFICATION: "Verifikasi Dokumen", DOCUMENT_REVISION: "Revisi Dokumen", DOCUMENT_VERIFIED: "Dokumen Terverifikasi", PAYMENT_PENDING: "Menunggu Pembayaran", PAYMENT_VERIFICATION: "Verifikasi Pembayaran", PAYMENT_VERIFIED: "Pembayaran Terverifikasi", READY_FOR_SELECTION: "Siap Seleksi", IN_SELECTION: "Sedang Seleksi", PASSED_SELECTION: "Lulus", FAILED_SELECTION: "Tidak Lulus", RE_REGISTRATION: "Registrasi Ulang", REGISTERED: "Terdaftar", CANCELLED: "Dibatalkan"
};
const selectionStatuses = ["PENDING", "SCHEDULED", "PRESENT", "ABSENT", "PASSED", "FAILED"];
const timelineSteps = ["Pendaftaran", "Dokumen", "Pembayaran", "Seleksi", "Kelulusan", "Registrasi Ulang"];
const checklistLabels = [
  ["personal", "Data Diri"], ["documents", "Dokumen"], ["payment", "Pembayaran"], ["administration", "Administrasi"], ["confirmation", "Konfirmasi Akhir"]
] as const;

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const result = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = result && typeof result === "object" && "message" in result ? result.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || `API admissions merespons ${response.status}.`);
  }
  return result as T;
}

function displayStatus(status: string) {
  return applicationStatusLabels[status] ?? status.replaceAll("_", " ");
}

function displayRegistrationType(type: string | null | undefined) {
  return type ? type.replaceAll("_", " ") : "Belum ditentukan";
}

function statusClassName(status: string) {
  const tone = ["LUNAS", "TERVERIFIKASI", "PASSED", "PASSED_SELECTION", "REGISTERED", "SELESAI"].includes(status) ? "status-approved"
    : ["DITOLAK", "FAILED", "FAILED_SELECTION", "CANCELLED", "ABSENT"].includes(status) ? "status-rejected"
      : ["PENDING", "BELUM_BAYAR", "BELUM_DIVERIFIKASI", "DOCUMENT_VERIFICATION", "PAYMENT_PENDING", "DRAFT"].includes(status) ? "status-warning" : "status-neutral";
  return `academic-status ${tone}`;
}

function progressFor(application: Applicant, periods: Period[]) {
  const period = (application.admissionPeriod ? periods.find((item) => item.id === application.admissionPeriod?.id) : undefined) ?? application.admissionPeriod;
  const total = 5 + (period?.selectionStages?.length ?? 0);
  const workflowStarted = !["DRAFT", "CANCELLED"].includes(application.status);
  const registrationDone = workflowStarted;
  const requiredDocuments = period?.documents ?? [];
  const documentsDone = workflowStarted && (requiredDocuments.length === 0 || requiredDocuments.every((item) => application.documents?.some((document) => document.documentCode === item.documentCode && document.status === "TERVERIFIKASI")));
  const requiredFees = period?.fees ?? [];
  const paymentDone = workflowStarted && (requiredFees.length === 0 || requiredFees.every((fee) => application.payments?.some((payment) => payment.feeId === fee.id && payment.status === "LUNAS")));
  const requiredStages = period?.selectionStages ?? [];
  const completedStages = requiredStages.filter((stage) => application.selectionResults?.some((result) => result.selectionStageId === stage.id && ["PASSED", "FAILED", "ABSENT"].includes(result.status))).length;
  const finalResultDone = ["PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(application.status);
  const reRegistrationDone = application.status === "REGISTERED";
  const done = Number(registrationDone) + Number(documentsDone) + Number(paymentDone) + completedStages + Number(finalResultDone) + Number(reRegistrationDone);
  return { done: Math.min(done, total), total };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

function admissionPeriodName(period: Period | null | undefined) {
  return period?.name ?? "Periode belum ditentukan";
}

function statusStep(application: Applicant, step: string, index: number, detail?: ApplicantDetail | null) {
  if (step === "Pendaftaran") return application.status === "DRAFT" ? "PENDING" : "TERVERIFIKASI";
  if (step === "Dokumen") return detail?.documents?.length ? detail.documents.every((item) => item.status === "TERVERIFIKASI") ? "TERVERIFIKASI" : detail.documents.some((item) => item.status === "PERLU_PERBAIKAN" || item.status === "DITOLAK") ? "PERLU_PERBAIKAN" : "PENDING" : ["DOCUMENT_VERIFIED", "PAYMENT_PENDING", "PAYMENT_VERIFICATION", "PAYMENT_VERIFIED", "READY_FOR_SELECTION", "IN_SELECTION", "PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(application.status) ? "TERVERIFIKASI" : "PENDING";
  if (step === "Pembayaran") return detail?.payments?.length ? detail.payments.every((item) => item.status === "LUNAS") ? "LUNAS" : "PENDING" : ["READY_FOR_SELECTION", "IN_SELECTION", "PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(application.status) ? "LUNAS" : "PENDING";
  if (step === "Seleksi") return ["PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(application.status) ? "PASSED" : application.status === "IN_SELECTION" ? "PRESENT" : "PENDING";
  if (step === "Kelulusan") return application.status === "PASSED_SELECTION" || application.status === "RE_REGISTRATION" || application.status === "REGISTERED" ? "LULUS" : application.status === "FAILED_SELECTION" ? "TIDAK_LULUS" : "PENDING";
  if (step === "Registrasi Ulang") return application.status === "REGISTERED" ? "SELESAI" : application.status === "RE_REGISTRATION" ? "PENDING" : "NOT_STARTED";
  return index === 0 ? "TERVERIFIKASI" : "PENDING";
}

export function AdmissionsOperationsPage({ workspace, initialTab }: { workspace: Workspace; initialTab?: string }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selection, setSelection] = useState<SelectionItem[]>([]);
  const [reRegistrations, setReRegistrations] = useState<ReRegistration[]>([]);
  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [detailTab, setDetailTab] = useState("ringkasan");
  const [selectionTab, setSelectionTab] = useState(initialTab === "hasil-akhir" ? "hasil-akhir" : "peserta");
  const [selectedReRegistration, setSelectedReRegistration] = useState<ReRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState("semua");
  const [typeFilter, setTypeFilter] = useState("semua");
  const [programFilter, setProgramFilter] = useState("semua");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [stageFilter, setStageFilter] = useState("semua");
  const [reviewReason, setReviewReason] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [resultNote, setResultNote] = useState("");
  const [resultConfirmation, setResultConfirmation] = useState(false);
  const [finalApplicant, setFinalApplicant] = useState<Applicant | null>(null);
  const [finalTargetStatus, setFinalTargetStatus] = useState<"PASSED_SELECTION" | "FAILED_SELECTION">("PASSED_SELECTION");
  const [selectionTarget, setSelectionTarget] = useState<SelectionItem | null>(null);
  const [selectionStatus, setSelectionStatus] = useState("PENDING");
  const [selectionScore, setSelectionScore] = useState("");
  const [selectionSchedule, setSelectionSchedule] = useState("");
  const [reRegistrationDraft, setReRegistrationDraft] = useState<ReRegistration | null>(null);

  const reloadWorkspace = useCallback(async () => {
    setError(null);
    const loadedPeriods = await adminRequest<Period[]>("/admissions/admin/periods");
    setPeriods(loadedPeriods);
    if (workspace === "pendaftar" || workspace === "seleksi") {
      const [loadedApplicants, loadedSelection] = await Promise.all([
        adminRequest<Applicant[]>("/admissions/admin/applicants"),
        workspace === "seleksi" ? adminRequest<SelectionItem[]>("/admissions/admin/selection") : Promise.resolve([])
      ]);
      setApplicants(loadedApplicants);
      setSelection(loadedSelection);
    }
    if (workspace === "registrasi-ulang") {
      const loaded = await adminRequest<ReRegistration[]>("/admissions/admin/re-registrations");
      setReRegistrations(loaded.filter((item) => ["RE_REGISTRATION", "REGISTERED"].includes(item.application.status) && item.status !== "DIBATALKAN"));
    }
  }, [workspace]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void reloadWorkspace().catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Gagal memuat data penerimaan.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadWorkspace]);

  async function runMutation<T>(operation: () => Promise<T>, message: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await operation();
      await reloadWorkspace();
      if (detail) setDetail(await adminRequest<ApplicantDetail>(`/admissions/admin/applicants/${detail.id}`));
      setNotice(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Aksi tidak dapat diselesaikan.");
    } finally {
      setBusy(false);
    }
  }

  async function openApplicant(id: string) {
    setBusy(true);
    setError(null);
    try {
      setDetail(await adminRequest<ApplicantDetail>(`/admissions/admin/applicants/${id}`));
      setDetailTab(["dokumen", "pembayaran"].includes(initialTab ?? "") ? initialTab! : "ringkasan");
      setReviewReason("");
      setPaymentReason("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Detail pendaftar tidak dapat dimuat.");
    } finally {
      setBusy(false);
    }
  }

  async function openDocument(document: DocumentRecord, download: boolean) {
    try {
      const response = await fetch(`${apiBase}/admissions/admin/documents/${document.id}/file`, { headers: { "x-backoffice-demo": "true" } });
      if (!response.ok) throw new Error(`File tidak dapat dibuka (${response.status}).`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = globalThis.document.createElement("a");
        link.href = url;
        link.download = document.fileName;
        link.click();
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Dokumen tidak dapat dibuka.");
    }
  }

  const visibleApplicants = useMemo(() => applicants.filter((item) => {
    const fullName = item.applicant.fullName ?? "";
    const matchesQuery = !query || `${item.registrationNumber} ${fullName} ${item.applicant.nationalId ?? ""}`.toLowerCase().includes(query.toLowerCase());
    const matchesPeriod = periodFilter === "semua" || item.admissionPeriod?.id === periodFilter;
    const matchesType = typeFilter === "semua" || item.registrationType === typeFilter;
    const matchesProgram = programFilter === "semua" || item.admissionProgram?.id === programFilter;
    const matchesStatus = statusFilter === "semua" || item.status === statusFilter;
    const progress = progressFor(item, periods);
    const currentStage = item.status === "DOCUMENT_VERIFICATION" || item.status === "DOCUMENT_REVISION" ? "Dokumen" : item.status.includes("PAYMENT") ? "Pembayaran" : item.status.includes("SELECTION") || item.status === "IN_SELECTION" ? "Seleksi" : item.status === "RE_REGISTRATION" || item.status === "REGISTERED" ? "Registrasi Ulang" : item.status === "READY_FOR_SELECTION" ? "Siap Seleksi" : "Pendaftaran Baru";
    return matchesQuery && matchesPeriod && matchesType && matchesProgram && matchesStatus && (stageFilter === "semua" || currentStage === stageFilter) && progress.total > 0;
  }), [applicants, periods, query, periodFilter, typeFilter, programFilter, statusFilter, stageFilter]);

  const visibleSelection = useMemo(() => selection.filter((item) => {
    const app = item.application;
    return (periodFilter === "semua" || app.admissionPeriod?.id === periodFilter)
      && (typeFilter === "semua" || app.registrationType === typeFilter)
      && (programFilter === "semua" || app.admissionProgram?.id === programFilter)
      && (stageFilter === "semua" || item.selectionStage.id === stageFilter)
      && (!query || `${app.registrationNumber} ${app.applicant.fullName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  }), [selection, periodFilter, typeFilter, programFilter, stageFilter, query]);

  const activePeriods = periods.filter((period) => periodFilter === "semua" || period.id === periodFilter);
  const allStages = activePeriods.flatMap((period) => period.selectionStages ?? []).sort((left, right) => left.sortOrder - right.sortOrder);
  const programs = Array.from(new Map(applicants.flatMap((item) => item.admissionProgram ? [[item.admissionProgram.id, item.admissionProgram] as const] : []).map(([id, program]) => [id, program])).values());
  const currentTitle = workspace === "pendaftar" ? "Pendaftar" : workspace === "seleksi" ? "Proses Seleksi" : "Registrasi Ulang";

  async function reviewDocument(document: DocumentRecord, status: string) {
    if (["PERLU_PERBAIKAN", "DITOLAK"].includes(status) && !reviewReason.trim()) {
      setError("Alasan perbaikan atau penolakan dokumen wajib diisi.");
      return;
    }
    await runMutation(() => adminRequest(`/admissions/admin/documents/${document.id}/review`, { method: "PATCH", body: JSON.stringify({ status, reason: reviewReason.trim() }) }), "Status dokumen diperbarui.");
    setReviewReason("");
  }

  async function reviewPayment(payment: PaymentRecord, status: string) {
    if (status === "DITOLAK" && !paymentReason.trim()) {
      setError("Alasan penolakan pembayaran wajib diisi.");
      return;
    }
    await runMutation(() => adminRequest(`/admissions/admin/payments/${payment.id}/review`, { method: "PATCH", body: JSON.stringify({ status, reason: paymentReason.trim() }) }), "Status pembayaran penerimaan diperbarui.");
    setPaymentReason("");
  }

  async function publishResult(application: Applicant, status: "PASSED_SELECTION" | "FAILED_SELECTION") {
    if (!resultConfirmation) {
      setError("Konfirmasi perubahan hasil akhir wajib dicentang.");
      return;
    }
    await runMutation(() => adminRequest(`/admissions/admin/applicants/${application.id}/final-result`, { method: "PATCH", body: JSON.stringify({ status, confirm: true, notes: resultNote.trim() }) }), "Hasil akhir dicatat pada riwayat pendaftar.");
    setResultNote("");
    setResultConfirmation(false);
    setFinalApplicant(null);
  }

  async function saveSelectionResult() {
    if (!selectionTarget) return;
    const payload: JsonRecord = { status: selectionStatus, ...(selectionScore ? { score: Number(selectionScore) } : {}), ...(selectionSchedule ? { scheduledAt: new Date(selectionSchedule).toISOString() } : {}) };
    await runMutation(() => adminRequest(`/admissions/admin/selection/${selectionTarget.id}`, { method: "PATCH", body: JSON.stringify(payload) }), "Hasil tahap seleksi disimpan.");
    setSelectionTarget(null);
  }

  async function saveChecklist(complete = false) {
    if (!reRegistrationDraft) return;
    const checklist = reRegistrationDraft.checklist ?? {};
    const completeChecklist = checklistLabels.every(([key]) => checklist[key] === true);
    if (complete && !completeChecklist) {
      setError("Semua checklist wajib selesai sebelum registrasi ulang ditutup.");
      return;
    }
    await runMutation(() => adminRequest(`/admissions/admin/re-registrations/${reRegistrationDraft.id}`, { method: "PATCH", body: JSON.stringify({ status: complete ? "SELESAI" : "DALAM_PROSES", checklist, confirmConversion: complete }) }), complete ? "Registrasi ulang selesai; konversi pendaftar diproses." : "Checklist registrasi ulang disimpan.");
    setSelectedReRegistration(null);
    setReRegistrationDraft(null);
  }

  function renderApplicantDetails() {
    if (!detail) return null;
    const tabs = ["ringkasan", "data-diri", "orang-tua", "pendidikan", ...(detail.registrationType === "POLA_PEMBIBITAN" ? ["data-fisik"] : []), ...(detail.registrationType === "DIKLAT" ? ["data-profesional"] : []), "dokumen", "pembayaran", "seleksi", "riwayat"];
    const tabLabels: Record<string, string> = { "ringkasan": "Ringkasan", "data-diri": "Data Diri", "orang-tua": "Orang Tua / Wali", "pendidikan": "Pendidikan", "data-fisik": "Data Fisik", "data-profesional": "Data Profesional", dokumen: "Dokumen", pembayaran: "Pembayaran", seleksi: "Seleksi", riwayat: "Riwayat" };
    const periodStages = detail.admissionPeriod?.selectionStages ?? [];
    const dataForTab = detailTab === "data-diri" ? detail.personalData : detailTab === "orang-tua" ? detail.parentData : detailTab === "pendidikan" ? detail.educationData : detailTab === "data-fisik" ? detail.physicalData : detailTab === "data-profesional" ? detail.professionalData : null;
    return <div className="academic-modal-backdrop" onClick={() => setDetail(null)}>
      <div aria-modal="true" className="academic-modal admissions-workspace-modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <header>
          <div><span className="academic-eyebrow">{detail.registrationNumber} · {displayRegistrationType(detail.registrationType)}</span><h2>{detail.applicant.fullName ?? "Nama belum diisi"}</h2><p>{detail.admissionProgram?.name ?? "Program belum dipilih"} · {admissionPeriodName(detail.admissionPeriod)} · {detail.admissionPeriod?.academicYear ?? "-"}</p><span className={statusClassName(detail.status)}>{displayStatus(detail.status)}</span></div>
          <button aria-label="Tutup detail pendaftar" className="academic-small-icon" onClick={() => setDetail(null)} type="button"><X size={18} /></button>
        </header>
        <div className="academic-entity-tabs" role="tablist" aria-label="Detail pendaftar">
          {tabs.map((tab) => <button aria-selected={detailTab === tab} className="academic-entity-tab" key={tab} onClick={() => setDetailTab(tab)} role="tab" type="button">{tabLabels[tab]}</button>)}
        </div>
        <div className="admissions-detail-body">
          {detailTab === "ringkasan" ? <>
            <div className="admissions-detail-status"><span>Status saat ini</span><b className={statusClassName(detail.status)}>{displayStatus(detail.status)}</b></div>
            <ol className="admissions-timeline">{timelineSteps.map((step, index) => { const state = statusStep(detail, step, index, detail); return <li className={state === "PENDING" || state === "NOT_STARTED" ? "is-pending" : "is-complete"} key={step}><span>{state === "TERVERIFIKASI" || state === "PASSED" || state === "LUNAS" || state === "SELESAI" ? <CheckCheck size={13} /> : index + 1}</span><b>{step}</b><small>{displayStatus(state)}</small></li>; })}</ol>
            <div className="admissions-summary-grid"><div><span>Nomor Pendaftaran</span><b>{detail.registrationNumber}</b></div><div><span>Jenis Pendaftaran</span><b>{displayRegistrationType(detail.registrationType)}</b></div><div><span>Program Studi</span><b>{detail.admissionProgram?.name ?? "Belum dipilih"}</b></div><div><span>Tanggal Daftar</span><b>{formatDate(detail.createdAt)}</b></div><div><span>NIK</span><b>{detail.applicant.nationalId ?? "-"}</b></div><div><span>Email / Telepon</span><b>{detail.applicant.email ?? "-"} / {detail.applicant.phone ?? "-"}</b></div></div>
            <h3>Tahapan periode</h3><div className="admissions-stage-list">{periodStages.map((stage) => <span key={stage.id}>{stage.sortOrder + 1}. {stage.name}</span>)}</div>
          </> : null}
          {dataForTab ? <div className="admissions-summary-grid">{Object.entries(dataForTab).map(([key, value]) => <div key={key}><span>{key.replaceAll(/([A-Z])/g, " $1")}</span><b>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "-")}</b></div>)}</div> : null}
          {detailTab === "dokumen" ? <>
            <div className="admissions-reason-row"><label className="academic-form-field"><span>Alasan perbaikan / penolakan</span><input onChange={(event) => setReviewReason(event.target.value)} placeholder="Contoh: KTP tidak terbaca" value={reviewReason} /></label></div>
            <div className="academic-table-wrap"><table className="academic-table"><thead><tr><th>DOKUMEN</th><th>FILE</th><th>STATUS</th><th>DIUNGGAH</th><th>AKSI</th></tr></thead><tbody>{detail.documents.map((document) => <tr key={document.id}><td>{document.label}</td><td>{document.fileName}</td><td><span className={statusClassName(document.status)}>{displayStatus(document.status)}</span>{document.rejectionReason ? <small className="admissions-reason">{document.rejectionReason}</small> : null}</td><td>{formatDate(document.uploadedAt)}</td><td><div className="academic-row-actions"><button aria-label={`Pratinjau ${document.label}`} className="academic-small-icon" onClick={() => void openDocument(document, false)} type="button"><Eye size={13} /></button><button aria-label={`Unduh ${document.label}`} className="academic-small-icon" onClick={() => void openDocument(document, true)} type="button"><Download size={13} /></button><button className="academic-text-action" disabled={busy} onClick={() => void reviewDocument(document, "TERVERIFIKASI")} type="button">Verifikasi</button><button className="academic-text-action is-reject" disabled={busy || !reviewReason.trim()} onClick={() => void reviewDocument(document, "PERLU_PERBAIKAN")} type="button">Minta Revisi</button><button className="academic-text-action is-reject" disabled={busy || !reviewReason.trim()} onClick={() => void reviewDocument(document, "DITOLAK")} type="button">Tolak</button></div></td></tr>)}</tbody></table></div>
            {!detail.documents.length ? <div className="academic-empty"><FileText size={18} /><strong>Belum ada dokumen</strong><span>Dokumen pendaftar dari formulir publik tampil di sini.</span></div> : null}
          </> : null}
          {detailTab === "pembayaran" ? <>
            <div className="admissions-reason-row"><label className="academic-form-field"><span>Alasan penolakan pembayaran</span><input onChange={(event) => setPaymentReason(event.target.value)} placeholder="Wajib diisi untuk menolak pembayaran" value={paymentReason} /></label></div>
            <div className="academic-table-wrap"><table className="academic-table"><thead><tr><th>JENIS TAGIHAN</th><th>NOMINAL</th><th>STATUS</th><th>METODE / REF</th><th>TANGGAL</th><th>BUKTI / AKSI</th></tr></thead><tbody>{detail.payments.map((payment) => <tr key={payment.id}><td>{payment.fee.name}</td><td>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(payment.amount))}</td><td><span className={statusClassName(payment.status)}>{displayStatus(payment.status)}</span>{payment.rejectionReason ? <small className="admissions-reason">{payment.rejectionReason}</small> : null}</td><td>{payment.method ?? "-"} / {payment.referenceNumber ?? "-"}</td><td>{formatDate(payment.paidAt)}</td><td><div className="academic-row-actions">{payment.proofDocument ? <button className="academic-small-icon" aria-label="Lihat bukti pembayaran" onClick={() => void openDocument({ ...payment.proofDocument!, documentCode: "payment-proof", label: "Bukti pembayaran", status: payment.proofDocument!.id, rejectionReason: null, mimeType: "application/octet-stream", uploadedAt: "" }, false)} type="button"><Eye size={13} /></button> : <span>-</span>}<button className="academic-text-action" disabled={busy || !payment.proofDocumentId} onClick={() => void reviewPayment(payment, "LUNAS")} type="button">Verifikasi</button><button className="academic-text-action is-reject" disabled={busy || !paymentReason.trim()} onClick={() => void reviewPayment(payment, "DITOLAK")} type="button">Tolak</button></div></td></tr>)}</tbody></table></div>
            {!detail.payments.length ? <div className="academic-empty"><strong>Tidak ada tagihan penerimaan</strong><span>Tagihan akademik taruna tidak ditampilkan pada workspace ini.</span></div> : null}
          </> : null}
          {detailTab === "seleksi" ? <div className="academic-table-wrap"><table className="academic-table"><thead><tr><th>TAHAP</th><th>JADWAL</th><th>NILAI</th><th>STATUS</th></tr></thead><tbody>{detail.selectionResults.map((item) => <tr key={item.id}><td>{item.selectionStage.name}</td><td>{formatDate(item.scheduledAt)}</td><td>{item.score ?? "-"}</td><td><span className={statusClassName(item.status)}>{displayStatus(item.status)}</span></td></tr>)}</tbody></table>{!detail.selectionResults.length ? <div className="academic-empty"><strong>Belum masuk tahapan seleksi</strong><span>Peserta muncul setelah periode memiliki tahap dan pendaftar memenuhi syarat.</span></div> : null}</div> : null}
          {detailTab === "riwayat" ? <div className="admissions-history">{detail.statusHistory.map((item) => <article key={item.id}><time>{formatDate(item.createdAt)}</time><strong>{displayStatus(item.newStatus)}</strong><span>{item.action} · {item.actor?.email ?? "Admin"}</span>{item.notes ? <p>{item.notes}</p> : null}</article>)}</div> : null}
        </div>
        {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}
      </div>
    </div>;
  }

  function renderPendaftar() {
    const metrics = [
      ["TOTAL PENDAFTAR", applicants.length], ["BARU", applicants.filter((item) => ["DRAFT", "SUBMITTED"].includes(item.status)).length],
      ["MENUNGGU REVIEW", applicants.filter((item) => ["DOCUMENT_VERIFICATION", "PAYMENT_VERIFICATION"].includes(item.status)).length],
      ["SIAP SELEKSI", applicants.filter((item) => item.status === "READY_FOR_SELECTION").length]
    ];
    const processOptions = ["Pendaftaran Baru", "Dokumen", "Pembayaran", "Siap Seleksi", "Seleksi", "Registrasi Ulang"];
    return <>
      <div className="academic-metrics">{metrics.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Data admissions API</small></div>)}</div>
      <div className="academic-toolbar admissions-filters">
        <label className="academic-search"><Search size={12} /><input aria-label="Cari pendaftar" onChange={(event) => setQuery(event.target.value)} placeholder="Nomor pendaftaran, nama, atau NIK..." value={query} /></label>
        <label className="academic-filter"><span>Periode</span><select aria-label="Filter periode" onChange={(event) => setPeriodFilter(event.target.value)} value={periodFilter}><option value="semua">Semua</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></label>
        <label className="academic-filter"><span>Jalur</span><select aria-label="Filter jenis pendaftaran" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}><option value="semua">Semua</option><option value="POLA_PEMBIBITAN">Pola Pembibitan</option><option value="NON_POLA_PEMBIBITAN">Non Pola Pembibitan</option><option value="DIKLAT">Diklat</option></select></label>
        <label className="academic-filter"><span>Status</span><select aria-label="Filter status" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="semua">Semua</option>{Object.entries(applicationStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="academic-filter"><span>Tahap</span><select aria-label="Filter tahap proses" onChange={(event) => setStageFilter(event.target.value)} value={stageFilter}><option value="semua">Semua</option>{processOptions.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
        <label className="academic-filter"><span>Program</span><select aria-label="Filter program studi" onChange={(event) => setProgramFilter(event.target.value)} value={programFilter}><option value="semua">Semua</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <button className="academic-reset-button" onClick={() => { setQuery(""); setPeriodFilter("semua"); setTypeFilter("semua"); setProgramFilter("semua"); setStatusFilter("semua"); setStageFilter("semua"); }} type="button">Reset</button>
      </div>
      <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NO</th><th>NOMOR PENDAFTARAN</th><th>NAMA</th><th>JALUR</th><th>PROGRAM STUDI</th><th>PERIODE</th><th>STATUS</th><th>PROGRESS</th><th>TANGGAL DAFTAR</th><th>AKSI</th></tr></thead><tbody>{visibleApplicants.map((item, index) => { const progress = progressFor(item, periods); return <tr key={item.id}><td>{index + 1}</td><td>{item.registrationNumber}</td><td>{item.applicant.fullName ?? "-"}</td><td>{displayRegistrationType(item.registrationType)}</td><td>{item.admissionProgram?.name ?? "-"}</td><td>{item.admissionPeriod?.academicYear ?? "-"}</td><td><span className={statusClassName(item.status)}>{displayStatus(item.status)}</span></td><td><strong>{progress.done}/{progress.total}</strong></td><td>{formatDate(item.createdAt)}</td><td><button className="academic-text-action" disabled={busy} onClick={() => void openApplicant(item.id)} type="button">Lihat</button></td></tr>; })}</tbody></table>{!visibleApplicants.length && !loading ? <div className="academic-empty"><strong>Tidak ada pendaftar yang cocok</strong><span>Atur ulang filter atau periksa koneksi API.</span></div> : null}</div>
    </>;
  }

  function renderSelection() {
    const participants = visibleSelection;
    const finalApplicants = applicants.filter((item) => ["READY_FOR_SELECTION", "IN_SELECTION", "PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(item.status));
    const stageId = stageFilter === "semua" ? null : stageFilter;
    const summary = [
      ["TOTAL PESERTA", participants.length], ["BELUM DIJADWALKAN", participants.filter((item) => item.status === "PENDING").length],
      ["TERJADWAL", participants.filter((item) => item.status === "SCHEDULED").length], ["SELESAI", participants.filter((item) => ["PASSED", "FAILED", "ABSENT"].includes(item.status)).length],
      ["LULUS", participants.filter((item) => item.status === "PASSED").length], ["TIDAK LULUS", participants.filter((item) => item.status === "FAILED").length]
    ];
    return <>
      <div className="academic-entity-tabs" role="tablist" aria-label="Ruang kerja seleksi">{[["tahapan", "Tahapan"], ["peserta", "Peserta"], ["hasil-akhir", "Hasil Akhir"]].map(([id, label]) => <button aria-selected={selectionTab === id} className="academic-entity-tab" key={id} onClick={() => setSelectionTab(id)} role="tab" type="button">{label}</button>)}</div>
      {selectionTab !== "tahapan" ? <div className="academic-toolbar admissions-filters">
        <label className="academic-filter"><span>Periode</span><select aria-label="Filter periode seleksi" onChange={(event) => setPeriodFilter(event.target.value)} value={periodFilter}><option value="semua">Semua</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></label>
        <label className="academic-filter"><span>Jalur</span><select aria-label="Filter jalur seleksi" onChange={(event) => setTypeFilter(event.target.value)} value={typeFilter}><option value="semua">Semua</option><option value="POLA_PEMBIBITAN">Pola Pembibitan</option><option value="NON_POLA_PEMBIBITAN">Non Pola Pembibitan</option><option value="DIKLAT">Diklat</option></select></label>
        <label className="academic-filter"><span>Program</span><select aria-label="Filter program seleksi" onChange={(event) => setProgramFilter(event.target.value)} value={programFilter}><option value="semua">Semua</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <label className="academic-filter"><span>Tahap Seleksi</span><select aria-label="Filter tahap seleksi" onChange={(event) => setStageFilter(event.target.value)} value={stageFilter}><option value="semua">Semua</option>{allStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}</select></label>
        <label className="academic-search"><Search size={12} /><input aria-label="Cari peserta seleksi" onChange={(event) => setQuery(event.target.value)} placeholder="Cari nomor atau nama..." value={query} /></label>
      </div> : null}
      {selectionTab === "peserta" ? <div className="academic-metrics">{summary.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Periode dan tahap terpilih</small></div>)}</div> : null}
      {selectionTab === "tahapan" ? <div className="admissions-period-stage-list">{activePeriods.map((period) => { const stages = period.selectionStages ?? []; return <section key={period.id}><div><span className="academic-eyebrow">{period.academicYear} · {period.registrationType.replaceAll("_", " ")}</span><h2>{period.name}</h2></div><ol>{stages.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((stage) => <li key={stage.id}><b>{stage.sortOrder + 1}</b><span>{stage.name}</span><small>{stage.required ? "Wajib" : "Opsional"} · {stage.scoringModel.replaceAll("_", " ")}</small></li>)}</ol>{!stages.length ? <p>Periode ini belum memiliki tahapan seleksi.</p> : null}</section>; })}</div> : null}
      {selectionTab === "peserta" ? <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NOMOR PENDAFTARAN</th><th>NAMA</th><th>PROGRAM STUDI</th><th>TAHAP</th><th>JADWAL</th><th>NILAI</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{participants.map((item) => <tr key={item.id}><td>{item.application.registrationNumber}</td><td>{item.application.applicant.fullName ?? "-"}</td><td>{item.application.admissionProgram?.name ?? "-"}</td><td>{item.selectionStage.name}</td><td>{formatDate(item.scheduledAt)}</td><td>{item.score ?? "-"}</td><td><span className={statusClassName(item.status)}>{displayStatus(item.status)}</span></td><td><div className="academic-row-actions"><button className="academic-text-action" onClick={() => void openApplicant(item.application.id)} type="button">Lihat</button><button className="academic-text-action" onClick={() => { setSelectionTarget(item); setSelectionStatus("SCHEDULED"); setSelectionScore(item.score == null ? "" : String(item.score)); setSelectionSchedule(item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : ""); }} type="button">Jadwalkan</button><button className="academic-text-action" onClick={() => { setSelectionTarget(item); setSelectionStatus(item.status); setSelectionScore(item.score == null ? "" : String(item.score)); setSelectionSchedule(item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : ""); }} type="button">Input Hasil</button></div></td></tr>)}</tbody></table>{!participants.length ? <div className="academic-empty"><strong>Tidak ada peserta pada filter ini</strong><span>Pilih periode atau tahap seleksi lain.</span></div> : null}</div> : null}
      {selectionTab === "hasil-akhir" ? <><div className="academic-metrics">{[["MENUNGGU KEPUTUSAN", finalApplicants.filter((item) => !["PASSED_SELECTION", "FAILED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(item.status)).length], ["LULUS", finalApplicants.filter((item) => ["PASSED_SELECTION", "RE_REGISTRATION", "REGISTERED"].includes(item.status)).length], ["TIDAK LULUS", finalApplicants.filter((item) => item.status === "FAILED_SELECTION").length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Keputusan final penerimaan</small></div>)}</div><div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NOMOR PENDAFTARAN</th><th>NAMA</th><th>PROGRAM STUDI</th><th>SKOR TAHAP</th><th>STATUS SELEKSI</th><th>HASIL AKHIR</th><th>AKSI</th></tr></thead><tbody>{finalApplicants.map((item) => { const results = selection.filter((result) => result.application.id === item.id && (!stageId || result.selectionStage.id === stageId)); const score = results.reduce((total, result) => total + Number(result.score ?? 0), 0); return <tr key={item.id}><td>{item.registrationNumber}</td><td>{item.applicant.fullName ?? "-"}</td><td>{item.admissionProgram?.name ?? "-"}</td><td>{results.length ? score : "-"}</td><td>{displayStatus(item.status)}</td><td><span className={statusClassName(item.status)}>{displayStatus(item.status)}</span></td><td><div className="academic-row-actions"><button className="academic-text-action" onClick={() => void openApplicant(item.id)} type="button">Lihat</button><button className="academic-text-action" onClick={() => { setFinalApplicant(item); setFinalTargetStatus("PASSED_SELECTION"); setResultNote(""); setResultConfirmation(false); }} type="button">Hasil Akhir</button></div></td></tr>; })}</tbody></table>{!finalApplicants.length ? <div className="academic-empty"><strong>Belum ada peserta untuk hasil akhir</strong><span>Peserta seleksi dan keputusan akhir terpusat di sini.</span></div> : null}</div></> : null}
    </>;
  }

  function renderReRegistration() {
    const records = reRegistrations.filter((item) => !query || `${item.application.registrationNumber} ${item.application.applicant.fullName ?? ""}`.toLowerCase().includes(query.toLowerCase()));
    return <>
      <div className="academic-toolbar admissions-filters"><label className="academic-search"><Search size={12} /><input aria-label="Cari registrasi ulang" onChange={(event) => setQuery(event.target.value)} placeholder="Nomor pendaftaran atau nama..." value={query} /></label><label className="academic-filter"><span>Periode</span><select aria-label="Filter periode registrasi ulang" onChange={(event) => setPeriodFilter(event.target.value)} value={periodFilter}><option value="semua">Semua</option>{periods.map((period) => <option key={period.id} value={period.id}>{period.name}</option>)}</select></label><button className="academic-reset-button" onClick={() => { setQuery(""); setPeriodFilter("semua"); }} type="button">Reset</button></div>
      <div className="academic-metrics">{[["LULUS", records.length], ["DALAM PROSES", records.filter((item) => item.status === "DALAM_PROSES").length], ["SELESAI", records.filter((item) => item.status === "SELESAI").length]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Hanya hasil lulus</small></div>)}</div>
      <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NOMOR PENDAFTARAN</th><th>NAMA</th><th>PROGRAM STUDI</th><th>PERIODE</th><th>HASIL SELEKSI</th><th>PROGRESS</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{records.filter((item) => periodFilter === "semua" || item.application.admissionPeriod?.id === periodFilter).map((item) => { const checklist = item.checklist ?? {}; const done = checklistLabels.filter(([key]) => checklist[key] === true).length; return <tr key={item.id}><td>{item.application.registrationNumber}</td><td>{item.application.applicant.fullName ?? "-"}</td><td>{item.application.admissionProgram?.name ?? "-"}</td><td>{admissionPeriodName(item.application.admissionPeriod)}</td><td><span className="academic-status status-approved">Lulus</span></td><td>{done}/5</td><td><span className={statusClassName(item.status)}>{displayStatus(item.status)}</span>{item.student ? <small className="admissions-reason">NIM {item.student.studentNumber}</small> : null}</td><td><button className="academic-text-action" disabled={item.status === "SELESAI"} onClick={() => { setSelectedReRegistration(item); setReRegistrationDraft({ ...item, checklist: { ...(item.checklist ?? {}) } }); }} type="button">Proses</button></td></tr>; })}</tbody></table>{!records.length ? <div className="academic-empty"><strong>Belum ada pendaftar lulus seleksi</strong><span>Hanya application berstatus Registrasi Ulang atau Terdaftar yang ditampilkan.</span></div> : null}</div>
      {selectedReRegistration && reRegistrationDraft ? <div className="academic-modal-backdrop" onClick={() => { setSelectedReRegistration(null); setReRegistrationDraft(null); }}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">REGISTRASI ULANG · {selectedReRegistration.application.registrationNumber}</span><h2>{selectedReRegistration.application.applicant.fullName ?? "Pendaftar"}</h2><p>{selectedReRegistration.application.admissionProgram?.name ?? "-"} · {admissionPeriodName(selectedReRegistration.application.admissionPeriod)}</p></div><button aria-label="Tutup registrasi ulang" className="academic-small-icon" onClick={() => { setSelectedReRegistration(null); setReRegistrationDraft(null); }} type="button"><X size={18} /></button></header><div className="admissions-detail-body">{checklistLabels.map(([key, label]) => <label className="admissions-checklist-item" key={key}><input checked={Boolean(reRegistrationDraft.checklist?.[key])} onChange={(event) => setReRegistrationDraft((current) => current ? { ...current, checklist: { ...(current.checklist ?? {}), [key]: event.target.checked } } : current)} type="checkbox" /><span>{label}</span><b>{reRegistrationDraft.checklist?.[key] ? "Selesai" : "Menunggu"}</b></label>)}<div className="academic-modal-actions"><button className="academic-secondary-button" disabled={busy} onClick={() => void saveChecklist()} type="button">Simpan Progres</button><button className="academic-primary-button" disabled={busy || !checklistLabels.every(([key]) => reRegistrationDraft.checklist?.[key])} onClick={() => void saveChecklist(true)} type="button">Selesaikan &amp; Konversi</button></div>{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}</div></div></div> : null}
    </>;
  }

  return <section className="academic-module admissions-operations">
    <header className="academic-heading"><div><span className="academic-eyebrow">PENERIMAAN · WORKSPACE</span><h1>{currentTitle}</h1><p>{workspace === "pendaftar" ? "Kelola satu record pendaftar dari dokumen dan pembayaran hingga keputusan seleksi." : workspace === "seleksi" ? "Operasikan tahap, peserta, jadwal, nilai, dan keputusan akhir dari konfigurasi periode." : "Proses hanya pendaftar yang lulus seleksi hingga konversi ke data mahasiswa."}</p></div><div className="academic-heading-actions"><button className="academic-secondary-button" onClick={() => void reloadWorkspace().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat ulang."))} type="button"><ShieldCheck size={14} /> Muat Ulang</button></div></header>
    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}{notice ? <p className="academic-feedback" role="status">{notice}</p> : null}
    {loading ? <div className="academic-empty"><span>Memuat data admissions dari API...</span></div> : workspace === "pendaftar" ? renderPendaftar() : workspace === "seleksi" ? renderSelection() : renderReRegistration()}
    {selectionTarget ? <div className="academic-modal-backdrop" onClick={() => setSelectionTarget(null)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">{selectionTarget.application.registrationNumber} · {selectionTarget.selectionStage.name}</span><h2>Jadwal &amp; hasil tahap</h2></div><button aria-label="Tutup input hasil" className="academic-small-icon" onClick={() => setSelectionTarget(null)} type="button"><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void saveSelectionResult(); }}><div className="academic-form-grid"><label className="academic-form-field"><span>Status</span><select onChange={(event) => setSelectionStatus(event.target.value)} value={selectionStatus}>{selectionStatuses.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</select></label><label className="academic-form-field"><span>Jadwal</span><input onChange={(event) => setSelectionSchedule(event.target.value)} type="datetime-local" value={selectionSchedule} /></label>{selectionTarget.selectionStage.scoringModel !== "PASS_FAIL" ? <label className="academic-form-field"><span>Nilai{selectionTarget.selectionStage.maximumScore ? ` (maks. ${selectionTarget.selectionStage.maximumScore})` : ""}</span><input max={selectionTarget.selectionStage.maximumScore ?? undefined} min={0} onChange={(event) => setSelectionScore(event.target.value)} type="number" value={selectionScore} /></label> : null}</div><footer><button className="academic-secondary-button" onClick={() => setSelectionTarget(null)} type="button">Batal</button><button className="academic-primary-button" disabled={busy} type="submit">Simpan Hasil</button></footer></form></div></div> : null}
    {finalApplicant ? <div className="academic-modal-backdrop" onClick={() => setFinalApplicant(null)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">HASIL AKHIR · {finalApplicant.registrationNumber}</span><h2>{finalApplicant.applicant.fullName ?? "Pendaftar"}</h2><p>{finalApplicant.admissionProgram?.name ?? "-"} · {admissionPeriodName(finalApplicant.admissionPeriod)}</p></div><button aria-label="Tutup keputusan" className="academic-small-icon" onClick={() => setFinalApplicant(null)} type="button"><X size={18} /></button></header><form onSubmit={(event) => { event.preventDefault(); void publishResult(finalApplicant, finalTargetStatus); }}><div className="academic-form-grid"><label className="academic-form-field"><span>Hasil akhir</span><select onChange={(event) => setFinalTargetStatus(event.target.value as "PASSED_SELECTION" | "FAILED_SELECTION")} value={finalTargetStatus}><option value="PASSED_SELECTION">LULUS</option><option value="FAILED_SELECTION">TIDAK LULUS</option></select></label><label className="academic-form-field is-wide"><span>Alasan / catatan audit</span><textarea required onChange={(event) => setResultNote(event.target.value)} value={resultNote} /></label><label className="academic-form-field is-wide"><span className="academic-checkbox-label"><input checked={resultConfirmation} onChange={(event) => setResultConfirmation(event.target.checked)} type="checkbox" /> Saya mengonfirmasi perubahan hasil akhir dan pencatatan audit.</span></label></div>{error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}<footer><button className="academic-secondary-button" onClick={() => setFinalApplicant(null)} type="button">Batal</button><button className="academic-primary-button" disabled={busy || !resultConfirmation} type="submit">Simpan Hasil Akhir</button></footer></form></div></div> : null}
    {detail ? renderApplicantDetails() : null}
    <div className="academic-footnote"><span>Dokumen, pembayaran, seleksi, dan riwayat dibuka dari record pendaftar yang sama.</span><span><ShieldCheck size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> API: /api/v1/admissions/admin</span></div>
  </section>;
}
