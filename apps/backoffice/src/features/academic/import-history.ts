import type { ImportModuleId } from "./import-config";
import type { ImportIssue } from "./import-validation";

export const importHistoryStorageKey = "siakad.backoffice.import-history.v1";

export interface ImportHistoryEntry {
  id: string;
  date: string;
  user: string;
  filename: string;
  moduleId: ImportModuleId;
  totalRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  issues: ImportIssue[];
}

export function readImportHistory(): ImportHistoryEntry[] {
  try {
    const serialized = window.localStorage.getItem(importHistoryStorageKey);
    const rows = serialized ? JSON.parse(serialized) as unknown : [];
    return Array.isArray(rows) ? rows.filter((row): row is ImportHistoryEntry => Boolean(row && typeof row === "object" && typeof row.id === "string" && Array.isArray(row.issues))) : [];
  } catch {
    window.localStorage.removeItem(importHistoryStorageKey);
    return [];
  }
}

export function recordImportHistory(entry: Omit<ImportHistoryEntry, "id" | "date">): ImportHistoryEntry {
  const created: ImportHistoryEntry = { ...entry, id: crypto.randomUUID(), date: new Date().toISOString() };
  const history = readImportHistory();
  window.localStorage.setItem(importHistoryStorageKey, JSON.stringify([created, ...history].slice(0, 200)));
  return created;
}

export function issueReportCsv(entry: ImportHistoryEntry) {
  const escape = (value: unknown) => {
    const text = String(value ?? "");
    const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const headers = ["Baris", "Sheet", "Kolom", "Nilai", "Error", "Saran Perbaikan"];
  const rows = entry.issues.map((item) => [item.row, item.sheet, item.column, item.value, item.message, item.suggestedFix]);
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
}
