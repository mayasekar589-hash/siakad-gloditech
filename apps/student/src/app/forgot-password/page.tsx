import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Lupa Password | SiAkad Taruna" };

export default function ForgotPasswordPage() {
  return (
    <main className="student-forgot-page">
      <section className="student-forgot-card">
        <span className="student-forgot-icon"><LockKeyhole size={21} aria-hidden="true" /></span>
        <p className="student-forgot-eyebrow">SiAkad Taruna</p>
        <h1>Lupa password?</h1>
        <p>Pengaturan ulang password belum tersedia melalui portal ini. Silakan hubungi bagian akademik untuk bantuan akses akun taruna.</p>
        <Link href="/login"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke login</Link>
      </section>
    </main>
  );
}