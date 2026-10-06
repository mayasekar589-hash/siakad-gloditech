import { Anchor, ArrowUpRight, Route, Settings2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { ProgramStudy } from "@/types/content";

const programIcons = {
  nautika: Anchor,
  mesin: Settings2,
  mtp: Route
};

export function ProgramCard({ program, index }: { program: ProgramStudy; index: number }) {
  const Icon = programIcons[program.icon];

  return (
    <article className="program-card">
      <Image src={program.imageSrc} alt={program.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 960px) 50vw, 33vw" className="program-card-image" />
      <div className="program-card-content">
        <div className="program-card-top">
          <span className="program-number">0{index + 1}</span>
          <span className="program-degree">{program.degree}</span>
        </div>
        <span className={`program-icon-wrap program-icon-${program.icon}`}><Icon size={23} strokeWidth={1.7} aria-hidden="true" /></span>
        <p className="program-field">{program.field}</p>
        <h3>{program.name}</h3>
        <p className="program-description">{program.description}</p>
        <Link className="program-link" href={`/program-studi/${program.slug}`}>
          <span>Lihat program</span>
          <span className="program-link-icon"><ArrowUpRight size={16} aria-hidden="true" /></span>
        </Link>
      </div>
    </article>
  );
}
