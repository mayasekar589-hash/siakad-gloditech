"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight, ChevronDown, GraduationCap, Menu, Search, ShipWheel, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { publicNavigation } from "@/lib/constants";

function isCurrentNavigationItem(href: string, pathname: string) {
  return (href === "/#beranda" && pathname === "/") || (href === "/pmb" && pathname.startsWith("/pmb")) || (href === "/berita" && pathname.startsWith("/berita")) || (href === "/pendaftaran" && pathname.startsWith("/pendaftaran"));
}

const registrationMenu = [
  {
    title: "SIPENCATAR",
    links: [
      { label: "Pola Pembibitan", href: "/pendaftaran/pola-pembibitan" },
      { label: "Non Pola Pembibitan", href: "/pendaftaran/non-pola-pembibitan" }
    ]
  },
  {
    title: "DIKLAT",
    links: [
      { label: "Pendaftaran Diklat", href: "/pendaftaran/diklat" },
      { label: "Diklat Peningkatan", href: "/pendaftaran/diklat/peningkatan" },
      { label: "Diklat Keterampilan", href: "/pendaftaran/diklat/keterampilan" }
    ]
  },
  {
    title: "INFORMASI",
    links: [
      { label: "Persyaratan", href: "/pendaftaran/informasi#persyaratan" },
      { label: "Jadwal", href: "/pendaftaran/informasi#jadwal" },
      { label: "Biaya", href: "/pendaftaran/informasi#biaya" },
      { label: "Dokumen", href: "/pendaftaran/informasi#dokumen" },
      { label: "FAQ", href: "/pendaftaran/informasi#faq-informasi" }
    ]
  }
];

const siakadBackofficeUrl = process.env.NEXT_PUBLIC_SIAKAD_URL ?? "http://localhost:3001";
const siakadTarunaUrl = process.env.NEXT_PUBLIC_SIAKAD_TARUNA_URL
  ?? process.env.NEXT_PUBLIC_STUDENT_PORTAL_URL
  ?? process.env.NEXT_PUBLIC_TARUNA_PORTAL_URL
  ?? process.env.NEXT_PUBLIC_STUDENT_URL
  ?? "http://localhost:3000";

export function SiteHeader({ hasOfficialLogo }: { hasOfficialLogo: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-inner">
        <BrandLockup hasOfficialLogo={hasOfficialLogo} logoOnly />

        <nav className="desktop-navigation" aria-label="Navigasi utama">
          {publicNavigation.map((item) => {
            const isCurrent = isCurrentNavigationItem(item.href, pathname);
            return (
              <Link key={item.label} href={item.href} className={isCurrent ? "is-active" : undefined} aria-current={isCurrent ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
          <details className="desktop-registration-menu">
            <summary aria-label="Buka menu Pendaftaran" aria-current={pathname.startsWith("/pendaftaran") ? "page" : undefined}>
              Pendaftaran<ChevronDown size={13} aria-hidden="true" />
            </summary>
            <div className="registration-mega-menu">
              {registrationMenu.map((group) => (
                <section className="registration-mega-column" key={group.title}>
                  <h2>{group.title}</h2>
                  {group.links.map((item) => (
                    <Link href={item.href} key={item.label}>
                      {item.label}<ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  ))}
                </section>
              ))}
            </div>
          </details>
        </nav>

        <div className="header-actions">
          <a className="header-search" href="https://poltektranssdp-palembang.ac.id/?s=" aria-label="Cari informasi di situs resmi" target="_blank" rel="noreferrer">
            <Search size={18} aria-hidden="true" />
          </a>
          <a
            className="taruna-portal-link"
            href={`${siakadTarunaUrl.replace(/\/$/, "")}/login`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Login SiAkad Taruna"
          >
            <span className="taruna-portal-mark" aria-hidden="true"><ShipWheel size={19} strokeWidth={1.8} /></span>
            <span>SiAkad Taruna</span>
            <ArrowUpRight className="taruna-portal-arrow" size={15} aria-hidden="true" />
          </a>
          <Link className="button button-accent button-small header-register" href="/pendaftaran">
            <GraduationCap size={18} aria-hidden="true" />
            <span>Daftar Sekarang</span>
            <ArrowUpRight className="register-arrow" size={16} aria-hidden="true" />
          </Link>
          <a
            className="siakad-link"
            href={siakadBackofficeUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka Portal Back Office SiAkad"
          >
            <span className="siakad-brand-mark" aria-hidden="true">
              <Image src="/assets/logo-poltektrans.png" alt="" width={2400} height={750} unoptimized />
            </span>
            <span className="siakad-link-copy"><strong>SiAkad</strong><small>Portal Back Office</small></span>
            <ArrowUpRight className="siakad-link-arrow" size={16} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="mobile-menu-button"
            aria-label={menuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <nav id="mobile-navigation" className={`mobile-navigation${menuOpen ? " is-open" : ""}`} aria-label="Navigasi seluler" hidden={!menuOpen}>
        {publicNavigation.map((item) => {
          const isCurrent = isCurrentNavigationItem(item.href, pathname);
          return (
            <Link key={item.label} href={item.href} className={isCurrent ? "is-active" : undefined} aria-current={isCurrent ? "page" : undefined} onClick={closeMenu}>
              {item.label}
            </Link>
          );
        })}
        <details className="mobile-registration-menu">
          <summary>Pendaftaran<ChevronDown size={15} aria-hidden="true" /></summary>
          <div className="mobile-registration-groups">
            {registrationMenu.map((group) => (
              <details key={group.title}>
                <summary>{group.title}<ChevronDown size={14} aria-hidden="true" /></summary>
                <div>
                  {group.links.map((item) => (
                    <Link href={item.href} key={item.label} onClick={closeMenu}>
                      {item.label}<ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </details>
        <a
          className="mobile-taruna-link"
          href={`${siakadTarunaUrl.replace(/\/$/, "")}/login`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Login SiAkad Taruna"
          onClick={closeMenu}
        >
          <span className="taruna-portal-mark" aria-hidden="true"><ShipWheel size={18} strokeWidth={1.8} /></span>
          <span className="mobile-taruna-copy"><strong>SiAkad Taruna</strong><small>Login Taruna</small></span>
          <ArrowUpRight className="taruna-portal-arrow" size={15} aria-hidden="true" />
        </a>
        <a
          className="mobile-siakad-link"
          href={siakadBackofficeUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Buka Portal Back Office SiAkad"
        >
          <span className="siakad-brand-mark" aria-hidden="true">
            <Image src="/assets/logo-poltektrans.png" alt="" width={2400} height={750} unoptimized />
          </span>
          <span className="siakad-link-copy"><strong>SiAkad</strong><small>Portal Back Office</small></span>
          <ArrowUpRight className="siakad-link-arrow" size={16} aria-hidden="true" />
        </a>
        <div className="mobile-navigation-actions">
          <Link className="button button-accent" href="/pendaftaran" onClick={closeMenu}>
            <GraduationCap size={17} aria-hidden="true" />
            Daftar Sekarang
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}