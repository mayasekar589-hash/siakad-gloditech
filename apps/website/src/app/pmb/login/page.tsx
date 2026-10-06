import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";
import { PmbPageShell, PmbUnavailableNotice } from "@/components/pmb/pmb-page-shell";

export const metadata: Metadata = { title: "Login akun calon" };

export default function ApplicantLoginPage() {
  return (
    <PmbPageShell
      eyebrow="Login calon pendaftar"
      title="Kembali ke akun PMB Anda."
      description="Area login khusus calon pendaftar. Halaman ini tidak menggunakan autentikasi Student Portal."
    >
      <PmbUnavailableNotice title="Login PMB belum terhubung." />
      <div className="pmb-form-preview">
        <div className="pmb-form-heading"><KeyRound size={19} aria-hidden="true" /><h2>Akun calon pendaftar</h2></div>
        <p>Setelah layanan aktif, gunakan akun calon yang dibuat pada periode pendaftaran terkait. Jika belum memiliki akun, periksa status pembukaan pendaftaran lebih dahulu.</p>
        <div className="pmb-callout-note">Login taruna/i aktif tersedia melalui portal mahasiswa yang terpisah.</div>
        <div className="pmb-option-actions">
          <Link className="button button-secondary" href="/pmb/daftar">Informasi registrasi <ArrowRight size={15} aria-hidden="true" /></Link>
          <Link className="button button-linklike" href="/pmb/status">Cek status pendaftaran <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </PmbPageShell>
  );
}