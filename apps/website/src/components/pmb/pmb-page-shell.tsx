import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, Circle } from "lucide-react";

const lifecycle = ["Buat akun", "Lengkapi pendaftaran", "Verifikasi", "Seleksi", "Hasil"];

export function PmbPageShell({
  eyebrow,
  title,
  description,
  activeStep,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  activeStep?: number;
  children: ReactNode;
}) {
  return (
    <div className="pmb-page">
      <section className="pmb-hero">
        <div className="section-shell pmb-hero-inner">
          <Link href="/" className="pmb-back"><ArrowLeft size={15} aria-hidden="true" /> Kembali ke website institusi</Link>
          <p className="eyebrow eyebrow-light"><span aria-hidden="true" />{eyebrow}</p>
          <h1 className="serif-heading">{title}</h1>
          <p>{description}</p>
          <div className="pmb-independent-note">Layanan calon pendaftar terpisah dari portal taruna/i aktif.</div>
        </div>
      </section>
      <div className="section-shell pmb-content-grid">
        <aside className="pmb-process" aria-label="Tahapan penerimaan">
          <p className="pmb-process-heading">Alur penerimaan</p>
          <ol>
            {lifecycle.map((step, index) => {
              const completed = activeStep !== undefined && index < activeStep;
              const current = activeStep === index;
              return (
                <li key={step} className={current ? "is-current" : ""}>
                  <span className="process-step-icon" aria-hidden="true">{completed ? <Check size={14} /> : current ? <Circle size={9} fill="currentColor" /> : <span>{String(index + 1).padStart(2, "0")}</span>}</span>
                  <span>{step}</span>
                </li>
              );
            })}
          </ol>
          <a href="https://sipencatar.kemenhub.go.id/" target="_blank" rel="noreferrer" className="pmb-official-link">
            Kanal SIPENCATAR <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </aside>
        <div className="pmb-main-content">{children}</div>
      </div>
    </div>
  );
}

export function PmbUnavailableNotice({ title = "Layanan pendaftaran sedang disiapkan." }: { title?: string }) {
  return (
    <div className="pmb-notice" role="status">
      <span className="pmb-notice-indicator" aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>Belum ada formulir atau akun PMB yang terhubung. Periksa pengumuman terbaru pada kanal resmi sebelum memasukkan data pribadi.</p>
        <Link href="https://poltektranssdp-palembang.ac.id/pengumuman/" target="_blank" rel="noreferrer">Lihat pengumuman resmi <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
