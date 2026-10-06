"use client";

import Image from "next/image";
import { ArrowUpRight, Bell, CalendarDays, GraduationCap, Megaphone, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { announcements } from "@/lib/constants";
import type { Announcement } from "@/types/content";

const categories = ["Semua", "Pengumuman", "Agenda", "Informasi Akademik", "Informasi PMB"] as const;
type CategoryFilter = typeof categories[number];

const announcementIcons: Record<Announcement["category"], LucideIcon> = {
  "Informasi PMB": Megaphone,
  "Pengumuman": Bell,
  "Informasi Akademik": GraduationCap,
  "Agenda": CalendarDays
};

function matchesCategory(item: Announcement, selected: CategoryFilter) {
  return selected === "Semua" || item.category === selected;
}

export function InformationBoard() {
  const [selected, setSelected] = useState<CategoryFilter>("Semua");
  const visibleAnnouncements = announcements.filter((item) => matchesCategory(item, selected));
  const [featuredAnnouncement, ...otherAnnouncements] = visibleAnnouncements;

  return (
    <section className="information-section section-space" id="informasi" aria-labelledby="information-title">
      <div className="information-shell information-grid">
        <div className="information-intro">
          <p className="information-eyebrow"><span aria-hidden="true" />PUSAT INFORMASI</p>
          <h2 id="information-title" className="serif-heading">
            <span>Pengumuman</span>
            <span>dan <em>agenda.</em></span>
          </h2>
          <p>Informasi yang ditampilkan merujuk kanal resmi institusi. Pastikan tanggal dan persyaratan pada dokumen sumber sebelum mengambil tindakan.</p>
          <a className="information-channel-link" href="https://poltektranssdp-palembang.ac.id/pengumuman/" target="_blank" rel="noreferrer">
            Kunjungi kanal pengumuman <ArrowUpRight size={16} aria-hidden="true" />
          </a>
          <figure className="information-editorial-figure">
            <div className="information-editorial-image">
              <Image
                src="/assets/hero/hero-04.webp"
                alt="Taruna mengikuti kegiatan pembelajaran dan praktik di lingkungan maritim."
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 960px) 42vw, 480px"
                className="information-image"
              />
            </div>
          </figure>
        </div>

        <div className="information-content">
          <nav className="information-tabs" role="tablist" aria-label="Kategori informasi">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                role="tab"
                aria-selected={selected === category}
                className={selected === category ? "information-tab is-selected" : "information-tab"}
                onClick={() => setSelected(category)}
              >
                {category}
              </button>
            ))}
          </nav>
          <div className="announcement-results" role="tabpanel" aria-live="polite">
            {featuredAnnouncement ? (() => {
              const Icon = announcementIcons[featuredAnnouncement.category];
              return (
                <article className="announcement-featured" key={`featured-${featuredAnnouncement.title}`}>
                  <div className="announcement-feature-copy">
                    <span className="announcement-icon announcement-icon-featured"><Icon size={20} aria-hidden="true" /></span>
                    <div className="announcement-feature-text">
                      <div className="announcement-meta"><span>{featuredAnnouncement.category}</span><time>{featuredAnnouncement.date}</time></div>
                      <h3>{featuredAnnouncement.title}</h3>
                      <a className="announcement-source" href={featuredAnnouncement.href} target="_blank" rel="noreferrer">
                        Buka sumber resmi <ArrowUpRight size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                  <div className="announcement-feature-image">
                    <Image
                      src="/assets/program/mtpd.jpg"
                      alt="Kapal dan dermaga sebagai bagian dari transportasi perairan."
                      fill
                      sizes="(max-width: 700px) 100vw, 32vw"
                      className="information-image"
                    />
                  </div>
                </article>
              );
            })() : null}

            <div className="announcement-list">
              {otherAnnouncements.map((item) => {
                const Icon = announcementIcons[item.category];
                return (
                  <article className="announcement-row" key={`${item.category}-${item.title}`}>
                    <span className={`announcement-icon announcement-icon-${item.category.toLowerCase().replaceAll(" ", "-")}`} aria-hidden="true">
                      <Icon size={20} strokeWidth={1.8} />
                    </span>
                    <div className="announcement-content">
                      <div className="announcement-meta"><span>{item.category}</span><time>{item.date}</time></div>
                      <h3>{item.title}</h3>
                      <a className="announcement-source" href={item.href} target="_blank" rel="noreferrer">
                        Buka sumber resmi <ArrowUpRight size={13} aria-hidden="true" />
                      </a>
                    </div>
                    <a className="announcement-arrow" href={item.href} target="_blank" rel="noreferrer" aria-label={`Buka sumber resmi: ${item.title}`}>
                      <ArrowUpRight size={17} aria-hidden="true" />
                    </a>
                  </article>
                );
              })}
            </div>
            {visibleAnnouncements.length === 0 ? <p className="empty-announcements">Belum ada informasi pada kategori ini.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
