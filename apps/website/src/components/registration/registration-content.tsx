import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleHelp, FileText, GraduationCap, ListChecks, MessageCircle, UsersRound, Wallet } from "lucide-react";
import { RegistrationInformationHub } from "@/components/registration/registration-information-hub";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import { registrationConfig } from "@/features/registration/config";
import { sipencatarRoutes } from "@/features/registration/data/admission-programs";
import type { RegistrationType } from "@/features/registration/types";

export const registrationOptions = [
  ...sipencatarRoutes.map((route) => ({
    slug: route.slug,
    title: route.title,
    description: route.description,
    imageSrc: route.imageSrc,
    imageAlt: route.imageAlt,
    Icon: route.registrationType === "POLA_PEMBIBITAN" ? GraduationCap : UsersRound,
    accent: route.accent
  })),
  {
    slug: "informasi",
    title: "Informasi Pendaftaran",
    description: "Persyaratan, jadwal, alur pendaftaran, biaya pendidikan, dan pertanyaan yang sering diajukan.",
    imageSrc: "/assets/hero/hero-02.webp",
    imageAlt: "Forum institusi membahas transportasi perairan dan penyeberangan.",
    Icon: FileText,
    accent: "sage"
  }
] as const;

export type RegistrationOption = (typeof registrationOptions)[number];

export function getRegistrationOption(slug: string) {
  return registrationOptions.find((option) => option.slug === slug);
}

export function RegistrationLanding() {
  const informationCards = [
    { label: "Persyaratan", description: "Persyaratan umum dan khusus setiap jalur pendaftaran.", href: "/pendaftaran/informasi#persyaratan", Icon: ListChecks },
    { label: "Jadwal", description: "Informasi jadwal pendaftaran, seleksi, dan pelaksanaan.", href: "/pendaftaran/informasi#jadwal", Icon: CalendarDays },
    { label: "Biaya", description: "Rincian biaya pendaftaran dan pendidikan/pelatihan.", href: "/pendaftaran/informasi#biaya", Icon: Wallet },
    { label: "Dokumen", description: "Daftar dokumen yang perlu disiapkan.", href: "/pendaftaran/informasi#dokumen", Icon: FileText },
    { label: "FAQ", description: "Pertanyaan yang sering diajukan.", href: "/pendaftaran/informasi#faq-informasi", Icon: CircleHelp }
  ];

  return (
    <div className="registration-page">
      <section className="registration-hero" aria-labelledby="registration-title">
        <div className="registration-shell registration-hero-grid">
          <div className="registration-hero-copy">
            <p className="registration-eyebrow"><span aria-hidden="true" />Pendaftaran</p>
            <h1 id="registration-title">Pilih Jenis Pendaftaran</h1>
            <p className="registration-hero-description">Temukan jalur pendaftaran yang sesuai dengan tujuan Anda. Poltektrans SDP Palembang menyediakan berbagai jalur penerimaan dan program diklat untuk mendukung pengembangan sumber daya manusia di sektor transportasi.</p>
          </div>
          <div className="registration-hero-image">
            <Image
              src="/assets/admissions/taruna-kapal.jpg"
              alt="Taruna Poltektrans menjalani praktik bersama awak kapal di lingkungan pelabuhan."
              fill
              priority
              sizes="(max-width: 700px) 100vw, 58vw"
            />
          </div>
        </div>
      </section>

      <section className="registration-options registration-hub-options" id="jalur-pendaftaran" aria-labelledby="registration-options-title">
        <div className="registration-shell">
          <section className="registration-category-group" aria-labelledby="sipencatar-title">
            <div className="registration-category-heading">
              <p className="registration-eyebrow">SIPENCATAR</p>
              <h3 id="sipencatar-title">Seleksi Penerimaan Calon Taruna/Taruni</h3>
            </div>
            <div className="registration-admission-grid">
              {sipencatarRoutes.map((route, index) => (
                <article className="registration-admission-card" key={route.id}>
                  <div className="registration-admission-image">
                    <Image src={route.imageSrc} alt={route.imageAlt} fill sizes="(max-width: 700px) 100vw, 38vw" />
                  </div>
                  <div className="registration-admission-copy">
                    <div className="registration-admission-meta">
                      <span className="registration-admission-icon" data-accent={route.accent} aria-hidden="true">
                        {route.registrationType === "POLA_PEMBIBITAN" ? <GraduationCap size={18} /> : <UsersRound size={18} />}
                      </span>
                      <span className="registration-admission-number">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <h4>{route.title}</h4>
                    <p>{route.description}</p>
                    <Link className="registration-editorial-link" href={`/pendaftaran/${route.slug}`}>
                      <span>Lihat Jalur</span><ArrowRight size={17} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <section className="registration-category-group registration-diklat-group" aria-labelledby="diklat-title">
            <div className="registration-category-heading">
              <p className="registration-eyebrow">DIKLAT</p>
              <h3 id="diklat-title">Pendidikan dan Pelatihan</h3>
              <Link className="registration-section-link" href="/pendaftaran/diklat">Lihat Semua Program Diklat<ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <article className="registration-diklat-feature">
              <div className="registration-diklat-image">
                <Image src="/assets/news/bon-voyage.png" alt="Peserta dalam kegiatan pendidikan dan pelatihan transportasi." fill sizes="(max-width: 700px) 100vw, 45vw" />
              </div>
              <div className="registration-diklat-copy">
                <p className="registration-eyebrow">Program Diklat</p>
                <h4>Diklat Keterampilan Pelaut</h4>
                <p>Pendidikan dan pelatihan untuk pengembangan kompetensi di sektor transportasi, khususnya keterampilan dan peningkatan kompetensi pelaut.</p>
                <Link className="registration-editorial-link" href="/pendaftaran/diklat">
                  <span>Lihat Program Diklat</span><ArrowRight size={17} aria-hidden="true" />
                </Link>
                <div className="registration-diklat-links">
                  <Link href="/pendaftaran/diklat/keterampilan">Diklat Keterampilan<ArrowRight size={15} aria-hidden="true" /></Link>
                  <Link href="/pendaftaran/diklat/peningkatan">Diklat Peningkatan<ArrowRight size={15} aria-hidden="true" /></Link>
                </div>
              </div>
            </article>
          </section>
          <section className="registration-category-group registration-information-group" aria-labelledby="registration-information-title">
            <div className="registration-category-heading">
              <p className="registration-eyebrow">Informasi Pendaftaran</p>
              <h3 id="registration-information-title">Informasi Penting untuk Calon Peserta</h3>
              <Link className="registration-section-link" href="/pendaftaran/informasi">Lihat Semua Informasi<ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <nav className="registration-information-list" aria-label="Topik informasi pendaftaran">
              {informationCards.map(({ label, description, href, Icon }, index) => (
                <Link className="registration-information-card" href={href} key={label}>
                  <span className="registration-information-icon" data-tone={index % 2 === 0 ? "gold" : "blue"}><Icon size={19} aria-hidden="true" /></span>
                  <strong>{label}</strong>
                  <span className="registration-information-description">{description}</span>
                  <span className="registration-information-arrow" aria-hidden="true"><ArrowRight size={15} /></span>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </section>
      <section className="registration-help-band" aria-labelledby="registration-help-title">
        <div className="registration-shell registration-help">
          <div className="registration-help-mark" aria-hidden="true"><MessageCircle size={22} strokeWidth={1.8} /></div>
          <div className="registration-help-copy">
            <h2 id="registration-help-title">Punya Pertanyaan?</h2>
            <p>Tim kami siap membantu Anda dalam proses pendaftaran. Hubungi panitia atau lihat FAQ untuk informasi lebih lanjut.</p>
          </div>
          <div className="registration-help-actions">
            <Link className="registration-help-primary" href="/pendaftaran/informasi#kontak-panitia">
              <span>Lihat Kontak Panitia</span><ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RegistrationDetail({ option }: { option: RegistrationOption }) {
  if (option.slug === "informasi") {
    return (
      <div className="registration-page registration-detail-page"><RegistrationInformationHub /></div>
    );
  }

  const registrationType: RegistrationType = option.slug === "pola-pembibitan"
    ? "POLA_PEMBIBITAN"
    : option.slug === "non-pola-pembibitan"
      ? "NON_POLA_PEMBIBITAN"
      : "DIKLAT";

  return (
    <div className="registration-page registration-detail-page"><RegistrationWizard config={registrationConfig[registrationType]} /></div>
  );
}