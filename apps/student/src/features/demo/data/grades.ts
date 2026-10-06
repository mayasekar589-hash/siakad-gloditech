import type { Grade } from "../types";
import { demoCourses } from "./courses";

export const semesterGrades: readonly Grade[] = [
  { courseCode: "NAU401", grade: "A", weight: 4, status: "Lulus" },
  { courseCode: "NAU402", grade: "A-", weight: 3.75, status: "Lulus" },
  { courseCode: "NAU403", grade: "B+", weight: 3.5, status: "Lulus" },
  { courseCode: "NAU404", grade: "A", weight: 4, status: "Lulus" },
  { courseCode: "NAU405", grade: "B+", weight: 3.6333333333, status: "Lulus" },
  { courseCode: "NAU406", grade: "B+", weight: 3.5, status: "Lulus" },
  { courseCode: "NAU407", grade: "A-", weight: 3.75, status: "Lulus" }
];

const courseCredits = new Map(demoCourses.map((course) => [course.code, course.credits]));
const gradedCredits = semesterGrades.reduce((sum, grade) => sum + (courseCredits.get(grade.courseCode) ?? 0), 0);
export const semesterGpa = Number((semesterGrades.reduce((sum, grade) => sum + grade.weight * (courseCredits.get(grade.courseCode) ?? 0), 0) / gradedCredits).toFixed(2));
export const cumulativeGpa = 3.64;

export const previousSemesterSummary = [
  { semester: 1, gpa: 3.52, credits: 20 },
  { semester: 2, gpa: 3.61, credits: 20 },
  { semester: 3, gpa: 3.71, credits: 20 },
  { semester: 4, gpa: 3.72, credits: 20 }
] as const;