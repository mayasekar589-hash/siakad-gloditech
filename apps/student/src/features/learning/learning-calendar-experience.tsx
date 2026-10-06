"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, FileText, GraduationCap, X
} from "lucide-react";
import { weeklySchedule } from "../demo/data/schedule";
import {
  activeLearningCourses, learningAssignments, learningExams, learningMaterials,
  learningQuizzes, type LearningAssignment, type LearningExam, type LearningQuiz
} from "./learning-data";

type LearningEventType = "KULIAH" | "QUIZ" | "TUGAS" | "UJIAN" | "DEADLINE";
type CalendarFilter = "SEMUA" | LearningEventType;

interface LearningCalendarEvent {
  id: string;
  type: LearningEventType;
  title: string;
  courseId?: string;
  courseName?: string;
  startAt: string;
  endAt?: string;
  location?: string;
  description?: string;
  sourceRoute: string;
  isComplete?: boolean;
}

const base = "/pembelajaran";
const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const weekdayShort = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
const weekdayLong = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const weekdayIndex: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 0 };
const typeLabels: Record<LearningEventType, string> = { KULIAH: "Kuliah", QUIZ: "Quiz", TUGAS: "Tugas", UJIAN: "Ujian", DEADLINE: "Deadline" };
const filterOptions: Array<{ value: CalendarFilter; label: string }> = [
  { value: "SEMUA", label: "Semua" }, { value: "KULIAH", label: "Kuliah" },
  { value: "QUIZ", label: "Quiz" }, { value: "TUGAS", label: "Tugas" },
  { value: "UJIAN", label: "Ujian" }, { value: "DEADLINE", label: "Deadline" }
];

function toLocalDateTime(date: Date, time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
  const offset = -localDate.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offset);
  return `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, "0")}:${String(absoluteOffset % 60).padStart(2, "0")}`;
}

function fromDateTime(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}

function startOfWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

function mapScheduleToCalendarEvents(month: Date): LearningCalendarEvent[] {
  const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return weeklySchedule.flatMap((course) => {
    const day = weekdayIndex[course.day];
    if (day === undefined) return [];
    return Array.from({ length: totalDays }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))
      .filter((date) => date.getDay() === day)
      .map((date) => ({
        id: `${course.code}-${date.toISOString().slice(0, 10)}`,
        type: "KULIAH" as const,
        title: course.name,
        courseId: course.code,
        courseName: course.name,
        startAt: toLocalDateTime(date, course.startTime),
        endAt: toLocalDateTime(date, course.endTime),
        location: course.room,
        description: course.lecturer,
        sourceRoute: "/jadwal"
      }));
  });
}

function mapAssignmentToCalendarEvent(assignment: LearningAssignment): LearningCalendarEvent {
  return {
    id: assignment.id,
    type: "TUGAS",
    title: assignment.title,
    courseId: assignment.courseId,
    courseName: activeLearningCourses.find((course) => course.code === assignment.courseId)?.name,
    startAt: assignment.dueAt,
    endAt: assignment.dueAt,
    description: assignment.description,
    sourceRoute: `${base}/tugas/${assignment.id}`,
    isComplete: assignment.status === "SUBMITTED" || assignment.status === "GRADED"
  };
}

function mapQuizToCalendarEvent(quiz: LearningQuiz): LearningCalendarEvent {
  return {
    id: quiz.id,
    type: "QUIZ",
    title: quiz.title.replace(/^Kuis/, "Quiz"),
    courseId: quiz.courseId,
    courseName: quiz.courseName,
    startAt: quiz.opensAt,
    endAt: quiz.closesAt,
    description: `${quiz.questionCount} soal · ${quiz.durationMinutes} menit`,
    sourceRoute: `${base}/quiz/${quiz.id}`,
    isComplete: quiz.status === "COMPLETED"
  };
}

function mapExamToCalendarEvent(exam: LearningExam): LearningCalendarEvent {
  return {
    id: exam.id,
    type: "UJIAN",
    title: exam.title,
    courseId: exam.courseId,
    courseName: exam.courseName,
    startAt: `${exam.date}T${exam.startsAt}:00+07:00`,
    endAt: `${exam.date}T${exam.endsAt}:00+07:00`,
    description: `${exam.questionCount} soal · ${exam.durationMinutes} menit`,
    sourceRoute: `${base}/ujian/${exam.id}`,
    isComplete: exam.status === "COMPLETED" || exam.status === "CLOSED"
  };
}

function makeLearningCalendarEvents(month: Date): LearningCalendarEvent[] {
  return [
    ...mapScheduleToCalendarEvents(month),
    ...learningQuizzes.map(mapQuizToCalendarEvent),
    ...learningAssignments.map(mapAssignmentToCalendarEvent),
    ...learningExams.map(mapExamToCalendarEvent)
  ];
}

function eventDate(event: LearningCalendarEvent) {
  return fromDateTime(event.startAt);
}

function eventColorClass(type: LearningEventType) {
  return `is-${type.toLowerCase()}`;
}

function eventIsComplete(event: LearningCalendarEvent) {
  return event.isComplete === true;
}

function eventIcon(type: LearningEventType) {
  if (type === "KULIAH") return CalendarDays;
  if (type === "QUIZ") return CircleHelp;
  if (type === "TUGAS" || type === "DEADLINE") return FileText;
  return GraduationCap;
}

function EventLink({ event, compact = false }: { event: LearningCalendarEvent; compact?: boolean }) {
  const Icon = eventIcon(event.type);
  const startsAt = new Date(event.startAt);
  const endsAt = event.endAt ? new Date(event.endAt) : null;
  return (
    <Link className={`learning-calendar-event-link${compact ? " is-compact" : ""}`} href={event.sourceRoute}>
      <span className={`learning-calendar-event-icon ${eventColorClass(event.type)}`}><Icon size={compact ? 14 : 16} /></span>
      <span className="learning-calendar-event-copy">
        <span className={`learning-calendar-event-type ${eventColorClass(event.type)}`}>{typeLabels[event.type]}</span>
        <strong>{event.title}</strong>
        {event.courseName ? <small>{event.courseName}</small> : null}
        {event.type === "KULIAH" ? <small className="learning-calendar-event-meta"><Clock3 size={11} />{formatDate(startsAt, { hour: "2-digit", minute: "2-digit" })}{endsAt ? `–${formatDate(endsAt, { hour: "2-digit", minute: "2-digit" })}` : ""}{event.location ? ` · ${event.location}` : ""}</small> : null}
        {event.type !== "KULIAH" && event.type !== "TUGAS" && event.description ? <small>{event.description}</small> : null}
        {event.type === "TUGAS" ? <small className="learning-calendar-event-meta"><Clock3 size={11} />Deadline {formatDate(startsAt, { hour: "2-digit", minute: "2-digit" })}</small> : null}
      </span>
      <ChevronRight size={15} />
    </Link>
  );
}

function CalendarMonth({ month, selectedDate, events, filter, courseFilter, onMonthChange, onSelectDate, onFilterChange, onToday }: {
  month: Date;
  selectedDate: Date;
  events: LearningCalendarEvent[];
  filter: CalendarFilter;
  courseFilter: string;
  onMonthChange: (amount: number) => void;
  onSelectDate: (date: Date) => void;
  onFilterChange: (filter: CalendarFilter) => void;
  onToday: () => void;
}) {
  const firstOffset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const numberOfDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstOffset + numberOfDays) / 7) * 7 }, (_, index) => {
    const day = index - firstOffset + 1;
    return day > 0 && day <= numberOfDays ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const visibleEvents = events.filter((event) => filter === "SEMUA" || event.type === filter)
    .filter((event) => courseFilter === "ALL" || event.courseId === courseFilter);
  const selectedEvents = visibleEvents.filter((event) => eventDate(event).toDateString() === selectedDate.toDateString());
  const today = new Date();

  return (
    <section className="learning-calendar-month-panel" aria-label="Kalender pembelajaran bulanan">
      <header className="learning-calendar-month-heading">
        <div className="learning-calendar-month-navigation">
          <button type="button" aria-label="Bulan sebelumnya" onClick={() => onMonthChange(-1)}><ChevronLeft size={18} /></button>
          <h2>{monthNames[month.getMonth()]} {month.getFullYear()}</h2>
          <button type="button" aria-label="Bulan berikutnya" onClick={() => onMonthChange(1)}><ChevronRight size={18} /></button>
        </div>
        <button className="learning-calendar-today" type="button" onClick={onToday}>Hari ini</button>
      </header>
      <div className="learning-calendar-controls">
        <div className="learning-calendar-filter-chips" aria-label="Filter jenis aktivitas">
          {filterOptions.map((option) => <button type="button" aria-pressed={filter === option.value} className={filter === option.value ? "is-active" : ""} onClick={() => onFilterChange(option.value)} key={option.value}>{option.label}</button>)}
        </div>
        <label className="learning-calendar-kind-select"><span className="sr-only">Filter aktivitas</span><select aria-label="Filter jenis aktivitas" value={filter} onChange={(event) => onFilterChange(event.target.value as CalendarFilter)}>{filterOptions.map((option) => <option value={option.value} key={option.value}>{option.label === "Semua" ? "Semua Aktivitas" : option.label}</option>)}</select><ChevronDown size={14} /></label>
      </div>
      <div className="learning-calendar-grid-month" role="grid" aria-label={`${monthNames[month.getMonth()]} ${month.getFullYear()}`}>
        {weekdayShort.map((day) => <span className="learning-calendar-weekday" role="columnheader" key={day}>{day}</span>)}
        {cells.map((date, index) => {
          if (!date) return <span className="learning-calendar-day is-outside" aria-hidden="true" key={`blank-${index}`} />;
          const dayEvents = visibleEvents.filter((event) => eventDate(event).toDateString() === date.toDateString());
          const selected = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === today.toDateString();
          return <button type="button" role="gridcell" aria-selected={selected} aria-label={`${formatDate(date)}${dayEvents.length ? `, ${dayEvents.length} aktivitas` : ""}`} className={`learning-calendar-day${selected ? " is-selected" : ""}${isToday ? " is-today" : ""}${dayEvents.length ? " has-events" : ""}`} onClick={() => onSelectDate(date)} key={date.toISOString()}>
            <span className="learning-calendar-day-number">{date.getDate()}</span>
            <span className="learning-calendar-day-markers">{[...new Set(dayEvents.map((event) => event.type))].slice(0, 3).map((type) => <i className={eventColorClass(type)} key={type} />)}</span>
            {dayEvents.length ? <span className="learning-calendar-day-tooltip">{dayEvents.length} aktivitas</span> : null}
          </button>;
        })}
      </div>
      <div className="learning-calendar-legend">{filterOptions.filter((option) => option.value !== "SEMUA").map((option) => <span key={option.value}><i className={eventColorClass(option.value as LearningEventType)} />{option.label}</span>)}</div>
      {selectedEvents.length ? <div className="learning-calendar-event-popover" role="dialog" aria-label={`Agenda ${formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })}`}>
        <header><strong>{formatDate(selectedDate, { day: "numeric", month: "long", year: "numeric" })}</strong><button type="button" aria-label="Tutup detail tanggal" onClick={() => onSelectDate(new Date(0))}><X size={14} /></button></header>
        {selectedEvents.map((event) => <EventLink compact key={event.id} event={event} />)}
      </div> : null}
    </section>
  );
}

function LearningWeeklySchedule({ weekStart, courseFilter }: { weekStart: Date; courseFilter: string }) {
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index);
    const courses = weeklySchedule.filter((course) => weekdayIndex[course.day] === date.getDay() && (courseFilter === "ALL" || course.code === courseFilter)).sort((left, right) => left.startTime.localeCompare(right.startTime));
    return { date, courses };
  }).filter((day) => day.courses.length > 0);

  return <section className="learning-calendar-weekly-panel">
    <header className="learning-calendar-section-heading"><div><p className="portal-eyebrow">Preview jadwal</p><h2>Jadwal Kuliah Minggu Ini</h2></div><Link href="/jadwal">Lihat Jadwal Lengkap <ArrowRight size={14} /></Link></header>
    {weekDays.length ? <div className="learning-calendar-weekly-days">{weekDays.map(({ date, courses }) => <section className="learning-calendar-weekday-group" key={date.toISOString()}><h3>{weekdayLong[date.getDay()]} {date.getDate()} {monthNames[date.getMonth()].slice(0, 3).toUpperCase()}</h3>{courses.map((course) => <article className="learning-calendar-class-row" key={course.code}><time>{course.startTime}–{course.endTime}</time><div><strong>{course.name}</strong><span>{course.room} · {course.lecturer}</span></div></article>)}</section>)}</div> : <p className="learning-calendar-empty">Tidak ada jadwal kuliah minggu ini.</p>}
  </section>;
}

function NearestEvents({ events }: { events: LearningCalendarEvent[] }) {
  return <section className="learning-calendar-side-panel learning-calendar-upcoming-panel"><header className="learning-calendar-section-heading"><div><p className="portal-eyebrow">Berdasarkan waktu</p><h2>Agenda Terdekat</h2></div></header>{events.length ? events.slice(0, 5).map((event) => <EventLink compact key={event.id} event={event} />) : <p className="learning-calendar-empty">Belum ada agenda berikutnya.</p>}</section>;
}

function NearestDeadline({ assignments }: { assignments: LearningAssignment[] }) {
  const pending = assignments.filter((assignment) => assignment.status === "PENDING" && new Date(assignment.dueAt).getTime() >= Date.now())
    .slice().sort((left, right) => left.dueAt.localeCompare(right.dueAt))[0];
  if (!pending) return <section className="learning-calendar-side-panel"><header className="learning-calendar-section-heading"><div><p className="portal-eyebrow">Tugas</p><h2>Deadline Terdekat</h2></div></header><p className="learning-calendar-empty">Tidak ada tugas yang perlu dikumpulkan.</p></section>;
  const due = new Date(pending.dueAt);
  const course = activeLearningCourses.find((item) => item.code === pending.courseId);
  return <section className="learning-calendar-side-panel learning-calendar-deadline-panel"><header className="learning-calendar-section-heading"><div><p className="portal-eyebrow">Tugas</p><h2>Deadline Terdekat</h2></div></header><div className="learning-calendar-deadline-date"><strong>{due.getDate()}</strong><span>{monthNames[due.getMonth()].slice(0, 3).toUpperCase()}</span></div><strong className="learning-calendar-deadline-title">{pending.title}</strong><span className="learning-calendar-deadline-course">{course?.name ?? pending.courseId}</span><small>Deadline {formatDate(due, { hour: "2-digit", minute: "2-digit" })}</small><Link href={`${base}/tugas/${pending.id}`}>Lihat Tugas <ArrowRight size={14} /></Link></section>;
}

function LearningActivitySummary() {
  const items = [
    ...learningQuizzes.map((quiz) => ({ id: quiz.id, type: "QUIZ" as const, title: quiz.title.replace(/^Kuis/, "Quiz"), courseName: quiz.courseName, complete: quiz.status === "COMPLETED", route: `${base}/quiz/${quiz.id}`, date: quiz.closesAt })),
    ...learningAssignments.map((assignment) => ({ id: assignment.id, type: "TUGAS" as const, title: assignment.title, courseName: activeLearningCourses.find((course) => course.code === assignment.courseId)?.name ?? assignment.courseId, complete: assignment.status === "SUBMITTED" || assignment.status === "GRADED", route: `${base}/tugas/${assignment.id}`, date: assignment.dueAt })),
    ...learningMaterials.map((material) => ({ id: material.id, type: "MATERI" as const, title: material.title, courseName: activeLearningCourses.find((course) => course.code === material.courseId)?.name ?? material.courseId, complete: material.status === "COMPLETED" || material.status === "READ", route: `${base}/materi/${material.id}`, date: material.publishedAt }))
  ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 5);

  return <section className="learning-calendar-side-panel learning-calendar-activity-panel"><header className="learning-calendar-section-heading"><div><p className="portal-eyebrow">Ringkasan status</p><h2>Aktivitas Pembelajaran</h2></div></header><div>{items.map((item) => <Link className="learning-calendar-activity-row" href={item.route} key={`${item.type}-${item.id}`}><span className={item.complete ? "is-complete" : "is-pending"}>{item.complete ? <CheckCircle2 size={16} /> : <Clock3 size={16} />}</span><div><strong>{item.title}</strong><small>{item.courseName} · {item.complete ? item.type === "MATERI" ? "Selesai dibaca" : "Selesai dikerjakan" : item.type === "TUGAS" ? "Belum dikumpulkan" : item.type === "MATERI" ? "Belum dibaca" : "Belum dikerjakan"}</small></div></Link>)}</div><Link className="learning-calendar-progress-link" href={`${base}/progress`}>Lihat Progress <ArrowRight size={14} /></Link></section>;
}

export function LearningCalendarExperience() {
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<CalendarFilter>("SEMUA");
  const [courseFilter, setCourseFilter] = useState("ALL");
  const events = useMemo(() => makeLearningCalendarEvents(month), [month]);
  const filteredEvents = events.filter((event) => (filter === "SEMUA" || event.type === filter) && (courseFilter === "ALL" || event.courseId === courseFilter));
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const upcomingEvents = filteredEvents.filter((event) => eventDate(event).getTime() >= startOfToday.getTime())
    .filter((event) => event.type === "KULIAH" || !eventIsComplete(event))
    .slice().sort((left, right) => left.startAt.localeCompare(right.startAt));
  const deadlineAssignments = learningAssignments.filter((assignment) => courseFilter === "ALL" || assignment.courseId === courseFilter);
  const weekStart = startOfWeek(today);
  const currentWeekClasses = Array.from({ length: 7 }, (_, index) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + index))
    .reduce((count, date) => count + weeklySchedule.filter((course) => weekdayIndex[course.day] === date.getDay() && (courseFilter === "ALL" || course.code === courseFilter)).length, 0);
  const summary = [
    { value: currentWeekClasses, label: "Jadwal Kuliah", detail: "Minggu ini", Icon: CalendarDays, color: "class" },
    { value: learningQuizzes.length, label: "Quiz", detail: "Dalam semester ini", Icon: CircleHelp, color: "quiz" },
    { value: learningAssignments.length, label: "Tugas", detail: "Dalam semester ini", Icon: FileText, color: "assignment" },
    { value: learningExams.length, label: "Ujian", detail: "Dalam semester ini", Icon: GraduationCap, color: "exam" }
  ];

  function changeMonth(amount: number) {
    const next = amount === 0 ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(next);
    setSelectedDate(null);
  }

  return <div className="portal-page learning-page learning-calendar-page">
    <header className="learning-calendar-page-header"><div><p className="portal-eyebrow">Pembelajaran</p><h1>Kalender Pembelajaran</h1><p>Deadline, quiz, ujian, dan jadwal kuliah terhubung dalam satu kalender pembelajaran.</p></div><label className="learning-calendar-course-filter"><BookOpen size={16} /><select aria-label="Filter mata kuliah" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}><option value="ALL">Semua Mata Kuliah</option>{activeLearningCourses.map((course) => <option value={course.code} key={course.code}>{course.name}</option>)}</select><ChevronDown size={14} /></label></header>
    <section className="learning-calendar-summary" aria-label="Ringkasan aktivitas kalender">{summary.map(({ value, label, detail, Icon, color }) => <article key={label}><span className={`learning-calendar-summary-icon is-${color}`}><Icon size={19} /></span><div><strong>{value}</strong><b>{label}</b><small>{detail}</small></div></article>)}</section>
    <div className="learning-calendar-primary-grid">
      <CalendarMonth month={month} selectedDate={selectedDate ?? new Date(today.getFullYear(), today.getMonth(), today.getDate())} events={events} filter={filter} courseFilter={courseFilter} onMonthChange={changeMonth} onSelectDate={(date) => setSelectedDate((current) => current?.toDateString() === date.toDateString() ? null : date)} onFilterChange={setFilter} onToday={() => changeMonth(0)} />
      <NearestEvents events={upcomingEvents} />
    </div>
    <LearningWeeklySchedule weekStart={weekStart} courseFilter={courseFilter} />
    <div className="learning-calendar-secondary-grid"><NearestDeadline assignments={deadlineAssignments} /><LearningActivitySummary /></div>
  </div>;
}
