import type { AcademicDocument } from "../types";

export const academicDocuments: readonly AcademicDocument[] = [
  {
    id: "krs-s4",
    documentType: "KRS",
    title: "Kartu Rencana Studi",
    description: "Rencana studi mata kuliah yang diambil oleh taruna.",
    period: "Semester 4 · 2026/2027",
    status: "AVAILABLE",
    downloadable: true,
    printable: true,
    semester: 4
  },
  {
    id: "khs-s3",
    documentType: "KHS",
    title: "Kartu Hasil Studi",
    description: "Hasil nilai mata kuliah yang telah ditempuh.",
    period: "Semester 3 · 2025/2026",
    status: "AVAILABLE",
    downloadable: true,
    printable: true,
    semester: 3
  },
  {
    id: "transkrip",
    documentType: "TRANSKRIP",
    title: "Transkrip Nilai",
    description: "Rekapitulasi seluruh nilai akademik taruna.",
    period: "Pembaruan terakhir · 2026/2027",
    status: "AVAILABLE",
    downloadable: true,
    printable: true
  },
  {
    id: "aktif",
    documentType: "SURAT_AKADEMIK",
    title: "Surat Keterangan Aktif",
    description: "Surat keterangan status aktif sebagai taruna.",
    period: "Tahun akademik 2026/2027",
    status: "PROCESSING",
    downloadable: false,
    printable: false
  },
  {
    id: "kartu",
    documentType: "KARTU_TARUNA",
    title: "Kartu Taruna",
    description: "Kartu identitas resmi taruna Poltektrans SDP.",
    period: "Angkatan 2025",
    status: "AVAILABLE",
    downloadable: true,
    printable: true
  }
];