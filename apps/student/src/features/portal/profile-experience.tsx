"use client";

import { useEffect, useState } from "react";
import { authService } from "../auth/service";
import { demoStudent } from "../demo/data/student";
import { StudentAvatar } from "../../components/portal/student-avatar";
import { getStudentAcademicRecord, type StudentAcademicRecord } from "../../lib/api/student-api";

function ProfileFields({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return <dl className="profile-information-list">{items.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function ProfileExperience() {
  const [student, setStudent] = useState<StudentAcademicRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const nim = authService.getSession()?.user.nim;
    if (!nim) {
      setLoadError("Sesi Taruna tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    void getStudentAcademicRecord(nim).then(setStudent).catch((error: unknown) => {
      setLoadError(error instanceof Error ? error.message : "Profil Taruna tidak dapat dimuat.");
    });
  }, []);

  if (!student) return <div aria-label="Memuat profil taruna" className="portal-page profile-page">{loadError ? <p role="alert">{loadError}</p> : <div className="profile-loading-line" />}</div>;

  const studentStatus = student.academicStatus;
  const statusLabels: Record<string, string> = { AKTIF: "Aktif", CUTI: "Cuti", NONAKTIF: "Nonaktif", LULUS: "Lulus", DROP_OUT: "Drop Out" };
  const statusLabel = statusLabels[studentStatus] ?? studentStatus;
  const displayName = student.name || demoStudent.name;
  const programStudy = student.studyProgram?.name ?? "Program studi belum ditetapkan";
  const email = student.email || "Belum tersedia";
  const phone = student.phone || "Belum tersedia";

  return <div className="portal-page profile-page">
    <nav aria-label="Breadcrumb" className="profile-breadcrumb"><span>SiAkad Taruna</span><span aria-hidden="true">/</span><strong>Profil Taruna</strong></nav>
    <header className="profile-page-heading"><h1>Profil Taruna</h1><p>Informasi profil dan data akademik Anda.</p></header>

    <div className="profile-information-layout">
      <div className="profile-primary-column">
        <section aria-label="Ringkasan profil taruna" className="profile-identity-panel">
          <StudentAvatar className="profile-institutional-avatar" name={displayName} />
          <div className="profile-identity-copy"><h2>{displayName}</h2><span>{student.studentNumber}</span><p>{programStudy}</p><small>Angkatan {student.cohort ?? "-"}</small></div>
          <span className={`profile-active-status${studentStatus === "AKTIF" ? " is-active" : ""}`}><i />{statusLabel}</span>
        </section>
        <section aria-labelledby="profile-academic-title" className="profile-information-section">
          <header><h2 id="profile-academic-title">Informasi Akademik</h2><p>Data studi yang tercatat pada akun taruna.</p></header>
          <ProfileFields items={[
            { label: "NIM", value: student.studentNumber },
            { label: "Program Studi", value: programStudy },
            { label: "Semester", value: student.semester ?? "-" },
            { label: "Kelas", value: student.className ?? "-" },
            { label: "Angkatan", value: student.cohort ?? "-" },
            { label: "Status Akademik", value: statusLabel }
          ]} />
        </section>
      </div>

      <aside className="profile-secondary-column">
        <section aria-labelledby="profile-contact-title" className="profile-information-section">
          <header><h2 id="profile-contact-title">Informasi Kontak</h2><p>Kontak yang terhubung dengan profil taruna.</p></header>
          <ProfileFields items={[
            { label: "Email", value: email },
            { label: "Nomor HP", value: phone }
          ]} />
        </section>
        <section aria-labelledby="profile-account-title" className="profile-information-section profile-account-section">
          <header><h2 id="profile-account-title">Informasi Akun</h2><p>Status akun pada portal taruna.</p></header>
          <ProfileFields items={[{ label: "Status Akun", value: statusLabel }]} />
        </section>
      </aside>
    </div>
  </div>;
}
