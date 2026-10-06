import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, GraduationCap, Ship, UsersRound } from "lucide-react";
import { institution } from "@/lib/constants";

const institutionalHighlights = [
  {
    number: "01",
    title: "Kompetensi Vokasi",
    description: "Pendidikan berbasis kebutuhan industri.",
    icon: GraduationCap
  },
  {
    number: "02",
    title: "Pengalaman Praktis",
    description: "Didukung pembelajaran dan pengalaman lapangan.",
    icon: Ship
  },
  {
    number: "03",
    title: "Karakter Profesional",
    description: "Membentuk disiplin, tanggung jawab, dan integritas.",
    icon: UsersRound
  }
];

export function AboutSection() {
  return (
    <section className="about-section section-space" id="tentang" aria-labelledby="about-title">
      <div className="section-shell about-grid">
        <figure className="about-visual">
          <div className="about-image-frame">
            <Image
              src={institution.learningImage}
              alt="Taruna mengikuti kegiatan di atas kapal pelatihan; foto ilustrasi, bukan dokumentasi Poltektrans SDP Palembang."
              fill
              sizes="(max-width: 700px) 100vw, (max-width: 1180px) 45vw, 540px"
              className="about-image"
            />
            <div className="about-image-caption">
              <span>Belajar dekat dengan dunia transportasi</span>
              <a href="https://commons.wikimedia.org/wiki/File:VISIT_OF_SRI_LANKAN_NCC_CADETS_ONBOARD_AND_INTERACTION_WITH_INDIAN_NCC_CADETS_1.jpg" target="_blank" rel="noreferrer">Foto Indian Navy · GODL-India</a>
            </div>
          </div>
        </figure>

        <div className="about-copy">
          <p className="about-eyebrow"><span aria-hidden="true" />TENTANG INSTITUSI</p>
          <h2 className="about-title serif-heading" id="about-title">
            <span>Pendidikan vokasi yang</span>
            <span>dekat dengan dunia</span>
            <span className="about-title-accent">transportasi.</span>
          </h2>
          <p className="about-lead">
            Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang hadir sebagai institusi pendidikan vokasi yang berfokus pada pengembangan kompetensi di bidang transportasi perairan daratan.
          </p>
          <p className="about-description">
            Pembelajaran dirancang untuk mempertemukan pengetahuan, keterampilan, dan karakter profesional dengan kebutuhan dunia transportasi.
          </p>
          <ul className="about-highlights" aria-label="Keunggulan institusi">
            {institutionalHighlights.map(({ number, title, description, icon: Icon }) => (
              <li className="about-highlight" key={number}>
                <span className="about-highlight-icon"><Icon size={19} aria-hidden="true" /></span>
                <div className="about-highlight-copy">
                  <span className="about-highlight-number">{number}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link className="about-cta" href="https://poltektranssdp-palembang.ac.id/" target="_blank" rel="noreferrer">
            Kenali institusi kami <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
