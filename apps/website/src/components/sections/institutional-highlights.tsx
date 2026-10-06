import { BookOpen, Settings2, UsersRound, ShieldCheck } from "lucide-react";

const highlights = [
  { icon: BookOpen, title: "Pendidikan Vokasi", detail: "Berbasis kompetensi", color: "blue" },
  { icon: Settings2, title: "Praktik & Pengalaman", detail: "Mengenal pembelajaran terapan", color: "gold" },
  { icon: UsersRound, title: "Lingkungan Profesional", detail: "Mengenal bidang transportasi", color: "green" },
  { icon: ShieldCheck, title: "Pengembangan Karakter", detail: "Disiplin dan tanggung jawab", color: "red" }
];

export function InstitutionalHighlights() {
  return (
    <section className="highlights-section" id="sorotan" aria-label="Sorotan pendidikan">
      <div className="section-shell highlights-grid">
        {highlights.map(({ icon: Icon, title, detail, color }) => (
          <article className="highlight-item" key={title}>
            <span className={`highlight-icon-wrap highlight-icon-${color}`} aria-hidden="true">
              <Icon className="highlight-icon" size={21} strokeWidth={1.8} />
            </span>
            <div>
              <h2>{title}</h2>
              <p>{detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
