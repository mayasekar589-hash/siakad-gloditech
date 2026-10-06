"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
  AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check,
  CheckCircle2, Clock3, Download, FileText, Paperclip, Upload
} from "lucide-react";
import type { LearningActivityStatus } from "./learning-data";
import type { AssignmentItem } from "./learning-interactions";

const acceptedFiles = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png";

function formatDeadline(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function AssignmentDetailStatus({ status }: { status: LearningActivityStatus }) {
  const label = status === "PENDING" ? "Belum Dikumpulkan" : status === "IN_PROGRESS" ? "Sedang Dikerjakan" : status === "SUBMITTED" ? "Sudah Dikumpulkan" : status === "LATE" ? "Terlambat" : status === "GRADED" ? "Dinilai" : "Selesai";
  const Icon = status === "LATE" ? AlertCircle : status === "SUBMITTED" ? CheckCircle2 : status === "GRADED" ? BadgeCheck : Clock3;
  const tone = status === "LATE" ? "late" : status === "SUBMITTED" ? "submitted" : status === "GRADED" ? "graded" : status === "IN_PROGRESS" ? "in-progress" : "pending";
  return <span className={`assignment-status status-${tone}`}><Icon size={13} />{label}</span>;
}

function SubmissionPanel({ assignment }: { assignment: AssignmentItem }) {
  const [file, setFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(assignment.status === "SUBMITTED" || assignment.status === "GRADED");
  const [draftSaved, setDraftSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isGraded = assignment.status === "GRADED";

  if (isGraded) return <section className="assignment-detail-panel assignment-feedback-panel"><span className="assignment-submission-success"><BadgeCheck size={19} />Tugas telah dinilai</span><h2>Feedback Dosen</h2><p>Nilai dan feedback akan ditampilkan setelah tersedia pada sistem akademik.</p></section>;
  if (submitted) return <section className="assignment-detail-panel assignment-feedback-panel"><span className="assignment-submission-success"><CheckCircle2 size={19} />Sudah Dikumpulkan</span><p>Pengumpulan tercatat pada data tugas demo ini.</p><div className="assignment-file-record"><FileText size={17} /><span><strong>{file?.name ?? "Berkas pengumpulan"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Detail berkas tidak tersedia pada data demo"}</small></span>{file ? <a href={URL.createObjectURL(file)} download={file.name} aria-label="Unduh berkas"><Download size={16} /></a> : null}</div></section>;

  return <section className="assignment-detail-panel assignment-submission-panel"><header><div><p>PENGUMPULAN</p><h2>Kirim Tugas</h2></div><Paperclip size={17} /></header><input accept={acceptedFiles} className="assignment-file-input" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setDraftSaved(false); }} ref={inputRef} type="file" /><button className={`assignment-dropzone${file ? " has-file" : ""}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFile(event.dataTransfer.files[0] ?? null); setDraftSaved(false); }} type="button"><span><Upload size={18} /></span><strong>{file ? file.name : "Tarik file ke sini atau pilih file"}</strong><small>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · klik untuk mengganti` : "PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, JPG, PNG"}</small></button>{draftSaved ? <p className="assignment-draft-message"><Check size={13} />Draft tersimpan di sesi ini.</p> : null}<p className="assignment-demo-note">Pengumpulan ini hanya tersimpan pada sesi demonstrasi browser, belum dikirim ke backend akademik.</p><div className="assignment-submission-actions"><button className="assignment-button secondary" disabled={!file} onClick={() => setDraftSaved(true)} type="button">Simpan Draft</button><button className="assignment-button primary" disabled={!file} onClick={() => setSubmitted(true)} type="button">Kirim Tugas<ArrowRight size={14} /></button></div></section>;
}

export function AssignmentDetailExperience({ assignment }: { assignment: AssignmentItem }) {
  return <div className="portal-page learning-page assignment-detail-page">
    <nav className="assignment-breadcrumb" aria-label="Breadcrumb"><Link href="/dashboard">SiAkad Taruna</Link><span>/</span><Link href="/pembelajaran">Pembelajaran</Link><span>/</span><Link href="/pembelajaran/tugas">Tugas</Link><span>/</span><strong>Detail</strong></nav>
    <Link href="/pembelajaran/tugas" className="assignment-back-link"><ArrowLeft size={15} />Kembali ke Semua Tugas</Link>
    <header className="assignment-detail-heading"><p>TUGAS · {assignment.courseId}</p><h1>{assignment.title}</h1><span>{assignment.description}</span><small>{assignment.courseId} · {assignment.courseName} · {assignment.instructor}</small></header>
    <div className="assignment-detail-layout"><main className="assignment-detail-main"><section className="assignment-detail-panel assignment-instructions"><p>INSTRUKSI TUGAS</p><h2>{assignment.title}</h2><p>{assignment.description} Kerjakan sesuai materi perkuliahan dan pastikan berkas yang dikumpulkan dapat dibuka dengan baik.</p><div className="assignment-attachment"><FileText size={17} /><span><strong>Petunjuk pengerjaan</strong><small>Informasi lampiran mengikuti materi pada mata kuliah.</small></span></div></section><SubmissionPanel assignment={assignment} /></main><aside className="assignment-detail-sidebar"><section className="assignment-detail-panel"><h2>Informasi Tugas</h2><dl><div><dt><CalendarDays size={14} />Deadline</dt><dd>{formatDeadline(assignment.dueAt)}</dd></div><div><dt><BadgeCheck size={14} />Status</dt><dd><AssignmentDetailStatus status={assignment.status} /></dd></div><div><dt><FileText size={14} />Mata Kuliah</dt><dd>{assignment.courseName}</dd></div><div><dt><Clock3 size={14} />Dosen</dt><dd>{assignment.instructor}</dd></div></dl></section><section className="assignment-detail-panel assignment-grade-panel"><p>PENILAIAN</p><h2>{assignment.status === "GRADED" ? "Nilai tersedia" : "Menunggu penilaian"}</h2><span>{assignment.status === "GRADED" ? "Rincian nilai belum tersedia pada data demo." : "Nilai akan muncul di sini setelah dosen menilai tugas."}</span></section></aside></div>
  </div>;
}