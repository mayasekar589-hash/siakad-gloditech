"use client";

import { useState } from "react";
import { NewsCard } from "@/components/news/news-card";
import { NewsHero } from "@/components/news/news-hero";
import { newsArticles, newsCategories } from "@/data/news";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type NewsCategoryFilter = typeof newsCategories[number];

export function NewsListing() {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategoryFilter>("Semua");
  const filteredArticles = newsArticles.filter((article) => selectedCategory === "Semua" || article.category === selectedCategory);
  const [featuredArticle, ...otherArticles] = filteredArticles;

  return (
    <div className="news-page">
      <NewsHero />
      <section className="news-listing section-space" aria-label="Daftar berita institusi">
        <div className="section-shell news-listing-shell">
          <nav className="news-category-filter" aria-label="Filter kategori berita">
            {newsCategories.map((category) => (
              <button
                type="button"
                key={category}
                aria-pressed={selectedCategory === category}
                className={selectedCategory === category ? "news-filter is-selected" : "news-filter"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          {featuredArticle ? (
            <article className="news-featured">
              <Link className="news-featured-image" href={`/berita/${featuredArticle.slug}`} aria-label={`Baca berita: ${featuredArticle.title}`}>
                <Image src={featuredArticle.image} alt={featuredArticle.imageAlt} fill priority sizes="(max-width: 900px) 100vw, 54vw" />
              </Link>
              <div className="news-featured-copy">
                <p className="news-featured-category">{featuredArticle.category}</p>
                <time className="news-date">{featuredArticle.date}</time>
                <h2 className="serif-heading"><Link href={`/berita/${featuredArticle.slug}`}>{featuredArticle.title}</Link></h2>
                <p>{featuredArticle.excerpt}</p>
                <Link className="news-read-link" href={`/berita/${featuredArticle.slug}`}>Baca berita <ArrowRight size={15} aria-hidden="true" /></Link>
              </div>
            </article>
          ) : null}

          {otherArticles.length ? (
            <section className="news-listing-results" aria-label="Berita lainnya">
              <h2 className="news-results-heading">Kabar terbaru</h2>
              <div className="news-listing-grid">
              {otherArticles.map((article) => <NewsCard key={article.id} article={article} />)}
              </div>
            </section>
          ) : null}
          {filteredArticles.length === 0 ? <p className="news-empty-state">Belum ada berita dalam kategori ini.</p> : null}
        </div>
      </section>
    </div>
  );
}