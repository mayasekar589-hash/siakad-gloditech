"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle, ArrowRight, BadgeCheck, BookOpen, CalendarDays, CheckCircle2,
  Clock3, FileText, List, Search, SlidersHorizontal, Grid2X2
} from "lucide-react";
import type { LearningActivityStatus } from "./learning-data";
import type { AssignmentItem } from "./learning-interactions";

const base = "/pembelajaran/tugas";
type AssignmentView = "list" | "grid";
type AssignmentFilter = "ALL" | "PENDING" | "SUBMITTED" | "LATE" | "GRADED";

function dueDate(value: string, withTime = true) {
  return new Intl.DateTimeFormat("id-ID", withTime
    ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function statusLabel(status: LearningActivityStatus) {
  if (status === "PENDING") return "Belum dikumpulkan";
  if (status === "IN_PROGRESS") return "Sedang dikerjakan";
  if (status === "SUBMITTED") return "Sudah dikumpulkan";
  if (status === "LATE") return "Terlambat";
  if (status === "GRADED") return "Dinilai";
  return status === "CLOSED" ? "Ditutup" : status === "COMPLETED" ? "Selesai" : "Akan datang";
}

function statusClass(status: LearningActivityStatus) {
  if (status === "PENDING") return "pending";
  if (status === "IN_PROGRESS") return "in-progress";
  if (status === "SUBMITTED") return "submitted";
  if (status === "LATE") return "late";
  if (status === "GRADED") return "graded";
  return "submitted";
}

function statusIcon(status: LearningActivityStatus) {
  if (status === "LATE") return AlertCircle;
  if (status === "SUBMITTED") return CheckCircle2;
  if (status === "GRADED") return BadgeCheck;
  if (status === "IN_PROGRESS") return BookOpen;
  return Clock3;
}

function actionLabel(status: LearningActivityStatus) {
  if (status === "PENDING" || status === "LATE") return "Kerjakan Tugas";
  if (status === "IN_PROGRESS") return "Lanjutkan";
  if (status === "GRADED") return "Lihat Nilai";
  if (status === "SUBMITTED") return "Lihat Pengumpulan";
  return "Lihat Detail";
}

function Deadline({ assignment }: { assignment: AssignmentItem }) {
  const urgent = assignment.status === "LATE" || assignment.status === "PENDING";
  return <span className={`assignment-deadline${assignment.status === "LATE" ? " is-late" : urgent ? " is-urgent" : ""}`}>
    <CalendarDays size={14} /><span><strong>{dueDate(assignment.dueAt)}</strong><small>{assignment.status === "LATE" ? "Perlu perhatian" : assignment.status === "PENDING" ? "Belum dikumpulkan" : "Deadline tugas"}</small></span>
  </span>;
}

function AssignmentStatus({ status }: { status: LearningActivityStatus }) {
  const Icon = statusIcon(status);
  return <span className={`assignment-status status-${statusClass(status)}`}><Icon size={12} />{statusLabel(status)}</span>;
}

function AssignmentRow({ assignment, view }: { assignment: AssignmentItem; view: AssignmentView }) {
  return <article className={`assignment-row is-${view}`}>
    <span className={`assignment-row-icon tone-${statusClass(assignment.status)}`}><FileText size={17} /></span>
    <div className="assignment-row-main"><Link href={`${base}/${assignment.id}`}><strong>{assignment.title}</strong></Link><span>{assignment.description}</span><small><b>{assignment.courseId}</b> · {assignment.courseName} · {assignment.instructor}</small></div>
    <Deadline assignment={assignment} />
    <div className="assignment-row-state"><AssignmentStatus status={assignment.status} /></div>
    <Link className="assignment-row-cta" href={`${base}/${assignment.id}`}>{actionLabel(assignment.status)}<ArrowRight size={14} /></Link>
  </article>;
}

function AssignmentHero() {
  return <section className="assignment-hero" aria-labelledby="assignment-title">
    <div className="assignment-hero-copy"><p>PEMBELAJARAN</p><h1 id="assignment-title">Tugas</h1><span>Pantau tugas, deadline, pengumpulan, dan penilaian dari seluruh mata kuliah aktif.</span></div>
    <blockquote>“Tugas hari ini adalah latihan untuk tanggung jawab yang lebih besar di masa depan.”</blockquote>
  </section>;
}

function AssignmentSummary({ assignments }: { assignments: readonly AssignmentItem[] }) {
  const summary = [
    { label: "Total Tugas", value: assignments.length, Icon: FileText, tone: "blue" },
    { label: "Belum Dikerjakan", value: assignments.filter((item) => item.status === "PENDING").length, Icon: Clock3, tone: "gold" },
    { label: "Terlambat", value: assignments.filter((item) => item.status === "LATE").length, Icon: AlertCircle, tone: "red" },
    { label: "Menunggu Penilaian", value: assignments.filter((item) => item.status === "SUBMITTED").length, Icon: BadgeCheck, tone: "purple" }
  ];
  return <section className="assignment-summary" aria-label="Ringkasan tugas">{summary.map(({ label, value, Icon, tone }) => <article className="assignment-summary-card" key={label}><span className={`summary-icon tone-${tone}`}><Icon size={17} /></span><strong>{value}</strong><small>{label}</small></article>)}</section>;
}

function PriorityAssignmentCard({ assignment }: { assignment: AssignmentItem }) {
  const urgency = assignment.status === "LATE" ? "late" : assignment.status === "PENDING" ? "urgent" : "normal";
  const label = assignment.status === "LATE" ? "Terlambat" : assignment.status === "PENDING" ? "Perlu dikumpulkan" : "Terbaru";
  return <article className={`assignment-priority-card priority-${urgency}`}>
    <span className="assignment-priority-icon"><FileText size={16} /></span>
    <div className="assignment-priority-copy"><small>{label}</small><Link href={`${base}/${assignment.id}`}><strong>{assignment.title}</strong></Link><span>{assignment.description}</span><span className="assignment-priority-course">{assignment.courseId} · {assignment.courseName}</span><time><CalendarDays size={13} />{dueDate(assignment.dueAt)}</time></div>
    <Link className="assignment-priority-open" href={`${base}/${assignment.id}`} aria-label={`Buka ${assignment.title}`}><ArrowRight size={15} /></Link>
  </article>;
}

export function AssignmentExperience({ assignments }: { assignments: readonly AssignmentItem[] }) {
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<AssignmentFilter>("ALL");
  const [sort, setSort] = useState("deadline");
  const [view, setView] = useState<AssignmentView>("list");
  const courses = useMemo(() => [...new Map(assignments.map((item) => [item.courseId, item.courseName])).entries()], [assignments]);
  const visibleAssignments = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id");
    return assignments.filter((item) => {
      const matchesQuery = !normalizedQuery || `${item.title} ${item.description} ${item.courseId} ${item.courseName} ${item.instructor}`.toLocaleLowerCase("id").includes(normalizedQuery);
      return matchesQuery && (courseFilter === "ALL" || item.courseId === courseFilter) && (statusFilter === "ALL" || item.status === statusFilter);
    }).sort((first, second) => sort === "name" ? first.title.localeCompare(second.title, "id") : first.dueAt.localeCompare(second.dueAt));
  }, [assignments, courseFilter, query, sort, statusFilter]);
  const priorityAssignments = [...assignments].sort((first, second) => {
    const firstRank = first.status === "LATE" ? 0 : first.status === "PENDING" ? 1 : 2;
    const secondRank = second.status === "LATE" ? 0 : second.status === "PENDING" ? 1 : 2;
    return firstRank - secondRank || first.dueAt.localeCompare(second.dueAt);
  }).slice(0, 3);

  return <div className="portal-page learning-page assignment-page">
    <nav className="assignment-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">SiAkad Taruna</Link><span>/</span><Link href="/pembelajaran">Pembelajaran</Link><span>/</span><strong>Tugas</strong></nav>
    <AssignmentHero />
    <AssignmentSummary assignments={assignments} />
    <section className="assignment-priority-section"><header className="assignment-section-heading"><div><span className="assignment-alert-mark"><AlertCircle size={16} /></span><div><h2>Perlu Perhatian</h2><p>Tugas dengan deadline terdekat, belum dikumpulkan, atau terlambat.</p></div></div><a href="#all-assignments">Lihat Semua<ArrowRight size={14} /></a></header><div className="assignment-priority-grid">{priorityAssignments.map((assignment) => <PriorityAssignmentCard assignment={assignment} key={assignment.id} />)}</div></section>
    <section className="assignment-toolbar" aria-label="Filter tugas">
      <label className="assignment-search"><Search size={15} /><input onChange={(event) => setQuery(event.target.value)} placeholder="Cari tugas, mata kuliah, atau dosen..." type="search" value={query} /></label>
      <select aria-label="Filter mata kuliah" onChange={(event) => setCourseFilter(event.target.value)} value={courseFilter}><option value="ALL">Semua Mata Kuliah</option>{courses.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>
      <select aria-label="Filter status" onChange={(event) => setStatusFilter(event.target.value as AssignmentFilter)} value={statusFilter}><option value="ALL">Semua Status</option><option value="PENDING">Belum Dikerjakan</option><option value="IN_PROGRESS">Sedang Dikerjakan</option><option value="SUBMITTED">Sudah Dikumpulkan</option><option value="LATE">Terlambat</option><option value="GRADED">Dinilai</option></select>
      <label className="assignment-sort"><SlidersHorizontal size={14} /><span>Urutkan</span><select aria-label="Urutkan tugas" onChange={(event) => setSort(event.target.value)} value={sort}><option value="deadline">Deadline Terdekat</option><option value="name">Nama A-Z</option></select></label>
      <div className="assignment-view-switch" aria-label="Tampilan tugas"><button aria-label="List" aria-pressed={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button"><List size={15} /><span>List</span></button><button aria-label="Grid" aria-pressed={view === "grid"} className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} type="button"><Grid2X2 size={14} /><span>Grid</span></button></div>
    </section>
    <section className="assignment-list-panel" id="all-assignments"><header className="assignment-list-heading"><div><h2>Semua Tugas</h2><p>Daftar tugas dari seluruh mata kuliah semester aktif.</p></div><span>{visibleAssignments.length} tugas</span></header><div className={`assignment-list ${view}`}>{visibleAssignments.map((assignment) => <AssignmentRow assignment={assignment} key={assignment.id} view={view} />)}{visibleAssignments.length === 0 ? <p className="assignment-no-results">Tidak ada tugas yang sesuai dengan pencarian atau filter.</p> : null}</div></section>
  </div>;
}