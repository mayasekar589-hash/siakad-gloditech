import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BookOpen, Compass, Route, Settings2 } from "lucide-react";
import { programs, institution } from "@/lib/constants";
import type { ProgramStudy } from "@/types/content";

const iconForProgram = {
  nautika: Compass,
  mesin: Settings2,
  mtp: Route
};

export function generateStaticParams() {
  return programs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  return { title: program ? program.name : "Program Studi" };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programs.find((item) => item.slug === slug);
  if (!program) notFound();

  return <ProgramDetail program={program} />;
}

function ProgramDetail({ program }: { program: ProgramStudy }) {
  const Icon = iconForProgram[program.icon];

  return (
    <div className="program-detail-page">
      <section className="program-detail-hero">
        <Image src={institution.heroImage} alt="Kapal penumpang melintas di sungai; foto ilustrasi transportasi perairan." fill sizes="100vw" className="program-detail-image" />
        <div className="program-detail-scrim" aria-hidden="true" />
        <div className="section-shell program-detail-copy">
          <Link className="pmb-back" href="/#program-studi"><ArrowLeft size={15} aria-hidden="true" /> Kembali ke program studi</Link>
          <p className="eyebrow eyebrow-light"><span aria-hidden="true" />{program.degree} · Program studi</p>
          <div className="program-detail-title-row"><span className="program-detail-icon"><Icon size={23} aria-hidden="true" /></span><h1 className="serif-heading">{program.name}</h1></div>
          <p>{program.field}</p>
        </div>
      </section>
      <section className="section-shell program-detail-body section-space">
        <div>
          <p className="eyebrow"><span aria-hidden="true" />Gambaran bidang</p>
          <h2 className="serif-heading">Mengenal ruang lingkup pembelajaran.</h2>
        </div>
        <div className="program-detail-summary">
          <p>{program.description}</p>
          <p className="content-note">Halaman ini adalah pengantar awal. Rincian kurikulum, fasilitas, persyaratan masuk, dan profil lulusan harus mengikuti publikasi akademik resmi.</p>
          <div className="program-detail-actions">
            <Link className="button button-primary" href="/pmb">Informasi PMB <ArrowUpRight size={15} aria-hidden="true" /></Link>
            <a className="button button-secondary" href="https://poltektranssdp-palembang.ac.id/program-studi/" target="_blank" rel="noreferrer"><BookOpen size={15} aria-hidden="true" /> Rujuk situs institusi</a>
          </div>
        </div>
      </section>
    </div>
  );
}
