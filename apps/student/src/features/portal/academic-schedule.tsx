"use client";

import { useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock3, Grid2X2,
  List, MapPin, Printer
} from "lucide-react";
import { demoCourses } from "../demo/data/courses";
import { demoStudent } from "../demo/data/student";
import { DocumentInfoGrid, DocumentLayout, DocumentTable } from "../../components/documents/document-layout";
import { printDocument } from "../../lib/print/print-document";

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"] as const;
const hours = Array.from({ length: 10 }, (_, index) => index + 7);
const hourHeight = 64;
const weekAnchor = new Date(2026, 9, 6);

const scheduleSlots = [
  { courseCode: "NAU401", day: "Senin", startTime: "08:00", endTime: "09:40" },
  { courseCode: "NAU404", day: "Senin", startTime: "08:00", endTime: "09:40" },
  { courseCode: "NAU406", day: "Senin", startTime: "08:00", endTime: "09:40" },
  { courseCode: "NAU402", day: "Selasa", startTime: "10:00", endTime: "11:40" },
  { courseCode: "NAU405", day: "Selasa", startTime: "10:00", endTime: "11:40" },
  { courseCode: "NAU403", day: "Kamis", startTime: "13:00", endTime: "14:40" },
  { courseCode: "NAU407", day: "Kamis", startTime: "13:00", endTime: "15:30" }
] as const;

type ScheduleSlot = (typeof scheduleSlots)[number];
type ScheduleView = "week" | "day" | "list";

const courseTones: Record<string, string> = {
  NAU401: "blue",
  NAU402: "green",
  NAU403: "ocean",
  NAU404: "gold",
  NAU405: "rose",
  NAU406: "purple",
  NAU407: "mint"
};

function minutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function formatDayDate(dayIndex: number, weekOffset: number) {
  const date = new Date(weekAnchor);
  date.setDate(date.getDate() + weekOffset * 7 + dayIndex);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date);
}

function formatWeekRange(weekOffset: number) {
  const start = new Date(weekAnchor);
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const startLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric" }).format(start);
  const endLabel = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(end);
  return `${startLabel} – ${endLabel}`;
}

function dayIndex(day: string) {
  return days.indexOf(day as (typeof days)[number]);
}

function courseFor(slot: ScheduleSlot) {
  return demoCourses.find((course) => course.code === slot.courseCode);
}

function ScheduleBlock({ slot, lane, laneCount }: { slot: ScheduleSlot; lane: number; laneCount: number }) {
  const course = courseFor(slot);
  if (!course) return null;
  const start = minutes(slot.startTime);
  const duration = minutes(slot.endTime) - start;
  const top = ((start - 7 * 60) / 60) * hourHeight;
  const height = (duration / 60) * hourHeight;
  return <article className={`academic-schedule-block tone-${courseTones[course.code] ?? "blue"}`} style={{ top, height, left: `${(lane / laneCount) * 100}%`, width: `${100 / laneCount}%` }}>
    <strong>{course.name}</strong>
    <time>{slot.startTime}–{slot.endTime}</time>
    <span>{course.room}</span>
    <small>{course.code}</small>
  </article>;
}

function ScheduleDayColumn({ day }: { day: (typeof days)[number] }) {
  const daySlots = scheduleSlots.filter((slot) => slot.day === day).sort((first, second) => minutes(first.startTime) - minutes(second.startTime));
  const clusters: ScheduleSlot[][] = [];
  let clusterEnd = -1;
  for (const slot of daySlots) {
    if (!clusters.length || minutes(slot.startTime) >= clusterEnd) {
      clusters.push([slot]);
      clusterEnd = minutes(slot.endTime);
    } else {
      clusters[clusters.length - 1].push(slot);
      clusterEnd = Math.max(clusterEnd, minutes(slot.endTime));
    }
  }

  return <div className="academic-schedule-day-column">
    {clusters.flatMap((cluster) => {
      const laneEnds: number[] = [];
      const lanes = cluster.map((slot) => {
        let lane = laneEnds.findIndex((end) => end <= minutes(slot.startTime));
        if (lane < 0) lane = laneEnds.length;
        laneEnds[lane] = minutes(slot.endTime);
        return { slot, lane };
      });
      const laneCount = Math.max(laneEnds.length, 1);
      return lanes.map(({ slot, lane }) => <ScheduleBlock key={slot.courseCode} slot={slot} lane={lane} laneCount={laneCount} />);
    })}
  </div>;
}

function Timetable({ weekOffset, selectedDay, singleDay }: { weekOffset: number; selectedDay: (typeof days)[number]; singleDay: boolean }) {
  const visibleDays = singleDay ? [selectedDay] : days;
  return <div className="academic-timetable-scroll">
    <div className={`academic-timetable ${visibleDays.length === 1 ? "is-day-view" : ""}`}>
      <div className="academic-timetable-header"><span className="academic-time-heading">Waktu</span>{visibleDays.map((day) => <div className="academic-day-heading" key={day}><strong>{day}</strong><small>{formatDayDate(dayIndex(day), weekOffset)}</small></div>)}</div>
      <div className="academic-timetable-body">
        <div className="academic-time-axis">{hours.map((hour) => <span key={hour} style={{ top: (hour - 7) * hourHeight }}>{`${String(hour).padStart(2, "0")}:00`}</span>)}</div>
        {visibleDays.map((day) => <ScheduleDayColumn day={day} key={day} />)}
      </div>
    </div>
  </div>;
}

function ScheduleList() {
  const sortedSlots = [...scheduleSlots].sort((first, second) => dayIndex(first.day) - dayIndex(second.day) || minutes(first.startTime) - minutes(second.startTime));
  return <section className="academic-schedule-list" aria-label="Daftar jadwal kuliah">{sortedSlots.map((slot) => {
    const course = courseFor(slot);
    if (!course) return null;
    return <article className="academic-schedule-list-row" key={slot.courseCode}>
      <span className={`academic-list-icon tone-${courseTones[course.code] ?? "blue"}`}><BookOpen size={16} /></span>
      <span className="academic-list-day"><strong>{slot.day}</strong><small>{slot.startTime}–{slot.endTime}</small></span>
      <span className="academic-list-course"><strong>{course.name}</strong><small>{course.code} · {course.lecturer}</small></span>
      <span className="academic-list-location"><MapPin size={14} />{course.room}</span>
    </article>;
  })}</section>;
}

function exportSchedule() {
  const rows = [["Hari", "Mulai", "Selesai", "Kode", "Mata Kuliah", "Ruang"]];
  for (const slot of scheduleSlots) {
    const course = courseFor(slot);
    if (course) rows.push([slot.day, slot.startTime, slot.endTime, course.code, course.name, course.room]);
  }
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "jadwal-kuliah-nautika-4a.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function ScheduleMetrics() {
  const metrics = [
    { value: "7", label: "Mata Kuliah", Icon: BookOpen, tone: "blue" },
    { value: "5", label: "Hari Perkuliahan", Icon: CalendarDays, tone: "gold" },
    { value: "18", label: "Total Jam/Minggu", Icon: Clock3, tone: "green" },
    { value: "6", label: "Ruang & Fasilitas", Icon: MapPin, tone: "purple" }
  ];
  return <section className="academic-schedule-metrics" aria-label="Ringkasan jadwal">{metrics.map(({ value, label, Icon, tone }) => <article className="academic-schedule-metric" key={label}><span className={`metric-icon tone-${tone}`}><Icon size={18} /></span><strong>{value}</strong><small>{label}</small></article>)}</section>;
}

function CourseDirectory() {
  return <section className="academic-course-directory"><header><div><p>SEMESTER 4</p><h2>Daftar Mata Kuliah</h2></div><span>7 mata kuliah<ArrowRight size={14} /></span></header><div className="academic-course-directory-grid">{demoCourses.map((course) => <article className="academic-course-directory-item" key={course.code}><span className={`academic-list-icon tone-${courseTones[course.code] ?? "blue"}`}><BookOpen size={16} /></span><span><strong>{course.code}</strong><small>{course.name}</small></span></article>)}</div></section>;
}

function SchedulePrintLayout({ weekOffset, view, selectedDay }: { weekOffset: number; view: ScheduleView; selectedDay: (typeof days)[number] }) {
  const printableSlots = scheduleSlots.filter((slot) => view !== "day" || slot.day === selectedDay);
  return <DocumentLayout className="academic-schedule-print-layout" documentNumber={`Kelas ${demoStudent.className} · ${view === "day" ? selectedDay : formatWeekRange(weekOffset)}`} documentType="JADWAL" subtitle={`Tahun Akademik 2026/2027 · Semester ${demoStudent.semester}`} title="JADWAL KULIAH">
    <DocumentInfoGrid items={[{ label: "Nama", value: demoStudent.name }, { label: "NIM", value: demoStudent.nim }, { label: "Program Studi", value: demoStudent.programStudy }, { label: "Semester", value: `${demoStudent.semester} · 2026/2027` }]} />
    <DocumentTable><thead><tr><th>No</th><th>Hari</th><th>Waktu</th><th>Kode</th><th>Mata Kuliah</th><th>Ruang</th></tr></thead><tbody>{printableSlots.map((slot, index) => {const course = courseFor(slot); if (!course) return null; return <tr key={`${slot.day}-${slot.courseCode}`}><td>{index + 1}</td><td>{slot.day}</td><td>{slot.startTime}–{slot.endTime}</td><td>{course.code}</td><td>{course.name}</td><td>{course.room}</td></tr>;})}</tbody></DocumentTable>
  </DocumentLayout>;
}

export function AcademicSchedule() {
  const [view, setView] = useState<ScheduleView>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<(typeof days)[number]>("Senin");
  const visibleDays = view === "day" ? [selectedDay] : days;

  return <div className="portal-page academic-schedule-page">
    <nav className="academic-schedule-breadcrumb" aria-label="Breadcrumb"><span>SiAkad Taruna</span><span>/</span><span>Akademik</span><span>/</span><strong>Jadwal Kuliah</strong></nav>
    <header className="academic-schedule-heading"><div><p>AKADEMIK · SEMESTER 4 <span>DATA DEMO</span></p><h1>Jadwal Kuliah</h1><small>Jadwal perkuliahan kelas Nautika 4A · 2026/2027</small></div><label className="academic-semester-select"><CalendarDays size={15} /><select aria-label="Semester"><option>Semester 4 (2026/2027)</option></select></label></header>
    <ScheduleMetrics />
    <section className="academic-schedule-toolbar" aria-label="Kontrol jadwal">
      <div className="academic-week-controls"><button aria-label="Minggu sebelumnya" onClick={() => setWeekOffset((offset) => offset - 1)} type="button"><ArrowLeft size={15} /></button><strong>{formatWeekRange(weekOffset)}</strong><button aria-label="Minggu berikutnya" onClick={() => setWeekOffset((offset) => offset + 1)} type="button"><ArrowRight size={15} /></button><button className="academic-today-button" onClick={() => setWeekOffset(0)} type="button">Minggu Ini</button></div>
      {view === "day" ? <select className="academic-day-select" aria-label="Pilih hari" onChange={(event) => setSelectedDay(event.target.value as (typeof days)[number])} value={selectedDay}>{days.map((day) => <option key={day}>{day}</option>)}</select> : null}
      <div className="academic-toolbar-spacer" />
      <div className="academic-view-switch" aria-label="Tampilan jadwal"><button aria-pressed={view === "week"} className={view === "week" ? "is-active" : ""} onClick={() => setView("week")} type="button"><CalendarDays size={14} />Mingguan</button><button aria-pressed={view === "day"} className={view === "day" ? "is-active" : ""} onClick={() => setView("day")} type="button"><Grid2X2 size={13} />Harian</button><button aria-pressed={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} type="button"><List size={14} />Daftar</button></div>
      <div className="academic-toolbar-actions"><button aria-label="Cetak jadwal" onClick={() => printDocument("JADWAL")} type="button"><Printer size={15} /><span>Cetak</span></button><button aria-label="Export jadwal CSV" onClick={exportSchedule} type="button"><CalendarDays size={15} /><span>Export</span></button></div>
    </section>
    {view === "list" ? <ScheduleList /> : <Timetable singleDay={view === "day"} weekOffset={weekOffset} selectedDay={visibleDays[0]} />}
    <CourseDirectory />
    <SchedulePrintLayout selectedDay={selectedDay} view={view} weekOffset={weekOffset} />
  </div>;
}