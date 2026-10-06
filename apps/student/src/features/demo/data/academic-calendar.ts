import type { AcademicEvent } from "../types";

export const academicCalendar: readonly AcademicEvent[] = [
  { id: "krs-2026", title: "Pengisian KRS", date: "12–16 Agustus 2026", type: "KRS", description: "Periode pengisian Kartu Rencana Studi semester ganjil." },
  { id: "kuliah-2026", title: "Perkuliahan Semester Ganjil", date: "18 Agustus 2026", type: "Kuliah", description: "Awal kegiatan perkuliahan semester ganjil 2026/2027." },
  { id: "uts-2026", title: "Ujian Tengah Semester", date: "12–17 Oktober 2026", type: "UTS", description: "Pelaksanaan UTS semester ganjil." },
  { id: "uas-2026", title: "Ujian Akhir Semester", date: "7–12 Desember 2026", type: "UAS", description: "Pelaksanaan UAS semester ganjil." },
  { id: "libur-2026", title: "Libur Semester", date: "14 Desember 2026", type: "Libur", description: "Perkiraan awal libur semester; jadwal demo." },
  { id: "yudisium-2027", title: "Yudisium", date: "Januari 2027", type: "Yudisium", description: "Agenda akademik demo." }
];