import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/data/news";

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="news-card">
      <Link className="news-card-image" href={`/berita/${article.slug}`} aria-label={`Baca berita: ${article.title}`}>
        <Image src={article.image} alt={article.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 960px) 50vw, 33vw" className="news-image" />
      </Link>
      <div className="news-card-copy">
        <p className="news-category">{article.category}</p>
        <time className="news-date">{article.date}</time>
        <h3><Link href={`/berita/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <Link className="news-read-link" href={`/berita/${article.slug}`}>
          Baca berita <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}