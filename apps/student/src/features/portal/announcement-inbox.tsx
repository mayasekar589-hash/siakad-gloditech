"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Download, Eye, FileText, Mail, MailOpen, Paperclip, Printer, Search, X } from "lucide-react";
import { Button, Input } from "@siakad/ui";
import { announcements } from "../demo/data/announcements";
import type { Announcement, AnnouncementAttachment, AnnouncementCategory } from "../demo/types";
import { DocumentInfoGrid, DocumentLayout, DocumentSection } from "../../components/documents/document-layout";
import { printDocument } from "../../lib/print/print-document";
import {
  getReadAnnouncementSlugs,
  markAllAnnouncementsRead,
  markAnnouncementRead,
  subscribeToAnnouncementReadState
} from "./announcement-read-state";

type InboxFilter = "ALL" | "UNREAD";

type CategoryFilter = "ALL" | AnnouncementCategory;

const PAGE_SIZE = 10;

const categories: CategoryFilter[] = ["ALL", "Akademik", "Kemahasiswaan", "Keuangan", "Kegiatan", "Umum"];

function getPageNumbers(totalPages: number, currentPage: number): Array<number | "ellipsis-start" | "ellipsis-end"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "ellipsis-end", totalPages];
  if (currentPage >= totalPages - 3) return [1, "ellipsis-start", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis-start", currentPage - 1, currentPage, currentPage + 1, "ellipsis-end", totalPages];
}

export function AnnouncementInbox() {
  const [filter, setFilter] = useState<InboxFilter>("ALL");
  const [category, setCategory] = useState<CategoryFilter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [readSlugs, setReadSlugs] = useState<string[]>(() => getReadAnnouncementSlugs());

  useEffect(() => subscribeToAnnouncementReadState(() => setReadSlugs(getReadAnnouncementSlugs())), []);
  useEffect(() => {
    const queryText = new URLSearchParams(window.location.search).get("q");
    if (queryText) setQuery(queryText);
  }, []);

  const readSet = useMemo(() => new Set(readSlugs), [readSlugs]);
  const unreadCount = announcements.length - readSlugs.length;
  const filteredAnnouncements = announcements.filter((announcement) => {
    const isUnread = !readSet.has(announcement.slug);
    const matchesReadState = filter === "ALL" || isUnread;
    const matchesCategory = category === "ALL" || announcement.category === category;
    const searchContent = `${announcement.sender} ${announcement.title} ${announcement.excerpt} ${announcement.body} ${announcement.category}`.toLocaleLowerCase("id-ID");
    const matchesSearch = searchContent.includes(query.trim().toLocaleLowerCase("id-ID"));
    return matchesReadState && matchesCategory && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredAnnouncements.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageAnnouncements = filteredAnnouncements.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = getPageNumbers(totalPages, currentPage);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  useEffect(() => {
    setPage(1);
  }, [query, filter, category]);

  function handleMarkAllRead() {
    markAllAnnouncementsRead();
    setReadSlugs(getReadAnnouncementSlugs());
  }

  return <div className="portal-page announcement-inbox-page">
    <nav aria-label="Breadcrumb" className="announcement-breadcrumb"><span>SiAkad Taruna</span><span aria-hidden="true">/</span><strong>Pengumuman</strong></nav>
    <header className="announcement-inbox-heading">
      <div><h1>Pengumuman</h1><p>Informasi dan pemberitahuan resmi dari institusi untuk taruna.</p></div>
      <Button className="announcement-mark-all" disabled={unreadCount === 0} onClick={handleMarkAllRead} type="button" variant="secondary"><CheckCheck size={16} />Tandai semua dibaca</Button>
    </header>

    <section aria-label="Kotak masuk informasi akademik" className="announcement-inbox-panel">
      <header className="announcement-inbox-toolbar">
        <div className="announcement-inbox-brand"><span><Bell size={19} /></span><div><h2>Kotak Informasi</h2><p>Pemberitahuan satu arah dari institusi</p></div></div>
          <label className="announcement-inbox-search"><span className="sr-only">Cari pengumuman</span><Search size={17} aria-hidden="true" /><Input onChange={(event) => setQuery(event.target.value)} placeholder="Cari pengumuman..." type="search" value={query} /></label>
      </header>
      <div className="announcement-inbox-filters">
        <div aria-label="Filter status baca" className="announcement-inbox-tabs" role="tablist">
          <button aria-selected={filter === "ALL"} className={filter === "ALL" ? "is-active" : ""} onClick={() => setFilter("ALL")} role="tab" type="button">Semua <span>{announcements.length}</span></button>
          <button aria-selected={filter === "UNREAD"} className={filter === "UNREAD" ? "is-active" : ""} onClick={() => setFilter("UNREAD")} role="tab" type="button">Belum Dibaca <span>{unreadCount}</span></button>
        </div>
        <label className="announcement-category-select"><span className="sr-only">Filter kategori</span><select aria-label="Filter kategori" onChange={(event) => setCategory(event.target.value as CategoryFilter)} value={category}><option value="ALL">Semua Kategori</option>{categories.filter((item) => item !== "ALL").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div aria-label="Daftar pengumuman" className="announcement-inbox-list" role="list">
        {pageAnnouncements.map((announcement) => {
          const isUnread = !readSet.has(announcement.slug);
          const MessageIcon = isUnread ? Mail : MailOpen;
          return <Link className={`announcement-inbox-row${isUnread ? " is-unread" : " is-read"}`} href={`/pengumuman/${announcement.slug}`} key={announcement.slug} onClick={() => markAnnouncementRead(announcement.slug)} role="listitem">
            <span className={`announcement-read-indicator${isUnread ? " is-unread" : ""}`} aria-label={isUnread ? "Belum dibaca" : "Sudah dibaca"} />
            <span className="announcement-message-icon"><MessageIcon size={18} aria-hidden="true" /></span>
            <span className="announcement-message-copy"><span className="announcement-message-topline"><strong>{announcement.sender}</strong><span className="announcement-category-label">{announcement.category}</span></span><strong className="announcement-message-subject">{announcement.title}</strong><span className="announcement-message-preview">{announcement.excerpt}</span>{announcement.attachments?.length ? <span className="announcement-attachment-count"><Paperclip size={12} />{announcement.attachments.length} lampiran</span> : null}</span>
            <time className="announcement-message-date">{announcement.date}</time>
          </Link>;
        })}
        {filteredAnnouncements.length === 0 ? <div className="announcement-inbox-empty"><MailOpen size={21} /><strong>Tidak ada pengumuman ditemukan.</strong><span>Coba ubah kata kunci atau filter.</span></div> : null}
      </div>
      {filteredAnnouncements.length > 0 ? <footer aria-label="Navigasi halaman pengumuman" className="announcement-pagination">
        <span className="announcement-page-count">{currentPage} / {totalPages}</span>
        <div className="announcement-page-controls">
          <button aria-label="Halaman sebelumnya" className="announcement-page-step" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">← <span>Sebelumnya</span></button>
          <div className="announcement-page-numbers">{pageNumbers.map((pageNumber, index) => typeof pageNumber === "number" ? <button aria-current={pageNumber === currentPage ? "page" : undefined} className={pageNumber === currentPage ? "is-current" : ""} key={pageNumber} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button> : <span aria-hidden="true" key={`${pageNumber}-${index}`}>…</span>)}</div>
          <button aria-label="Halaman berikutnya" className="announcement-page-step" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button"><span>Berikutnya</span> →</button>
        </div>
      </footer> : null}
    </section>
  </div>;
}

export function AnnouncementDetail({ slug }: { slug: string }) {
  const announcement = announcements.find((item) => item.slug === slug);
  const markRead = useCallback(() => {
    if (announcement) markAnnouncementRead(announcement.slug);
  }, [announcement]);

  useEffect(() => {
    markRead();
  }, [markRead]);

  if (!announcement) return <div className="portal-page announcement-inbox-page"><section className="announcement-reading-panel"><h1>Pengumuman tidak ditemukan</h1><Link className="announcement-back-link" href="/pengumuman">Kembali ke pengumuman</Link></section></div>;

  return <div className="portal-page announcement-inbox-page">
    <nav aria-label="Breadcrumb" className="announcement-breadcrumb"><Link href="/pengumuman">SiAkad Taruna</Link><span aria-hidden="true">/</span><strong>Pengumuman</strong></nav>
    <article className="announcement-reading-panel">
      <Link className="announcement-back-link" href="/pengumuman"><Mail size={15} />Kembali ke daftar</Link>
      <div className="announcement-reading-category">{announcement.category}</div>
      <h1>{announcement.title}</h1>
      <dl className="announcement-reading-meta"><div><dt>Dari</dt><dd>{announcement.sender}</dd></div><div><dt>Tanggal</dt><dd>{announcement.date}</dd></div></dl>
      <div className="announcement-reading-body">{announcement.body.split("\n\n").map((paragraph, index) => <p key={`${announcement.slug}-${index}`}>{paragraph}</p>)}</div>
      {announcement.attachments?.length ? <section aria-labelledby="announcement-attachments-title" className="announcement-attachments"><h2 id="announcement-attachments-title">Lampiran</h2>{announcement.attachments.map((attachment) => <AnnouncementAttachmentRow attachment={attachment} announcement={announcement} key={attachment.id} />)}</section> : null}
    </article>
  </div>;
}

function AnnouncementAttachmentRow({ attachment, announcement }: { attachment: AnnouncementAttachment; announcement: Announcement }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadOnOpen, setDownloadOnOpen] = useState(false);

  function downloadGeneratedPdf() {
    setDownloadOnOpen(true);
    setPreviewOpen(true);
  }

  return <div className="announcement-attachment-row">
    <span className="announcement-attachment-file-icon"><FileText size={19} /></span>
    <span className="announcement-attachment-file-copy"><strong>{attachment.name}</strong><small>{attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(1)} MB · PDF` : attachment.type === "application/pdf" ? "PDF · Pratinjau tersedia" : attachment.type}</small></span>
    <div className="announcement-attachment-actions">
      {attachment.previewable && attachment.type === "application/pdf" ? <button className="announcement-attachment-action" onClick={() => setPreviewOpen(true)} type="button"><Eye size={15} />Lihat</button> : null}
      {attachment.url ? <a className="announcement-attachment-action is-primary" download href={attachment.url}><Download size={15} />Download</a> : <button className="announcement-attachment-action is-primary" onClick={downloadGeneratedPdf} type="button"><Download size={15} />Download PDF</button>}
    </div>
    {attachment.previewable && attachment.type === "application/pdf" && previewOpen ? <AnnouncementAttachmentPreview attachment={attachment} announcement={announcement} downloadOnOpen={downloadOnOpen} onClose={() => { setPreviewOpen(false); setDownloadOnOpen(false); }} /> : null}
  </div>;
}

function AnnouncementAttachmentPreview({ attachment, announcement, downloadOnOpen, onClose }: { attachment: AnnouncementAttachment; announcement: Announcement; downloadOnOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!downloadOnOpen || attachment.url) return;
    const timeout = window.setTimeout(() => printDocument("PENGUMUMAN"), 0);
    return () => window.clearTimeout(timeout);
  }, [attachment.url, downloadOnOpen]);

  return <div className="announcement-attachment-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-label="Pratinjau lampiran PDF" aria-modal="true" className="announcement-attachment-preview-modal" role="dialog">
      <header><div><p>Lampiran PDF</p><h2>{attachment.name}</h2></div><button aria-label="Tutup pratinjau lampiran" onClick={onClose} type="button"><X size={18} /></button></header>
      <div className="announcement-attachment-preview-scroll">{attachment.url ? <iframe className="announcement-attachment-pdf-frame" src={attachment.url} title={`Pratinjau ${attachment.name}`} /> : <DocumentLayout className="announcement-attachment-document" documentNumber={announcement.slug.toUpperCase()} documentType="PENGUMUMAN" screenPreview subtitle="Lampiran pemberitahuan institusi" title={(attachment.documentTitle ?? attachment.name.replace(/\.pdf$/i, "")).toLocaleUpperCase("id-ID")}>
        <DocumentInfoGrid items={[{ label: "Dari", value: announcement.sender }, { label: "Tanggal", value: announcement.date }, { label: "Kategori", value: announcement.category }]} />
        <DocumentSection title="Pemberitahuan">{announcement.body.split("\n\n").map((paragraph, index) => <p className="announcement-attachment-document-paragraph" key={index}>{paragraph}</p>)}</DocumentSection>
      </DocumentLayout>}</div>
      <footer>{attachment.url ? <a className="announcement-attachment-modal-download" download href={attachment.url}><Download size={16} />Download</a> : <><Button className="announcement-attachment-download" onClick={() => printDocument("PENGUMUMAN")} type="button" variant="primary"><Download size={16} />Download PDF</Button><Button onClick={() => printDocument("PENGUMUMAN")} type="button" variant="secondary"><Printer size={16} />Cetak</Button></>}</footer>
    </section>
  </div>;
}
