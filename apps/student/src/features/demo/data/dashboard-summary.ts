import { semesterCredits } from "./courses";

export const dashboardSummary = {
  academicYear: "Semester Ganjil 2026 / 2027",
  scheduleDate: "Senin, 5 Oktober 2026",
  quote: "Navigasi yang baik berawal dari rencana yang matang.",
  quoteAttribution: "POLTEKTRANS SDP · PALEMBANG",
  performance: [
    { label: "IP Semester", value: "3.72", description: "Semester 4 · 2026/2027" },
    { label: "IPK", value: "3.64", description: "Indeks Prestasi Kumulatif" },
    { label: "SKS Ditempuh", value: "72", description: "Dari 120 SKS" },
    { label: "SKS Semester Ini", value: String(semesterCredits), description: "KRS telah disetujui" }
  ],
  journey: [
    { term: "Semester 1", gpa: "3.42", credits: "18 SKS", current: false },
    { term: "Semester 2", gpa: "3.51", credits: "20 SKS", current: false },
    { term: "Semester 3", gpa: "3.63", credits: "18 SKS", current: false },
    { term: "Semester 4", gpa: "3.72", credits: "20 SKS", current: true }
  ]
} as const;