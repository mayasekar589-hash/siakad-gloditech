import { Facebook, Instagram, MapPin, Phone, Youtube } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/layout/brand-lockup";
import { contactInfo, publicNavigation } from "@/lib/constants";

export function SiteFooter({ hasOfficialLogo }: { hasOfficialLogo: boolean }) {
  return (
    <footer className="site-footer" id="kontak">
      <div className="section-shell footer-main">
        <div className="footer-about">
          <BrandLockup hasOfficialLogo={hasOfficialLogo} compact />
          <p className="footer-institution-title">Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang.</p>
          <p className="footer-description">Mencetak sumber daya manusia transportasi yang profesional, berintegritas, dan siap berkontribusi bagi kemajuan sektor transportasi di Indonesia.</p>
          <span className="footer-gold-rule" aria-hidden="true" />
        </div>

        <div className="footer-column">
          <h2>Jelajahi</h2>
          <span className="footer-heading-rule" aria-hidden="true" />
          <nav aria-label="Navigasi footer">
            <ul>
              {publicNavigation.filter((item) => item.label !== "Beranda" && item.label !== "Informasi").map((item) => <li key={item.label}><Link href={item.href}>{item.label}</Link></li>)}
              <li><Link href="/#kontak">Kontak</Link></li>
            </ul>
          </nav>
        </div>

        <div className="footer-column footer-contact">
          <h2>Kontak institusi</h2>
          <span className="footer-heading-rule" aria-hidden="true" />
          <div className="footer-contact-details">
            <address><MapPin size={19} aria-hidden="true" /><span>{contactInfo.address}</span></address>
            <a href={`tel:${contactInfo.phone.replace(/[^+\d]/g, "")}`}><Phone size={19} aria-hidden="true" /><span>{contactInfo.phone}</span></a>
            {contactInfo.email ? <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a> : null}
          </div>
          <div className="social-links" aria-label="Media sosial resmi">
            <a href="https://www.instagram.com/poltektranssdp/" aria-label="Instagram Poltektrans SDP Palembang" target="_blank" rel="noreferrer"><Instagram size={19} aria-hidden="true" /></a>
            <a href="https://www.youtube.com/@poltektranssdp" aria-label="YouTube Poltektrans SDP Palembang" target="_blank" rel="noreferrer"><Youtube size={19} aria-hidden="true" /></a>
            <a href="https://www.facebook.com/PoltektranSDP/" aria-label="Facebook Poltektrans SDP Palembang" target="_blank" rel="noreferrer"><Facebook size={19} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="section-shell footer-bottom-inner">
          <span>© {new Date().getFullYear()} Poltektrans SDP Palembang. All rights reserved.</span>
          <span>Informasi resmi institusi akan diperbarui melalui kanal resmi.</span>
        </div>
      </div>
    </footer>
  );
}