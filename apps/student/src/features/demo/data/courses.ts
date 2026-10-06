import type { Course } from "../types";
import { demoStudent } from "./student";

export const demoCourses: readonly Course[] = [
  { code: "NAU401", name: "Navigasi Lanjutan", credits: 3, className: "4A", lecturer: "Capt. Ahmad Fauzi", room: "Ruang Simulator Nautika", day: "Senin", startTime: "08:00", endTime: "09:40" },
  { code: "NAU402", name: "Meteorologi Maritim", credits: 3, className: "4A", lecturer: "Dr. Budi Santoso", room: "Ruang 204", day: "Senin", startTime: "10:00", endTime: "11:40" },
  { code: "NAU403", name: "Keselamatan Pelayaran", credits: 3, className: "4A", lecturer: "Capt. Dimas Prasetyo", room: "Ruang 301", day: "Senin", startTime: "13:00", endTime: "14:40" },
  { code: "NAU404", name: "Komunikasi Maritim", credits: 2, className: "4A", lecturer: "Rina Kurnia, M.Pd.", room: "Laboratorium Bahasa", day: "Selasa", startTime: "08:00", endTime: "09:40" },
  { code: "NAU405", name: "Bahasa Inggris Maritim", credits: 3, className: "4A", lecturer: "Dr. Budi Santoso", room: "Ruang 204", day: "Selasa", startTime: "10:00", endTime: "11:40" },
  { code: "NAU406", name: "Olahraga dan Kesamaptaan", credits: 3, className: "4A", lecturer: "M. Iqbal, S.Or.", room: "Lapangan Kampus", day: "Rabu", startTime: "08:00", endTime: "09:40" },
  { code: "NAU407", name: "Praktik Dinas Jaga", credits: 3, className: "4A", lecturer: "Capt. Ahmad Fauzi", room: "Simulator Anjungan", day: "Kamis", startTime: "13:00", endTime: "15:30" }
];

export const semesterCredits = demoCourses.reduce((sum, course) => sum + course.credits, 0);

export type KrsEnrollmentStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface KrsEnrollment {
  courseCode: Course["code"];
  semester: number;
  status: KrsEnrollmentStatus;
  isActive: boolean;
}

export const krsEnrollments: readonly KrsEnrollment[] = demoCourses.map((course) => ({
  courseCode: course.code,
  semester: demoStudent.semester,
  status: "APPROVED",
  isActive: true
}));