import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

type AdmissionStep = {
  title: string;
  detail: string;
};

const steps: AdmissionStep[] = [
  { title: "Buat akun calon", detail: "Mulai proses pendaftaran melalui layanan PMB." },
  { title: "Lengkapi pendaftaran", detail: "Isi data dan unggah dokumen sesuai persyaratan." },
  { title: "Pantau proses seleksi", detail: "Ikuti informasi dan hasil seleksi melalui kanal resmi." }
];

export function AdmissionsSection() {
  return (
    <section className="admissions-section section-space" id="pmb" aria-labelledby="admission-title">
      <div className="admissions-background" aria-hidden="true">
        <Image
          src="/assets/admissions/taruna-kapal.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="admissions-background-image"
        />
      </div>
      <div className="admissions-shell">
        <div className="admissions-content">
          <div className="admissions-hero">
          <div className="admissions-copy">
            <p className="admissions-eyebrow"><span aria-hidden="true" />PENERIMAAN MAHASISWA BARU</p>
            <h2 className="admissions-title serif-heading" id="admission-title">
              <span>Mulai perjalanan</span>
              <span>pendidikan vokasi <em>Anda.</em></span>
            </h2>
            <p className="admissions-description">
              Temukan jalur penerimaan, jadwal, dan persyaratan yang sesuai dan mulai langkah Anda bersama Poltektrans SDP Palembang.
            </p>
            <div className="admission-actions">
              <Link className="admission-cta-primary" href="/pendaftaran">
                Daftar Sekarang <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="admission-cta-secondary" href="/pmb">
                Jelajahi PMB <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <p className="admission-status">
              <span className="status-indicator" aria-hidden="true" />
              <span>Informasi mengikuti pengumuman resmi institusi.</span>
            </p>
          </div>

          </div>

          <div className="admissions-process">
            <div className="admissions-divider" aria-hidden="true" />

            <div className="admission-steps" aria-label="Gambaran proses penerimaan">
              {steps.map(({ title, detail }, index) => (
                <article className="admission-step" key={title}>
                <span className="admission-step-number">0{index + 1}</span>
                  <span className="admission-step-accent" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
