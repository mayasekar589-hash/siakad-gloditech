import Image from "next/image";
import { BookOpen, HardHat, Route, ShieldCheck, type LucideIcon } from "lucide-react";

type EducationPrinciple = {
  icon: LucideIcon;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
};

const educationPrinciples: EducationPrinciple[] = [
  {
    icon: BookOpen,
    title: "Pendidikan vokasi",
    description: "Pembelajaran diarahkan pada pemahaman bidang dan keterampilan terapan.",
    image: "/assets/program/nautika.jpg",
    imageAlt: "Taruna berlatih di atas kapal latih.",
    imagePosition: "center 48%"
  },
  {
    icon: Route,
    title: "Transportasi perairan",
    description: "Ruang lingkup sungai, danau, dan penyeberangan menjadi konteks pendidikan.",
    image: "/assets/program/mtpd.jpg",
    imageAlt: "Kapal dan dermaga di lingkungan transportasi perairan.",
    imagePosition: "center 55%"
  },
  {
    icon: HardHat,
    title: "Pembelajaran praktis",
    description: "Pengetahuan akademik dipertemukan dengan pengalaman lingkungan kerja.",
    image: "/assets/program/permesinan.jpg",
    imageAlt: "Fasilitas praktik dengan mesin dan peralatan maritim.",
    imagePosition: "center 56%"
  },
  {
    icon: ShieldCheck,
    title: "Karakter profesional",
    description: "Disiplin, keselamatan, dan tanggung jawab menjadi nilai yang terus dibangun.",
    image: "/assets/hero/hero-04.webp",
    imageAlt: "Taruna mengikuti kegiatan bersama di atas kapal.",
    imagePosition: "center 54%"
  }
];

export function WhyPoltektransSection() {
  return (
    <section className="why-section section-space" id="akademik" aria-labelledby="why-title">
      <div className="section-shell">
        <div className="why-intro">
          <div className="why-heading">
            <p className="why-eyebrow"><span aria-hidden="true" />ARAH PENDIDIKAN</p>
            <h2 className="serif-heading" id="why-title">Belajar untuk memahami,<br />terampil untuk <span>melayani.</span></h2>
            <p className="why-description">Nilai pendidikan vokasi yang relevan dengan konektivitas dan mobilitas di perairan daratan.</p>
          </div>
          <p className="why-aside">Keterangan ini merupakan arah editorial situs; rincian kurikulum dan capaian pendidikan mengikuti dokumen resmi institusi.</p>
        </div>
        <div className="why-list">
          {educationPrinciples.map(({ icon: Icon, title, description, image, imageAlt, imagePosition }, index) => (
            <article className="why-item" key={title}>
              <div className="why-topline">
                <span className="why-index">0{index + 1}</span>
                <span className="why-index-accent" aria-hidden="true" />
              </div>
              <div className="why-visual">
                <div className="why-image-frame">
                  <Image src={image} alt={imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 960px) 50vw, 25vw" className="why-image" style={{ objectPosition: imagePosition }} />
                </div>
                <span className={`why-icon why-icon-${index + 1}`}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span>
              </div>
              <div className="why-copy">
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
              <span className="why-accent" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
