"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, FileText, GraduationCap, X,
  Search, SlidersHorizontal
} from "lucide-react";
import { activeLearningCourses, learningAssignments, learningExams, learningQuizzes, type LearningExam, type LearningQuiz } from "./learning-data";

type AssessmentTab = "ALL" | "QUIZ" | "EXAM";
type CalendarKind = "QUIZ" | "EXAM" | "DEADLINE" | "COMPLETED";

interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  courseName: string;
  kind: CalendarKind;
  href: string;
}

const monthLabels = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const portalBase = "/pembelajaran";

function dateFromIso(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function quizTitle(quiz: LearningQuiz) {
  return quiz.title.replace(/^Kuis/, "Quiz");
}

function statusPresentation(quiz: LearningQuiz) {
  if (quiz.status === "IN_PROGRESS") return { label: "Sedang Dikerjakan", action: "Lanjutkan", tone: "in-progress" };
  if (quiz.status === "LATE" || quiz.status === "CLOSED") return { label: "Terlambat", action: "Lihat Detail", tone: "late" };
  if (quiz.status === "NOT_STARTED" || quiz.status === "UPCOMING") return { label: "Belum Dimulai", action: "Mulai Quiz", tone: "not-started" };
  return { label: "Selesai", action: "Lihat Detail", tone: "completed" };
}

function makeCalendarEvents(): CalendarEvent[] {
  return [
    ...learningQuizzes.map((quiz) => ({
      id: quiz.id,
      date: dateFromIso(quiz.closesAt),
      title: quizTitle(quiz),
      courseName: quiz.courseName,
      kind: quiz.status === "COMPLETED" ? "COMPLETED" as const : "QUIZ" as const,
      href: `${portalBase}/quiz/${quiz.id}`
    })),
    ...learningExams.map((exam) => ({
      id: exam.id,
      date: dateFromIso(exam.date),
      title: exam.title,
      courseName: exam.courseName,
      kind: "EXAM" as const,
      href: `${portalBase}/ujian/${exam.id}`
    })),
    ...learningAssignments.map((assignment) => ({
      id: assignment.id,
      date: dateFromIso(assignment.dueAt),
      title: assignment.title,
      courseName: activeLearningCourses.find((course) => course.code === assignment.courseId)?.name ?? assignment.courseId,
      kind: "DEADLINE" as const,
      href: `${portalBase}/tugas/${assignment.id}`
    }))
  ];
}

const calendarEvents = makeCalendarEvents();

function PageHeader({ courseFilter, setCourseFilter }: { courseFilter: string; setCourseFilter: (value: string) => void }) {
  return (
    <header className="assessment-center-header">
      <nav className="assessment-center-breadcrumb" aria-label="Breadcrumb"><span>SiAkad Taruna</span><i>/</i><span>Pembelajaran</span><i>/</i><strong>Ujian &amp; Quiz</strong></nav>
      <div className="assessment-center-title-row">
        <div><p className="portal-eyebrow">Pembelajaran</p><h1>Ujian &amp; Quiz</h1><p>Quiz adalah evaluasi pembelajaran singkat. Ujian merupakan assessment formal terjadwal.</p></div>
        <label className="assessment-course-picker"><BookOpen size={16} /><select aria-label="Filter mata kuliah" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}><option value="ALL">Semua Mata Kuliah</option>{activeLearningCourses.map((course) => <option key={course.code} value={course.code}>{course.name}</option>)}</select><ChevronDown size={15} /></label>
      </div>
    </header>
  );
}

function AssessmentCalendar({ month, selectedDate, onMonthChange, onSelectDate, courseFilter }: {
  month: Date;
  selectedDate: Date;
  onMonthChange: (offset: number) => void;
  onSelectDate: (date: Date) => void;
  courseFilter: string;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const leadingDays = Array.from({ length: firstWeekday }, (_, index) => ({ key: `leading-${index}`, date: null as Date | null }));
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => ({ key: `day-${index + 1}`, date: new Date(month.getFullYear(), month.getMonth(), index + 1) }));
  const trailingCount = (7 - ((leadingDays.length + monthDays.length) % 7)) % 7;
  const trailingDays = Array.from({ length: trailingCount }, (_, index) => ({ key: `trailing-${index}`, date: null as Date | null }));
  const days = [...leadingDays, ...monthDays, ...trailingDays];
  const selectedEvents = calendarEvents.filter((event) => event.date.getTime() === selectedDate.getTime() && (courseFilter === "ALL" || activeLearningCourses.find((course) => course.name === event.courseName)?.code === courseFilter));

  return (
    <section className="assessment-calendar-panel" aria-label="Jadwal assessment">
      <header className="assessment-calendar-title"><CalendarDays size={16} /><h2>Jadwal Assessment</h2></header>
      <div className="assessment-calendar-month"><button type="button" aria-label="Bulan sebelumnya" onClick={() => onMonthChange(-1)}><ChevronLeft size={16} /></button><strong>{monthLabels[month.getMonth()]} {month.getFullYear()}</strong><button type="button" aria-label="Bulan berikutnya" onClick={() => onMonthChange(1)}><ChevronRight size={16} /></button></div>
      <div className="assessment-calendar-grid" role="grid" aria-label={`${monthLabels[month.getMonth()]} ${month.getFullYear()}`}>
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <span className="assessment-calendar-weekday" role="columnheader" key={day}>{day}</span>)}
        {days.map(({ key, date }) => {
          if (!date) return <span className="assessment-calendar-day is-outside" aria-hidden="true" key={key} />;
          const events = calendarEvents.filter((event) => event.date.getTime() === date.getTime() && (courseFilter === "ALL" || activeLearningCourses.find((course) => course.name === event.courseName)?.code === courseFilter));
          const selected = date.getTime() === selectedDate.getTime();
          const markers = [...new Set(events.map((event) => event.kind))].slice(0, 3);
          return <button className={`assessment-calendar-day${selected ? " is-selected" : ""}${events.length ? " has-events" : ""}`} type="button" role="gridcell" aria-selected={selected} aria-label={`${formatDate(date)}${events.length ? `, ${events.length} assessment` : ""}`} title={events.map((event) => `${event.title} · ${event.courseName}`).join("\n") || formatDate(date)} onClick={() => { onSelectDate(date); setDetailsOpen(true); }} key={key}><span>{date.getDate()}</span><i className="assessment-calendar-dots">{markers.map((kind) => <b className={`is-${kind.toLowerCase()}`} key={kind} />)}</i></button>;
        })}
      </div>
      <div className="assessment-calendar-legend"><span><i className="is-quiz" />Quiz</span><span><i className="is-exam" />Ujian</span><span><i className="is-deadline" />Batas Waktu</span><span><i className="is-completed" />Selesai</span></div>
      {detailsOpen ? <div className="assessment-calendar-selection" role="dialog" aria-label={`Assessment ${formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })}`}><header><strong>{formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })}</strong><button type="button" aria-label="Tutup detail tanggal" onClick={() => setDetailsOpen(false)}><X size={14} /></button></header>{selectedEvents.length ? selectedEvents.map((event) => <Link href={event.href} key={event.id}><span className={`assessment-kind-dot is-${event.kind.toLowerCase()}`} />{event.title}<small>{event.courseName}</small></Link>) : <span className="assessment-calendar-no-event">Tidak ada assessment pada tanggal ini.</span>}</div> : null}
    </section>
  );
}

function AssessmentStatistics() {
  const upcomingQuizCount = learningQuizzes.filter((quiz) => quiz.status === "UPCOMING" || quiz.status === "NOT_STARTED" || quiz.status === "IN_PROGRESS").length;
  const upcomingExamCount = learningExams.some((exam) => exam.status === "UPCOMING" || exam.status === "IN_PROGRESS") ? 1 : 0;
  const upcomingCount = upcomingQuizCount + upcomingExamCount;
  const items = [
    { value: learningQuizzes.length, title: "Total Quiz", detail: "Seluruh semester", Icon: FileText, tone: "blue" },
    { value: learningExams.length, title: "Total Ujian", detail: "Seluruh semester", Icon: GraduationCap, tone: "red" },
    { value: upcomingCount, title: "Akan Datang", detail: "Quiz & Ujian", Icon: Clock3, tone: "gold" }
  ];
  return <div className="assessment-statistics">{items.map(({ value, title, detail, Icon, tone }) => <article className="assessment-stat-card" key={title}><span className={`assessment-stat-icon is-${tone}`}><Icon size={21} /></span><div><strong>{value}</strong><b>{title}</b><small>{detail}</small></div></article>)}</div>;
}

function UpcomingAssessment({ exam }: { exam: LearningExam | undefined }) {
  if (!exam) return <section className="assessment-upcoming-panel"><header><Clock3 size={18} /><div><h2>Segera Dikerjakan</h2><p>Assessment yang akan segera dimulai.</p></div></header><p className="assessment-no-upcoming">Belum ada assessment terjadwal.</p></section>;
  const date = dateFromIso(exam.date);
  return <section className="assessment-upcoming-panel"><header><Clock3 size={18} /><div><h2>Segera Dikerjakan</h2><p>Assessment yang akan segera dimulai.</p></div></header><article className="assessment-upcoming-item"><time className="assessment-date-block"><strong>{date.getDate()}</strong><span>{monthLabels[date.getMonth()].slice(0, 3).toLocaleUpperCase("id-ID")}</span><small>{date.getFullYear()}</small></time><span className="assessment-upcoming-icon"><GraduationCap size={22} /></span><div className="assessment-upcoming-copy"><span className="assessment-type-badge is-exam">UJIAN</span><h3>{exam.title}</h3><p>{exam.courseName}</p><small><Clock3 size={12} />{exam.startsAt}–{exam.endsAt}<i />{exam.durationMinutes} menit<i />{exam.questionCount} soal</small></div><div className="assessment-upcoming-actions"><span className="assessment-status-badge is-upcoming">Akan Datang</span><Link href={`${portalBase}/ujian/${exam.id}`}>Lihat Detail <ArrowRight size={13} /></Link></div></article></section>;
}

function QuizList({ quizzes, exams, showExams }: { quizzes: readonly LearningQuiz[]; exams: readonly LearningExam[]; showExams: boolean }) {
  const itemCount = showExams ? exams.length : quizzes.length;
  return <section className="assessment-quiz-panel"><header className="assessment-panel-heading"><div><h2>{showExams ? "Daftar Ujian" : "Daftar Quiz"}</h2><p>{showExams ? "Daftar ujian dari seluruh mata kuliah." : "Daftar quiz dari seluruh mata kuliah."}</p></div><span>{itemCount} {showExams ? "ujian" : "quiz"}</span></header>{itemCount ? <div className="assessment-quiz-list">{showExams ? exams.map((exam) => <article className="assessment-quiz-row assessment-exam-main-row" key={exam.id}><span className="assessment-quiz-icon is-late"><GraduationCap size={20} /></span><div className="assessment-quiz-copy"><strong>{exam.title}</strong><span>{exam.courseName} · {formatDate(dateFromIso(exam.date))} · {exam.startsAt}–{exam.endsAt} · {exam.durationMinutes} menit · {exam.questionCount} soal</span></div><span className="assessment-status-badge is-upcoming">Akan Datang</span><Link className="assessment-row-action" href={`${portalBase}/ujian/${exam.id}`}>Lihat Detail <ArrowRight size={13} /></Link></article>) : quizzes.map((quiz) => {
    const status = statusPresentation(quiz);
    const href = `${portalBase}/quiz/${quiz.id}`;
    return <article className="assessment-quiz-row" key={quiz.id}><span className={`assessment-quiz-icon is-${status.tone}`}><CircleHelp size={20} /></span><div className="assessment-quiz-copy"><strong>{quizTitle(quiz)}</strong><span>{quiz.courseName} · {quiz.questionCount} soal · {quiz.durationMinutes} menit</span></div><span className={`assessment-status-badge is-${status.tone}`}>{status.label}</span><Link className={`assessment-row-action${status.tone === "not-started" || status.tone === "in-progress" ? " is-primary" : ""}`} href={href}>{status.action} <ArrowRight size={13} /></Link></article>;
  })}</div> : <p className="assessment-empty-state">Tidak ada {showExams ? "ujian" : "quiz"} yang cocok dengan filter.</p>}</section>;
}

function ScheduledExams({ exams }: { exams: readonly LearningExam[] }) {
  const previewExams = exams.slice(0, 2);
  return <section className="assessment-side-panel"><header className="assessment-panel-heading"><div><h2>Ujian Terjadwal</h2><p>Daftar ujian yang akan dilaksanakan.</p></div><span>{exams.length}</span></header>{previewExams.length ? <div className="assessment-exam-list">{previewExams.map((exam) => <Link className="assessment-exam-row" href={`${portalBase}/ujian/${exam.id}`} key={exam.id}><time className="assessment-date-block"><strong>{dateFromIso(exam.date).getDate()}</strong><span>{monthLabels[dateFromIso(exam.date).getMonth()].slice(0, 3).toLocaleUpperCase("id-ID")}</span><small>{dateFromIso(exam.date).getFullYear()}</small></time><div><span className="assessment-type-badge is-exam">UJIAN</span><strong>{exam.title}</strong><small>{exam.courseName}</small><span className="assessment-exam-meta"><Clock3 size={11} />{exam.startsAt}–{exam.endsAt}<i />{exam.durationMinutes} menit</span></div><ChevronRight size={16} /></Link>)}</div> : <p className="assessment-empty-state">Tidak ada ujian terjadwal.</p>}</section>;
}

function RecentResults({ quizzes }: { quizzes: readonly LearningQuiz[] }) {
  const recent = quizzes.filter((quiz) => quiz.status === "COMPLETED").slice().sort((left, right) => right.closesAt.localeCompare(left.closesAt)).slice(0, 1);
  return <section className="assessment-side-panel assessment-results-panel"><header className="assessment-panel-heading"><div><h2>Hasil Terbaru</h2><p>Hasil quiz dan ujian yang sudah dikerjakan.</p></div></header>{recent.length ? recent.map((quiz) => <Link className="assessment-result-row" href={`${portalBase}/quiz/${quiz.id}`} key={quiz.id}><time className="assessment-date-block"><strong>{dateFromIso(quiz.closesAt).getDate()}</strong><span>{monthLabels[dateFromIso(quiz.closesAt).getMonth()].slice(0, 3).toLocaleUpperCase("id-ID")}</span><small>{dateFromIso(quiz.closesAt).getFullYear()}</small></time><span><b className="assessment-type-badge is-quiz">QUIZ</b><strong>{quizTitle(quiz)}</strong><small>{quiz.courseName}</small><em><CheckCircle2 size={12} />Menunggu hasil</em></span><ChevronRight size={15} /></Link>) : <p className="assessment-empty-state">Belum ada hasil assessment.</p>}</section>;
}

export function AssessmentCenter() {
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [tab, setTab] = useState<AssessmentTab>("ALL");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [month, setMonth] = useState(() => new Date(2026, 9, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 9, 21));

  const filteredQuizzes = useMemo(() => learningQuizzes.filter((quiz) => {
    const matchesCourse = courseFilter === "ALL" || quiz.courseId === courseFilter;
    const matchesSearch = `${quiz.title} ${quiz.courseName}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"));
    return matchesCourse && matchesSearch;
  }).slice().sort((left, right) => sort === "newest" ? right.opensAt.localeCompare(left.opensAt) : left.opensAt.localeCompare(right.opensAt)), [courseFilter, query, sort]);
  const filteredExams = useMemo(() => learningExams.filter((exam) => {
    const matchesCourse = courseFilter === "ALL" || exam.courseId === courseFilter;
    const matchesSearch = `${exam.title} ${exam.courseName}`.toLocaleLowerCase("id-ID").includes(query.trim().toLocaleLowerCase("id-ID"));
    return matchesCourse && matchesSearch;
  }), [courseFilter, query]);
  const activeCount = tab === "QUIZ" ? filteredQuizzes.length : tab === "EXAM" ? filteredExams.length : filteredQuizzes.length + filteredExams.length;
  const visibleQuizzes = tab === "EXAM" ? [] : filteredQuizzes;
  const upcomingExam = learningExams.filter((exam) => exam.status === "UPCOMING" || exam.status === "IN_PROGRESS").slice().sort((left, right) => left.date.localeCompare(right.date))[0];
  const tabs: Array<{ id: AssessmentTab; label: string; count: number }> = [
    { id: "ALL", label: "Semua", count: learningQuizzes.length + learningExams.length },
    { id: "QUIZ", label: "Quiz", count: learningQuizzes.length },
    { id: "EXAM", label: "Ujian", count: learningExams.length }
  ];

  function changeMonth(amount: number) {
    const nextMonth = new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(nextMonth);
  }

  return <div className="assessment-center-page">
    <PageHeader courseFilter={courseFilter} setCourseFilter={setCourseFilter} />
    <div className="assessment-overview-grid"><div className="assessment-overview-primary"><AssessmentStatistics /><UpcomingAssessment exam={upcomingExam} /></div><AssessmentCalendar month={month} selectedDate={selectedDate} onMonthChange={changeMonth} onSelectDate={setSelectedDate} courseFilter={courseFilter} /></div>
    <div className="assessment-filter-bar"><div className="assessment-filter-tabs" role="tablist" aria-label="Filter jenis assessment">{tabs.map((item) => <button type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)} key={item.id}>{item.label}<span>{item.count}</span></button>)}</div><label className="assessment-search"><Search size={15} /><input aria-label="Cari quiz atau ujian" placeholder="Cari quiz atau ujian..." value={query} onChange={(event) => setQuery(event.target.value)} /></label><label className="assessment-sort"><SlidersHorizontal size={14} /><select aria-label="Urutkan assessment" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Terbaru</option><option value="oldest">Terlama</option></select><ChevronDown size={14} /></label></div>
    <div className="assessment-lower-grid"><QuizList quizzes={visibleQuizzes} exams={filteredExams} showExams={tab === "EXAM"} /><aside className="assessment-lower-aside"><ScheduledExams exams={filteredExams} /><RecentResults quizzes={filteredQuizzes} /></aside></div>
    <span className="assessment-filter-count" aria-live="polite">Menampilkan {activeCount} assessment</span>
  </div>;
}
