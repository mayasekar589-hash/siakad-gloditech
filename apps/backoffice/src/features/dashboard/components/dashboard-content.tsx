import {
  Activity, ArrowRight, BellRing, BookOpen, CalendarDays, CheckCircle2, CircleAlert, Clock3,
  CreditCard, Database, FileCheck2, FileUp, GraduationCap, Plus, RefreshCw, ShieldCheck, UsersRound, XCircle
} from "lucide-react";
import { EnrollmentTrendChart, StudentStatusChart, StudyDistributionChart } from "./dashboard-charts";

const kpis = [
  { label: "Total Mahasiswa", value: "1.248", detail: "↑ 12 dari semester lalu", Icon: UsersRound, tone: "orange" },
  { label: "Mahasiswa Aktif", value: "1.102", detail: "88,3% dari total", Icon: GraduationCap, tone: "green" },
  { label: "Total Dosen", value: "86", detail: "↑ 4 dari semester lalu", Icon: UsersRound, tone: "blue" },
  { label: "Program Studi", value: "4", detail: "3 D-III, 1 D-IV", Icon: Database, tone: "blue" },
  { label: "Kelas Aktif", value: "62", detail: "↑ 6 kelas baru", Icon: BookOpen, tone: "gold" },
  { label: "KRS Berjalan", value: "932", detail: "75% dari mahasiswa aktif", Icon: FileCheck2, tone: "blue" }
] as const;

const activityItems = [
  { title: "KRS baru diajukan", detail: "Mahasiswa 202501001 - D-III Nautika", time: "2 jam yang lalu", Icon: FileCheck2, tone: "blue" },
  { title: "Nilai diinput", detail: "Mata Kuliah Navigasi Pelayaran", time: "4 jam yang lalu", Icon: BookOpen, tone: "blue" },
  { title: "Jadwal diperbarui", detail: "Kelas A - D-III Teknika", time: "6 jam yang lalu", Icon: CalendarDays, tone: "gold" },
  { title: "Data mahasiswa diverifikasi", detail: "Berkas pendaftaran 2025", time: "8 jam yang lalu", Icon: CheckCircle2, tone: "green" },
  { title: "Sync data integrasi selesai", detail: "PDDIKTI - 125 data berhasil disinkronkan", time: "10 jam yang lalu", Icon: RefreshCw, tone: "green" }
] as const;

const alerts = [
  { title: "18 dokumen perlu verifikasi", detail: "Berkas pendaftaran mahasiswa baru", time: "2 jam lalu", Icon: CircleAlert, tone: "error" },
  { title: "45 KRS menunggu persetujuan", detail: "Semester Genap 2025/2026", time: "4 jam lalu", Icon: BellRing, tone: "warning" },
  { title: "12 nilai belum lengkap", detail: "Mata kuliah semester berjalan", time: "6 jam lalu", Icon: Clock3, tone: "warning" },
  { title: "5 presensi bermasalah", detail: "Tingkat kehadiran < 75%", time: "8 jam lalu", Icon: XCircle, tone: "error" },
  { title: "3 pembayaran pending", detail: "Tagihan semester Genap 2025/2026", time: "1 hari lalu", Icon: CreditCard, tone: "warning" }
] as const;

const integrations = [
  { name: "PDDIKTI / Neo Feeder", detail: "Sinkronisasi data akademik", status: "NOT CONFIGURED", tone: "not-configured", Icon: Database },
  { name: "Payment Gateway", detail: "Pembayaran tagihan akademik", status: "NOT CONFIGURED", tone: "not-configured", Icon: CreditCard },
  { name: "Email Service", detail: "Notifikasi sistem", status: "NOT CONFIGURED", tone: "not-configured", Icon: BellRing },
  { name: "WhatsApp Gateway", detail: "Notifikasi WhatsApp", status: "NOT CONFIGURED", tone: "not-configured", Icon: BellRing },
  { name: "SSO Institusi", detail: "Single Sign On", status: "NOT CONFIGURED", tone: "not-configured", Icon: ShieldCheck }
] as const;

function PanelHeading({ title, icon, tone = "blue" }: { title: string; icon: React.ReactNode; tone?: string }) {
  return <div className="dashboard-panel-heading"><div className={`panel-heading-icon tone-${tone}`}>{icon}</div><h2>{title}</h2><button aria-label={`Lihat detail ${title}`} className="panel-detail-link" type="button">Lihat Detail <ArrowRight size={12} /></button></div>;
}

function SectionHeading({ title, action = "Lihat Semua" }: { title: string; action?: string }) {
  return <div className="dashboard-list-heading"><h2>{title}</h2><button className="panel-detail-link" type="button">{action} <ArrowRight size={12} /></button></div>;
}

function KpiCards() {
  return <section aria-label="Ringkasan akademik" className="dashboard-kpi-grid">
    {kpis.map(({ label, value, detail, Icon, tone }) => <article className="dashboard-kpi-card" key={label}>
      <span className={`kpi-icon tone-${tone}`}><Icon size={17} aria-hidden="true" /></span>
      <div className="kpi-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </article>)}
  </section>;
}

function StatusRow() {
  return <section aria-label="Status operasional" className="dashboard-status-row">
    <article className="status-summary-card"><span className="status-summary-icon tone-red"><CircleAlert size={19} /></span><div><span>Pending Verifikasi</span><strong>18</strong><small>Dokumen & data mahasiswa</small></div></article>
    <article className="status-summary-card"><span className="status-summary-icon tone-green"><Database size={19} /></span><div><span>Integration Health</span><strong>0 / 5</strong><small>Provider terkonfigurasi</small></div></article>
    <article className="institutional-banner"><div><strong>Sistem Akademik Terpadu</strong><p>Mendukung pengelolaan pendidikan transportasi yang lebih maju, terintegrasi, dan berdaya saing.</p><span>LINGKUNGAN DEMO</span></div><button aria-label="Lihat ringkasan sistem" type="button"><ArrowRight size={16} /></button></article>
  </section>;
}

function AnalyticsRow() {
  return <section aria-label="Analitik akademik" className="dashboard-analytics-grid">
    <article className="dashboard-panel analytics-panel"><PanelHeading icon={<GraduationCap size={14} />} title="Distribusi Mahasiswa per Program Studi" tone="gold" /><StudyDistributionChart /></article>
    <article className="dashboard-panel analytics-panel"><PanelHeading icon={<GraduationCap size={14} />} title="Status Mahasiswa" /><StudentStatusChart /></article>
    <article className="dashboard-panel analytics-panel"><PanelHeading icon={<Activity size={14} />} title="Tren KRS 6 Semester Terakhir" tone="gold" /><EnrollmentTrendChart /></article>
  </section>;
}

function ActivityPanel() {
  return <article className="dashboard-panel lower-panel"><SectionHeading title="Aktivitas Akademik Terbaru" />
    <ul className="dashboard-event-list">{activityItems.map(({ title, detail, time, Icon, tone }) => <li key={title}>
      <span className={`event-icon tone-${tone}`}><Icon size={13} /></span><div className="event-copy"><strong>{title}</strong><small>{detail}</small></div><time>{time}</time>
    </li>)}</ul>
  </article>;
}

function AlertsPanel() {
  return <article className="dashboard-panel lower-panel"><SectionHeading title="Pemberitahuan & Alert" />
    <ul className="dashboard-event-list">{alerts.map(({ title, detail, time, Icon, tone }) => <li key={title}>
      <span className={`event-icon tone-${tone}`}><Icon size={13} /></span><div className="event-copy"><strong>{title}</strong><small>{detail}</small></div><time>{time}</time>
    </li>)}</ul>
  </article>;
}

function IntegrationPanel() {
  return <article className="dashboard-panel lower-panel"><SectionHeading title="Status Integrasi Sistem" />
    <ul className="integration-list">{integrations.map(({ name, detail, status, tone, Icon }) => <li key={name}>
      <span className={`integration-icon tone-${tone}`}><Icon size={13} /></span><div><strong>{name}</strong><small>{detail}</small></div><span className={`integration-status ${tone}`}>{status}</span>
    </li>)}</ul>
    <p className="integration-demo-note">Belum ada provider aktif yang terhubung.</p>
  </article>;
}

function LowerContentRow() {
  return <section aria-label="Aktivitas dan status operasional" className="dashboard-lower-grid">
    <ActivityPanel /><AlertsPanel /><IntegrationPanel />
  </section>;
}

const quickActions = [
  { label: "Tambah Mahasiswa", Icon: UsersRound }, { label: "Tambah Dosen", Icon: Plus },
  { label: "Tambah Mata Kuliah", Icon: BookOpen }, { label: "Buat Kelas", Icon: UsersRound },
  { label: "Buat Jadwal", Icon: CalendarDays }, { label: "Buat Periode Akademik", Icon: CalendarDays },
  { label: "Import Data", Icon: FileUp }
];

function QuickActions() {
  return <section aria-label="Aksi cepat" className="dashboard-panel quick-actions-panel">
    <div className="dashboard-list-heading"><h2><span className="quick-actions-icon"><ZapIcon /></span>Aksi Cepat</h2><button className="panel-detail-link" type="button">Sesuaikan <ArrowRight size={12} /></button></div>
    <div className="quick-actions-row">
      {quickActions.map(({ label, Icon }) => <button className="quick-action-button" key={label} type="button"><Icon size={14} />{label}</button>)}
      <button className="quick-action-button sync-action" type="button"><RefreshCw size={14} />Sinkronisasi Integrasi</button>
    </div>
  </section>;
}

function ZapIcon() {
  return <Activity size={14} aria-hidden="true" />;
}

export function DashboardContent() {
  return <div className="dashboard-content">
    <header className="dashboard-page-heading">
      <div><h1>Selamat datang kembali, Administrator.</h1><p>Pantau operasional akademik, aktivitas pengguna, dan integrasi sistem dalam satu tempat.</p></div>
      <label className="semester-selector"><CalendarDays size={14} /><select aria-label="Pilih semester" defaultValue="Semester Genap 2025/2026"><option>Semester Genap 2025/2026</option><option>Semester Ganjil 2025/2026</option></select><span aria-hidden="true">⌄</span></label>
    </header>
    <KpiCards />
    <StatusRow />
    <AnalyticsRow />
    <LowerContentRow />
    <QuickActions />
    <p className="dashboard-demo-footnote">Mode DEMO · Data dashboard merupakan simulasi untuk Super Admin.</p>
  </div>;
}
