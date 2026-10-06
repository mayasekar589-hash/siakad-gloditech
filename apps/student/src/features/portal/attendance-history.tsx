"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronDown, Search } from "lucide-react";
import { attendanceRecords } from "../demo/data/attendance";
import { demoCourses } from "../demo/data/courses";
import type { AttendanceRecord } from "../demo/types";

type AttendanceView = "list" | "calendar";

const statusClassMap = {
  Hadir: "status-approved",
  Izin: "status-warning",
  Sakit: "status-info",
  Alpa: "status-danger"
} as const;

function formatAttendanceDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function AttendanceStatusBadge({ status }: { status: AttendanceRecord["status"] }) {
  return <span className={`attendance-status-badge ${statusClassMap[status]}`}>{status === "Hadir" ? <Check size={12} /> : null}{status}</span>;
}

function AttendanceDetail({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const course = demoCourses.find((item) => item.code === record.courseCode);

  return (
    <div className="attendance-detail-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="attendance-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="attendance-detail-title">
        <button type="button" className="attendance-detail-close" onClick={onClose} aria-label="Tutup detail">×</button>
        <p className="portal-eyebrow">Detail Presensi</p>
        <h2 id="attendance-detail-title">{course?.name ?? record.courseCode}</h2>
        <dl>
          <div><dt>Tanggal</dt><dd>{formatAttendanceDate(record.date)}</dd></div>
          <div><dt>Kode Mata Kuliah</dt><dd>{record.courseCode}</dd></div>
          <div><dt>Dosen</dt><dd>{course?.lecturer ?? "-"}</dd></div>
          <div><dt>Status</dt><dd><AttendanceStatusBadge status={record.status} /></dd></div>
        </dl>
      </section>
    </div>
  );
}

function AttendanceHistoryRow({ record, onDetail }: { record: AttendanceRecord; onDetail: (record: AttendanceRecord) => void }) {
  const course = demoCourses.find((item) => item.code === record.courseCode);

  return (
    <tr>
      <td className="attendance-date-cell" data-label="Tanggal">
        <span className="attendance-calendar-pill"><CalendarDays size={13} />{formatAttendanceDate(record.date)}</span>
      </td>
      <td className="attendance-course-cell" data-label="Mata Kuliah">
        <div className="attendance-course-meta">
          <span className="attendance-course-icon">{course?.name.charAt(0) ?? "M"}</span>
          <div><strong>{course?.name ?? record.courseCode}</strong><small>{record.courseCode}</small></div>
        </div>
      </td>
      <td className="attendance-lecturer-cell" data-label="Dosen">{course?.lecturer ?? "-"}</td>
      <td className="attendance-status-cell" data-label="Status"><AttendanceStatusBadge status={record.status} /></td>
      <td className="attendance-note-cell" data-label="Keterangan">-</td>
      <td className="attendance-action-cell" data-label="Aksi">
        <button type="button" onClick={() => onDetail(record)}>Lihat Detail <ArrowRight size={13} /></button>
      </td>
    </tr>
  );
}

function AttendanceCalendar({ records, onDetail }: { records: readonly AttendanceRecord[]; onDetail: (record: AttendanceRecord) => void }) {
  const dateGroups = new Map<string, AttendanceRecord[]>();
  for (const record of records) {
    const dayRecords = dateGroups.get(record.date) ?? [];
    dayRecords.push(record);
    dateGroups.set(record.date, dayRecords);
  }

  return (
    <div className="attendance-calendar-view" aria-label="Riwayat presensi dalam tampilan kalender">
      {[...dateGroups.entries()].map(([date, dayRecords]) => (
        <section className="attendance-calendar-day" key={date}>
          <h3><CalendarDays size={14} />{formatAttendanceDate(date)}</h3>
          {dayRecords.map((record) => {
            const course = demoCourses.find((item) => item.code === record.courseCode);
            return (
              <button className="attendance-calendar-record" type="button" key={`${record.date}-${record.courseCode}`} onClick={() => onDetail(record)}>
                <span>{course?.name ?? record.courseCode}</span><AttendanceStatusBadge status={record.status} />
              </button>
            );
          })}
        </section>
      ))}
      {records.length === 0 ? <p className="attendance-filter-empty">Tidak ada presensi yang sesuai dengan filter.</p> : null}
    </div>
  );
}

export function AttendanceHistory() {
  const [query, setQuery] = useState("");
  const [courseCode, setCourseCode] = useState("all");
  const [status, setStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [view, setView] = useState<AttendanceView>("list");
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID");
    return attendanceRecords
      .filter((record) => {
        const course = demoCourses.find((item) => item.code === record.courseCode);
        const matchesQuery = !normalizedQuery || `${course?.name ?? ""} ${record.courseCode} ${course?.lecturer ?? ""}`.toLocaleLowerCase("id-ID").includes(normalizedQuery);
        return matchesQuery && (courseCode === "all" || record.courseCode === courseCode) && (status === "all" || record.status === status);
      })
      .slice()
      .sort((left, right) => sortOrder === "newest" ? right.date.localeCompare(left.date) : left.date.localeCompare(right.date));
  }, [courseCode, query, sortOrder, status]);

  return (
    <section className="attendance-history-panel" aria-labelledby="attendance-history-heading">
      <div className="attendance-section-header attendance-history-header">
        <div><h2 id="attendance-history-heading">Riwayat Presensi</h2><p>Riwayat kehadiran terbaru pada semester berjalan.</p></div>
        <span className="attendance-history-total">46 pertemuan</span>
      </div>

      <div className="attendance-filter-bar">
        <label className="attendance-input-field attendance-search-field">
          <Search size={15} />
          <input aria-label="Cari mata kuliah" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari mata kuliah..." />
        </label>
        <label className="attendance-select-field">
          <select aria-label="Filter mata kuliah" value={courseCode} onChange={(event) => setCourseCode(event.target.value)}>
            <option value="all">Semua Mata Kuliah</option>
            {[...new Set(attendanceRecords.map((record) => record.courseCode))].map((code) => {
              const course = demoCourses.find((item) => item.code === code);
              return <option value={code} key={code}>{course?.name ?? code}</option>;
            })}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
        <label className="attendance-select-field">
          <select aria-label="Filter status" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Semua Status</option>
            <option value="Hadir">Hadir</option><option value="Izin">Izin</option><option value="Sakit">Sakit</option><option value="Alpa">Alpa</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
        <label className="attendance-select-field">
          <select aria-label="Urutkan tanggal" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest">Terbaru</option><option value="oldest">Terlama</option>
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </label>
        <div className="attendance-view-switch" aria-label="Tampilan riwayat">
          <button type="button" className={view === "list" ? "is-active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
          <button type="button" className={view === "calendar" ? "is-active" : ""} aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>Calendar</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="attendance-table-wrap">
          <table>
            <thead><tr><th>TANGGAL</th><th>MATA KULIAH</th><th>DOSEN</th><th>STATUS</th><th>KETERANGAN</th><th>AKSI</th></tr></thead>
            <tbody>
              {filteredRecords.map((record) => <AttendanceHistoryRow key={`${record.date}-${record.courseCode}`} record={record} onDetail={setSelectedRecord} />)}
            </tbody>
          </table>
          {filteredRecords.length === 0 ? <p className="attendance-filter-empty">Tidak ada presensi yang sesuai dengan filter.</p> : null}
        </div>
      ) : <AttendanceCalendar records={filteredRecords} onDetail={setSelectedRecord} />}
      {selectedRecord ? <AttendanceDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
    </section>
  );
}