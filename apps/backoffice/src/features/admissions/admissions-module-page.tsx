"use client";

import { CheckCheck, CircleDashed, Download, Eye, GraduationCap, Search, ShieldCheck, X } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";

const moduleCatalog = {
  periode: {
    id: "periode",
    label: "Periode Pendaftaran",
    eyebrow: "PENERIMAAN",
    description: "Kelola periode aktif, jenis pendaftaran, program studi, kuota, jadwal, biaya, dan status publikasi penerimaan.",
    metrics: [
      { label: "TOTAL PERIODE", value: "8", detail: "Aktif + arsip" },
      { label: "TERBUKA", value: "3", detail: "Status OPEN" },
      { label: "MENUNGGU", value: "2", detail: "Status DRAFT" },
      { label: "PENDAFTAR", value: "2.340", detail: "Total pendaftar" }
    ],
    headers: ["Nama Periode", "Tahun Akademik", "Jenis", "Mulai", "Selesai", "Status", "Pendaftar", "Aksi"],
    rows: [
      { name: "SIPENCATAR 2026/2027", academicYear: "2026/2027", type: "POLA_PEMBIBITAN", start: "01 Apr 2026", end: "30 Apr 2026", status: "OPEN", applicants: 542 },
      { name: "Penerimaan Jalur Non Pola 2026/2027", academicYear: "2026/2027", type: "NON_POLA_PEMBIBITAN", start: "15 Mei 2026", end: "20 Jun 2026", status: "UPCOMING", applicants: 216 },
      { name: "Diklat Periode Oktober 2026", academicYear: "2026/2027", type: "DIKLAT", start: "01 Okt 2026", end: "30 Okt 2026", status: "DRAFT", applicants: 44 }
    ]
  },
  pendaftar: {
    id: "pendaftar",
    label: "Pendaftar",
    eyebrow: "APPLICANT INBOX",
    description: "Inbox utama pendaftar yang masuk dari formulir publik. Status bersifat satu alur administrasi yang dipakai di seluruh modul penerimaan.",
    metrics: [
      { label: "TOTAL PENDAFTAR", value: "1.284", detail: "Semua status" },
      { label: "BARU", value: "186", detail: "Dalam alur masuk" },
      { label: "MENUNGGU VERIFIKASI", value: "54", detail: "Dokumen belum review" },
      { label: "SIAP SELEKSI", value: "118", detail: "Tuntas verifikasi" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "NIK", "Jenis", "Program Studi", "Periode", "Status", "Tanggal", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000014", name: "Ari Prasetyo", nik: "167205...", type: "NON_POLA_PEMBIBITAN", program: "D-III Studi Nautika", period: "Penerimaan Jalur Non Pola 2026/2027", status: "DOCUMENT_VERIFICATION", date: "04 Okt 2026" },
      { registrationNumber: "REG-2026-000015", name: "Rina Sari", nik: "167206...", type: "POLA_PEMBIBITAN", program: "D-IV Teknik Keselamatan Kapal", period: "SIPENCATAR 2026/2027", status: "PAYMENT_PENDING", date: "05 Okt 2026" },
      { registrationNumber: "REG-2026-000016", name: "Fajar Hidayat", nik: "167207...", type: "DIKLAT", program: "Diklat Keterampilan Pelaut", period: "Diklat Periode Oktober 2026", status: "READY_FOR_SELECTION", date: "06 Okt 2026" }
    ]
  },
  "verifikasi-dokumen": {
    id: "verifikasi-dokumen",
    label: "Verifikasi Dokumen",
    eyebrow: "DOCUMENT REVIEW",
    description: "Dokumen yang diunggah melalui formulir publik dipertautkan langsung ke modul verifikasi tanpa sistem upload terpisah.",
    metrics: [
      { label: "TOTAL DOKUMEN", value: "463", detail: "Berkas masuk" },
      { label: "VALID", value: "308", detail: "Terverifikasi" },
      { label: "PERLU PERBAIKAN", value: "27", detail: "Revisi dokumen" },
      { label: "BELUM DIREVIEW", value: "128", detail: "Menunggu review" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "Jenis", "Jumlah Dokumen", "Valid", "Perlu Perbaikan", "Status", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000021", name: "Dewi Lestari", type: "POLA_PEMBIBITAN", total: 7, valid: 4, fix: 1, status: "BELUM_DIVERIFIKASI" },
      { registrationNumber: "REG-2026-000022", name: "Budi Santoso", type: "NON_POLA_PEMBIBITAN", total: 6, valid: 5, fix: 0, status: "TERVERIFIKASI" },
      { registrationNumber: "REG-2026-000023", name: "Nadia Rahma", type: "DIKLAT", total: 5, valid: 2, fix: 2, status: "PERLU_PERBAIKAN" }
    ]
  },
  pembayaran: {
    id: "pembayaran",
    label: "Pembayaran",
    eyebrow: "ADMISSION PAYMENT",
    description: "Kelola bukti pembayaran pendaftaran dan verifikasi pembayaran secara terpisah dari tagihan taruna akademik yang aktif.",
    metrics: [
      { label: "TOTAL TAGIHAN", value: "642", detail: "Biaya penerimaan" },
      { label: "MENUNGGU VERIFIKASI", value: "41", detail: "Bukti belum review" },
      { label: "LUNAS", value: "324", detail: "Sudah diverifikasi" },
      { label: "DITOLAK", value: "9", detail: "Perlu retry" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "Jenis", "Jenis Tagihan", "Nominal", "Metode", "Status", "Tanggal", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000036", name: "Siti Nurhaliza", type: "NON_POLA_PEMBIBITAN", fee: "Pendaftaran", amount: "Rp 1.250.000", method: "Transfer", status: "MENUNGGU_VERIFIKASI", date: "08 Okt 2026" },
      { registrationNumber: "REG-2026-000037", name: "Agung Pratama", type: "POLA_PEMBIBITAN", fee: "Seleksi", amount: "Rp 350.000", method: "QRIS", status: "LUNAS", date: "09 Okt 2026" },
      { registrationNumber: "REG-2026-000038", name: "Maya Fitri", type: "DIKLAT", fee: "Training Fee", amount: "Rp 2.500.000", method: "Transfer", status: "DITOLAK", date: "09 Okt 2026" }
    ]
  },
  seleksi: {
    id: "seleksi",
    label: "Seleksi",
    eyebrow: "SELECTION WORKFLOW",
    description: "Kelola tahapan seleksi yang dapat dikonfigurasi per periode, termasuk jadwal, status peserta, dan skor yang relevan per stage.",
    metrics: [
      { label: "TOTAL PESERTA", value: "286", detail: "Semua stage" },
      { label: "TERJADWAL", value: "74", detail: "Siap proses" },
      { label: "SELESAI", value: "138", detail: "Sudah dinilai" },
      { label: "PENDING", value: "74", detail: "Belum dijadwalkan" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "Program Studi", "Tahap", "Jadwal", "Skor", "Status", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000041", name: "Rizky Hidayat", program: "DIII Studi Nautika", stage: "Wawancara", schedule: "12 Okt 2026", score: "-", status: "SCHEDULED" },
      { registrationNumber: "REG-2026-000043", name: "Imanul Huda", program: "D-IV Teknik Keselamatan Kapal", stage: "Administrasi", schedule: "10 Okt 2026", score: "86", status: "PASSED" },
      { registrationNumber: "REG-2026-000044", name: "Yuda Putra", program: "Diklat Keterampilan Pelaut", stage: "Kesamaptaan", schedule: "11 Okt 2026", score: "72", status: "PRESENT" }
    ]
  },
  "kelulusan-seleksi": {
    id: "kelulusan-seleksi",
    label: "Kelulusan Seleksi",
    eyebrow: "FINAL RESULT",
    description: "Hasil akhir seleksi hanya dapat dipublikasikan setelah validasi dokumen, pembayaran, dan tahapan yang diwajibkan pada periode selesai.",
    metrics: [
      { label: "TOTAL PESERTA", value: "119", detail: "Hasil akhir" },
      { label: "LULUS", value: "64", detail: "Diterima" },
      { label: "TIDAK LULUS", value: "21", detail: "Tidak lanjut" },
      { label: "PENDING", value: "34", detail: "Menunggu keputusan" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "Program Studi", "Total Skor", "Status Akhir", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000055", name: "Dimas Prayoga", program: "D-III Studi Nautika", score: "88", status: "LULUS" },
      { registrationNumber: "REG-2026-000056", name: "Hanifa Putri", program: "D-IV Teknik Keselamatan Kapal", score: "75", status: "PENDING" },
      { registrationNumber: "REG-2026-000057", name: "Wahyu Saputra", program: "Diklat Keterampilan Pelaut", score: "63", status: "TIDAK_LULUS" }
    ]
  },
  "registrasi-ulang": {
    id: "registrasi-ulang",
    label: "Registrasi Ulang",
    eyebrow: "RE-REGISTRATION",
    description: "Menjembatani pendaftar yang lulus seleksi ke tahap aktivasi data dan konversi menjadi mahasiswa atau peserta diklat sesuai workflow yang berlaku.",
    metrics: [
      { label: "TOTAL", value: "95", detail: "Calon lolos" },
      { label: "DALAM PROSES", value: "22", detail: "Checklist pending" },
      { label: "DOKUMEN LENGKAP", value: "41", detail: "Siap final" },
      { label: "SELESAI", value: "32", detail: "Konversi berhasil" }
    ],
    headers: ["Nomor Pendaftaran", "Nama", "Program Studi", "Periode", "Status Kelulusan", "Status Registrasi", "Tanggal", "Aksi"],
    rows: [
      { registrationNumber: "REG-2026-000071", name: "M. Arifin", program: "D-III Studi Nautika", period: "SIPENCATAR 2026/2027", finalStatus: "LULUS", reStatus: "DALAM_PROSES", date: "15 Okt 2026" },
      { registrationNumber: "REG-2026-000072", name: "Alya Sabina", program: "D-IV Teknik Keselamatan Kapal", period: "Penerimaan Jalur Non Pola 2026/2027", finalStatus: "LULUS", reStatus: "DOKUMEN_LENGKAP", date: "16 Okt 2026" },
      { registrationNumber: "REG-2026-000073", name: "Gilang R., S.Tr.Pel.", program: "Diklat Keterampilan Pelaut", period: "Diklat Periode Oktober 2026", finalStatus: "LULUS", reStatus: "SELESAI", date: "18 Okt 2026" }
    ]
  }
} as const;

const statusPalette: Record<string, string> = {
  OPEN: "status-approved",
  UPCOMING: "status-warning",
  DRAFT: "status-warning",
  CLOSED: "status-rejected",
  ARCHIVED: "status-neutral",
  DOCUMENT_VERIFICATION: "status-warning",
  PAYMENT_PENDING: "status-warning",
  READY_FOR_SELECTION: "status-approved",
  BELUM_DIVERIFIKASI: "status-warning",
  DIPERIKSA: "status-warning",
  TERVERIFIKASI: "status-approved",
  PERLU_PERBAIKAN: "status-warning",
  DITOLAK: "status-rejected",
  MENUNGGU_VERIFIKASI: "status-warning",
  LUNAS: "status-approved",
  PASSED: "status-approved",
  SCHEDULED: "status-warning",
  PRESENT: "status-approved",
  FAILED: "status-rejected",
  ABSENT: "status-rejected",
  PENDING: "status-warning",
  LULUS: "status-approved",
  TIDAK_LULUS: "status-rejected",
  DALAM_PROSES: "status-warning",
  DOKUMEN_LENGKAP: "status-approved",
  SELESAI: "status-approved",
  BELUM_REGISTRASI: "status-neutral"
};

const statusLabels: Record<string, string> = {
  OPEN: "Buka",
  UPCOMING: "Akan Datang",
  DRAFT: "Draf",
  CLOSED: "Tutup",
  ARCHIVED: "Diarsip",
  DOCUMENT_VERIFICATION: "Verifikasi Dokumen",
  PAYMENT_PENDING: "Pembayaran Pending",
  READY_FOR_SELECTION: "Siap Seleksi",
  BELUM_DIVERIFIKASI: "Belum Diverifikasi",
  DIPERIKSA: "Diperiksa",
  TERVERIFIKASI: "Terverifikasi",
  PERLU_PERBAIKAN: "Perlu Perbaikan",
  DITOLAK: "Ditolak",
  MENUNGGU_VERIFIKASI: "Menunggu Verifikasi",
  LUNAS: "Lunas",
  PASSED: "Lulus",
  SCHEDULED: "Terjadwal",
  PRESENT: "Hadir",
  FAILED: "Gagal",
  ABSENT: "Absen",
  PENDING: "Menunggu",
  LULUS: "Lulus",
  TIDAK_LULUS: "Tidak Lulus",
  DALAM_PROSES: "Dalam Proses",
  DOKUMEN_LENGKAP: "Dokumen Lengkap",
  SELESAI: "Selesai",
  BELUM_REGISTRASI: "Belum Registrasi"
};

function statusClass(status: string) {
  return `academic-status ${statusPalette[status] ?? "status-neutral"}`;
}

export function AdmissionsModulePage({ moduleId }: { moduleId: string }) {
  const definition = useMemo(() => Object.values(moduleCatalog).find((item) => item.id === moduleId) ?? moduleCatalog.periode, [moduleId]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);
  const [draftPeriod, setDraftPeriod] = useState({
    id: "",
    name: "",
    academicYear: "2026/2027",
    type: "POLA_PEMBIBITAN",
    start: "",
    end: "",
    status: "DRAFT",
    applicants: 0,
    program: "D-III Nautika",
    kuota: 150,
    fee: "Rp 1.250.000",
    documents: ["KTP", "Ijazah", "Surat Keterangan Sehat"],
    requirements: ["Lulus seleksi administrasi", "Melengkapi bukti pembayaran"],
    stages: ["Administrasi", "Tes Potensi", "Wawancara"]
  });

  const [periods, setPeriods] = useState([
    { id: "period-01", name: "SIPENCATAR 2026/2027", academicYear: "2026/2027", type: "POLA_PEMBIBITAN", start: "01 Apr 2026", end: "30 Apr 2026", status: "OPEN", applicants: 542, program: "D-III Nautika", kuota: 180, fee: "Rp 1.250.000", documents: ["KTP", "Ijazah", "Surat Keterangan Sehat"], requirements: ["Lulus tes potensi", "Melengkapi berkas"], stages: ["Administrasi", "Tes Potensi", "Wawancara"] },
    { id: "period-02", name: "Penerimaan Jalur Non Pola 2026/2027", academicYear: "2026/2027", type: "NON_POLA_PEMBIBITAN", start: "15 Mei 2026", end: "20 Jun 2026", status: "UPCOMING", applicants: 216, program: "D-IV Teknik Keselamatan Kapal", kuota: 120, fee: "Rp 1.500.000", documents: ["KTP", "Ijazah", "Pas Foto"], requirements: ["Melengkapi berkas pendaftaran"], stages: ["Administrasi", "Tes Kesehatan"] },
    { id: "period-03", name: "Diklat Periode Oktober 2026", academicYear: "2026/2027", type: "DIKLAT", start: "01 Okt 2026", end: "30 Okt 2026", status: "DRAFT", applicants: 44, program: "Diklat Keterampilan Pelaut", kuota: 90, fee: "Rp 2.000.000", documents: ["KTP", "Surat Ket. Kerja"], requirements: ["Pendaftar wajib hadir di briefing"], stages: ["Administrasi", "Uji Kompetensi"] }
  ]);

  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? null;

  const rows = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (moduleId === "periode") {
      const filtered = periods.filter((period) => {
        const matchesSearch = !value || [period.name, period.academicYear, period.type].some((entry) => String(entry).toLowerCase().includes(value));
        const matchesStatus = statusFilter === "semua" || period.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
      return filtered;
    }

    if (!value) return definition.rows;
    return definition.rows.filter((row) => Object.values(row).some((cell) => String(cell).toLowerCase().includes(value)));
  }, [moduleId, periods, query, statusFilter, definition]);

  function handleView(periodId: string) {
    setSelectedPeriodId(periodId);
    setIsDetailOpen(true);
    setMenuOpen(false);
  }

  function handleReset() {
    setQuery("");
    setStatusFilter("semua");
    setMenuOpen(false);
    setSelectedPeriodId(null);
    setIsDetailOpen(false);
    setEditingPeriodId(null);
    setIsFormOpen(false);
  }

  function handleExport() {
    const exportRows = moduleId === "periode" ? rows : definition.rows;
    const csvHeader = ["Nama Periode", "Tahun Akademik", "Jenis", "Mulai", "Selesai", "Status", "Pendaftar"].join(",");
    const csvBody = exportRows.map((row) => {
      const record = row as Record<string, unknown>;
      return [record.name ?? "-", record.academicYear ?? "-", record.type ?? "-", record.start ?? "-", record.end ?? "-", record.status ?? "-", record.applicants ?? "-"].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",");
    }).join("\n");

    const blob = new Blob([`${csvHeader}\n${csvBody}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${moduleId === "periode" ? "periode-pendaftaran" : definition.id}-export.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMessage(`Ekspor CSV disiapkan: ${exportRows.length} periode.`);
    setMenuOpen(false);
  }

  function handleStatusChange(periodId: string, nextStatus: "OPEN" | "UPCOMING" | "DRAFT" | "CLOSED" | "ARCHIVED") {
    setPeriods((current) => current.map((period) => period.id === periodId ? { ...period, status: nextStatus } : period));
    setSelectedPeriodId(periodId);
    setIsDetailOpen(true);
  }

  function openCreateForm() {
    setDraftPeriod({
      id: "",
      name: "",
      academicYear: "2026/2027",
      type: "POLA_PEMBIBITAN",
      start: "",
      end: "",
      status: "DRAFT",
      applicants: 0,
      program: "D-III Nautika",
      kuota: 150,
      fee: "Rp 1.250.000",
      documents: ["KTP", "Ijazah", "Surat Keterangan Sehat"],
      requirements: ["Lulus seleksi administrasi", "Melengkapi bukti pembayaran"],
      stages: ["Administrasi", "Tes Potensi", "Wawancara"]
    });
    setEditingPeriodId(null);
    setIsFormOpen(true);
    setMenuOpen(false);
  }

  function openEditForm(periodId: string) {
    const period = periods.find((item) => item.id === periodId);
    if (!period) return;
    setDraftPeriod({ ...period, documents: [...period.documents], requirements: [...period.requirements], stages: [...period.stages] });
    setEditingPeriodId(periodId);
    setIsFormOpen(true);
    setIsDetailOpen(false);
  }

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextId = editingPeriodId ?? `period-${Date.now()}`;
    const periodToSave = {
      ...draftPeriod,
      id: nextId,
      applicants: Number(draftPeriod.applicants ?? 0),
      kuota: Number(draftPeriod.kuota ?? 150),
      documents: Array.isArray(draftPeriod.documents) ? draftPeriod.documents : ["KTP"],
      requirements: Array.isArray(draftPeriod.requirements) ? draftPeriod.requirements : ["Persyaratan belum diisi"],
      stages: Array.isArray(draftPeriod.stages) ? draftPeriod.stages : ["Administrasi"]
    };

    setPeriods((current) => {
      if (editingPeriodId) {
        return current.map((period) => period.id === editingPeriodId ? { ...period, ...periodToSave } : period);
      }
      return [periodToSave, ...current];
    });

    setSelectedPeriodId(nextId);
    setIsFormOpen(false);
    setEditingPeriodId(null);
    setDraftPeriod({
      id: "",
      name: "",
      academicYear: "2026/2027",
      type: "POLA_PEMBIBITAN",
      start: "",
      end: "",
      status: "DRAFT",
      applicants: 0,
      program: "D-III Nautika",
      kuota: 150,
      fee: "Rp 1.250.000",
      documents: ["KTP", "Ijazah", "Surat Keterangan Sehat"],
      requirements: ["Lulus seleksi administrasi", "Melengkapi bukti pembayaran"],
      stages: ["Administrasi", "Tes Potensi", "Wawancara"]
    });
  }

  return <section className="academic-module">
    <header className="academic-heading">
      <div>
        <span className="academic-eyebrow">{definition.eyebrow}</span>
        <h1>{definition.label}</h1>
        <p>{definition.description}</p>
      </div>
      <div className="academic-heading-actions">
        <button className="academic-secondary-button" onClick={handleExport} type="button"><Download size={14} /> Export</button>
        <div style={{ position: "relative" }}>
          <button aria-expanded={menuOpen} className="academic-primary-button" onClick={() => setMenuOpen((open) => !open)} type="button"><CheckCheck size={14} /> Tindakan</button>
          {menuOpen ? <div aria-label="Menu tindakan penerimaan" style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 20, display: "grid", minWidth: 190, gap: 4, padding: 8, background: "#fff", border: "1px solid #dfe7ec", borderRadius: 6, boxShadow: "0 12px 26px rgba(7, 32, 52, .12)" }}>
            <button className="academic-text-action" onClick={openCreateForm} style={{ justifyContent: "flex-start", width: "100%" }} type="button">Tambah Periode</button>
            <button className="academic-text-action" onClick={handleExport} style={{ justifyContent: "flex-start", width: "100%" }} type="button">Export Data</button>
          </div> : null}
        </div>
      </div>
    </header>

    <div className="academic-metrics">
      {definition.metrics.map((metric) => <div key={`${definition.id}-${metric.label}`}>
        <span>{metric.label}</span>
        <strong>{metric.value}</strong>
        <small>{metric.detail}</small>
      </div>)}
    </div>

    <div className="academic-toolbar">
      <label className="academic-search" aria-label="Cari periode">
        <Search size={12} />
        <input aria-label="Cari nama periode atau tahun akademik" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={moduleId === "periode" ? "Cari nama periode atau tahun akademik..." : "Cari nomor pendaftaran, nama, NIK, email, atau program..."} />
      </label>
      <label className="academic-filter" aria-label="Filter status periode">
        <span>{moduleId === "periode" ? "Status" : "Periode"}</span>
        <select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
          <option value="semua">Semua</option>
          <option value="OPEN">Buka</option>
          <option value="UPCOMING">Akan Datang</option>
          <option value="DRAFT">Draf</option>
          <option value="CLOSED">Tutup</option>
          <option value="ARCHIVED">Diarsip</option>
        </select>
      </label>
      <button className="academic-reset-button" onClick={handleReset} type="button"><CircleDashed size={12} /> Reset</button>
    </div>

    {exportMessage ? <p className="academic-feedback" role="status">{exportMessage}</p> : null}

    <div className="academic-table-wrap">
      <table className="academic-table">
        <thead>
          <tr>
            {definition.headers.map((header) => <th key={`${definition.id}-${header}`}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => {
            const record = row as Record<string, unknown>;
            const readValue = (field: string) => {
              const value = record[field];
              return value == null ? "-" : String(value);
            };
            const statusValue = typeof record.status === "string"
              ? record.status
              : typeof record.reStatus === "string"
                ? record.reStatus
                : typeof record.finalStatus === "string"
                  ? record.finalStatus
                  : "PENDING";

            return <tr key={`${definition.id}-${index}`}>
              {definition.headers.map((header) => {
                const key = header.toLowerCase();
                if (header === "Aksi") {
                  const periodId = typeof record.id === "string" ? record.id : `${definition.id}-${index}`;
                  return <td key={`${definition.id}-${header}-${index}`}><div className="academic-row-actions"><button className="academic-text-action" onClick={() => handleView(periodId)} type="button">Lihat</button><button aria-label="Lihat periode" className="academic-small-icon" onClick={() => handleView(periodId)} type="button"><Eye size={12} /></button></div></td>;
                }
                if (header === "Status") return <td key={`${definition.id}-status-${index}`}><span className={statusClass(String(statusValue))}>{statusLabels[String(statusValue)] ?? String(statusValue)}</span></td>;
                if (header === "Status Registrasi") {
                  const value = typeof record.reStatus === "string" ? record.reStatus : "PENDING";
                  return <td key={`${definition.id}-restatus-${index}`}><span className={statusClass(value)}>{statusLabels[value] ?? value}</span></td>;
                }
                if (header === "Status Kelulusan") {
                  const value = typeof record.finalStatus === "string" ? record.finalStatus : "PENDING";
                  return <td key={`${definition.id}-finalstatus-${index}`}><span className={statusClass(value)}>{statusLabels[value] ?? value}</span></td>;
                }
                if (header === "Status Akhir") return <td key={`${definition.id}-akhir-${index}`}><span className={statusClass(String(statusValue))}>{statusLabels[String(statusValue)] ?? String(statusValue)}</span></td>;

                const normalizedKeyMap: Record<string, string> = {
                  "Nama Periode": "name",
                  "Nomor Pendaftaran": "registrationNumber",
                  "Jenis": "type",
                  "Program Studi": "program",
                  "Periode": "period",
                  "Tanggal": "date",
                  "Mulai": "start",
                  "Selesai": "end",
                  "Tahun Akademik": "academicYear",
                  "Pendaftar": "applicants",
                  "Total Skor": "score",
                  "Jadwal": "schedule",
                  "Skor": "score",
                  "Nama": "name",
                  "NIK": "nik",
                  "Jumlah Dokumen": "total",
                  "Valid": "valid",
                  "Perlu Perbaikan": "fix",
                  "Jenis Tagihan": "fee",
                  "Nominal": "amount",
                  "Metode": "method",
                  "Tahap": "stage",
                  "Status Akhir": "status",
                  "Status Registrasi": "reStatus",
                  "Status Kelulusan": "finalStatus"
                };
                const field = normalizedKeyMap[header] ?? key;
                return <td key={`${definition.id}-${key}-${index}`}>{readValue(field)}</td>;
              })}
            </tr>;
          }) : <tr><td colSpan={definition.headers.length}><div className="academic-empty"><GraduationCap size={18} /><strong>Data tidak ditemukan</strong><span>Tidak ada data yang cocok dengan pencarian saat ini.</span></div></td></tr>}
        </tbody>
      </table>
    </div>

    {selectedPeriod && isDetailOpen ? <div className="academic-modal-backdrop" onClick={() => setIsDetailOpen(false)}>
      <div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <header>
          <div>
            <span className="academic-eyebrow">PERIODE PENDAFTARAN</span>
            <h2>{selectedPeriod.name}</h2>
          </div>
          <button aria-label="Tutup detail periode" className="academic-small-icon" onClick={() => setIsDetailOpen(false)} type="button"><X size={18} /></button>
        </header>
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="academic-form-grid">
            <label className="academic-form-field"><span>Nama Periode</span><input readOnly value={selectedPeriod.name} /></label>
            <label className="academic-form-field"><span>Tahun Akademik</span><input readOnly value={selectedPeriod.academicYear} /></label>
            <label className="academic-form-field"><span>Jenis Pendaftaran</span><input readOnly value={selectedPeriod.type} /></label>
            <label className="academic-form-field"><span>Status</span><input readOnly value={statusLabels[selectedPeriod.status] ?? selectedPeriod.status} /></label>
            <label className="academic-form-field"><span>Tanggal Mulai</span><input readOnly value={selectedPeriod.start} /></label>
            <label className="academic-form-field"><span>Tanggal Selesai</span><input readOnly value={selectedPeriod.end} /></label>
            <label className="academic-form-field"><span>Jumlah Pendaftar</span><input readOnly value={selectedPeriod.applicants} /></label>
            <label className="academic-form-field"><span>Kuota</span><input readOnly value={selectedPeriod.kuota} /></label>
            <label className="academic-form-field"><span>Program Studi</span><input readOnly value={selectedPeriod.program} /></label>
            <label className="academic-form-field"><span>Biaya</span><input readOnly value={selectedPeriod.fee} /></label>
            <label className="academic-form-field is-wide"><span>Persyaratan</span><textarea readOnly value={selectedPeriod.requirements.join("\n")} /></label>
            <label className="academic-form-field is-wide"><span>Dokumen</span><textarea readOnly value={selectedPeriod.documents.join(", ")} /></label>
            <label className="academic-form-field is-wide"><span>Tahapan Seleksi</span><textarea readOnly value={selectedPeriod.stages.join(", ")} /></label>
          </div>
          <footer>
            <button className="academic-secondary-button" onClick={() => openEditForm(selectedPeriod.id)} type="button">Edit</button>
            {selectedPeriod.status === "OPEN" ? <button className="academic-primary-button" onClick={() => handleStatusChange(selectedPeriod.id, "CLOSED")} type="button">Tutup Pendaftaran</button> : <button className="academic-primary-button" onClick={() => handleStatusChange(selectedPeriod.id, "OPEN")} type="button">Buka Pendaftaran</button>}
          </footer>
        </form>
      </div>
    </div> : null}

    {isFormOpen ? <div className="academic-modal-backdrop" onClick={() => setIsFormOpen(false)}>
      <div aria-modal="true" className="academic-modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <header>
          <div>
            <span className="academic-eyebrow">PERIODE PENDAFTARAN</span>
            <h2>{editingPeriodId ? "Ubah Periode" : "Tambah Periode"}</h2>
          </div>
          <button aria-label="Tutup formulir periode" className="academic-small-icon" onClick={() => setIsFormOpen(false)} type="button"><X size={18} /></button>
        </header>
        <form onSubmit={saveDraft}>
          <div className="academic-form-grid">
            <label className="academic-form-field"><span>Nama Periode</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, name: event.target.value }))} required value={draftPeriod.name} /></label>
            <label className="academic-form-field"><span>Tahun Akademik</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, academicYear: event.target.value }))} required value={draftPeriod.academicYear} /></label>
            <label className="academic-form-field"><span>Jenis Pendaftaran</span><select onChange={(event) => setDraftPeriod((current) => ({ ...current, type: event.target.value }))} value={draftPeriod.type}>
              <option value="POLA_PEMBIBITAN">POLA_PEMBIBITAN</option>
              <option value="NON_POLA_PEMBIBITAN">NON_POLA_PEMBIBITAN</option>
              <option value="DIKLAT">DIKLAT</option>
            </select></label>
            <label className="academic-form-field"><span>Status</span><select onChange={(event) => setDraftPeriod((current) => ({ ...current, status: event.target.value as "OPEN" | "UPCOMING" | "DRAFT" | "CLOSED" | "ARCHIVED" }))} value={draftPeriod.status}>
              <option value="DRAFT">DRAFT</option>
              <option value="UPCOMING">UPCOMING</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select></label>
            <label className="academic-form-field"><span>Tanggal Mulai</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, start: event.target.value }))} type="date" value={draftPeriod.start || ""} /></label>
            <label className="academic-form-field"><span>Tanggal Selesai</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, end: event.target.value }))} type="date" value={draftPeriod.end || ""} /></label>
            <label className="academic-form-field"><span>Program Studi</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, program: event.target.value }))} value={draftPeriod.program ?? ""} /></label>
            <label className="academic-form-field"><span>Kuota</span><input min={0} onChange={(event) => setDraftPeriod((current) => ({ ...current, kuota: Number(event.target.value) }))} type="number" value={draftPeriod.kuota ?? 0} /></label>
            <label className="academic-form-field"><span>Biaya</span><input onChange={(event) => setDraftPeriod((current) => ({ ...current, fee: event.target.value }))} value={draftPeriod.fee ?? ""} /></label>
            <label className="academic-form-field is-wide"><span>Dokumen</span><textarea onChange={(event) => setDraftPeriod((current) => ({ ...current, documents: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} value={draftPeriod.documents.join(", ")} /></label>
            <label className="academic-form-field is-wide"><span>Persyaratan</span><textarea onChange={(event) => setDraftPeriod((current) => ({ ...current, requirements: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) }))} value={draftPeriod.requirements.join("\n")} /></label>
            <label className="academic-form-field is-wide"><span>Tahapan Seleksi</span><textarea onChange={(event) => setDraftPeriod((current) => ({ ...current, stages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} value={draftPeriod.stages.join(", ")} /></label>
          </div>
          <footer>
            <button className="academic-secondary-button" onClick={() => setIsFormOpen(false)} type="button">Batal</button>
            <button className="academic-primary-button" type="submit">{editingPeriodId ? "Simpan Perubahan" : "Simpan Periode"}</button>
          </footer>
        </form>
      </div>
    </div> : null}

    <div className="academic-footnote">
      <span>Integrasi aktif: formulir publik → data pendaftar → verifikasi dokumen → pembayaran → seleksi → kelulusan → registrasi ulang.</span>
      <span><ShieldCheck size={12} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} /> Sumber data: periode demo lokal, siap dihubungkan ke Prisma + NestJS Admissions API.</span>
    </div>
  </section>;
}
