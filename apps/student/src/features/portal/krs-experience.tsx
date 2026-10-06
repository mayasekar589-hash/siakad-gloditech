"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Anchor, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2, Download,
  ChevronDown, Cloud, Dumbbell, FileText, GraduationCap, Layers3, MapPin,
  Printer, Radio, Ship, Shield, X
} from "lucide-react";
import { demoCourses } from "../demo/data/courses";
import { demoStudent } from "../demo/data/student";
import { DocumentInfoGrid, DocumentLayout, DocumentTable } from "../../components/documents/document-layout";
import { printDocument } from "../../lib/print/print-document";
import { authService } from "../auth/service";
import { getStudentAcademicRecord, type StudentAcademicRecord } from "../../lib/api/student-api";

const courseIcons = {
  NAU401: Ship,
  NAU402: Cloud,
  NAU403: Shield,
  NAU404: Radio,
  NAU405: BookOpen,
  NAU406: Dumbbell,
  NAU407: Anchor
} as const;

const courseTones: Record<string, string> = {
  NAU401: "blue",
  NAU402: "green",
  NAU403: "ocean",
  NAU404: "gold",
  NAU405: "rose",
  NAU406: "purple",
  NAU407: "mint"
};

function KrsCourseIcon({ code, size = 17 }: { code: string; size?: number }) {
  const Icon = courseIcons[code as keyof typeof courseIcons] ?? BookOpen;
  return <span className={`krs-course-icon tone-${courseTones[code] ?? "blue"}`}><Icon size={size} /></span>;
}

function KrsBreadcrumb() {
  return <nav className="krs-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">SiAkad Taruna</Link><span>/</span><span>Akademik</span><span>/</span><strong>Kartu Rencana Studi</strong></nav>;
}

function SemesterSelector({ semester, academicYear, term }: { semester: number; academicYear: string; term: string }) {
  return <label className="krs-semester-selector"><CalendarDays size={15} /><select aria-label="Semester"><option>Semester {semester} · {academicYear} · {term}</option></select><ChevronDown size={14} /></label>;
}

function KrsHeader({ semester, academicYear, term }: { semester: number; academicYear: string; term: string }) {
  return <header className="krs-page-header"><div><p>AKADEMIK · SEMESTER {semester} <span>TERHUBUNG API</span></p><h1>Kartu Rencana Studi</h1><small>Rencana studi taruna semester berjalan.</small></div><SemesterSelector academicYear={academicYear} semester={semester} term={term} /></header>;
}

function KrsStatusHero({ status, semester, academicYear }: { status: string; semester: number; academicYear: string }) {
  const statusLabel = status === "APPROVED" ? "Disetujui" : status === "REJECTED" ? "Ditolak" : status === "DRAFT" ? "Draf" : "Menunggu Verifikasi";
  return <section className="krs-status-hero" aria-label="Status KRS">
    <span className="krs-approved-emblem"><Check size={23} /></span>
    <div className="krs-status-copy"><p>KRS SEMESTER {semester}</p><h2>{statusLabel}</h2><span>Rencana studi semester {academicYear} · {statusLabel.toLowerCase()} oleh akademik.</span></div>
    <blockquote>“Rencana studi yang baik adalah langkah awal menuju masa depan yang lebih besar.”</blockquote>
  </section>;
}

function KrsSummary({ courseCount, approvedCount, credits, semester, academicYear, status }: { courseCount: number; approvedCount: number; credits: number; semester: number; academicYear: string; status: string }) {
  const statusLabel = status === "APPROVED" ? "Disetujui" : status === "REJECTED" ? "Ditolak" : status === "DRAFT" ? "Draf" : "Menunggu";
  const items = [
    { value: String(semester), label: "Semester", detail: `Tahun akademik ${academicYear}`, Icon: BookOpen, tone: "blue" },
    { value: statusLabel, label: "Status KRS", detail: "Status registrasi akademik", Icon: CheckCircle2, tone: "green" },
    { value: `${credits} SKS`, label: "Total SKS", detail: `${approvedCount} mata kuliah disetujui`, Icon: Layers3, tone: "ocean" },
    { value: String(courseCount), label: "Mata Kuliah", detail: "Diambil pada semester ini", Icon: GraduationCap, tone: "purple" }
  ];
  return <section className="krs-summary-grid" aria-label="Ringkasan KRS">{items.map(({ value, label, detail, Icon, tone }) => <article className="krs-summary-card" key={label}><span className={`krs-summary-icon tone-${tone}`}><Icon size={19} /></span><div><strong>{value}</strong><span>{label}</span><small>{detail}</small></div></article>)}</section>;
}

function KrsActions() {
  return <div className="krs-actions"><button className="krs-action-button secondary" onClick={() => printDocument("KRS")} type="button"><Printer size={15} />Cetak KRS</button><button aria-label="Buka dialog cetak untuk menyimpan KRS sebagai PDF" className="krs-action-button primary" onClick={() => printDocument("KRS")} title="Pada dialog cetak, pilih Simpan sebagai PDF" type="button"><Download size={15} />Download PDF</button></div>;
}

function KrsCourseRow({ course, index, status, onDetails }: {
  course: (typeof demoCourses)[number];
  index: number;
  status: string;
  onDetails: () => void;
}) {
  return <tr>
    <td>{index + 1}</td>
    <td className="krs-table-code">{course.code}</td>
    <td><div className="krs-course-identity"><KrsCourseIcon code={course.code} size={16} /><span><strong>{course.name}</strong><small>{course.code}</small></span></div></td>
    <td>{course.credits}</td>
    <td>{course.className}</td>
    <td>{course.lecturer}</td>
    <td><span className={`krs-status-badge ${status === "APPROVED" ? "approved" : status === "PENDING" ? "pending" : "rejected"}`}>{status === "APPROVED" ? <Check size={12} /> : null}{status === "APPROVED" ? "Disetujui" : status === "PENDING" ? "Menunggu" : "Ditolak"}</span></td>
    <td><button className="krs-detail-button" onClick={onDetails} type="button">Lihat Detail<ArrowRight size={13} /></button></td>
  </tr>;
}

function KrsCourseMobileCard({ course, status, onDetails }: {
  course: (typeof demoCourses)[number];
  status: string;
  onDetails: () => void;
}) {
  return <article className="krs-mobile-course-card"><header><KrsCourseIcon code={course.code} /><span>{course.code}</span><span className={`krs-status-badge ${status === "APPROVED" ? "approved" : status === "PENDING" ? "pending" : "rejected"}`}>{status === "APPROVED" ? <Check size={12} /> : null}{status === "APPROVED" ? "Disetujui" : status === "PENDING" ? "Menunggu" : "Ditolak"}</span></header><h3>{course.name}</h3><p>{course.credits} SKS · {course.className}</p><small>{course.lecturer}</small><button className="krs-detail-button" onClick={onDetails} type="button">Lihat Detail<ArrowRight size={13} /></button></article>;
}

function KrsCourseDetail({ course, status, onClose }: {
  course: (typeof demoCourses)[number];
  status: string;
  onClose: () => void;
}) {
  return <div className="krs-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-labelledby="krs-detail-title" aria-modal="true" className="krs-course-dialog" role="dialog">
      <header><div><KrsCourseIcon code={course.code} size={18} /><span><small>{course.code}</small><strong id="krs-detail-title">{course.name}</strong></span></div><button aria-label="Tutup detail" onClick={onClose} type="button"><X size={18} /></button></header>
      <dl className="krs-detail-facts"><div><dt>SKS</dt><dd>{course.credits}</dd></div><div><dt>Kelas</dt><dd>{course.className}</dd></div><div><dt>Semester</dt><dd>{demoStudent.semester}</dd></div><div><dt>Status</dt><dd><span className={`krs-status-badge ${status === "APPROVED" ? "approved" : status === "PENDING" ? "pending" : "rejected"}`}>{status === "APPROVED" ? "Disetujui" : status === "PENDING" ? "Menunggu" : "Ditolak"}</span></dd></div><div><dt>Dosen</dt><dd>{course.lecturer}</dd></div><div><dt>Jadwal</dt><dd>{course.day}, {course.startTime}–{course.endTime}</dd></div><div><dt>Ruang</dt><dd>{course.room}</dd></div></dl>
      <div className="krs-detail-links"><Link href={`/pembelajaran/mata-kuliah/${course.code}`}>Lihat Pembelajaran<ArrowRight size={14} /></Link><Link href={`/pembelajaran/mata-kuliah/${course.code}/materi`}><BookOpen size={14} />Materi</Link><Link href={`/pembelajaran/mata-kuliah/${course.code}/tugas`}><FileText size={14} />Tugas</Link><Link href={`/pembelajaran/mata-kuliah/${course.code}/ujian`}><GraduationCap size={14} />Ujian</Link><Link href="/jadwal">Lihat Jadwal<CalendarDays size={14} /></Link></div>
    </section>
  </div>;
}

function KrsInfoSection({ approvedCount, credits, semester, academicYear, className, status }: { approvedCount: number; credits: number; semester: number; academicYear: string; className: string; status: string }) {
  const statusLabel = status === "APPROVED" ? "Disetujui" : status === "REJECTED" ? "Ditolak" : status === "DRAFT" ? "Draf" : "Menunggu";
  const items = [
    { label: "Status KRS", value: statusLabel, Icon: CheckCircle2, tone: "green" },
    { label: "Semester", value: String(semester), Icon: CalendarDays, tone: "blue" },
    { label: "Tahun Akademik", value: academicYear, Icon: CalendarDays, tone: "blue" },
    { label: "Kelas", value: className, Icon: MapPin, tone: "gold" },
    { label: "Total Mata Kuliah", value: String(approvedCount), Icon: BookOpen, tone: "blue" },
    { label: "Total SKS", value: String(credits), Icon: Layers3, tone: "ocean" }
  ];
  return <section className="krs-info-section"><header><h2>Informasi KRS</h2><p>Ringkasan informasi rencana studi semester ini.</p></header><div className="krs-info-grid">{items.map(({ label, value, Icon, tone }) => <article className="krs-info-card" key={label}><span className={`krs-info-icon tone-${tone}`}><Icon size={16} /></span><div><small>{label}</small><strong>{value}</strong></div></article>)}</div></section>;
}

function KrsPrintLayout({ courses, statuses, credits, academicYear, status }: { courses: typeof demoCourses; statuses: Map<string, string>; credits: number; academicYear: string; status: string }) {
  const statusLabel = status === "APPROVED" ? "Disetujui" : status === "REJECTED" ? "Ditolak" : status === "DRAFT" ? "Draf" : "Menunggu";
  return <DocumentLayout className="krs-print-layout" documentNumber={`Semester ${demoStudent.semester} · ${academicYear}`} documentType="KRS" subtitle="Kartu Rencana Studi" title="KARTU RENCANA STUDI">
    <DocumentInfoGrid items={[{ label: "Nama Taruna", value: demoStudent.name }, { label: "NIM", value: demoStudent.nim }, { label: "Program Studi", value: demoStudent.programStudy }, { label: "Kelas", value: demoStudent.className }, { label: "Semester", value: demoStudent.semester }, { label: "Tahun Akademik", value: academicYear }, { label: "Status KRS", value: statusLabel }]} />
    <DocumentTable><thead><tr><th>No</th><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Kelas</th><th>Dosen</th><th>Status</th></tr></thead><tbody>{courses.map((course, index) => <tr key={course.code}><td>{index + 1}</td><td>{course.code}</td><td>{course.name}</td><td>{course.credits}</td><td>{course.className}</td><td>{course.lecturer}</td><td>{statuses.get(course.code) === "APPROVED" ? "Disetujui" : "Menunggu"}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>Total SKS</td><td>{credits}</td><td colSpan={3} /></tr></tfoot></DocumentTable>
  </DocumentLayout>;
}

export function KrsExperience() {
  const [selectedCourse, setSelectedCourse] = useState<(typeof demoCourses)[number] | null>(null);
  const [studentRecord, setStudentRecord] = useState<StudentAcademicRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const nim = authService.getSession()?.user.nim;
    if (!nim) {
      setLoadError("Sesi Taruna tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    void getStudentAcademicRecord(nim).then(setStudentRecord).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Data KRS tidak dapat dimuat.");
    });
  }, []);

  const activeKrs = studentRecord?.krsRecords[0];
  const academicYear = activeKrs?.academicYear ?? "-";
  const semester = studentRecord?.semester ?? 0;
  const className = studentRecord?.className ?? "-";
  const courses = activeKrs?.items.map(({ offering }) => {
    const schedule = offering.schedules[0];
    return {
      code: offering.course.code,
      name: offering.course.name,
      credits: offering.course.credits,
      className: offering.className,
      lecturer: offering.lecturer.name,
      room: offering.room ?? "-",
      day: schedule?.day ?? "-",
      startTime: schedule?.start ?? "-",
      endTime: schedule?.end ?? "-"
    };
  }) ?? [];
  const recordStatus = activeKrs?.status;
  const rowStatus = recordStatus === "APPROVED" ? "APPROVED" : recordStatus === "REJECTED" ? "REJECTED" : "PENDING";
  const statuses = new Map(courses.map((course) => [course.code, rowStatus]));
  const approvedCourses = rowStatus === "APPROVED" ? courses : [];
  const approvedCount = approvedCourses.length;
  const totalCredits = approvedCourses.reduce((total, course) => total + course.credits, 0);

  if (!studentRecord) return <div className="portal-page krs-page">{loadError ? <p className="portal-inline-message" role="alert">{loadError}</p> : <div className="profile-loading-line" aria-label="Memuat KRS" />}</div>;

  return <div className="portal-page krs-page">
    <KrsBreadcrumb />
    <KrsHeader academicYear={academicYear} semester={semester} term={activeKrs?.term ?? "-"} />
    {studentRecord.academicStatus !== "AKTIF" ? <p className="portal-inline-message" role="status">Status akademik {studentRecord.academicStatus === "CUTI" ? "Cuti" : studentRecord.academicStatus}. Aktivitas KRS mengikuti aturan status mahasiswa.</p> : null}
    {activeKrs?.rejectionReason ? <p className="portal-inline-message" role="status">Catatan akademik: {activeKrs.rejectionReason}</p> : null}
    <KrsStatusHero academicYear={academicYear} semester={semester} status={recordStatus ?? "DRAFT"} />
    <KrsSummary academicYear={academicYear} approvedCount={approvedCount} courseCount={courses.length} credits={totalCredits} semester={semester} status={recordStatus ?? "DRAFT"} />
    <section className="krs-table-section"><header className="krs-table-section-header"><div><h2>Daftar Mata Kuliah</h2><p>Mata kuliah yang telah disetujui pada semester berjalan.</p></div><div className="krs-table-tools"><span>{approvedCount} Mata Kuliah · {totalCredits} SKS</span><KrsActions /></div></header>
      <div className="krs-table-scroll"><table className="krs-table"><thead><tr><th>NO</th><th>KODE</th><th>MATA KULIAH</th><th>SKS</th><th>KELAS</th><th>DOSEN</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{courses.length ? courses.map((course, index) => <KrsCourseRow course={course} index={index} key={course.code} onDetails={() => setSelectedCourse(course)} status={statuses.get(course.code) ?? "PENDING"} />) : <tr><td colSpan={8}>Belum ada KRS untuk mahasiswa ini.</td></tr>}</tbody></table></div>
      <div className="krs-mobile-course-list">{courses.map((course) => <KrsCourseMobileCard course={course} key={course.code} onDetails={() => setSelectedCourse(course)} status={statuses.get(course.code) ?? "PENDING"} />)}</div>
    </section>
    <KrsInfoSection academicYear={academicYear} approvedCount={approvedCount} className={className} credits={totalCredits} semester={semester} status={recordStatus ?? "DRAFT"} />
    <KrsPrintLayout academicYear={academicYear} courses={approvedCourses} statuses={statuses} credits={totalCredits} status={recordStatus ?? "DRAFT"} />
    {selectedCourse ? <KrsCourseDetail course={selectedCourse} onClose={() => setSelectedCourse(null)} status={statuses.get(selectedCourse.code) ?? "PENDING"} /> : null}
  </div>;
}