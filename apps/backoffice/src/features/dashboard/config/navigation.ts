import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, BookMarked, BookOpen, CalendarDays, CheckCheck,
  ClipboardCheck, Clock3, CreditCard, Database, FileBarChart, FileClock, FileText, GraduationCap,
  Group, Landmark, LibraryBig, Link2, ListChecks, Mail, MapPinned, Network, PanelTop, RefreshCw,
  ScrollText, Settings2, Shield, ShieldAlert, ShieldCheck, UserCog, UserRound, UsersRound, WalletCards
} from "lucide-react";

export type NavigationItem = {
  id: string;
  label: string;
  href?: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavigationItem[];
};

export type NavigationSection = {
  id: string;
  label: string;
  items: NavigationItem[];
  icon?: LucideIcon;
};

const item = (id: string, label: string, icon: LucideIcon, permission?: string): NavigationItem => ({ id, label, icon, permission });
const academicItem = (id: string, label: string, icon: LucideIcon, permission: string): NavigationItem => ({ ...item(id, label, icon, permission), href: `/akademik/${id}` });
const financeItem = (id: string, label: string, icon: LucideIcon, permission: string): NavigationItem => ({ ...item(id, label, icon, permission), href: `/keuangan/${id}` });

export const adminNavigation: NavigationSection[] = [
  { id: "overview", label: "Overview", items: [{ ...item("dashboard", "Dashboard", PanelTop, "dashboard.read"), href: "/dashboard" }] },
  { id: "academic", label: "Akademik", icon: GraduationCap, items: [
    academicItem("mahasiswa", "Mahasiswa", UsersRound, "students.read"), academicItem("dosen", "Dosen", UserRound, "lecturers.read"),
    academicItem("program-studi", "Program Studi", GraduationCap, "programs.read"), academicItem("kurikulum", "Kurikulum", LibraryBig, "curriculum.read"),
    academicItem("mata-kuliah", "Mata Kuliah", BookOpen, "courses.read"), academicItem("kelas-perkuliahan", "Kelas Perkuliahan", Group, "classes.read"),
    academicItem("jadwal", "Jadwal", CalendarDays, "schedules.read"), academicItem("krs", "KRS", ClipboardCheck, "enrollments.read"),
    academicItem("nilai", "Nilai", CheckCheck, "grades.read"), academicItem("presensi", "Presensi", Clock3, "attendance.read"),
    academicItem("khs-transkrip", "KHS & Transkrip", BookMarked, "transcripts.read"), academicItem("kelulusan", "Kelulusan", GraduationCap, "graduation.read"),
    academicItem("wisuda", "Wisuda", Landmark, "ceremonies.read"), academicItem("kalender-akademik", "Kalender Akademik", CalendarDays, "calendar.read")
  ] },
  { id: "student-life", label: "Kemahasiswaan", icon: UsersRound, items: [
    { ...item("status-mahasiswa", "Status Mahasiswa", UserRound, "student-status.read"), href: "/kemahasiswaan/status-mahasiswa" },
    { ...item("registrasi-akademik", "Registrasi Akademik", ClipboardCheck, "registrations.read"), href: "/kemahasiswaan/registrasi-akademik" },
    item("cuti", "Cuti", FileClock, "leave.read"), item("mutasi", "Mutasi", Network, "transfers.read"),
    item("aktivitas-mahasiswa", "Aktivitas Mahasiswa", Activity, "student-activity.read"), item("dokumen-mahasiswa", "Dokumen Mahasiswa", FileText, "student-documents.read"),
    item("pengumuman", "Pengumuman", Mail, "announcements.read")
  ] },
  { id: "finance", label: "Keuangan", icon: WalletCards, items: [
    financeItem("tagihan", "Tagihan", WalletCards, "invoices.read"), financeItem("pembayaran", "Pembayaran", CreditCard, "payments.read"),
    financeItem("tarif-akademik", "Tarif Akademik", Landmark, "fees.read"), financeItem("beasiswa", "Beasiswa", GraduationCap, "scholarships.read"),
    financeItem("rekonsiliasi", "Rekonsiliasi", ListChecks, "reconciliation.read")
  ] },
  { id: "admissions", label: "Penerimaan", icon: ClipboardCheck, items: [
    { ...item("periode", "Periode Pendaftaran", CalendarDays, "admissions.periods.read"), href: "/penerimaan/periode" },
    { ...item("pendaftar", "Pendaftar", UsersRound, "applicants.read"), href: "/penerimaan/pendaftar" },
    { ...item("seleksi", "Proses Seleksi", CheckCheck, "selection.read"), href: "/penerimaan/seleksi" },
    { ...item("registrasi-ulang", "Registrasi Ulang", ClipboardCheck, "re-registration.read"), href: "/penerimaan/registrasi-ulang" }
  ] },
  { id: "integration", label: "Integrasi", icon: Network, items: [
    item("integration-hub", "Integration Hub", Network, "integrations.read"), item("provider", "Provider", Link2, "providers.read"),
    item("sinkronisasi", "Sinkronisasi", RefreshCw, "sync.run"), item("mapping-data", "Mapping Data", MapPinned, "mappings.read"),
    item("reference-data", "Reference Data", Database, "reference-data.read"), item("sync-jobs", "Sync Jobs", ListChecks, "sync-jobs.read"),
    item("sync-logs", "Sync Logs", FileClock, "sync-logs.read"), item("conflict-center", "Conflict Center", AlertTriangle, "conflicts.read"),
    item("webhooks", "Webhooks", Link2, "webhooks.read"), item("api-keys", "API Keys", Shield, "api-keys.read")
  ] },
  { id: "reports", label: "Laporan", icon: FileBarChart, items: [
    item("laporan-akademik", "Laporan Akademik", FileBarChart, "reports.academic"), item("laporan-mahasiswa", "Laporan Mahasiswa", FileBarChart, "reports.students"),
    item("laporan-dosen", "Laporan Dosen", FileBarChart, "reports.lecturers"), item("laporan-krs", "Laporan KRS", FileBarChart, "reports.enrollments"),
    item("laporan-nilai", "Laporan Nilai", FileBarChart, "reports.grades"), item("laporan-presensi", "Laporan Presensi", FileBarChart, "reports.attendance"),
    item("laporan-kelulusan", "Laporan Kelulusan", FileBarChart, "reports.graduation"), item("laporan-keuangan", "Laporan Keuangan", FileBarChart, "reports.finance"),
    item("laporan-penerimaan", "Laporan Penerimaan", FileBarChart, "reports.admissions"), item("export-center", "Export Center", FileText, "exports.read")
  ] },
  { id: "system", label: "Sistem", icon: Settings2, items: [
    item("user-management", "User Management", UserCog, "users.manage"), item("role-management", "Role Management", ShieldCheck, "roles.manage"),
    item("permission-management", "Permission Management", Shield, "permissions.manage"), item("organization", "Organization", Landmark, "organization.manage"),
    item("academic-settings", "Academic Settings", Settings2, "settings.academic"), item("system-settings", "System Settings", Settings2, "settings.system"),
    item("notification-settings", "Notification Settings", Mail, "settings.notifications")
  ] },
  { id: "security", label: "Keamanan & Audit", icon: ShieldAlert, items: [
    item("audit-log", "Audit Log", ScrollText, "audit.read"), item("login-activity", "Login Activity", Activity, "login-activity.read"),
    item("security-events", "Security Events", ShieldAlert, "security-events.read"), item("data-change-history", "Data Change History", FileClock, "data-history.read"),
    item("session-management", "Session Management", UserCog, "sessions.manage")
  ] }
];
