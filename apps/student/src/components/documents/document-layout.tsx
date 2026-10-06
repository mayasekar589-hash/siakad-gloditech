import Image from "next/image";
import type { ReactNode, TableHTMLAttributes } from "react";

export type DocumentType =
  | "KRS"
  | "KHS"
  | "RENCANA_STUDI"
  | "REKAP_STUDI"
  | "TRANSKRIP"
  | "NILAI"
  | "REKAP_NILAI"
  | "JADWAL"
  | "JADWAL_UJIAN"
  | "PRESENSI"
  | "REKAP_PRESENSI"
  | "KALENDER_AKADEMIK"
  | "PROFIL_TARUNA"
  | "KARTU_TARUNA"
  | "DATA_AKADEMIK"
  | "DOKUMEN_AKADEMIK"
  | "SURAT_AKADEMIK"
  | "MATERI"
  | "TUGAS"
  | "DETAIL_TUGAS"
  | "REKAP_TUGAS"
  | "UJIAN_QUIZ"
  | "HASIL_UJIAN"
  | "REKAP_NILAI_QUIZ"
  | "DISKUSI"
  | "KALENDER_PEMBELAJARAN"
  | "REKAP_AKTIVITAS_PEMBELAJARAN"
  | "PROGRESS_PEMBELAJARAN"
  | "TAGIHAN"
  | "E_BILLING"
  | "BUKTI_PEMBAYARAN"
  | "REKAP_TAGIHAN"
  | "REKAP_PEMBAYARAN"
  | "REKAP_PEMBELAJARAN"
  | "PENGUMUMAN"
  | "DOKUMEN"
  | "SURAT"
  | "FORMULIR"
  | "LAPORAN_AKADEMIK"
  | "LAPORAN_ADMINISTRASI"
  | "DOKUMEN_ADMINISTRASI";

export function DocumentWatermark() {
  return <span aria-hidden="true" className="institutional-document-watermark">
    <Image alt="" height={750} loading="eager" src="/assets/logo-poltektrans-emblem.png" width={700} />
  </span>;
}

export function DocumentTitle({ title, subtitle, documentNumber }: {
  title: string;
  subtitle?: string;
  documentNumber?: string;
}) {
  return <div className="institutional-document-heading">
    {documentNumber ? <small>{documentNumber}</small> : null}
    <h1>{title}</h1>
    {subtitle ? <p>{subtitle}</p> : null}
  </div>;
}

export function DocumentHeader() {
  return <header className="institutional-document-header">
    <div className="institutional-document-masthead">
      <Image alt="Logo resmi Poltektrans SDP Palembang" height={750} loading="eager" src="/assets/logo-poltektrans-emblem.png" width={700} />
      <span><strong>POLITEKNIK TRANSPORTASI SUNGAI, DANAU DAN<br />PENYEBERANGAN PALEMBANG</strong><small>POLTEKTRANS SDP PALEMBANG</small></span>
    </div>
  </header>;
}

export function DocumentFooter() {
  return <footer className="institutional-document-footer"><span>SiAkad Taruna · POLTEKTRANS SDP PALEMBANG</span><span>Dokumen institusi</span></footer>;
}

export function DocumentLayout({ title, subtitle, documentNumber, documentType, children, className = "", showWatermark = true, orientation = "portrait", screenPreview = false }: {
  title: string;
  subtitle?: string;
  documentNumber?: string;
  documentType: DocumentType;
  children: ReactNode;
  className?: string;
  showWatermark?: boolean;
  orientation?: "portrait" | "landscape";
  screenPreview?: boolean;
}) {
  return <article className={`institutional-document-layout institutional-print-area document-layout${screenPreview ? " document-screen-preview" : ""} ${className}`.trim()} data-document-type={documentType} data-orientation={orientation}>
    {showWatermark ? <DocumentWatermark /> : null}
    <DocumentHeader />
    <DocumentTitle documentNumber={documentNumber} subtitle={subtitle} title={title} />
    <div className="institutional-document-content">{children}</div>
    <DocumentFooter />
  </article>;
}

export function DocumentInfoGrid({ items, className = "" }: {
  items: Array<{ label: string; value: ReactNode }>;
  className?: string;
}) {
  return <dl className={`document-info-grid ${className}`.trim()}>{items.map(({ label, value }) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

export function DocumentSection({ title, children, className = "" }: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`document-section ${className}`.trim()}>
    {title ? <h2>{title}</h2> : null}
    {children}
  </section>;
}

export function DocumentTable({ children, className = "", ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`institutional-document-table ${className}`.trim()} {...props}>{children}</table>;
}

export function DocumentSummary({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`document-summary ${className}`.trim()}>{children}</div>;
}

export function DocumentPaymentBox({ label, amount, status, className = "" }: {
  label: string;
  amount: ReactNode;
  status?: ReactNode;
  className?: string;
}) {
  return <div className={`document-payment-box ${className}`.trim()}><span>{label}</span><strong>{amount}</strong>{status}</div>;
}

export function DocumentSignature({ name, title }: { name: string; title: string }) {
  return <div className="document-signature"><span>{title}</span><strong>{name}</strong></div>;
}

export function DocumentPageBreak() {
  return <div aria-hidden="true" className="document-page-break" />;
}