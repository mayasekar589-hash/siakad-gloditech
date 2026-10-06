"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Award, ArrowRight, BookOpen, CalendarDays, Check, CheckCircle2,
  Cloud, Dumbbell, GraduationCap, Layers3, MessageSquare, Printer,
  Shield, Ship, TrendingUp
} from "lucide-react";
import { demoCourses } from "../demo/data/courses";
import { cumulativeGpa, previousSemesterSummary, semesterGpa, semesterGrades } from "../demo/data/grades";
import { demoStudent } from "../demo/data/student";
import { DocumentInfoGrid, DocumentLayout, DocumentTable } from "../../components/documents/document-layout";
import { printDocument } from "../../lib/print/print-document";

const courseIcons = {
  NAU401: Ship,
  NAU402: Cloud,
  NAU403: Shield,
  NAU404: MessageSquare,
  NAU405: BookOpen,
  NAU406: Dumbbell,
  NAU407: Ship
} as const;

const tones: Record<string, string> = {
  NAU401: "blue", NAU402: "green", NAU403: "ocean", NAU404: "gold",
  NAU405: "rose", NAU406: "purple", NAU407: "mint"
};

function GradeIcon({ courseCode, size = 16 }: { courseCode: string; size?: number }) {
  const Icon = courseIcons[courseCode as keyof typeof courseIcons] ?? BookOpen;
  return <span className={`grades-course-icon tone-${tones[courseCode] ?? "blue"}`}><Icon size={size} /></span>;
}

function AcademicPerformanceHero({ semester }: { semester: string }) {
  const semesterValue = semester === "4" ? semesterGpa : previousSemesterSummary[Number(semester) - 1]?.gpa ?? semesterGpa;
  return <section className="grades-performance-hero" aria-label="Performa akademik">
    <div className="grades-performance-intro"><span><GraduationCap size={24} /></span><div><h2>Performa Akademik</h2><small>Semester {semester} · 2026/2027</small><blockquote>“Terus tingkatkan prestasi, karena setiap langkah kecil hari ini membawa masa depan yang lebih besar.”</blockquote></div></div>
    <div className="grades-performance-stat"><span><BookOpen size={17} /></span><div><small>IP Semester</small><strong>{semesterValue.toFixed(2)}</strong><em>Semester {semester}</em></div></div>
    <div className="grades-performance-stat"><span><TrendingUp size={17} /></span><div><small>IPK Kumulatif</small><strong>{cumulativeGpa.toFixed(2)}</strong><em>Kumulatif</em></div></div>
  </section>;
}

function GradeSummaryCards({ semester }: { semester: string }) {
  const semesterValue = semester === "4" ? semesterGpa : previousSemesterSummary[Number(semester) - 1]?.gpa ?? semesterGpa;
  const items = [
    { value: semesterValue.toFixed(2), label: "IP Semester", detail: `Semester ${semester}`, Icon: TrendingUp, tone: "green" },
    { value: cumulativeGpa.toFixed(2), label: "IPK Kumulatif", detail: "Seluruh semester", Icon: Award, tone: "gold" },
    { value: "20 SKS", label: "Total SKS", detail: "Semester berjalan", Icon: Layers3, tone: "blue" },
    { value: "7", label: "Mata Kuliah", detail: "Semester berjalan", Icon: GraduationCap, tone: "purple" }
  ];
  return <section className="grades-summary-grid" aria-label="Ringkasan nilai">{items.map(({ value, label, detail, Icon, tone }) => <article className="grades-summary-card" key={label}><span className={`grades-summary-icon tone-${tone}`}><Icon size={18} /></span><div><strong>{value}</strong><small>{label}</small><em>{detail}</em></div></article>)}</section>;
}

function GradeBadge({ grade }: { grade: string }) {
  const tone = grade.startsWith("A") ? "green" : grade.startsWith("B") ? "blue" : grade.startsWith("C") ? "gold" : "red";
  return <span className={`grade-letter grade-${tone}`}>{grade}</span>;
}

function GradeTable({ onDetails }: { onDetails: (courseCode: string) => void }) {
  return <>
    <div className="grades-table-scroll"><table className="grades-table"><thead><tr><th>NO</th><th>KODE</th><th>MATA KULIAH</th><th>SKS</th><th>NILAI</th><th>BOBOT</th><th>STATUS</th><th>AKSI</th></tr></thead><tbody>{demoCourses.map((course, index) => {const grade = semesterGrades.find((item) => item.courseCode === course.code);if (!grade) return null;return <tr key={course.code}><td>{index + 1}</td><td className="grades-code">{course.code}</td><td><div className="grades-course-identity"><GradeIcon courseCode={course.code} /><span><strong>{course.name}</strong><small>{course.code}</small></span></div></td><td>{course.credits}</td><td><GradeBadge grade={grade.grade} /></td><td>{grade.weight.toFixed(2)}</td><td><span className="grades-pass-badge"><Check size={12} />{grade.status}</span></td><td><button className="grades-detail-button" onClick={() => onDetails(course.code)} type="button">Lihat Detail<ArrowRight size={13} /></button></td></tr>;})}</tbody></table></div>
    <div className="grades-mobile-list">{demoCourses.map((course) => {const grade = semesterGrades.find((item) => item.courseCode === course.code);if (!grade) return null;return <article className="grades-mobile-card" key={course.code}><div className="grades-mobile-card-heading"><GradeIcon courseCode={course.code} /><div><small>{course.code}</small><strong>{course.name}</strong></div><GradeBadge grade={grade.grade} /></div><div className="grades-mobile-card-meta"><span>{course.credits} SKS</span><span>Bobot {grade.weight.toFixed(2)}</span><span className="grades-pass-badge"><Check size={12} />{grade.status}</span></div><button className="grades-detail-button" onClick={() => onDetails(course.code)} type="button">Lihat Detail<ArrowRight size={13} /></button></article>;})}</div>
  </>;
}

function SemesterGradeSection({ semester, onDetails }: { semester: string; onDetails: (courseCode: string) => void }) {
  return <section className="grades-section-card"><header className="grades-section-header"><div><h2>Hasil Studi Semester {semester}</h2><p>Rekap hasil studi pada semester {semester} tahun akademik 2026/2027.</p></div><div className="grades-inline-summary"><span><Layers3 size={14} /><strong>20 SKS</strong><small>Total SKS</small></span><span><GraduationCap size={14} /><strong>7</strong><small>Mata Kuliah</small></span><span><TrendingUp size={14} /><strong>{semester === "4" ? semesterGpa.toFixed(2) : (previousSemesterSummary[Number(semester) - 1]?.gpa ?? semesterGpa).toFixed(2)}</strong><small>IP Semester</small></span><span><CheckCircle2 size={14} /><strong>Selesai</strong><small>Status Semester</small></span><button className="grades-print-button" onClick={() => printDocument("KHS")} type="button"><Printer size={14} />Cetak KHS</button></div></header><GradeTable onDetails={onDetails} /></section>;
}

function AcademicJourney() {
  return <section className="grades-bottom-card academic-journey-card"><header><h2>Perjalanan Akademik</h2><p>Tren IP Semester dari awal hingga saat ini.</p></header><div className="academic-journey-track">{previousSemesterSummary.map((item, index) => <div className={`academic-journey-step${index === previousSemesterSummary.length - 1 ? " is-current" : ""}`} key={item.semester}><span className="academic-journey-node" /><small>Semester {item.semester}</small><strong>{item.gpa.toFixed(2)}</strong></div>)}</div></section>;
}

function GpaTrend() {
  const values = previousSemesterSummary.map((item) => item.gpa);
  const chartMin = 3.4;
  const chartMax = 3.8;
  const plotTop = 28;
  const plotBottom = 102;
  const points = values.map((value, index) => ({
    x: 42 + index * 100,
    y: plotBottom - ((value - chartMin) / (chartMax - chartMin)) * (plotBottom - plotTop)
  }));
  const linePath = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ");
  const yTicks = [3.8, 3.6, 3.4];
  return <section className="grades-bottom-card gpa-trend-card"><header><h2>Tren IP Semester</h2><p>Grafik perkembangan IP setiap semester.</p></header><div className="gpa-chart-wrap"><div className="gpa-y-axis">{yTicks.map((tick) => <span key={tick}>{tick.toFixed(1)}</span>)}</div><svg aria-label="Grafik IP Semester: 3.52, 3.61, 3.71, 3.72" className="gpa-chart" preserveAspectRatio="none" role="img" viewBox="0 0 360 130"><line x1="28" x2="350" y1="28" y2="28" /><line x1="28" x2="350" y1="65" y2="65" /><line x1="28" x2="350" y1="102" y2="102" /><path d={linePath} fill="none" stroke="#0b78b8" strokeWidth="2.5" />{points.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 5} fill={index === points.length - 1 ? "#d9a62e" : "#0b5a93"} /><text fill={index === points.length - 1 ? "#9e7018" : "#526f83"} fontSize="10" fontWeight="700" textAnchor="middle" x={point.x} y={point.y - 11}>{values[index].toFixed(2)}</text><text fill="#71859a" fontSize="9" textAnchor="middle" x={point.x} y="125">Semester {index + 1}</text></g>)}</svg></div></section>;
}

function TranscriptView() {
  return <section className="grades-section-card transcript-grade-section"><header className="transcript-summary"><div><h2>Transkrip Nilai</h2><p>Rekap nilai yang tersedia pada data akademik taruna.</p></div><div><span><strong>{cumulativeGpa.toFixed(2)}</strong><small>IPK Kumulatif</small></span><span><strong>72</strong><small>Total SKS</small></span><span><strong>Aktif</strong><small>Status Akademik</small></span><button className="grades-print-button" onClick={() => printDocument("TRANSKRIP")} type="button"><Printer size={14} />Cetak Transkrip</button></div></header><div className="grades-table-scroll"><table className="grades-table transcript-table"><thead><tr><th>KODE</th><th>MATA KULIAH</th><th>SKS</th><th>NILAI</th><th>BOBOT</th><th>SEMESTER</th><th>STATUS</th></tr></thead><tbody>{demoCourses.map((course) => {const grade = semesterGrades.find((item) => item.courseCode === course.code);if (!grade) return null;return <tr key={course.code}><td className="grades-code">{course.code}</td><td>{course.name}</td><td>{course.credits}</td><td><GradeBadge grade={grade.grade} /></td><td>{grade.weight.toFixed(2)}</td><td>Semester 4</td><td><span className="grades-pass-badge"><Check size={12} />{grade.status}</span></td></tr>;})}</tbody></table></div><p className="transcript-data-note">Transkrip hanya menampilkan nilai yang tersedia pada data demonstrasi semester ini.</p></section>;
}

function GradesPrintLayout({ semester, transcript }: { semester: string; transcript: boolean }) {
  return <DocumentLayout className="grades-print-layout" documentNumber={transcript ? "Transkrip akademik" : `Semester ${semester} · 2026/2027`} documentType={transcript ? "TRANSKRIP" : "KHS"} subtitle={transcript ? "Rekap nilai akademik taruna" : "Kartu Hasil Studi"} title={transcript ? "TRANSKRIP NILAI" : "KARTU HASIL STUDI"}><DocumentInfoGrid items={[{ label: "Nama", value: demoStudent.name }, { label: "NIM", value: demoStudent.nim }, { label: "Program Studi", value: demoStudent.programStudy }, { label: "Kelas", value: demoStudent.className }, { label: "IP Semester", value: semester === "4" ? semesterGpa.toFixed(2) : (previousSemesterSummary[Number(semester) - 1]?.gpa ?? semesterGpa).toFixed(2) }, { label: "IPK", value: cumulativeGpa.toFixed(2) }, { label: "Total SKS", value: "20 SKS" }]} /><DocumentTable><thead><tr><th>No</th><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Nilai</th><th>Bobot</th><th>Status</th></tr></thead><tbody>{demoCourses.map((course, index) => {const grade = semesterGrades.find((item) => item.courseCode === course.code);if (!grade)return null;return <tr key={course.code}><td>{index+1}</td><td>{course.code}</td><td>{course.name}</td><td>{course.credits}</td><td>{grade.grade}</td><td>{grade.weight.toFixed(2)}</td><td>{grade.status}</td></tr>;})}</tbody></DocumentTable></DocumentLayout>;
}

function GradeDetailDialog({ courseCode, onClose }: { courseCode: string; onClose: () => void }) {
  const course = demoCourses.find((item) => item.code === courseCode);
  const grade = semesterGrades.find((item) => item.courseCode === courseCode);
  if (!course || !grade) return null;
  return <div className="grades-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section aria-modal="true" className="grades-detail-dialog" role="dialog"><header><div><GradeIcon courseCode={course.code} /><span><small>{course.code} · SEMESTER 4</small><strong>{course.name}</strong></span></div><button aria-label="Tutup detail" onClick={onClose} type="button">×</button></header><dl><div><dt>SKS</dt><dd>{course.credits}</dd></div><div><dt>Nilai</dt><dd><GradeBadge grade={grade.grade} /></dd></div><div><dt>Bobot</dt><dd>{grade.weight.toFixed(2)}</dd></div><div><dt>Status</dt><dd><span className="grades-pass-badge"><Check size={12} />{grade.status}</span></dd></div><div><dt>Dosen</dt><dd>{course.lecturer}</dd></div><div><dt>Kelas</dt><dd>{course.className}</dd></div><div><dt>Jadwal</dt><dd>{course.day}, {course.startTime}–{course.endTime}</dd></div><div><dt>Ruang</dt><dd>{course.room}</dd></div></dl><div className="grades-dialog-actions"><Link href={`/pembelajaran/mata-kuliah/${course.code}`}>Lihat Pembelajaran<ArrowRight size={14} /></Link><Link href="/jadwal">Lihat Jadwal<CalendarDays size={14} /></Link></div></section></div>;
}

export function GradesExperience() {
  const [tab, setTab] = useState<"grades" | "transcript">("grades");
  const [semester, setSemester] = useState("4");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null);
  return <div className="portal-page grades-page"><nav className="grades-breadcrumb" aria-label="Breadcrumb"><span>SiAkad Taruna</span><span>/</span><span>Akademik</span><span>/</span><strong>Nilai & KHS</strong></nav><header className="grades-page-heading"><div><p>AKADEMIK <span>DATA DEMO</span></p><h1>Nilai & KHS</h1><small>Hasil studi dan ringkasan capaian akademik Anda.</small></div><label className="grades-semester-select"><CalendarDays size={15} /><select aria-label="Pilih semester" onChange={(event) => setSemester(event.target.value)} value={semester}>{[1,2,3,4].map((value)=><option key={value} value={value}>Semester {value} (2026/2027)</option>)}</select><span aria-hidden="true">⌄</span></label></header><AcademicPerformanceHero semester={semester} /><GradeSummaryCards semester={semester} /><nav className="grades-tabs" aria-label="Nilai dan transkrip"><button aria-current={tab === "grades" ? "page" : undefined} className={tab === "grades" ? "is-active" : ""} onClick={() => setTab("grades")} type="button">Nilai Semester</button><button aria-current={tab === "transcript" ? "page" : undefined} className={tab === "transcript" ? "is-active" : ""} onClick={() => setTab("transcript")} type="button">Transkrip</button></nav>{tab === "grades" ? <><SemesterGradeSection onDetails={setSelectedCourseCode} semester={semester} /><div className="grades-bottom-grid"><AcademicJourney /><GpaTrend /></div></> : <TranscriptView />}<GradesPrintLayout semester={semester} transcript={tab === "transcript"} />{selectedCourseCode ? <GradeDetailDialog courseCode={selectedCourseCode} onClose={() => setSelectedCourseCode(null)} /> : null}</div>;
}