"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, FileText, HelpCircle, ListChecks, Phone } from "lucide-react";
import { admissionPrograms, informationCategories, registrationConfig } from "@/features/registration/config";
import { trainingPrograms } from "@/features/registration/data/training-programs";
import { registrationService } from "@/features/registration/service";
import { contactInfo } from "@/lib/constants";
import type { RegistrationQuestion } from "@/features/registration/types";

const initialQuestion: RegistrationQuestion = { name: "", email: "", phone: "", category: "Persyaratan", question: "" };

export function RegistrationInformationHub() {
  const [question, setQuestion] = useState(initialQuestion);
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationQuestion, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateQuestion(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const key = event.target.name as keyof RegistrationQuestion;
    setQuestion((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof RegistrationQuestion, string>> = {};
    if (!question.name.trim()) nextErrors.name = "Nama wajib diisi.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(question.email.trim())) nextErrors.email = "Format email tidak valid.";
    if (!/^\+?[\d\s()-]{8,20}$/.test(question.phone.trim())) nextErrors.phone = "Format nomor HP tidak valid.";
    if (!question.question.trim()) nextErrors.question = "Pertanyaan wajib diisi.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    await registrationService.submitQuestion(question);
    setSubmitting(false);
    setSubmitted(true);
  }

  const allDocs = [...new Map(Object.values(registrationConfig).flatMap((config) => config.documents.map((document) => [document.id, document] as const))).values()];

  return (
    <div className="registration-information-hub">
      <div className="registration-shell registration-information-intro">
        <p className="registration-eyebrow"><span aria-hidden="true" />Informasi pendaftaran</p>
        <h1>Informasi pendaftaran</h1>
        <p>Ringkasan informasi untuk membantu calon peserta menyiapkan langkah berikutnya. Rincian resmi periode aktif belum tersedia pada konfigurasi portal ini.</p>
      </div>

      <nav className="registration-information-nav" aria-label="Topik informasi pendaftaran">
        <div className="registration-shell">
          <a href="#persyaratan">Persyaratan</a><a href="#jadwal">Jadwal</a><a href="#seleksi">Tahapan seleksi</a><a href="#program-studi">Program studi</a><a href="#program-diklat">Program Diklat</a><a href="#biaya">Biaya</a><a href="#dokumen">Dokumen</a><a href="#alur-pendaftaran">Alur</a><a href="#faq-informasi">FAQ</a>
        </div>
      </nav>

      <div className="registration-shell registration-information-content">
        <section id="persyaratan" className="registration-info-section"><div className="registration-info-symbol"><ListChecks size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Persyaratan</p><h2>Ketentuan mengikuti jalur pilihan</h2>{registrationConfig.POLA_PEMBIBITAN.requirements.length ? <ul>{registrationConfig.POLA_PEMBIBITAN.requirements.map((item) => <li key={item.id}>{item.title}: {item.description}</li>)}</ul> : <p>Persyaratan spesifik mengikuti pengumuman resmi setiap periode dan belum dikonfigurasi di portal ini.</p>}</div></section>
        <section id="jadwal" className="registration-info-section"><div className="registration-info-symbol"><CalendarDays size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Jadwal</p><h2>Periode dan tanggal penting</h2><p>Belum ada periode atau jadwal aktif yang dimasukkan. Pastikan tanggal melalui pengumuman resmi sebelum mengajukan pendaftaran.</p></div></section>
        <section id="seleksi" className="registration-info-section"><div className="registration-info-symbol"><ListChecks size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Tahapan seleksi</p><h2>Ikuti proses sesuai pengumuman</h2><p>Tahapan dapat mengikuti jalur dan periode. Urutan seleksi resmi belum dikonfigurasi pada halaman ini.</p></div></section>
        <section id="program-studi" className="registration-info-section"><div className="registration-info-symbol"><FileText size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Program studi</p><h2>Program yang tercatat di situs publik</h2><ul>{admissionPrograms.map((program) => <li key={program.id}>{program.name} <span>· Referensi, bukan konfirmasi ketersediaan periode</span></li>)}</ul><p>Pastikan program yang dibuka melalui pengumuman resmi periode terkait.</p></div></section>
        <section id="program-diklat" className="registration-info-section"><div className="registration-info-symbol"><FileText size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Program Diklat</p><h2>Pendidikan dan pelatihan</h2>{trainingPrograms.filter((program) => program.active).length ? <ul>{trainingPrograms.filter((program) => program.active).map((program) => <li key={program.id}>{program.name}</li>)}</ul> : <p>Belum ada program Diklat yang dikonfigurasi. <Link href="/pendaftaran/diklat">Lihat katalog Diklat</Link> untuk status ketersediaan.</p>}</div></section>
        <section id="biaya" className="registration-info-section"><div className="registration-info-symbol"><HelpCircle size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Biaya</p><h2>Informasi biaya</h2><p>Biaya pendaftaran, seleksi, dan pendidikan belum dikonfigurasi. Jangan melakukan pembayaran sebelum memperoleh instruksi resmi.</p></div></section>
        <section id="dokumen" className="registration-info-section"><div className="registration-info-symbol"><FileText size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Dokumen</p><h2>Dokumen yang dapat disiapkan</h2><ul>{allDocs.map((document) => <li key={document.id}>{document.label} <span>· {document.required ? "Wajib" : "Opsional / belum ditetapkan"}</span></li>)}</ul><p>Daftar ini merupakan konfigurasi awal, bukan persyaratan resmi. Ikuti daftar pada pengumuman yang berlaku.</p></div></section>
        <section id="alur-pendaftaran" className="registration-info-section"><div className="registration-info-symbol"><ListChecks size={20} aria-hidden="true" /></div><div><p className="registration-eyebrow">Alur pendaftaran</p><h2>Mulai dari jalur atau program yang dipilih</h2><p>Alur pendaftaran berbeda antara SIPENCATAR dan tiap program Diklat. Ikuti langkah yang ditampilkan pada jalur/program terkait.</p></div></section>
      </div>

      <section id="faq-informasi" className="registration-information-faq" aria-labelledby="information-faq-title">
        <div className="registration-shell registration-faq-inner"><p className="registration-eyebrow"><span aria-hidden="true" />FAQ</p><h2 id="information-faq-title">Pertanyaan yang sering diajukan</h2><div className="registration-faq-list">
          <details><summary>Bagaimana memilih jalur pendaftaran?</summary><p>Tinjau deskripsi jalur pada halaman pilihan, lalu cocokkan dengan tujuan Anda. Persyaratan penentu tetap mengikuti pengumuman resmi.</p></details>
          <details><summary>Di mana melihat persyaratan dan dokumen?</summary><p>Periksa pengumuman resmi untuk jalur dan periode yang dipilih. Daftar pada portal ini belum menggantikan ketentuan resmi.</p></details>
          <details><summary>Bagaimana mengetahui jadwal dan biaya?</summary><p>Jadwal dan biaya periode aktif belum tersedia di portal ini. Jangan menggunakan informasi dari periode lama sebagai ketentuan aktif.</p></details>
        </div></div>
      </section>

      <section id="kontak-panitia" className="registration-question-band" aria-labelledby="registration-question-title">
        <div className="registration-shell registration-question-layout">
          <div className="registration-question-copy"><p className="registration-eyebrow">Butuh bantuan?</p><h2 id="registration-question-title">Sampaikan pertanyaan Anda.</h2><p>Hubungi institusi melalui kontak resmi, atau siapkan pertanyaan di form berikut. Form ini belum terhubung ke server.</p><a className="registration-detail-contact" href={`tel:${contactInfo.phone.replace(/[^+\d]/g, "")}`}><Phone size={16} aria-hidden="true" />{contactInfo.phone}</a></div>
          <form className="registration-question-form" onSubmit={(event) => void submitQuestion(event)} noValidate>
            {submitted ? <div className="registration-question-success" role="status"><p>Validasi pertanyaan selesai.</p><small>Mode pratinjau: pertanyaan belum dikirim atau disimpan. Silakan hubungi nomor resmi untuk bantuan langsung.</small></div> : <>
              <p className="registration-form-note">Mode pratinjau · data tidak disimpan</p>
              <QuestionField name="name" label="Nama" value={question.name} error={errors.name} onChange={updateQuestion} />
              <div className="registration-field-grid"><QuestionField name="email" label="Email" value={question.email} error={errors.email} onChange={updateQuestion} /><QuestionField name="phone" label="Nomor HP" value={question.phone} error={errors.phone} onChange={updateQuestion} /></div>
              <label className="registration-form-field" htmlFor="question-category">Kategori pertanyaan<select id="question-category" name="category" value={question.category} onChange={updateQuestion}>{informationCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <QuestionField name="question" label="Pertanyaan" value={question.question} error={errors.question} onChange={updateQuestion} multiline />
              <button type="submit" className="registration-primary-action" disabled={submitting}>{submitting ? "Memproses..." : "Kirim Pertanyaan"}<ArrowRight size={16} aria-hidden="true" /></button>
            </>}
          </form>
        </div>
      </section>
    </div>
  );
}

function QuestionField({ name, label, value, error, onChange, multiline = false }: { name: keyof RegistrationQuestion; label: string; value: string; error?: string; onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; multiline?: boolean }) {
  const id = `question-${name}`;
  return <div className={`registration-form-field${error ? " has-error" : ""}`}><label htmlFor={id}>{label}</label>{multiline ? <textarea id={id} name={name} rows={4} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} /> : <input id={id} name={name} type={name === "email" ? "email" : name === "phone" ? "tel" : "text"} value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />}{error ? <p id={`${id}-error`} className="registration-field-error" role="alert">{error}</p> : null}</div>;
}