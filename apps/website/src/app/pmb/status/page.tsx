import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { PmbPageShell, PmbUnavailableNotice } from "@/components/pmb/pmb-page-shell";

export const metadata: Metadata = { title: "Status pendaftaran" };

export default function ApplicantStatusPage() {
  return (
    <PmbPageShell
      eyebrow="Status pendaftaran"
      title="Pantau tahapan seleksi."
      description="Status aplikasi akan tersedia melalui akun dan nomor pendaftaran setelah layanan PMB terhubung."
      activeStep={2}
    >
      <PmbUnavailableNotice title="Pemeriksaan status belum tersedia." />
      <div className="pmb-form-preview">
        <div className="pmb-form-heading"><ClipboardCheck size={19} aria-hidden="true" /><h2>Informasi proses</h2></div>
        <p>Verifikasi berkas, jadwal, dan hasil seleksi hanya dapat dipastikan melalui akun calon atau pengumuman resmi penerimaan.</p>
        <div className="status-timeline" aria-label="Tahapan umum penerimaan">
          <span className="is-done">Pendaftaran</span><span>Verifikasi</span><span>Seleksi</span><span>Hasil</span>
        </div>
        <div className="pmb-option-actions">
          <Link className="button button-secondary" href="/pmb">Informasi PMB <ArrowRight size={15} aria-hidden="true" /></Link>
          <Link className="button button-linklike" href="/pmb/login">Login akun calon <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>
    </PmbPageShell>
  );
}