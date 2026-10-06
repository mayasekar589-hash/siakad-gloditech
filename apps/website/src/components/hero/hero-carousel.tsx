"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { heroSlides } from "@/lib/hero-data";

const AUTOPLAY_INTERVAL = 6500;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const activeSlide = heroSlides[activeIndex];

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % heroSlides.length);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  }, []);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    updateMotionPreference();
    motionQuery.addEventListener("change", updateMotionPreference);
    return () => motionQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) showNext();
    }, AUTOPLAY_INTERVAL);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, showNext]);

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
    }
  }

  return (
    <section
      className="hero-section hero-carousel"
      id="beranda"
      aria-roledescription="carousel"
      aria-label="Poltektrans SDP Palembang"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="hero-media-stack">
        {heroSlides.map((slide, index) => (
          <Image
            key={slide.id}
            src={slide.image}
            alt={index === activeIndex ? slide.imageAlt : ""}
            aria-hidden={index !== activeIndex}
            fill
            loading={index === activeIndex ? "eager" : "lazy"}
            sizes="100vw"
            className={`hero-image${index === activeIndex ? " is-active" : ""}`}
          />
        ))}
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-grid section-shell">
        <div className="hero-copy" key={activeSlide.id}>
          <p className="hero-kicker">{activeSlide.eyebrow}</p>
          <h1 id="hero-title" className="serif-heading">{activeSlide.title}</h1>
          <p className="hero-description">{activeSlide.description}</p>
          <div className="hero-actions">
            <Link className="button button-accent" href="/pendaftaran">
              Daftar Sekarang <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button button-hero-secondary" href="#tentang">
              <span className="hero-secondary-icon" aria-hidden="true"><ArrowDown size={14} /></span>
              Jelajahi Kampus
            </Link>
          </div>
          <p className="hero-note">Informasi penerimaan mengikuti pengumuman resmi institusi.</p>
        </div>
      </div>

      <div className="hero-carousel-controls" aria-label="Navigasi slide">
        <button type="button" className="hero-arrow hero-arrow-previous" aria-label="Slide sebelumnya" onClick={showPrevious}>
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <div className="hero-indicators" role="group" aria-label="Pilih slide">
          {heroSlides.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              className={`hero-indicator${index === activeIndex ? " is-active" : ""}`}
              aria-label={`Buka slide ${index + 1}: ${slide.eyebrow}`}
              aria-current={index === activeIndex ? "true" : undefined}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <button type="button" className="hero-arrow hero-arrow-next" aria-label="Slide berikutnya" onClick={showNext}>
          <ArrowRight size={19} aria-hidden="true" />
        </button>
        <div className="hero-carousel-meta">
          <div className="hero-slide-count" aria-live={paused || reducedMotion ? "polite" : "off"} aria-atomic="true">
            <span>{String(activeIndex + 1).padStart(2, "0")}</span><span className="hero-count-divider">/</span><span>{String(heroSlides.length).padStart(2, "0")}</span>
          </div>
          <button
            type="button"
            className="hero-autoplay-toggle"
            aria-label={reducedMotion ? "Pemutaran otomatis dinonaktifkan sesuai preferensi gerak" : paused ? "Lanjutkan pemutaran otomatis" : "Jeda pemutaran otomatis"}
            aria-pressed={paused || reducedMotion}
            disabled={reducedMotion}
            onClick={() => setPaused((value) => !value)}
          >
            {paused || reducedMotion ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
          </button>
        </div>
      </div>
      <p className="hero-image-credit">Foto resmi Poltektrans SDP Palembang</p>
    </section>
  );
}
