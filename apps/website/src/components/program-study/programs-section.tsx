import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { programs } from "@/lib/constants";
import { ProgramCard } from "@/components/program-study/program-card";

export function ProgramsSection() {
  return (
    <section className="programs-section section-space" id="program-studi" aria-labelledby="programs-title">
      <div className="section-shell programs-shell">
        <div className="programs-heading-row">
          <div className="programs-heading-copy">
            <p className="programs-eyebrow"><span aria-hidden="true" />PILIHAN AKADEMIK</p>
            <h2 className="programs-title serif-heading" id="programs-title">Kenali bidang <span>studi.</span></h2>
            <p className="programs-description">Program vokasi dalam rumpun transportasi sungai, danau, dan penyeberangan.</p>
          </div>
          <Link className="programs-all-link" href="https://poltektranssdp-palembang.ac.id/program-studi/" target="_blank" rel="noreferrer">
            Informasi akademik resmi <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="program-grid">
          {programs.map((program, index) => <ProgramCard key={program.slug} program={program} index={index} />)}
        </div>
        <p className="content-note programs-note">Nama dan jenjang di atas adalah daftar awal. Rincian kurikulum, daya tampung, dan persyaratan perlu merujuk publikasi resmi terbaru.</p>
      </div>
    </section>
  );
}
