import { randomUUID } from "node:crypto";
import { paymentProofDocument, registrationConfig, registrationSystemMaxUploadBytes } from "@/features/registration/config";

export const runtime = "nodejs";

function matchesSignature(mimeType: string, bytes: Uint8Array) {
  if (mimeType === "application/pdf") return String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-";
  if (mimeType === "image/png") return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (mimeType === "image/jpeg") return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  return false;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > registrationSystemMaxUploadBytes + 256 * 1024) {
    return Response.json({ message: "Ukuran unggahan melebihi batas sistem." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ message: "Format unggahan tidak dapat dibaca." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const file = formData.get("file");
  const documentId = formData.get("documentId");
  if (!(file instanceof File) || typeof documentId !== "string") {
    return Response.json({ message: "File dan jenis dokumen wajib disertakan." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const configuredDocuments = Object.values(registrationConfig).flatMap((registration) => registration.documents);
  const config = [...configuredDocuments, paymentProofDocument].find((document) => document.id === documentId);
  if (!config) return Response.json({ message: "Jenis dokumen tidak dikenal." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  if (!config.acceptedTypes.includes(file.type)) return Response.json({ message: "File yang diunggah tidak sesuai format." }, { status: 415, headers: { "Cache-Control": "no-store" } });
  if (file.size === 0 || file.size > registrationSystemMaxUploadBytes || (config.maxSizeBytes !== null && file.size > config.maxSizeBytes)) {
    return Response.json({ message: "Ukuran file kosong atau melebihi batas sistem." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesSignature(file.type, bytes)) return Response.json({ message: "Isi file tidak cocok dengan tipe dokumen." }, { status: 415, headers: { "Cache-Control": "no-store" } });

  return Response.json({
    id: `validated-${randomUUID()}`,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedAt: new Date().toISOString()
  }, { headers: { "Cache-Control": "no-store" } });
}