"use client";

import { BookOpen, CalendarCheck2, CalendarDays, HeartPulse, Info, Users, FileText } from "lucide-react";
import { attendanceSummary } from "../demo/data/attendance";
import { AttendanceHistory } from "./attendance-history";

function AttendanceHeader() {
  return (
    <header className="attendance-page-header">
      <div className="attendance-page-breadcrumb">SiAkad Taruna <span>/</span> Akademik <span>/</span> <strong>Presensi</strong></div>
      <div className="attendance-page-headline">
        <div className="attendance-page-kicker"><span>AKADEMIK · SEMESTER 4</span><span className="portal-demo-tag">DATA DEMO</span></div>
        <h1>Presensi</h1>
        <p>Ringkasan kehadiran dari data demonstrasi semester ini.</p>
      </div>
      <button type="button" className="attendance-semester-picker" aria-label="Semester 4 tahun akademik 2026/2027">
        <CalendarDays size={16} /><span>Semester 4 (2026/2027)</span>
      </button>
    </header>
  );
}

function AttendanceDonut() {
  return (
    <div className="attendance-donut" aria-label="Kehadiran 92%">
      <div className="attendance-donut-inner"><strong>92%</strong><span>Hadir</span></div>
    </div>
  );
}

function AttendanceHero() {
  return (
    <section className="attendance-hero" aria-label="Ringkasan kehadiran">
      <div className="attendance-hero-sheen" aria-hidden="true" />
      <div className="attendance-hero-left">
        <div className="attendance-hero-icon-wrap"><CalendarCheck2 size={26} /></div>
        <div className="attendance-hero-copy"><h2>Ringkasan Kehadiran</h2><p>Kehadiran Anda selama semester 4.</p></div>
        <div className="attendance-total-block"><strong>46</strong><span>Total Pertemuan</span></div>
      </div>
      <div className="attendance-hero-center"><AttendanceDonut /></div>
      <div className="attendance-hero-breakdown" aria-label="Detail kehadiran">
        {attendanceSummary.map((item) => (
          <div className="attendance-breakdown-row" key={item.label}>
            <span className={`attendance-dot ${item.label.toLowerCase()}`} aria-hidden="true" />
            <span className="attendance-breakdown-label">{item.label}</span>
            <strong>{item.percent}%</strong>
            <span className="attendance-breakdown-count">{item.count} pertemuan</span>
          </div>
        ))}
      </div>
      <aside className="attendance-hero-quote" aria-label="Motivasi disiplin">
        <div className="attendance-quote-mark" aria-hidden="true"><CalendarCheck2 size={18} /></div>
        <p>“Disiplin hadir hari ini<br />adalah langkah nyata<br />menuju masa depan yang<br />tangguh.”</p>
      </aside>
    </section>
  );
}

function AttendanceInfoBanner() {
  return (
    <div className="attendance-info-banner">
      <span className="attendance-info-icon"><Info size={14} /></span>
      <div><strong>Presensi Anda berada dalam kondisi baik.</strong><span>Pertahankan konsistensi kehadiran untuk mendukung hasil akademik yang optimal.</span></div>
    </div>
  );
}

function AttendanceSummaryCards() {
  const summaryCards = [
    { label: "Total Pertemuan", value: "46", detail: "Semester 4", icon: CalendarDays },
    { label: "Hadir", value: "42", detail: "92% dari total", icon: Users },
    { label: "Izin", value: "2", detail: "4% dari total", icon: FileText },
    { label: "Sakit / Alpa", value: "2", detail: "4% dari total", icon: HeartPulse }
  ];

  return (
    <div className="attendance-summary-grid">
      {summaryCards.map(({ label, value, detail, icon: Icon }) => (
        <article className="attendance-summary-card" key={label}>
          <div className="attendance-summary-icon"><Icon size={18} /></div>
          <div className="attendance-summary-copy"><strong>{value}</strong><span>{label}</span><small>{detail}</small></div>
        </article>
      ))}
    </div>
  );
}

function CourseAttendanceSection() {
  return (
    <section className="attendance-course-section" aria-labelledby="course-attendance-heading">
      <div className="attendance-section-header">
        <div><h2 id="course-attendance-heading">Kehadiran per Mata Kuliah</h2><p>Ringkasan kehadiran berdasarkan mata kuliah semester 4.</p></div>
      </div>
      <div className="attendance-empty-state" aria-live="polite">
        <div className="attendance-empty-icon"><BookOpen size={20} /></div>
        <div><strong>Data kehadiran per mata kuliah belum tersedia</strong><span>Detail kehadiran untuk setiap mata kuliah akan ditampilkan di sini setelah data tersedia.</span></div>
      </div>
    </section>
  );
}

export function AttendanceExperience() {
  return (
    <div className="attendance-page">
      <AttendanceHeader />
      <AttendanceHero />
      <AttendanceInfoBanner />
      <AttendanceSummaryCards />
      <CourseAttendanceSection />
      <AttendanceHistory />
    </div>
  );
}