"use client";

import { useEffect, useId, useState } from "react";
import {
  CheckCircle2, Clock3, Download, Eye, FileText, MinusCircle,
  Printer, Search, X
} from "lucide-react";
import { Button, Input } from "@siakad/ui";
import {
  DocumentInfoGrid, DocumentLayout, DocumentSection, DocumentSummary, DocumentTable
} from "../../../components/documents/document-layout";
import { academicDocuments } from "../../demo/data/documents";
import { demoCourses, krsEnrollments } from "../../demo/data/courses";
import { cumulativeGpa, previousSemesterSummary, semesterGrades } from "../../demo/data/grades";
import { demoStudent } from "../../demo/data/student";
import type { AcademicDocument, AcademicDocumentStatus } from "../../demo/types";
import { printDocument } from "../../../lib/print/print-document";

type StatusFilter = "ALL" | AcademicDocumentStatus;

const statusLabels: Record<AcademicDocumentStatus, string> = {
  AVAILABLE: "Tersedia",
  PROCESSING: "Diproses",
  UNAVAILABLE: "Tidak Tersedia"
};

function DocumentStatus({ status }: { status: AcademicDocumentStatus }) {
  const Icon = status === "AVAILABLE" ? CheckCircle2 : status === "PROCESSING" ? Clock3 : MinusCircle;
  return <span className={`documents-status is-${status.toLowerCase()}`}><Icon size={15} aria-hidden="true" />{statusLabels[status]}</span>;
}

function AcademicDocumentSheet({ document, className = "", screenPreview = false }: { document: AcademicDocument; className?: string; screenPreview?: boolean }) {
  const metadata = [
    { label: "Nama", value: demoStudent.name },
    { label: "NIM", value: demoStudent.nim },
    { label: "Program Studi", value: demoStudent.programStudy },
    { label: "Periode", value: document.period }
  ];

  return <DocumentLayout
    className={className}
    documentNumber={document.id.toUpperCase()}
    documentType={document.documentType}
    screenPreview={screenPreview}
    subtitle={document.description}
    title={document.title.toLocaleUpperCase("id-ID")}
  >
    <DocumentInfoGrid items={metadata} />
    {document.documentType === "KRS" ? <KrsDocumentContent /> : null}
    {document.documentType === "KHS" ? <KhsDocumentContent semester={document.semester ?? demoStudent.semester} /> : null}
    {document.documentType === "TRANSKRIP" ? <TranscriptDocumentContent /> : null}
    {document.documentType === "KARTU_TARUNA" ? <StudentCardDocumentContent /> : null}
  </DocumentLayout>;
}

function KrsDocumentContent() {
  const enrollmentStatuses = new Map(krsEnrollments.map((enrollment) => [enrollment.courseCode, enrollment.status]));
  const approvedCourses = demoCourses.filter((course) => enrollmentStatuses.get(course.code) === "APPROVED");
  const credits = approvedCourses.reduce((total, course) => total + course.credits, 0);

  return <>
    <DocumentSection title="Rencana Studi">
      <DocumentTable><thead><tr><th>No</th><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Kelas</th><th>Status</th></tr></thead><tbody>{approvedCourses.map((course, index) => <tr key={course.code}><td>{index + 1}</td><td>{course.code}</td><td>{course.name}</td><td>{course.credits}</td><td>{course.className}</td><td>Disetujui</td></tr>)}</tbody></DocumentTable>
    </DocumentSection>
    <DocumentSummary className="documents-document-summary"><span>Total SKS</span><strong>{credits}</strong></DocumentSummary>
  </>;
}

function KhsDocumentContent({ semester }: { semester: number }) {
  const summary = previousSemesterSummary.find((item) => item.semester === semester);
  return <DocumentSection title="Ringkasan Hasil Studi">
    <DocumentTable><thead><tr><th>Indikator</th><th>Hasil</th></tr></thead><tbody>
      <tr><td>Semester</td><td>{semester}</td></tr>
      <tr><td>Indeks Prestasi Semester</td><td>{summary?.gpa.toFixed(2) ?? "Belum tersedia"}</td></tr>
      <tr><td>Total SKS</td><td>{summary?.credits ?? 0}</td></tr>
    </tbody></DocumentTable>
  </DocumentSection>;
}

function TranscriptDocumentContent() {
  const gradesByCourse = new Map(semesterGrades.map((grade) => [grade.courseCode, grade]));
  const credits = demoCourses.reduce((total, course) => total + course.credits, 0);

  return <>
    <DocumentSection title="Rekapitulasi Nilai">
      <DocumentTable><thead><tr><th>No</th><th>Kode</th><th>Mata Kuliah</th><th>SKS</th><th>Nilai</th><th>Bobot</th><th>Status</th></tr></thead><tbody>{demoCourses.map((course, index) => {
        const grade = gradesByCourse.get(course.code);
        if (!grade) return null;
        return <tr key={course.code}><td>{index + 1}</td><td>{course.code}</td><td>{course.name}</td><td>{course.credits}</td><td>{grade.grade}</td><td>{grade.weight.toFixed(2)}</td><td>{grade.status}</td></tr>;
      })}</tbody></DocumentTable>
    </DocumentSection>
    <DocumentSummary className="documents-document-summary"><span>IPK Kumulatif</span><strong>{cumulativeGpa.toFixed(2)}</strong><span>Total SKS</span><strong>{credits}</strong></DocumentSummary>
  </>;
}

function StudentCardDocumentContent() {
  return <DocumentSection title="Identitas Taruna">
    <DocumentInfoGrid items={[
      { label: "Kelas", value: demoStudent.className },
      { label: "Angkatan", value: demoStudent.cohort },
      { label: "Status", value: "Aktif" }
    ]} />
  </DocumentSection>;
}

function DocumentPreviewDialog({ document, onClose }: { document: AcademicDocument; onClose: () => void }) {
  const titleId = useId();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const isReady = document.status === "AVAILABLE";

  return <div className="documents-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-labelledby={titleId} aria-modal="true" className="documents-preview-modal" role="dialog">
      <header className="documents-preview-header"><div><p>Dokumen Akademik</p><h2 id={titleId}>{document.title}</h2></div><button aria-label="Tutup pratinjau" className="documents-preview-close" onClick={onClose} type="button"><X size={18} /></button></header>
      <div className="documents-preview-scroll">
        {isReady ? <AcademicDocumentSheet className="documents-preview-document" document={document} screenPreview /> : <div className="documents-processing-preview"><DocumentStatus status={document.status} /><h3>Dokumen sedang diproses</h3><p>Dokumen ini belum tersedia untuk diunduh atau dicetak.</p><span>{document.period}</span></div>}
      </div>
      <footer className="documents-preview-actions">
        {document.downloadable && document.printable ? <>
          <Button className="documents-action-button documents-action-secondary" onClick={() => printDocument(document.documentType)} type="button" variant="secondary"><Download size={16} />Download PDF</Button>
          <Button className="documents-action-button documents-action-primary" onClick={() => printDocument(document.documentType)} type="button" variant="primary"><Printer size={16} />Cetak</Button>
        </> : null}
      </footer>
    </section>
  </div>;
}

export function DocumentsExperience() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedDocument, setSelectedDocument] = useState<AcademicDocument | null>(null);
  const filteredDocuments = academicDocuments.filter((document) => {
    const searchText = `${document.title} ${document.description} ${document.period}`.toLocaleLowerCase("id-ID");
    const matchesQuery = searchText.includes(query.trim().toLocaleLowerCase("id-ID"));
    const matchesStatus = statusFilter === "ALL" || document.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return <div className="portal-page documents-page">
    <nav aria-label="Breadcrumb" className="documents-breadcrumb"><span>SiAkad Taruna</span><span aria-hidden="true">/</span><strong>Dokumen Akademik</strong></nav>
    <header className="documents-page-heading"><h1>Dokumen Akademik</h1><p>Daftar dokumen akademik taruna pada portal.</p></header>

    <section aria-labelledby="documents-panel-title" className="documents-registry">
      <header className="documents-registry-header">
        <div className="documents-panel-title"><span className="documents-panel-icon"><FileText size={20} /></span><div><h2 id="documents-panel-title">Daftar Dokumen</h2><p>Dokumen resmi akademik yang dapat dilihat dan diunduh sesuai dengan data akademik Anda.</p></div></div>
        <div className="documents-controls">
          <label className="documents-search"><span className="sr-only">Cari dokumen</span><Search aria-hidden="true" size={17} /><Input onChange={(event) => setQuery(event.target.value)} placeholder="Cari dokumen..." type="search" value={query} /></label>
          <label className="documents-status-filter"><span className="sr-only">Filter status dokumen</span><select aria-label="Filter status dokumen" onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}><option value="ALL">Semua Status</option><option value="AVAILABLE">Tersedia</option><option value="PROCESSING">Diproses</option><option value="UNAVAILABLE">Tidak Tersedia</option></select></label>
        </div>
      </header>

      <div aria-label="Daftar dokumen akademik" className="documents-table-scroll" role="region" tabIndex={0}>
        <table className="documents-table"><thead><tr><th scope="col">No</th><th scope="col">Dokumen</th><th scope="col">Periode / Keterangan</th><th scope="col">Status</th><th scope="col">Aksi</th></tr></thead>
          <tbody>{filteredDocuments.map((document, index) => <tr key={document.id}>
            <td className="documents-row-number">{index + 1}</td>
            <td><div className="documents-row-title"><span className="documents-row-icon"><FileText size={18} /></span><span><strong>{document.title}</strong><small>{document.description}</small></span></div></td>
            <td className="documents-period">{document.period}</td>
            <td><DocumentStatus status={document.status} /></td>
            <td><div className="documents-row-actions">
              <Button className="documents-action-button documents-action-secondary" onClick={() => setSelectedDocument(document)} type="button" variant="secondary"><Eye size={16} />Lihat</Button>
              {document.downloadable && document.printable ? <Button aria-label={`Download PDF ${document.title}`} className="documents-action-button documents-action-primary" onClick={() => printDocument(document.documentType)} type="button" variant="primary"><Download size={16} />Download PDF</Button> : null}
            </div></td>
          </tr>)}</tbody>
        </table>
        {filteredDocuments.length === 0 ? <div className="documents-empty-state"><FileText size={20} /><strong>Tidak ada dokumen ditemukan.</strong><span>Coba ubah kata kunci atau filter status.</span></div> : null}
      </div>
    </section>

    {selectedDocument ? <DocumentPreviewDialog document={selectedDocument} onClose={() => setSelectedDocument(null)} /> : null}
    <div aria-hidden="true" className="documents-print-targets print-only">{academicDocuments.filter((document) => document.printable).map((document) => <AcademicDocumentSheet className="documents-print-target" document={document} key={document.id} />)}</div>
  </div>;
}