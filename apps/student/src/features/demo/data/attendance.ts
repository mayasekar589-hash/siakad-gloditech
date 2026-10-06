import type { AttendanceRecord } from "../types";

export const attendanceSummary = [
  { label: "Hadir", percent: 92, count: 46 },
  { label: "Izin", percent: 4, count: 2 },
  { label: "Sakit", percent: 2, count: 1 },
  { label: "Alpa", percent: 2, count: 1 }
] as const;

export const attendanceRecords: readonly AttendanceRecord[] = [
  { date: "2026-08-18", courseCode: "NAU401", status: "Hadir" },
  { date: "2026-08-18", courseCode: "NAU402", status: "Hadir" },
  { date: "2026-08-19", courseCode: "NAU404", status: "Izin" },
  { date: "2026-08-20", courseCode: "NAU406", status: "Hadir" },
  { date: "2026-08-24", courseCode: "NAU401", status: "Sakit" },
  { date: "2026-08-25", courseCode: "NAU405", status: "Hadir" },
  { date: "2026-08-27", courseCode: "NAU407", status: "Alpa" }
];