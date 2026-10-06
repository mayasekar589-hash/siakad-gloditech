import { BookOpen, Database, Info, Link2 } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

interface LoginCardProps {
  children: ReactNode;
}

export function LoginCard({ children }: LoginCardProps) {
  return <section aria-label="Masuk ke SiAkad Back Office" className="login-card">{children}</section>;
}

export function AuthNotice() {
  return (
    <aside className="auth-notice">
      <Info size={17} aria-hidden="true" />
      <p>Mode DEMO. Akun admin ini hanya untuk pengujian lokal dan tidak boleh digunakan sebagai akun produksi.</p>
    </aside>
  );
}

const featureHighlights = [
  { label: "Akademik Terintegrasi", Icon: BookOpen },
  { label: "Data Terpusat", Icon: Database },
  { label: "Siap Integrasi", Icon: Link2 }
];

export function LoginBranding() {
  return (
    <section aria-label="SiAkad Back Office Poltektrans SDP Palembang" className="login-brand-panel">
      <div className="login-brand-lockup">
        <span className="login-brand-emblem">
          <Image alt="Lambang resmi Poltektrans SDP Palembang" height={750} priority src="/assets/logo-poltektrans.png" width={2400} />
        </span>
        <span className="login-brand-name">
          <strong>SiAkad</strong>
          <span>Back Office</span>
          <small>POLTEKTRANS SDP PALEMBANG</small>
        </span>
      </div>
      <div className="login-brand-copy">
        <span aria-hidden="true" className="login-brand-rule" />
        <h1>Pengelolaan Akademik<br />untuk Pendidikan<br />Transportasi yang<br /><span>Lebih Maju.</span></h1>
        <p>SiAkad Back Office mendukung pengelolaan akademik yang terintegrasi, akurat, dan efisien untuk mewujudkan taruna yang unggul dan berdaya saing di sektor transportasi Indonesia.</p>
        <ul className="login-feature-list">
          {featureHighlights.map(({ label, Icon }) => (
            <li key={label}><span className="login-feature-icon"><Icon size={20} aria-hidden="true" /></span>{label}</li>
          ))}
        </ul>
      </div>
      <p className="login-brand-tagline">DISIPLIN <span aria-hidden="true">•</span> PROFESIONAL <span aria-hidden="true">•</span> BERINTEGRITAS</p>
    </section>
  );
}
