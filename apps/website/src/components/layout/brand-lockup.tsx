import Image from "next/image";
import Link from "next/link";

type BrandLockupProps = {
  hasOfficialLogo: boolean;
  compact?: boolean;
  logoOnly?: boolean;
};

export function BrandLockup({ hasOfficialLogo, compact = false, logoOnly = false }: BrandLockupProps) {
  return (
    <Link className={`brand-lockup${compact ? " brand-lockup-compact" : ""}${logoOnly ? " brand-logo-only" : ""}`} href="/" aria-label="Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang, beranda">
      {hasOfficialLogo ? (
        <span className="brand-symbol-window" aria-hidden={!logoOnly}>
          <Image
            src="/assets/logo-poltektrans.png"
            alt={logoOnly ? "Poltektrans SDP Palembang" : ""}
            width={2400}
            height={750}
            priority={!compact}
            className="brand-image"
          />
        </span>
      ) : (
        <span className="brand-type" aria-label="Logo resmi belum tersedia">
          <span className="brand-type-main">POLTEKTRANS SDP</span>
          <span className="brand-type-sub">PALEMBANG</span>
        </span>
      )}
      {hasOfficialLogo && !logoOnly ? (
        <span className="brand-institution-name">
          <strong>POLTEKTRANS SDP</strong>
          <span>PALEMBANG</span>
        </span>
      ) : null}
    </Link>
  );
}