import type { DocumentType } from "../../components/documents/document-layout";

export function printDocument(documentType: DocumentType) {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  const target = document.querySelector<HTMLElement>(`.document-layout[data-document-type="${documentType}"]`);
  if (!target) return;

  root.dataset.printDocument = documentType;
  target.dataset.printSelected = "true";

  const clearPrintTarget = () => {
    if (root.dataset.printDocument === documentType) delete root.dataset.printDocument;
    delete target.dataset.printSelected;
  };

  window.addEventListener("afterprint", clearPrintTarget, { once: true });
  window.print();
}