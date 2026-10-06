"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, Plus, RefreshCw, Search, X } from "lucide-react";

type AdmissionProgram = { id: string; code: string; name: string; registrationType: string; active: boolean; studyProgram?: { name: string } | null };
type PeriodConfig = {
  id: string; code: string; name: string; academicYear: string; registrationType: string; status: string;
  opensAt: string; closesAt: string; quota: number | null; description: string | null;
  programs: { admissionProgramId: string; quota: number | null; program: AdmissionProgram }[];
  requirements: { title: string; description: string; required: boolean }[];
  documents: { documentCode: string; label: string; required: boolean; acceptedMimeTypes: string[]; maxSizeBytes: number | null }[];
  fees: { code: string; name: string; amount: number | null; required: boolean }[];
  selectionStages: { id: string; code: string; name: string; sortOrder: number; scoringModel: string; maximumScore: number | null; required: boolean }[];
  _count: { applications: number };
};
type PeriodForm = {
  code: string; name: string; academicYear: string; registrationType: string; opensAt: string; closesAt: string;
  quota: string; description: string; programIds: string[]; requirements: string; documents: string;
  feeName: string; feeAmount: string; stages: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const types = ["POLA_PEMBIBITAN", "NON_POLA_PEMBIBITAN", "DIKLAT"];
const statuses = ["DRAFT", "UPCOMING", "OPEN", "CLOSED", "ARCHIVED"];
const statusNames: Record<string, string> = { DRAFT: "Draf", UPCOMING: "Akan Datang", OPEN: "Buka", CLOSED: "Tutup", ARCHIVED: "Diarsip" };
const emptyForm: PeriodForm = { code: "", name: "", academicYear: "2026/2027", registrationType: "POLA_PEMBIBITAN", opensAt: "", closesAt: "", quota: "", description: "", programIds: [], requirements: "", documents: "", feeName: "Biaya Pendaftaran", feeAmount: "", stages: "Administrasi\nWawancara\nFinal" };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("x-backoffice-demo", "true");
  if (init.body) headers.set("content-type", "application/json");
  const response = await fetch(`${apiBase}${path}`, { ...init, headers, cache: "no-store" });
  const body = await response.json().catch(() => null) as { message?: string | string[] } | T | null;
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body ? body.message : null;
    throw new Error(Array.isArray(message) ? message.join(" ") : message || `API admissions merespons ${response.status}.`);
  }
  return body as T;
}

function dateValue(value: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function slug(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 35) || "tahap";
}

export function AdmissionPeriodsPage() {
  const [periods, setPeriods] = useState<PeriodConfig[]>([]);
  const [programs, setPrograms] = useState<AdmissionProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PeriodConfig | null>(null);
  const [form, setForm] = useState<PeriodForm>(emptyForm);

  async function reload() {
    setError(null);
    const [nextPeriods, nextPrograms] = await Promise.all([
      request<PeriodConfig[]>("/admissions/admin/periods"),
      request<AdmissionProgram[]>("/admissions/admin/programs")
    ]);
    setPeriods(nextPeriods);
    setPrograms(nextPrograms.filter((program) => program.active));
  }

  useEffect(() => {
    let active = true;
    void reload().catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Periode pendaftaran gagal dimuat."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visiblePeriods = periods.filter((period) => {
    const matchesQuery = !query || `${period.name} ${period.code} ${period.academicYear}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (statusFilter === "semua" || period.status === statusFilter);
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, code: `PMB-${new Date().getFullYear()}-` });
    setFormOpen(true);
  }

  function openEdit(period: PeriodConfig) {
    setEditing(period);
    setForm({
      code: period.code,
      name: period.name,
      academicYear: period.academicYear,
      registrationType: period.registrationType,
      opensAt: dateValue(period.opensAt),
      closesAt: dateValue(period.closesAt),
      quota: period.quota == null ? "" : String(period.quota),
      description: period.description ?? "",
      programIds: period.programs.map((item) => item.admissionProgramId),
      requirements: period.requirements.map((item) => `${item.title}|${item.description}`).join("\n"),
      documents: period.documents.map((item) => item.label).join("\n"),
      feeName: period.fees[0]?.name ?? "Biaya Pendaftaran",
      feeAmount: period.fees[0]?.amount == null ? "" : String(period.fees[0].amount),
      stages: period.selectionStages.map((item) => item.name).join("\n")
    });
    setFormOpen(true);
  }

  function makePayload() {
    const requirementRows = form.requirements.split("\n").map((line) => line.trim()).filter(Boolean).map((line, index) => {
      const [title, ...description] = line.split("|");
      return { title: title.trim(), description: description.join("|").trim() || title.trim(), required: true, sortOrder: index };
    });
    const documentRows = form.documents.split("\n").map((label) => label.trim()).filter(Boolean).map((label, index) => ({
      documentCode: slug(label), label, required: true, acceptedMimeTypes: ["application/pdf", "image/jpeg", "image/png"], maxSizeBytes: 10 * 1024 * 1024, sortOrder: index
    }));
    const selectionStages = form.stages.split("\n").map((name) => name.trim()).filter(Boolean).map((name, sortOrder) => ({
      code: slug(name), name, sortOrder, scoringModel: "SCORE_AND_PASS", maximumScore: 100, required: true
    }));
    return {
      code: form.code.trim(), name: form.name.trim(), academicYear: form.academicYear.trim(), registrationType: form.registrationType,
      status: editing?.status ?? "DRAFT", opensAt: new Date(`${form.opensAt}T00:00:00.000Z`).toISOString(), closesAt: new Date(`${form.closesAt}T23:59:59.000Z`).toISOString(),
      quota: form.quota ? Number(form.quota) : undefined, description: form.description.trim(), registrationSettings: { registrationType: form.registrationType },
      programs: form.programIds.map((admissionProgramId) => ({ admissionProgramId, quota: form.quota ? Number(form.quota) : undefined })),
      requirements: requirementRows, documents: documentRows,
      fees: form.feeAmount ? [{ code: "REGISTRATION", name: form.feeName.trim() || "Biaya Pendaftaran", amount: Number(form.feeAmount), required: true, currency: "IDR" }] : [],
      selectionStages
    };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const payload = makePayload();
      if (editing) {
        const scalar = { ...payload, programs: undefined, requirements: undefined, documents: undefined, fees: undefined, selectionStages: undefined };
        await request(`/admissions/admin/periods/${editing.id}`, { method: "PATCH", body: JSON.stringify(scalar) });
        setNotice("Perubahan dasar periode tersimpan. Relasi persyaratan, dokumen, biaya, program, dan tahap yang sudah dipakai pendaftar tidak ditimpa.");
      } else {
        await request("/admissions/admin/periods", { method: "POST", body: JSON.stringify(payload) });
        setNotice("Periode pendaftaran dibuat.");
      }
      setFormOpen(false);
      setEditing(null);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Periode tidak dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(period: PeriodConfig, status: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await request(`/admissions/admin/periods/${period.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      await reload();
      setNotice(`Status ${period.name} diperbarui menjadi ${statusNames[status] ?? status}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Status periode tidak dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="academic-module admissions-operations">
    <header className="academic-heading"><div><span className="academic-eyebrow">PENERIMAAN · KONFIGURASI</span><h1>Periode Pendaftaran</h1><p>Kelola jadwal, jalur, program, kuota, biaya, dokumen wajib, persyaratan, dan tahapan seleksi.</p></div><div className="academic-heading-actions"><button className="academic-secondary-button" disabled={busy} onClick={() => void reload().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Gagal memuat ulang."))} type="button"><RefreshCw size={14} /> Muat Ulang</button><button className="academic-primary-button" onClick={openCreate} type="button"><Plus size={14} /> Tambah Periode</button></div></header>
    {error ? <p className="academic-feedback is-error" role="alert">{error}</p> : null}{notice ? <p className="academic-feedback" role="status">{notice}</p> : null}
    <div className="academic-toolbar admissions-filters"><label className="academic-search"><Search size={12} /><input aria-label="Cari periode pendaftaran" onChange={(event) => setQuery(event.target.value)} placeholder="Nama periode, kode, atau tahun akademik..." value={query} /></label><label className="academic-filter"><span>Status</span><select aria-label="Filter status periode" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}><option value="semua">Semua</option>{statuses.map((status) => <option key={status} value={status}>{statusNames[status]}</option>)}</select></label><button className="academic-reset-button" onClick={() => { setQuery(""); setStatusFilter("semua"); }} type="button">Reset</button></div>
    <div className="academic-metrics">{[["TOTAL PERIODE", periods.length], ["TERBUKA", periods.filter((period) => period.status === "OPEN").length], ["MENUNGGU", periods.filter((period) => ["DRAFT", "UPCOMING"].includes(period.status)).length], ["PENDAFTAR", periods.reduce((total, period) => total + (period._count?.applications ?? 0), 0)]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong><small>Data admissions API</small></div>)}</div>
    {loading ? <div className="academic-empty">Memuat konfigurasi periode...</div> : <div className="academic-table-wrap"><table className="academic-table admissions-wide-table"><thead><tr><th>NAMA PERIODE</th><th>TAHUN AKADEMIK</th><th>JENIS</th><th>MULAI</th><th>SELESAI</th><th>PROGRAM</th><th>KUOTA</th><th>STATUS</th><th>PENDAFTAR</th><th>AKSI</th></tr></thead><tbody>{visiblePeriods.map((period) => <tr key={period.id}><td>{period.name}<small className="admissions-reason">{period.code}</small></td><td>{period.academicYear}</td><td>{period.registrationType.replaceAll("_", " ")}</td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(period.opensAt))}</td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(period.closesAt))}</td><td>{period.programs.map((item) => item.program?.name).filter(Boolean).join(", ") || "-"}</td><td>{period.quota ?? "-"}</td><td><span className={`academic-status ${period.status === "OPEN" ? "status-approved" : ["DRAFT", "UPCOMING"].includes(period.status) ? "status-warning" : "status-neutral"}`}>{statusNames[period.status] ?? period.status}</span></td><td>{period._count.applications}</td><td><div className="academic-row-actions"><button className="academic-text-action" disabled={busy} onClick={() => openEdit(period)} type="button">Konfigurasi</button><select aria-label={`Ubah status ${period.name}`} disabled={busy} onChange={(event) => { if (event.target.value !== period.status) void setStatus(period, event.target.value); }} value={period.status}>{statuses.map((status) => <option key={status} value={status}>{statusNames[status]}</option>)}</select></div></td></tr>)}</tbody></table>{!visiblePeriods.length && !error ? <div className="academic-empty"><CalendarDays size={18} /><strong>Belum ada periode pendaftaran</strong><span>Tambah periode untuk menyiapkan konfigurasi pendaftaran dan tahap seleksi.</span></div> : null}</div>}
    {formOpen ? <div className="academic-modal-backdrop" onClick={() => setFormOpen(false)}><div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog"><header><div><span className="academic-eyebrow">PENERIMAAN · KONFIGURASI</span><h2>{editing ? "Konfigurasi Periode" : "Tambah Periode"}</h2></div><button aria-label="Tutup formulir periode" className="academic-small-icon" onClick={() => setFormOpen(false)} type="button"><X size={18} /></button></header><form onSubmit={(event) => void save(event)}><div className="academic-form-grid"><label className="academic-form-field"><span>Kode Periode</span><input onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase().replaceAll(" ", "-") }))} required value={form.code} /></label><label className="academic-form-field"><span>Nama Periode</span><input onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} /></label><label className="academic-form-field"><span>Tahun Akademik</span><input onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))} required value={form.academicYear} /></label><label className="academic-form-field"><span>Jenis Pendaftaran</span><select onChange={(event) => setForm((current) => ({ ...current, registrationType: event.target.value, programIds: [] }))} value={form.registrationType}>{types.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}</select></label><label className="academic-form-field"><span>Tanggal Mulai</span><input onChange={(event) => setForm((current) => ({ ...current, opensAt: event.target.value }))} required type="date" value={form.opensAt} /></label><label className="academic-form-field"><span>Tanggal Selesai</span><input onChange={(event) => setForm((current) => ({ ...current, closesAt: event.target.value }))} required type="date" value={form.closesAt} /></label><label className="academic-form-field"><span>Kuota</span><input min={1} onChange={(event) => setForm((current) => ({ ...current, quota: event.target.value }))} type="number" value={form.quota} /></label><label className="academic-form-field"><span>Biaya Pendaftaran (IDR)</span><input min={0} onChange={(event) => setForm((current) => ({ ...current, feeAmount: event.target.value }))} type="number" value={form.feeAmount} /></label><label className="academic-form-field is-wide"><span>Deskripsi</span><input onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} /></label><div className="academic-form-field is-wide"><span>Program Pendaftaran</span><div className="admissions-program-options">{programs.filter((program) => program.registrationType === form.registrationType).map((program) => <label key={program.id}><input checked={form.programIds.includes(program.id)} onChange={(event) => setForm((current) => ({ ...current, programIds: event.target.checked ? [...current.programIds, program.id] : current.programIds.filter((id) => id !== program.id) }))} type="checkbox" /><span>{program.name}{program.studyProgram?.name ? ` · ${program.studyProgram.name}` : ""}</span></label>)}{!programs.some((program) => program.registrationType === form.registrationType) ? <small>Belum ada program penerimaan aktif untuk jalur ini. Program dapat ditambahkan melalui API admin.</small> : null}</div></div><label className="academic-form-field is-wide"><span>Persyaratan (satu per baris; gunakan Judul|Deskripsi bila berbeda)</span><textarea onChange={(event) => setForm((current) => ({ ...current, requirements: event.target.value }))} value={form.requirements} /></label><label className="academic-form-field is-wide"><span>Dokumen wajib (satu per baris)</span><textarea onChange={(event) => setForm((current) => ({ ...current, documents: event.target.value }))} value={form.documents} /></label><label className="academic-form-field is-wide"><span>Biaya</span><input onChange={(event) => setForm((current) => ({ ...current, feeName: event.target.value }))} value={form.feeName} /></label><label className="academic-form-field is-wide"><span>Tahapan Seleksi (urutan satu per baris)</span><textarea onChange={(event) => setForm((current) => ({ ...current, stages: event.target.value }))} value={form.stages} /></label><p className="academic-form-note is-wide">Perubahan relasi konfigurasi pada periode yang sudah memiliki pendaftar dilindungi API. Detail biaya dan program mengikuti data penerimaan, terpisah dari tagihan akademik taruna.</p></div><footer><button className="academic-secondary-button" onClick={() => setFormOpen(false)} type="button">Batal</button><button className="academic-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Periode"}</button></footer></form></div></div> : null}
    <div className="academic-footnote"><span>Konfigurasi program, dokumen, pembayaran penerimaan, dan seleksi bersumber dari satu AdmissionPeriod.</span><span>API: /api/v1/admissions/admin/periods</span></div>
  </section>;
}
