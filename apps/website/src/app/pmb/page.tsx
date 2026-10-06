import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CircleHelp, UserRoundCheck } from "lucide-react";
import { admissionOverview } from "@/lib/constants";
import { PmbPageShell, PmbUnavailableNotice } from "@/components/pmb/pmb-page-shell";

export const metadata: Metadata = { title: "Penerimaan Mahasiswa Baru" };

export default function PmbLandingPage() {
  return (
    <PmbPageShell
      eyebrow="Penerimaan mahasiswa baru"
      title="Mulai dari informasi yang resmi."
      description="Ruang informasi bagi calon taruna dan taruni Poltektrans SDP Palembang. Akun pendaftar berbeda dari akun taruna/i aktif."
      activeStep={0}
    >
      <PmbUnavailableNotice title="Portal pendaftaran belum terhubung." />
      <div className="pmb-card-grid">
        <article className="pmb-option-card">
          <span className="pmb-option-icon"><UserRoundCheck size={20} aria-hidden="true" /></span>
          <p className="eyebrow">Calon pendaftar baru</p>
          <h2>Buat akun PMB</h2>
          <p>Registrasi akun calon pendaftar akan dibuka setelah informasi dan sistem periode penerimaan dikonfirmasi.</p>
          <Link href="/pmb/daftar" className="text-link">Lihat halaman pendaftaran <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
        <article className="pmb-option-card">
          <span className="pmb-option-icon"><CircleHelp size={20} aria-hidden="true" /></span>
          <p className="eyebrow">Sudah memiliki akun</p>
          <h2>Akses akun calon</h2>
          <p>Login PMB adalah layanan untuk calon pendaftar, bukan login portal mahasiswa aktif.</p>
          <Link href="/pmb/login" className="text-link">Ke login calon <ArrowRight size={15} aria-hidden="true" /></Link>
        </article>
        <article className="pmb-option-card pmb-option-card-wide">
          <p className="eyebrow">Pengumuman penerimaan</p>
          <h2>{admissionOverview.status}</h2>
          <p>{admissionOverview.description}</p>
          <div className="pmb-option-actions">
            <Link href="/pmb/status" className="button button-secondary">Pantau status pendaftaran</Link>
            <a href={admissionOverview.officialUrl} target="_blank" rel="noreferrer" className="button button-linklike">Situs SIPENCATAR <ArrowUpRight size={15} aria-hidden="true" /></a>
          </div>
        </article>
      </div>
      <p className="pmb-privacy-note">Jangan kirim dokumen identitas atau data pribadi melalui kanal yang belum dinyatakan resmi.</p>
    </PmbPageShell>
  );
}