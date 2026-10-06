"use client";

import { Download, FileSpreadsheet, History, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { AcademicWorkspaceData } from "./domain";
import { importConfigs, importModuleOrder, maxImportFileSizeBytes, type ImportModuleId } from "./import-config";
import { acceptedImportCount, commitImport } from "./import-engine";
import { issueReportCsv, readImportHistory, recordImportHistory, type ImportHistoryEntry } from "./import-history";
import type { UploadedSheet } from "./spreadsheet";
import { validateImport, type ImportIssue, type ImportPreview } from "./import-validation";

interface DataImportDialogProps {
  moduleId: ImportModuleId;
  data: AcademicWorkspaceData;
  username: string;
  authorized: boolean;
  onCommit: (next: AcademicWorkspaceData) => string | null;
  onClose: () => void;
}

type Stage = "UPLOAD" | "PREVIEW" | "PROCESSING" | "RESULT";
const stages = ["Download Template", "Upload File", "Validasi", "Preview", "Import", "Import Result"];

function sizeLabel(bytes: number) {
  return `${(bytes / 1024 / 1024).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadErrorReport(entry: ImportHistoryEntry) {
  saveBlob(new Blob(["\uFEFF", issueReportCsv(entry)], { type: "text/csv;charset=utf-8" }), `${entry.filename.replace(/\.[^.]+$/, "")}_error_report.csv`);
}

function IssueTable({ issues }: { issues: ImportIssue[] }) {
  return <div className="import-issue-table-wrap"><table className="academic-table"><thead><tr><th>Baris</th><th>Sheet</th><th>Kolom</th><th>Nilai</th><th>Error / Peringatan</th><th>Saran Perbaikan</th></tr></thead><tbody>{issues.map((item, index) => <tr key={`${item.row}-${item.sheet}-${item.column}-${index}`}><td>{item.row}</td><td>{item.sheet}</td><td>{item.column || "-"}</td><td>{item.value || "-"}</td><td>{item.message}</td><td>{item.suggestedFix}</td></tr>)}</tbody></table></div>;
}

export function DataImportDialog({ moduleId, data, username, authorized, onCommit, onClose }: DataImportDialogProps) {
  const config = importConfigs[moduleId];
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"IMPORT" | "HISTORY">("IMPORT");
  const [stage, setStage] = useState<Stage>("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<UploadedSheet[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isError, setIsError] = useState(false);
  const [history, setHistory] = useState<ImportHistoryEntry[]>(() => typeof window === "undefined" ? [] : readImportHistory().filter((entry) => entry.moduleId === moduleId));
  const [selectedHistory, setSelectedHistory] = useState<ImportHistoryEntry | null>(null);
  const [result, setResult] = useState<ImportHistoryEntry | null>(null);
  const previewColumns = useMemo(() => config.sheets.flatMap((sheet) => sheet.fields.map((field) => ({ key: field.key, label: field.header.replace(/\s\*$/, "") }))).slice(0, 7), [config]);

  async function downloadTemplate() {
    setBusy(true);
    try {
      const { buildImportTemplate } = await import("./spreadsheet");
      saveBlob(await buildImportTemplate(config, data), config.filename);
      setFeedback("Template resmi dibuat dengan referensi terbaru.");
      setIsError(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Template tidak dapat dibuat.");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  async function chooseFile(nextFile?: File) {
    if (!nextFile) return;
    setPreview(null);
    setFile(null);
    setFeedback("");
    const extension = nextFile.name.split(".").pop()?.toLocaleLowerCase("en-US");
    if (nextFile.size > maxImportFileSizeBytes) {
      setFeedback(`Ukuran file melebihi batas ${sizeLabel(maxImportFileSizeBytes)}.`);
      setIsError(true);
      return;
    }
    if (extension !== "xlsx" && !(extension === "csv" && config.csv)) {
      setFeedback(config.csv ? "Pilih file .xlsx atau .csv." : "Kurikulum membutuhkan workbook .xlsx multi-sheet.");
      setIsError(true);
      return;
    }
    setBusy(true);
    try {
      const { readImportFile } = await import("./spreadsheet");
      const parsed = await readImportFile(nextFile, config);
      setFile(nextFile);
      setSheets(parsed);
      setStage("UPLOAD");
      setFeedback(`${nextFile.name} siap divalidasi (${sizeLabel(nextFile.size)}).`);
      setIsError(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "File tidak dapat dibaca.");
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  function runValidation() {
    if (!file) return;
    const next = validateImport(moduleId, sheets, data);
    setPreview(next);
    setStage("PREVIEW");
    setFeedback(`Validasi selesai: ${next.validCount} siap, ${next.errorCount} error, ${next.skippedCount} duplikat dilewati.`);
    setIsError(next.errorCount > 0);
  }

  async function confirmImport() {
    if (!preview || !authorized || acceptedImportCount(preview) === 0) return;
    setBusy(true);
    setStage("PROCESSING");
    await new Promise<void>((resolve) => window.setTimeout(resolve, 25));
    let commitError: string | null = null;
    let committedCount = 0;
    try {
      const committed = commitImport(data, preview);
      committedCount = committed.count;
      commitError = onCommit(committed.data);
    } catch (error) {
      commitError = error instanceof Error ? error.message : "Terjadi kegagalan saat memproses data import.";
    }
    const totalRows = preview.rows.filter((row) => row.rowNumber > 1).length;
    const failedRows = preview.errorCount + (commitError ? committedCount : 0);
    const issues = preview.rows.flatMap((row) => [...row.errors, ...row.warnings]);
    if (commitError) issues.push({ row: 0, sheet: "IMPORT", column: "", value: "", message: commitError, suggestedFix: "Perbaiki data terkait lalu ulangi import." });
    const successRows = commitError ? 0 : committedCount;
    const entry = recordImportHistory({ user: username, filename: file?.name ?? config.filename, moduleId, totalRows, successRows, failedRows, skippedRows: preview.skippedCount, status: successRows === 0 ? "FAILED" : failedRows || preview.skippedCount ? "PARTIAL" : "COMPLETED", issues });
    setHistory((current) => [entry, ...current]);
    setResult(entry);
    setStage("RESULT");
    setFeedback(commitError ?? (successRows ? "Import selesai dan dicatat pada riwayat lokal." : "Tidak ada baris yang berhasil diimport."));
    setIsError(Boolean(commitError) || successRows === 0);
    setBusy(false);
  }

  function downloadCurrentErrors() {
    if (!preview) return;
    const entry: ImportHistoryEntry = { id: "preview", date: new Date().toISOString(), user: username, filename: file?.name ?? config.filename, moduleId, totalRows: preview.rows.length, successRows: preview.validCount, failedRows: preview.errorCount, skippedRows: preview.skippedCount, status: preview.validCount ? "PARTIAL" : "FAILED", issues: preview.rows.flatMap((row) => [...row.errors, ...row.warnings]) };
    downloadErrorReport(entry);
  }

  function resetFlow() {
    setFile(null);
    setSheets([]);
    setPreview(null);
    setResult(null);
    setStage("UPLOAD");
    setFeedback("");
    setIsError(false);
  }

  const activeStep = stage === "UPLOAD" ? 1 : stage === "PREVIEW" ? 3 : stage === "PROCESSING" ? 4 : 5;
  const historyForModule = history.filter((entry) => entry.moduleId === moduleId);

  return <div className="academic-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <section aria-labelledby="import-dialog-title" aria-modal="true" className="academic-modal data-import-dialog" role="dialog">
      <header className="import-dialog-header"><div><span className="academic-eyebrow">DATA AKADEMIK / IMPORT MASSAL</span><h2 id="import-dialog-title">Import Data {config.title}</h2><p>Upload data secara massal menggunakan template resmi SiAkad.</p></div><button aria-label="Tutup dialog import" className="academic-small-icon" disabled={busy} onClick={onClose} type="button"><X size={18} /></button></header>
      <div className="import-dialog-tabs" role="tablist" aria-label="Import dan riwayat"><button aria-selected={tab === "IMPORT"} className="academic-entity-tab" onClick={() => setTab("IMPORT")} role="tab" type="button"><Upload size={14} /> Import Data</button><button aria-selected={tab === "HISTORY"} className="academic-entity-tab" onClick={() => { setHistory(readImportHistory().filter((entry) => entry.moduleId === moduleId)); setSelectedHistory(null); setTab("HISTORY"); }} role="tab" type="button"><History size={14} /> Riwayat Import</button></div>
      {tab === "HISTORY" ? <div className="import-history-panel"><div className="import-demo-notice">Riwayat demo tersimpan di browser ini; audit produksi memerlukan API terautentikasi.</div>{selectedHistory ? <div className="import-history-detail"><button className="academic-secondary-button" onClick={() => setSelectedHistory(null)} type="button">Kembali ke riwayat</button><h3>{selectedHistory.filename}</h3><p>{new Date(selectedHistory.date).toLocaleString("id-ID")} · {selectedHistory.user}</p><p>{selectedHistory.totalRows} baris · {selectedHistory.successRows} berhasil · {selectedHistory.failedRows} gagal · {selectedHistory.skippedRows} dilewati</p>{selectedHistory.issues.length ? <IssueTable issues={selectedHistory.issues} /> : <p>Tidak ada error.</p>}{selectedHistory.issues.length ? <button className="academic-icon-button" onClick={() => downloadErrorReport(selectedHistory)} type="button"><Download size={15} /> Download Error Report</button> : null}</div> : historyForModule.length ? <div className="import-history-table-wrap"><table className="academic-table"><thead><tr><th>Tanggal</th><th>User</th><th>File</th><th>Total</th><th>Berhasil</th><th>Gagal</th><th>Status</th><th></th></tr></thead><tbody>{historyForModule.map((entry) => <tr key={entry.id}><td>{new Date(entry.date).toLocaleString("id-ID")}</td><td>{entry.user}</td><td>{entry.filename}</td><td>{entry.totalRows}</td><td>{entry.successRows}</td><td>{entry.failedRows}</td><td>{entry.status}</td><td><button className="academic-text-action" onClick={() => setSelectedHistory(entry)} type="button">Lihat Detail</button></td></tr>)}</tbody></table></div> : <div className="academic-empty"><strong>Belum ada riwayat import.</strong><span>Percobaan import akan tercatat di sini.</span></div>}</div> : <div className="import-dialog-body">
        <ol aria-label="Tahapan import" className="import-stepper">{stages.map((label, index) => <li className={index <= activeStep ? "is-active" : ""} key={label}><span>{index + 1}</span><small>{label}</small></li>)}</ol>
        <div className="import-order-note"><strong>Urutan Import Data</strong><span>{importModuleOrder.map((id) => importConfigs[id].title).join(" → ")}</span></div>
        <div className="import-template-row"><div><FileSpreadsheet size={18} /><span><strong>{config.filename}</strong><small>Template dibentuk dari schema dan referensi modul.</small></span></div><button className="academic-icon-button" disabled={busy} onClick={() => void downloadTemplate()} type="button"><Download size={15} /> Download Template</button></div>
        {stage === "UPLOAD" ? <div className={`import-dropzone${file ? " has-file" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void chooseFile(event.dataTransfer.files[0]); }}><input accept={config.csv ? ".xlsx,.csv" : ".xlsx"} className="import-file-input" onChange={(event) => void chooseFile(event.target.files?.[0])} ref={inputRef} type="file" /><FileSpreadsheet aria-hidden="true" size={25} /><strong>{file?.name ?? "Seret file ke area ini"}</strong><span>{file ? `${sizeLabel(file.size)} · ${sheets.map((sheet) => sheet.name).join(", ")}` : `atau pilih file ${config.csv ? ".xlsx / .csv" : ".xlsx"} (maks. ${sizeLabel(maxImportFileSizeBytes)})`}</span><button className="academic-secondary-button" disabled={busy} onClick={() => inputRef.current?.click()} type="button">Pilih File</button></div> : null}
        {feedback ? <div className={`academic-feedback${isError ? " is-error" : ""}`} role={isError ? "alert" : "status"}>{feedback}</div> : null}
        {!authorized ? <div className="academic-feedback is-error" role="alert">Akun ini tidak memiliki izin import pada mode demo.</div> : null}
        {stage === "PREVIEW" && preview ? <div className="import-preview"><div className="import-preview-summary"><div><strong>{preview.rows.length}</strong><span>Total baris</span></div><div><strong>{preview.validCount}</strong><span>Valid</span></div><div><strong>{preview.warningCount}</strong><span>Peringatan</span></div><div><strong>{preview.errorCount}</strong><span>Error</span></div><div><strong>{preview.skippedCount}</strong><span>Duplikat</span></div></div><div className="import-preview-table-wrap"><table className="academic-table"><thead><tr><th>Baris</th>{previewColumns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Validasi</th></tr></thead><tbody>{preview.rows.map((row, index) => <tr key={`${row.sheetName}-${row.rowNumber}-${index}`}><td>{row.rowNumber}</td>{previewColumns.map((column) => <td key={column.key}>{row.values[column.key] === undefined || row.values[column.key] === "" ? "-" : String(row.values[column.key])}</td>)}<td><span className={`academic-status status-${row.state.toLowerCase()}`}>{row.state === "VALID" ? "Valid" : row.state === "WARNING" ? "Peringatan" : row.state === "SKIPPED" ? "Dilewati" : "Error"}</span>{[...row.errors, ...row.warnings].map((entry, issueIndex) => <small className="import-row-issue" key={`${entry.column}-${issueIndex}`}>{entry.column ? `${entry.column}: ` : ""}{entry.message}</small>)}</td></tr>)}</tbody></table></div>{preview.errorCount ? <button className="academic-icon-button" onClick={downloadCurrentErrors} type="button"><Download size={15} /> Download Error Report</button> : null}<p className="import-partial-note">Baris error tidak diimport. Baris valid akan diproses sebagai partial import dan kegagalan tetap tercatat.</p></div> : null}
        {stage === "RESULT" && result ? <div className="import-result"><span className={`import-result-mark status-${result.status.toLowerCase()}`}>{result.status}</span><h3>Hasil Import</h3><div className="import-history-summary"><span>{result.successRows} berhasil</span><span>{result.failedRows} gagal</span><span>{result.skippedRows} dilewati</span></div><p>{result.filename}</p>{result.issues.length ? <IssueTable issues={result.issues} /> : null}{result.issues.length ? <button className="academic-icon-button" onClick={() => downloadErrorReport(result)} type="button"><Download size={15} /> Download Error Report</button> : null}</div> : null}
        {stage === "PROCESSING" ? <div aria-live="polite" className="import-processing"><span className="import-processing-spinner" /><strong>Memproses {preview?.validCount ?? 0} baris valid...</strong></div> : null}
        <footer className="import-dialog-footer">{stage === "UPLOAD" ? <><button className="academic-secondary-button" disabled={busy} onClick={onClose} type="button">Batal</button><button className="academic-primary-button" disabled={!file || busy || !authorized} onClick={runValidation} type="button">{busy ? "Memproses..." : "Validasi Data"}</button></> : stage === "PREVIEW" ? <><button className="academic-secondary-button" disabled={busy} onClick={() => setStage("UPLOAD")} type="button">Kembali</button><button className="academic-primary-button" disabled={!preview || !authorized || !preview.validCount || busy} onClick={() => void confirmImport()} type="button">{busy ? "Mengimport..." : `Import ${preview?.validCount ?? 0} Baris Valid`}</button></> : stage === "PROCESSING" ? <button className="academic-primary-button" disabled type="button">Memproses...</button> : <><button className="academic-secondary-button" onClick={onClose} type="button">Tutup</button><button className="academic-primary-button" onClick={() => { resetFlow(); setTab("IMPORT"); }} type="button">Import File Lain</button></>}</footer>
      </div>}
    </section>
  </div>;
}
