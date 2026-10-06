import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { newsArticles } from "@/data/news";
import { NewsCard } from "@/components/news/news-card";
import { SectionHeading } from "@/components/sections/section-heading";

export function NewsSection() {
  return (
    <section className="news-section section-space" id="berita" aria-labelledby="news-title">
      <div className="section-shell">
        <div className="news-heading-row">
          <SectionHeading eyebrow="Kabar institusi" title="Berita & informasi." description="Pilihan kabar dari kanal berita resmi Poltektrans SDP Palembang." headingId="news-title" />
          <Link className="text-link news-all-link" href="/berita">
            Lihat Selengkapnya <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="news-grid">
          {newsArticles.slice(0, 3).map((article) => <NewsCard article={article} key={article.id} />)}
        </div>
      </div>
    </section>
  );
}
