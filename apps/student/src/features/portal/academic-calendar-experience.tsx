"use client";

import { useMemo, useState } from "react";
import {
  BookOpen, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  Clock3, FileText, GraduationCap, Info, Palmtree
} from "lucide-react";
import { academicCalendar } from "../demo/data/academic-calendar";
import type { AcademicEvent } from "../demo/types";

type CalendarMode = "calendar" | "timeline";
type EventCategory = AcademicEvent["type"];

interface ParsedAcademicEvent {
  event: AcademicEvent;
  start: Date;
  end: Date;
  monthOnly: boolean;
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const categories: Array<"Semua" | EventCategory> = ["Semua", "KRS", "Kuliah", "UTS", "UAS", "Libur", "Yudisium"];
const categoryLabels: Record<EventCategory, string> = {
  KRS: "KRS",
  Kuliah: "Perkuliahan",
  UTS: "UTS",
  UAS: "UAS",
  Libur: "Libur",
  Yudisium: "Yudisium"
};
const categoryShortLabels: Record<EventCategory, string> = {
  KRS: "KRS",
  Kuliah: "Kuliah",
  UTS: "UTS",
  UAS: "UAS",
  Libur: "Libur",
  Yudisium: "Yudisium"
};

function parseAcademicEvent(event: AcademicEvent): ParsedAcademicEvent {
  const normalized = event.date.toLocaleLowerCase("id-ID");
  const month = monthNames.findIndex((name) => normalized.includes(name.toLocaleLowerCase("id-ID")));
  const numericParts = event.date.match(/\d+/g)?.map(Number) ?? [];
  const year = numericParts.find((part) => part >= 2000) ?? 2026;
  const dayParts = numericParts.filter((part) => part < 2000);
  const monthOnly = dayParts.length === 0;
  const startDay = dayParts[0] ?? 1;
  const endDay = dayParts[1] ?? startDay;

  return {
    event,
    start: new Date(year, Math.max(month, 0), startDay),
    end: new Date(year, Math.max(month, 0), endDay),
    monthOnly
  };
}

const parsedEvents = academicCalendar.map(parseAcademicEvent);
const eventColorClasses: Record<EventCategory, string> = {
  KRS: "is-krs",
  Kuliah: "is-kuliah",
  UTS: "is-uts",
  UAS: "is-uas",
  Libur: "is-libur",
  Yudisium: "is-yudisium"
};

function sameMonth(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

function eventOccursOn(event: ParsedAcademicEvent, date: Date) {
  return date >= event.start && date <= event.end;
}

function formatDate(date: Date) {
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function formatEventRange(event: ParsedAcademicEvent) {
  return event.event.date;
}

function eventForMonth(event: ParsedAcademicEvent, month: Date) {
  return sameMonth(event.start, month) || sameMonth(event.end, month) || (event.start < month && event.end > month);
}

function AcademicYearSummary() {
  return (
    <section className="academic-calendar-year-summary" aria-label="Ringkasan tahun akademik">
      <div className="academic-year-primary">
        <span className="academic-year-icon"><CalendarDays size={27} /></span>
        <div><span className="academic-year-label">Tahun Akademik</span><strong>2026/2027</strong><small>Periode kegiatan akademik<br />di Poltektrans SDP.</small></div>
      </div>
      <div className="academic-year-term">
        <span className="academic-term-icon"><GraduationCap size={25} /></span>
        <div><span>Semester Ganjil</span><strong>Agustus – Desember 2026</strong><small>Perkuliahan, UTS dan UAS<br />semester ganjil.</small></div>
      </div>
      <div className="academic-year-term">
        <span className="academic-term-icon"><GraduationCap size={25} /></span>
        <div><span>Semester Genap</span><strong>Januari – Juli 2027</strong><small>Jadwal semester genap<br />belum tersedia.</small></div>
      </div>
    </section>
  );
}

function AcademicCalendarStatistics() {
  const items = [
    { value: "6", label: "Agenda Akademik", detail: "Tahun 2026/2027", Icon: CalendarDays, color: "blue" },
    { value: "1", label: "Kegiatan KRS", detail: "12–16 Agustus 2026", Icon: FileText, color: "gold" },
    { value: "3", label: "Periode Ujian", detail: "UTS dan UAS", Icon: BookOpen, color: "green" },
    { value: "1", label: "Libur / Yudisium", detail: "Desember 2026 – Januari 2027", Icon: Palmtree, color: "teal" }
  ];

  return (
    <div className="academic-calendar-statistics">
      {items.map(({ value, label, detail, Icon, color }) => (
        <article className="academic-stat-card" key={label}>
          <span className={`academic-stat-icon is-${color}`}><Icon size={21} /></span>
          <span className="academic-stat-copy"><strong>{value}</strong><b>{label}</b><small>{detail}</small></span>
        </article>
      ))}
    </div>
  );
}

function AcademicCalendarGrid({
  month,
  events,
  selectedDate,
  onDateSelect,
  onMonthChange,
  mode,
  onModeChange,
  activeCategory,
  onCategoryChange
}: {
  month: Date;
  events: ParsedAcademicEvent[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (amount: number) => void;
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  activeCategory: "Semua" | EventCategory;
  onCategoryChange: (category: "Semua" | EventCategory) => void;
}) {
  const firstWeekday = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const dayCount = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((firstWeekday + dayCount) / 7) * 7 }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day > 0 && day <= dayCount ? new Date(month.getFullYear(), month.getMonth(), day) : null;
  });
  const selectedEvents = events.filter((item) => item.monthOnly ? sameMonth(item.start, selectedDate) : eventOccursOn(item, selectedDate));
  const monthOnlyEvents = events.filter((item) => item.monthOnly && sameMonth(item.start, month));
  const hasSelectedMonthOnlyEvent = selectedEvents.some((item) => item.monthOnly);

  return (
    <section className="academic-month-panel" aria-label="Kalender bulanan">
      <div className="academic-month-heading">
        <div className="academic-month-navigation">
          <button type="button" aria-label="Bulan sebelumnya" onClick={() => onMonthChange(-1)}><ChevronLeft size={18} /></button>
          <h2>{monthNames[month.getMonth()]} {month.getFullYear()}</h2>
          <button type="button" aria-label="Bulan berikutnya" onClick={() => onMonthChange(1)}><ChevronRight size={18} /></button>
        </div>
        <button className="academic-current-month" type="button" onClick={() => onMonthChange(0)}>Hari ini</button>
      </div>

      <div className="academic-calendar-toolbar">
        <div className="academic-calendar-mode" role="tablist" aria-label="Mode kalender">
          <button type="button" role="tab" aria-selected={mode === "calendar"} className={mode === "calendar" ? "is-active" : ""} onClick={() => onModeChange("calendar")}><CalendarDays size={14} />Kalender</button>
          <button type="button" role="tab" aria-selected={mode === "timeline"} className={mode === "timeline" ? "is-active" : ""} onClick={() => onModeChange("timeline")}><Clock3 size={14} />Timeline</button>
        </div>
        <label className="academic-category-filter">
          <span className="sr-only">Filter kategori agenda</span>
          <select value={activeCategory} onChange={(event) => onCategoryChange(event.target.value as "Semua" | EventCategory)}>
            {categories.map((category) => <option value={category} key={category}>{category === "Semua" ? "Semua kategori" : categoryLabels[category]}</option>)}
          </select>
          <ChevronDown size={14} />
        </label>
      </div>

      {monthOnlyEvents.length ? <div className="academic-month-only-events" aria-label="Agenda bulan ini">{monthOnlyEvents.map((item) => <button type="button" className={`academic-day-event ${eventColorClasses[item.event.type]}`} key={item.event.id} onClick={() => onDateSelect(item.start)} title={`${item.event.title} · ${item.event.date}`}><i />{item.event.title} · {item.event.date}</button>)}</div> : null}

      {mode === "calendar" ? (
        <div className="academic-month-grid" role="grid" aria-label={`${monthNames[month.getMonth()]} ${month.getFullYear()}`}>
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <div className="academic-weekday" role="columnheader" key={day}>{day}</div>)}
          {cells.map((date, index) => {
            if (!date) return <div className="academic-day-cell is-outside" role="gridcell" aria-hidden="true" key={`empty-${index}`} />;
            const dateEvents = events.filter((item) => !item.monthOnly && eventOccursOn(item, date));
            const isSelected = !hasSelectedMonthOnlyEvent && sameMonth(date, selectedDate) && date.getDate() === selectedDate.getDate();
            const today = new Date();
            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
            const accessibleEvents = dateEvents.map((item) => `${item.event.title}, ${item.event.type}, ${formatEventRange(item)}`).join(". ");

            return (
              <button
                className={`academic-day-cell${isSelected ? " is-selected" : ""}${isToday ? " is-today" : ""}${dateEvents.length ? " has-event" : ""}`}
                type="button"
                role="gridcell"
                aria-selected={isSelected}
                aria-label={`${formatDate(date)}${accessibleEvents ? `. ${accessibleEvents}` : ""}`}
                title={accessibleEvents ? `${formatDate(date)} · ${accessibleEvents}` : formatDate(date)}
                onClick={() => onDateSelect(date)}
                key={date.toISOString()}
              >
                <span className="academic-day-number">{date.getDate()}</span>
                {dateEvents.slice(0, 1).map((item) => <span className={`academic-day-event ${eventColorClasses[item.event.type]}`} key={item.event.id}><i />{categoryShortLabels[item.event.type]}</span>)}
                {dateEvents.length > 1 ? <span className="academic-day-more">+{dateEvents.length - 1} agenda</span> : null}
              </button>
            );
          })}
        </div>
      ) : (
        <ol className="academic-calendar-timeline">
          {events.filter((item) => eventForMonth(item, month)).map((item) => (
            <li className={eventColorClasses[item.event.type]} key={item.event.id}>
              <span className="academic-timeline-dot" />
              <div><span className="academic-event-date">{item.event.date}</span><h3>{item.event.title}</h3><p>{item.event.description}</p></div>
            </li>
          ))}
        </ol>
      )}

      {mode === "calendar" && selectedEvents.length ? (
        <div className="academic-selected-events" aria-live="polite">
          <div className="academic-selected-date"><CalendarDays size={15} /><strong>{selectedEvents.length === 1 && selectedEvents[0].monthOnly ? selectedEvents[0].event.date : formatDate(selectedDate)}</strong></div>
          {selectedEvents.map((item) => (
            <article className={`academic-selected-event ${eventColorClasses[item.event.type]}`} key={item.event.id}>
              <span>{categoryLabels[item.event.type]}</span><strong>{item.event.title}</strong><small>{formatEventRange(item)}</small><p>{item.event.description}</p>
            </article>
          ))}
        </div>
      ) : mode === "calendar" ? (
        <div className="academic-selected-events is-empty" aria-live="polite"><Info size={15} /><span>{formatDate(selectedDate)} · Tidak ada agenda akademik.</span></div>
      ) : null}
    </section>
  );
}

function UpcomingEvent({ event }: { event: ParsedAcademicEvent | undefined }) {
  if (!event) return <section className="academic-upcoming-panel"><div className="academic-support-heading"><h2>Agenda Berikutnya</h2></div><div className="academic-no-upcoming">Tidak ada agenda pada bulan ini.</div></section>;
  const start = event.start;
  const end = event.end;

  return (
    <section className="academic-upcoming-panel">
      <div className="academic-support-heading"><h2><Clock3 size={17} />Agenda Berikutnya</h2></div>
      <article className={`academic-upcoming-event ${eventColorClasses[event.event.type]}${event.monthOnly ? " is-month-only" : ""}`}>
        <div className="academic-upcoming-date">{event.monthOnly ? <strong>{monthNames[start.getMonth()]} {start.getFullYear()}</strong> : <><strong>{start.getDate() === end.getDate() ? start.getDate() : `${start.getDate()}–${end.getDate()}`}</strong><span>{monthNames[start.getMonth()].toLocaleUpperCase("id-ID")}</span><small>{start.getFullYear()}</small></>}</div>
        <div className="academic-upcoming-copy"><span>{categoryLabels[event.event.type]}</span><h3>{event.event.title}</h3><p>{event.event.description}</p></div>
        <button type="button" onClick={() => document.getElementById("academic-month-agenda")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Lihat Detail <ChevronRight size={14} /></button>
      </article>
    </section>
  );
}

function AcademicTimeline({ events }: { events: ParsedAcademicEvent[] }) {
  return (
    <section className="academic-support-timeline">
      <div className="academic-support-heading"><div><h2>Agenda Akademik</h2><p>Rangkaian kegiatan akademik tahun ajaran 2026/2027.</p></div></div>
      <ol>
        {events.map((item) => (
          <li className={eventColorClasses[item.event.type]} key={item.event.id}>
            <span className="academic-timeline-dot" />
            <div className="academic-timeline-entry"><time>{item.event.date}</time><span className={eventColorClasses[item.event.type]}>{categoryLabels[item.event.type]}</span><h3>{item.event.title}</h3><p>{item.event.description}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SelectedMonthAgenda({ month, events }: { month: Date; events: ParsedAcademicEvent[] }) {
  const monthEvents = events.filter((item) => eventForMonth(item, month));
  return (
    <section className="academic-month-agenda" id="academic-month-agenda">
      <div className="academic-support-heading"><div><h2>Daftar Agenda pada {monthNames[month.getMonth()]} {month.getFullYear()}</h2></div></div>
      {monthEvents.length ? <ul>{monthEvents.map((item) => <li className={eventColorClasses[item.event.type]} key={item.event.id}><span className="academic-agenda-icon"><CalendarDays size={16} /></span><span className="academic-agenda-date">{item.event.date}</span><strong>{item.event.title}</strong><span className="academic-agenda-category">{categoryLabels[item.event.type]}</span></li>)}</ul> : <p className="academic-month-empty">Belum ada agenda yang tercatat pada bulan ini.</p>}
    </section>
  );
}

export function AcademicCalendarExperience() {
  const [month, setMonth] = useState(() => new Date(2026, 7, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 7, 12));
  const [mode, setMode] = useState<CalendarMode>("calendar");
  const [activeCategory, setActiveCategory] = useState<"Semua" | EventCategory>("Semua");
  const [academicYear, setAcademicYear] = useState("2026/2027");

  const filteredEvents = useMemo(() => parsedEvents.filter((item) => activeCategory === "Semua" || item.event.type === activeCategory), [activeCategory]);
  const monthEvents = filteredEvents.filter((item) => eventForMonth(item, month));
  const upcomingEvent = monthEvents.slice().sort((left, right) => left.start.getTime() - right.start.getTime())[0];

  function changeMonth(amount: number) {
    const today = new Date();
    const nextMonth = amount === 0 ? new Date(today.getFullYear(), today.getMonth(), 1) : new Date(month.getFullYear(), month.getMonth() + amount, 1);
    setMonth(nextMonth);
    setSelectedDate(amount === 0 ? today : nextMonth);
  }

  return (
    <div className="academic-calendar-page">
      <header className="academic-calendar-page-header">
        <div className="academic-calendar-breadcrumb">SiAkad Taruna <span>/</span> Akademik <span>/</span> <strong>Kalender Akademik</strong></div>
        <div className="academic-calendar-heading-row">
          <div><div className="academic-calendar-eyebrow"><span>AKADEMIK · DATA DEMO</span><span className="portal-demo-tag">DATA DEMO</span></div><h1>Kalender Akademik</h1><p>Agenda akademik tahun ajaran 2026/2027.</p></div>
          <label className="academic-year-selector"><CalendarDays size={16} /><select aria-label="Pilih tahun akademik" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)}><option value="2026/2027">2026/2027</option></select><ChevronDown size={14} /></label>
        </div>
      </header>

      <AcademicYearSummary />
      <AcademicCalendarStatistics />

      <div className="academic-calendar-main-grid">
        <div className="academic-calendar-primary-column">
          <AcademicCalendarGrid month={month} events={filteredEvents} selectedDate={selectedDate} onDateSelect={setSelectedDate} onMonthChange={changeMonth} mode={mode} onModeChange={setMode} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          <SelectedMonthAgenda month={month} events={monthEvents} />
        </div>
        <aside className="academic-calendar-secondary-column">
          <UpcomingEvent event={upcomingEvent} />
          <AcademicTimeline events={parsedEvents} />
        </aside>
      </div>
    </div>
  );
}
