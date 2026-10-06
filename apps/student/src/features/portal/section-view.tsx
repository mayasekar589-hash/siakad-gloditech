"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { AnnouncementDetail, AnnouncementInbox } from "./announcement-inbox";
import { ProfileExperience } from "./profile-experience";
import { DocumentsExperience } from "./documents/documents-experience";
import { AcademicSchedule } from "./academic-schedule";
import { KrsExperience } from "./krs-experience";
import { GradesExperience } from "./grades-experience";
import { AttendanceExperience } from "./attendance-experience";
import { AcademicCalendarExperience } from "./academic-calendar-experience";
import { BillingOverview } from "./billing/billing-experience";

type DemoSection = "krs" | "jadwal" | "nilai" | "presensi" | "kalender" | "tagihan" | "dokumen" | "pengumuman" | "profil" | "pengaturan";

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) {
  return <header className="portal-page-heading"><div><p className="portal-eyebrow">{eyebrow} <span className="portal-demo-tag">DATA DEMO</span></p><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{action}</header>;
}

function KrsView() {
  return <KrsExperience />;
}

function ScheduleView() {
  return <AcademicSchedule />;
}

function GradesView() {
  return <GradesExperience />;
}

function PresensiView() {
  return <AttendanceExperience />;
}

function CalendarView() {
  return <AcademicCalendarExperience />;
}

function BillingView() {
  return <BillingOverview />;
}

function SettingsView() {
  const [saved, setSaved] = useState(false);
  return <div className="portal-page"><PageHeading eyebrow="Akun" title="Pengaturan" description="Preferensi tampilan demo SiAkad Taruna." /><section className="portal-panel settings-panel"><h2>Preferensi</h2><label><span><strong>Notifikasi akademik</strong><small>Tampilkan pengingat akademik di portal.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Mode demo</strong><small>Data dan autentikasi tidak terhubung ke sistem production.</small></span><input type="checkbox" checked readOnly /></label><button className="portal-button portal-button-primary" type="button" onClick={() => setSaved(true)}>{saved ? <><Check size={16} />Tersimpan</> : "Simpan Preferensi"}</button>{saved ? <p className="portal-save-note" role="status">Preferensi demo tersimpan untuk sesi ini.</p> : null}</section></div>;
}

export function PortalSectionView({ section }: { section: DemoSection }) {
  switch (section) {
    case "krs": return <KrsView />;
    case "jadwal": return <ScheduleView />;
    case "nilai": return <GradesView />;
    case "presensi": return <PresensiView />;
    case "kalender": return <CalendarView />;
    case "tagihan": return <BillingView />;
    case "dokumen": return <DocumentsExperience />;
    case "pengumuman": return <AnnouncementInbox />;
    case "profil": return <ProfileExperience />;
    case "pengaturan": return <SettingsView />;
  }
}

export function AnnouncementDetailView({ slug }: { slug: string }) {
  return <AnnouncementDetail slug={slug} />;
}