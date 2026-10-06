import ExcelJS from "exceljs";
import type { AcademicWorkspaceData } from "./domain";
import type { ImportFieldConfig, ImportModuleConfig } from "./import-config";

export interface UploadedSheet {
  name: string;
  rows: { rowNumber: number; values: Record<string, unknown> }[];
}

function cellText(value: ExcelJS.CellValue): unknown {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value && typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) return "__FORMULA_CELL_NOT_ALLOWED__";
    if ("text" in value) return value.text;
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
    if ("result" in value) return value.result;
  }
  return value;
}

export function parseDelimited(text: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) records.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error("File CSV memiliki tanda kutip yang tidak berpasangan.");
  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) records.push(row);
  return records;
}

function rowsFromMatrix(name: string, matrix: unknown[][]): UploadedSheet {
  const headers = (matrix[0] ?? []).map((header) => String(header ?? "").trim());
  const rows = matrix.slice(1).flatMap((values, offset) => {
    if (!values.some((value) => value !== null && value !== undefined && String(value).trim() !== "")) return [];
    return [{ rowNumber: offset + 2, values: Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) }];
  });
  return { name, rows };
}

export async function readTabularRows(file: File, expectedHeaders: string[]): Promise<{ rowNumber: number; values: Record<string, unknown> }[]> {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en-US");
  let matrix: unknown[][];
  if (extension === "csv") {
    matrix = parseDelimited(await file.text());
  } else if (extension === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("Workbook tidak memiliki worksheet.");
    matrix = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      for (let column = 1; column <= row.cellCount; column += 1) values[column - 1] = cellText(row.getCell(column).value);
      matrix[row.number - 1] = values;
    });
  } else {
    throw new Error("Format file harus .xlsx atau .csv.");
  }
  const headers = (matrix[0] ?? []).map((header) => String(header ?? "").trim());
  if (expectedHeaders.some((header, index) => headers[index] !== header) || headers.length !== expectedHeaders.length) {
    throw new Error(`Header file harus berurutan: ${expectedHeaders.join(", ")}.`);
  }
  return matrix.slice(1).flatMap((values, offset) => {
    if (!values?.some((value) => value !== null && value !== undefined && String(value).trim() !== "")) return [];
    return [{ rowNumber: offset + 2, values: Object.fromEntries(expectedHeaders.map((header, index) => [header, values[index] ?? ""])) }];
  });
}

export async function readImportFile(file: File, config: ImportModuleConfig): Promise<UploadedSheet[]> {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("en-US");
  if (extension === "csv") {
    if (!config.csv || config.sheets.length !== 1) throw new Error("Modul ini memerlukan workbook Excel multi-sheet (.xlsx).");
    const matrix = parseDelimited(await file.text());
    if (matrix.length < 2) throw new Error("File CSV tidak memiliki baris data.");
    return [rowsFromMatrix(config.sheets[0].name, matrix)];
  }
  if (extension !== "xlsx") throw new Error("Format file harus .xlsx atau .csv.");

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  return workbook.worksheets.map((worksheet) => {
    const matrix: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      for (let column = 1; column <= row.cellCount; column += 1) values[column - 1] = cellText(row.getCell(column).value);
      matrix[row.number - 1] = values;
    });
    return rowsFromMatrix(worksheet.name, matrix);
  });
}

function referenceRows(field: ImportFieldConfig, data: AcademicWorkspaceData): [string, string][] {
  switch (field.reference) {
    case "programs": return data.programs.map((item) => [item.code, item.name]);
    case "lecturers": return data.lecturers.map((item) => [item.nidn, item.name]);
    case "courses": return data.courses.map((item) => [item.code, item.name]);
    case "curricula": return data.curricula.map((item) => [item.code ?? item.id, item.name]);
    case "offerings": return data.offerings.map((item) => [item.code, item.className]);
    case "students": return data.students.map((item) => [item.nim, item.name]);
    case "ceremonies": return data.ceremonies.map((item) => [item.code ?? item.id, item.name]);
    default: return [];
  }
}

function exampleValue(field: ImportFieldConfig, data: AcademicWorkspaceData): string | number {
  if (field.example !== undefined) return field.example;
  if (field.reference) return referenceRows(field, data)[0]?.[0] ?? "";
  if (field.enumValues) return field.enumValues[0];
  return "";
}

function styleHeader(row: ExcelJS.Row) {
  row.height = 30;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF103D60" } };
    cell.alignment = { vertical: "middle", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FFD6A132" } } };
  });
}

export async function buildImportTemplate(config: ImportModuleConfig, data: AcademicWorkspaceData): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SiAkad Back Office";
  workbook.subject = `Template import ${config.title}`;
  workbook.created = new Date();

  for (const sheetConfig of config.sheets) {
    const sheet = workbook.addWorksheet(sheetConfig.name);
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.columns = sheetConfig.fields.map((field) => ({ header: field.header, key: field.key, width: Math.max(18, Math.min(34, field.header.length + 8)), style: { numFmt: field.format.startsWith("Text") ? "@" : "General" } }));
    styleHeader(sheet.getRow(1));
    sheet.addRow(Object.fromEntries(sheetConfig.fields.map((field) => [field.key, exampleValue(field, data)])));
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheetConfig.fields.length } };
  }

  const instructions = workbook.addWorksheet("PETUNJUK");
  instructions.columns = [{ width: 24 }, { width: 32 }, { width: 17 }, { width: 25 }, { width: 68 }];
  instructions.addRow(["SHEET", "KOLOM", "KEBUTUHAN", "FORMAT", "KETERANGAN"]);
  styleHeader(instructions.getRow(1));
  instructionsConfigRows(config).forEach((row) => instructions.addRow(row));
  config.instructions.forEach((text, index) => instructions.addRow([`INSTRUKSI ${index + 1}`, text]));

  const references = workbook.addWorksheet("REFERENSI");
  references.columns = [{ width: 30 }, { width: 44 }, { width: 28 }];
  references.addRow(["JENIS REFERENSI", "KODE", "NAMA / NILAI"]);
  styleHeader(references.getRow(1));
  for (const sheetConfig of config.sheets) {
    for (const field of sheetConfig.fields) {
      if (field.reference) {
        for (const [code, name] of referenceRows(field, data)) references.addRow([field.reference, code, name]);
      }
      if (field.enumValues) {
        for (const value of field.enumValues) references.addRow([field.key, value, value]);
      }
    }
  }
  if (references.rowCount === 1) references.addRow(["Tidak ada referensi eksternal", "", ""]);

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function instructionsConfigRows(config: ImportModuleConfig): (string | boolean)[][] {
  return config.sheets.flatMap((sheet) => sheet.fields.map((field) => [sheet.name, field.header, field.systemGenerated ? "SYSTEM GENERATED" : [field.required ? "REQUIRED" : "OPTIONAL", field.reference ? "REFERENCE" : ""].filter(Boolean).join(" / "), field.format, field.description]));
}
