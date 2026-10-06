import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { PmbPageShell, PmbUnavailableNotice } from "@/components/pmb/pmb-page-shell";

export const metadata: Metadata = { title: "Daftar akun calon" };

export default function ApplicantRegistrationPage() {
  return (
    <PmbPageShell
      eyebrow="Akun calon pendaftar"
      title="Registrasi calon taruna/i."
      description="Pendaftaran akun hanya dilakukan saat periode dan jalur penerimaan telah diumumkan melalui kanal resmi."
      activeStep={0}
    >
      <PmbUnavailableNotice title="Formulir registrasi belum dibuka." />
      <div className="pmb-form-preview" aria-label="Informasi persiapan registrasi">
        <div className="pmb-form-heading"><LockKeyhole size={19} aria-hidden="true" /><h2>Yang perlu disiapkan</h2></div>
        <p>Persyaratan dapat berbeda pada setiap jalur. Ikuti daftar dokumen dan ketentuan yang tercantum pada pengumuman resmi untuk periode pendaftaran yang dipilih.</p>
        <div className="pmb-callout-note">Form ini belum mengirim atau menyimpan data. Integrasi registrasi calon akan dibuat pada tahap PMB berikutnya.</div>
        <Link className="button button-secondary" href="/pmb">Kembali ke informasi PMB <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <p className="pmb-switch-link">Sudah punya akun calon? <Link href="/pmb/login">Masuk ke akun PMB</Link></p>
    </PmbPageShell>
  );
}