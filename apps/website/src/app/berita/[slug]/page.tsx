import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { NewsCard } from "@/components/news/news-card";
import { newsArticles } from "@/data/news";

type NewsArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return newsArticles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: NewsArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = newsArticles.find((item) => item.slug === slug);
  if (!article) return { title: "Berita tidak ditemukan" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.image, alt: article.imageAlt }]
    }
  };
}

export default async function NewsArticlePage({ params }: NewsArticlePageProps) {
  const { slug } = await params;
  const article = newsArticles.find((item) => item.slug === slug);
  if (!article) notFound();

  const relatedArticles = newsArticles.filter((item) => item.slug !== article.slug).slice(0, 2);

  return (
    <article className="news-article-page">
      <div className="section-shell news-article-shell">
        <nav className="news-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Beranda</Link><span aria-hidden="true">/</span><Link href="/berita">Berita</Link><span aria-hidden="true">/</span><span aria-current="page">{article.title}</span>
        </nav>
        <div className="news-article-layout">
          <div className="news-article-main">
            <header className="news-article-header">
              <p className="news-article-category">{article.category}</p>
              <time className="news-article-date">{article.date}</time>
              <h1 className="serif-heading">{article.title}</h1>
              <p className="news-article-excerpt">{article.excerpt}</p>
            </header>
            <figure className="news-article-image">
              <Image src={article.image} alt={article.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 820px" />
            </figure>
            <div className="news-article-body">
              {article.content?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {!article.content?.length ? <p className="news-source-note">Ringkasan ini merujuk pada publikasi {article.sourceName}.</p> : null}
              {article.sourceUrl ? <a className="news-article-source" href={article.sourceUrl} target="_blank" rel="noreferrer">Sumber: {article.sourceName} <ArrowUpRight size={15} aria-hidden="true" /></a> : null}
            </div>
            <Link className="news-back-link" href="/berita">Berita lainnya <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
          <aside className="related-news" aria-labelledby="related-news-title">
            <h2 id="related-news-title">Berita lainnya</h2>
            {relatedArticles.map((related) => <NewsCard key={related.id} article={related} />)}
          </aside>
        </div>
      </div>
    </article>
  );
}