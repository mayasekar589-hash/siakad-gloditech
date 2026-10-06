"use client";

import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, CircleAlert, FileText, LockKeyhole, Printer, Upload, X } from "lucide-react";
import { paymentProofDocument as paymentProofConfig, registrationStepLabels } from "@/features/registration/config";
import { registrationService, validateRegistrationDocument } from "@/features/registration/service";
import type { AdmissionDocumentConfig, RegistrationConfiguration, RegistrationDocument, RegistrationField, RegistrationFormData, RegistrationReceipt, RegistrationStepKey, RegistrationType } from "@/features/registration/types";

type EditableStep = Exclude<RegistrationStepKey, "documents" | "payment" | "confirmation">;
type FieldErrors = Record<string, string>;

const emptyForm: RegistrationFormData = {
  personal: {},
  parent: { hasGuardian: false },
  education: {},
  physical: {},
  program: {},
  professional: {},
  documents: [],
  payment: { status: "MENUNGGU_VERIFIKASI" }
};

const guardianNoDataLabel = "Tidak memiliki wali / tidak menggunakan data wali";

function initialFormForConfiguration(config: RegistrationConfiguration): RegistrationFormData {
  const program = config.trainingProgram;
  if (!program) return emptyForm;
  const schedule = program.schedules[0];
  return {
    ...emptyForm,
    program: {
      programType: program.category,
      programName: program.name,
      selectedProgramId: program.id,
      period: schedule?.title ?? "",
      date: schedule?.startDate ?? "",
      location: program.location ?? ""
    }
  };
}

function readField(data: RegistrationFormData, step: EditableStep, id: string): string | boolean {
  if (step === "parent") {
    if (id === "hasGuardian") return Boolean(data.parent.hasGuardian);
    const [group, key] = id.split(".");
    const nested = data.parent[group as "father" | "mother" | "guardian"];
    return nested?.[key as keyof typeof nested] as string | undefined ?? "";
  }
  const section = data[step] as Record<string, string | boolean | undefined>;
  return section[id] ?? "";
}

function writeField(data: RegistrationFormData, step: EditableStep, id: string, value: string | boolean): RegistrationFormData {
  if (step === "parent") {
    if (id === "hasGuardian") return { ...data, parent: { ...data.parent, hasGuardian: Boolean(value) } };
    const [group, key] = id.split(".");
    const groupKey = group as "father" | "mother" | "guardian";
    return {
      ...data,
      parent: {
        ...data.parent,
        [groupKey]: { ...data.parent[groupKey], [key]: value }
      }
    };
  }

  return { ...data, [step]: { ...data[step], [id]: value } } as RegistrationFormData;
}

function validateField(field: RegistrationField, value: string | boolean): string | null {
  const text = String(value).trim();
  if (field.required && !text) return `${field.label} wajib diisi.`;
  if (!text) return null;

  if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) return "Format email tidak valid.";
  if (field.validation === "nik" && !/^\d{16}$/.test(text)) return "NIK harus terdiri dari 16 digit.";
  if (field.validation === "phone" && (/[A-Za-z]/.test(text) || text.replace(/\D/g, "").length < 8 || text.replace(/\D/g, "").length > 15)) return "Format nomor HP tidak valid.";
  if (field.validation === "postal" && !/^\d{5}$/.test(text)) return "Kode pos harus terdiri dari 5 digit.";
  if (field.validation === "positive-number" && (!Number.isFinite(Number(text)) || Number(text) <= 0)) return `${field.label} harus berupa angka lebih dari 0.`;
  if (field.validation === "year" && (!/^\d{4}$/.test(text) || Number(text) < 1900 || Number(text) > new Date().getFullYear())) return "Tahun lulus tidak valid.";
  if (field.kind === "date" && field.id === "birthDate" && new Date(`${text}T00:00:00`) > new Date()) return "Tanggal lahir tidak boleh di masa depan.";
  return null;
}

function formatSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(0)} KB`;
  return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
}

function stepHeading(step: RegistrationStepKey) {
  const headings: Record<RegistrationStepKey, string> = {
    program: "Pilih program yang dituju",
    personal: "Data pribadi peserta",
    parent: "Data orang tua / wali",
    education: "Riwayat pendidikan",
    physical: "Data fisik",
    professional: "Data profesional",
    documents: "Dokumen pendaftaran",
    payment: "Informasi pembayaran",
    confirmation: "Periksa kembali data"
  };
  return headings[step];
}

function FieldControl({
  field,
  value,
  error,
  onChange
}: {
  field: RegistrationField;
  value: string | boolean;
  error?: string;
  onChange: (value: string) => void;
}) {
  const id = `registration-${field.id.replaceAll(".", "-")}`;
  const errorId = `${id}-error`;
  const shared = {
    id,
    name: field.id,
    value: String(value),
    required: field.required,
    placeholder: field.placeholder,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : field.hint ? `${id}-hint` : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value)
  };

  return (
    <div className={`registration-form-field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>{field.label}{field.required ? <span aria-hidden="true"> *</span> : <small> Opsional</small>}</label>
      {field.kind === "select" ? (
        <select {...shared} value={String(value)}>
          <option value="">Pilih {field.label.toLowerCase()}</option>
          {field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
        </select>
      ) : field.kind === "textarea" ? (
        <textarea {...shared} rows={3} />
      ) : (
        <input {...shared} type={field.kind} inputMode={field.kind === "number" ? "decimal" : undefined} min={field.kind === "number" ? "0" : undefined} step={field.kind === "number" ? "any" : undefined} />
      )}
      {field.hint && !error ? <p id={`${id}-hint`} className="registration-field-hint">{field.hint}</p> : null}
      {error ? <p id={errorId} className="registration-field-error" role="alert">{error}</p> : null}
    </div>
  );
}

function DocumentUploader({
  config,
  document,
  error,
  uploading,
  onFile,
  onRemove
}: {
  config: AdmissionDocumentConfig;
  document?: RegistrationDocument;
  error?: string;
  uploading: boolean;
  onFile: (file: File) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputId = `document-${config.id}`;
  const receive = (file?: File) => { if (file) onFile(file); };
  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    receive(event.dataTransfer.files[0]);
  };

  return (
    <div className={`registration-upload-item${error ? " has-error" : ""}`}>
      <div className="registration-upload-heading">
        <div><h3>{config.label}{config.required ? <span> *</span> : <small> · Opsional</small>}</h3>{config.description ? <p>{config.description}</p> : null}</div>
        {document ? <CheckCircle2 size={19} aria-label="Dokumen dipilih" /> : null}
      </div>
      <input
        id={inputId}
        className="registration-file-input"
        type="file"
        accept={config.acceptedTypes.join(",")}
        aria-label={`Pilih ${config.label}`}
        onChange={(event) => { receive(event.target.files?.[0]); event.currentTarget.value = ""; }}
      />
      {document ? (
        <div className="registration-upload-file">
          <FileText size={19} aria-hidden="true" />
          <div><strong>{document.fileName}</strong><span>{formatSize(document.sizeBytes)} · dipilih pada sesi ini</span></div>
          <button type="button" className="registration-icon-button" aria-label={`Hapus ${config.label}`} onClick={onRemove}><X size={17} /></button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`registration-dropzone${dragging ? " is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <Upload size={20} aria-hidden="true" />
          <span>{uploading ? "Memeriksa file..." : "Seret file ke sini atau pilih file"}</span>
          <small>{config.acceptedTypes.map((type) => type.split("/")[1]?.toUpperCase()).join(", ")}{config.maxSizeBytes ? ` · Maks. ${formatSize(config.maxSizeBytes)} (batas teknis)` : " · Batas ukuran mengikuti konfigurasi periode"}</small>
        </label>
      )}
      {uploading ? <progress className="registration-upload-progress" aria-label={`Memproses ${config.label}`} /> : null}
      {error ? <p className="registration-field-error" role="alert">{error}</p> : null}
    </div>
  );
}

function readDisplayValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (typeof value === "string" && value.trim()) return value;
  return "Belum diisi";
}

export function RegistrationWizard({ config }: { config: RegistrationConfiguration }) {
  const [formData, setFormData] = useState<RegistrationFormData>(() => initialFormForConfiguration(config));
  const [stepIndex, setStepIndex] = useState(-1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<RegistrationReceipt | null>(null);
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [documentErrors, setDocumentErrors] = useState<FieldErrors>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<RegistrationDocument | undefined>();

  const currentStep = config.steps[stepIndex];
  const totalSteps = config.steps.length;
  const activeFields = currentStep && currentStep !== "documents" && currentStep !== "payment" && currentStep !== "confirmation"
    ? config.fields[currentStep] ?? []
    : [];

  const programName = useMemo(() => {
    if (config.trainingProgram) return config.trainingProgram.name;
    const selectedId = formData.education.selectedProgramId ?? formData.program.selectedProgramId;
    return config.programs.find((program) => program.id === selectedId)?.name ?? selectedId ?? "Belum dipilih";
  }, [config.programs, config.trainingProgram, formData.education.selectedProgramId, formData.program.selectedProgramId]);

  function setValue(step: EditableStep, id: string, value: string | boolean) {
    setFormData((current) => writeField(current, step, id, value));
    setFieldErrors((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  async function beginRegistration() {
    setBusy(true);
    setErrorMessage("");
    try {
      const draft = await registrationService.createDraft(config.registrationType, config.period?.id ?? null);
      setDraftId(draft.id);
      setStepIndex(0);
    } catch {
      setErrorMessage("Sesi pendaftaran belum dapat dimulai. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  function visibleFields(step: EditableStep) {
    return (config.fields[step] ?? []).filter((field) => {
      if (!field.visibleWhen) return true;
      return String(readField(formData, step, field.visibleWhen.field)) === field.visibleWhen.equals;
    });
  }

  function validateCurrentStep() {
    if (!currentStep) return true;
    const nextErrors: FieldErrors = {};
    if (currentStep !== "documents" && currentStep !== "payment" && currentStep !== "confirmation") {
      visibleFields(currentStep).forEach((field) => {
        const error = validateField(field, readField(formData, currentStep, field.id));
        if (error) nextErrors[field.id] = error;
      });
    }
    if (currentStep === "documents") {
      config.documents.filter((documentConfig) => documentConfig.required).forEach((documentConfig) => {
        if (!formData.documents.some((document) => document.configId === documentConfig.id)) nextErrors[documentConfig.id] = `${documentConfig.label} wajib diunggah.`;
      });
    }
    setFieldErrors(nextErrors);
    setErrorMessage("");
    return Object.keys(nextErrors).length === 0;
  }

  async function nextStep() {
    if (!validateCurrentStep()) return;
    if (draftId) await registrationService.updateDraft(draftId, formData);
    setStepIndex((index) => Math.min(index + 1, totalSteps - 1));
    setConsent(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function previousStep() {
    setFieldErrors({});
    setErrorMessage("");
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function selectDocument(file: File, documentConfig: AdmissionDocumentConfig, isPaymentProof = false) {
    const validation = validateRegistrationDocument(file, documentConfig);
    if (validation) {
      setDocumentErrors((current) => ({ ...current, [documentConfig.id]: validation }));
      return;
    }
    setDocumentErrors((current) => ({ ...current, [documentConfig.id]: "" }));
    setUploadingId(documentConfig.id);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      const uploaded = await registrationService.uploadRegistrationDocument(file, documentConfig);
      const document: RegistrationDocument = { ...uploaded, configId: documentConfig.id, label: documentConfig.label };
      if (isPaymentProof) setPaymentProof(document);
      else setFormData((current) => ({ ...current, documents: [...current.documents.filter((item) => item.configId !== documentConfig.id), document] }));
    } catch (error) {
      setDocumentErrors((current) => ({ ...current, [documentConfig.id]: error instanceof Error ? error.message : "File tidak dapat diproses." }));
    } finally {
      setUploadingId(null);
    }
  }

  async function submitRegistration() {
    if (!consent || !draftId) return;
    setBusy(true);
    setErrorMessage("");
    try {
      const nextData = paymentProof
        ? { ...formData, documents: [...formData.documents.filter((item) => item.configId !== paymentProof.configId), paymentProof] }
        : formData;
      const result = await registrationService.submit(draftId, config.registrationType, nextData);
      setReceipt(result);
    } catch {
      setErrorMessage("Pendaftaran belum dapat diproses. Data Anda tetap berada di sesi ini; silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  if (receipt) return <RegistrationSuccess receipt={receipt} />;

  if (stepIndex < 0) {
    return (
      <div className="registration-flow-shell">
        <Link className="registration-back-link" href="/pendaftaran"><ArrowLeft size={16} aria-hidden="true" /> Semua pilihan pendaftaran</Link>
        <div className="registration-flow-intro">
          <div>
            <p className="registration-eyebrow"><span aria-hidden="true" />Pendaftaran</p>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </div>
          <aside className="registration-period-panel" aria-label="Informasi periode pendaftaran">
            <span>Status periode</span><strong>{config.period ? config.period.status : "Belum dikonfigurasi"}</strong>
            <p>{config.period?.name ?? "Periode, jadwal, biaya, kuota, dan persyaratan aktif belum tersedia pada konfigurasi."}</p>
          </aside>
        </div>
        <div className="registration-config-grid">
          <section><h2>Program studi</h2>{config.programs.length ? <ul>{config.programs.filter((program) => program.active).map((program) => <li key={program.id}>{program.name}</li>)}</ul> : <p>Daftar program Diklat belum dikonfigurasi.</p>}</section>
          <section><h2>Persyaratan utama</h2>{config.requirements.length ? <ul>{config.requirements.map((item) => <li key={item.id}>{item.title}: {item.description}</li>)}</ul> : <p>Persyaratan periode ini belum dikonfigurasi.</p>}</section>
          <section><h2>Tahapan seleksi</h2>{config.schedules.length ? <ul>{config.schedules.map((item) => <li key={item.id}>{item.title}</li>)}</ul> : <p>Jadwal dan tahapan akan mengikuti konfigurasi resmi periode.</p>}</section>
        </div>
        <div className="registration-mock-notice" role="note"><LockKeyhole size={18} aria-hidden="true" /><p>Mode pratinjau: backend pendaftaran belum terhubung. Data hanya berada di memori halaman ini dan tidak dikirim atau disimpan.</p></div>
        {errorMessage ? <p className="registration-flow-error" role="alert">{errorMessage}</p> : null}
        <button type="button" className="registration-primary-action" onClick={beginRegistration} disabled={busy}>{busy ? "Menyiapkan sesi..." : "Mulai Pendaftaran"}<ArrowRight size={17} aria-hidden="true" /></button>
      </div>
    );
  }

  return (
    <div className="registration-flow-shell">
      <Link className="registration-back-link" href="/pendaftaran"><ArrowLeft size={16} aria-hidden="true" /> Semua pilihan pendaftaran</Link>
      <div className="registration-wizard-heading">
        <div><p className="registration-eyebrow"><span aria-hidden="true" />{config.title}</p><h1>{stepHeading(currentStep)}</h1></div>
        <p>Langkah {stepIndex + 1} dari {totalSteps}</p>
      </div>
      <ol className="registration-progress" aria-label="Progres pendaftaran">
        {config.steps.map((step, index) => <li key={step} className={index < stepIndex ? "is-complete" : index === stepIndex ? "is-current" : ""} aria-current={index === stepIndex ? "step" : undefined}><span>{index < stepIndex ? <Check size={14} aria-hidden="true" /> : index + 1}</span><small>{registrationStepLabels[step]}</small></li>)}
      </ol>

      <div className="registration-form-panel">
        <div className="registration-mock-notice compact" role="note"><LockKeyhole size={16} aria-hidden="true" /><p>Pratinjau lokal. Data tidak dikirim ke server atau disimpan permanen.</p></div>
        {currentStep === "program" && config.trainingProgram ? (
          <TrainingProgramStep program={config.trainingProgram} />
        ) : currentStep === "documents" ? (
          <section className="registration-step-section" aria-labelledby="documents-title">
            <h2 id="documents-title">Unggah dokumen sesuai daftar yang tersedia</h2>
            <p className="registration-step-description">Persyaratan wajib dan batas ukuran belum dikonfigurasi. File diproses di sesi ini saja.</p>
            <div className="registration-upload-list">{config.documents.map((documentConfig) => <DocumentUploader key={documentConfig.id} config={documentConfig} document={formData.documents.find((document) => document.configId === documentConfig.id)} error={documentErrors[documentConfig.id] || fieldErrors[documentConfig.id]} uploading={uploadingId === documentConfig.id} onFile={(file) => void selectDocument(file, documentConfig)} onRemove={() => setFormData((current) => ({ ...current, documents: current.documents.filter((document) => document.configId !== documentConfig.id) }))} />)}</div>
          </section>
        ) : currentStep === "payment" ? (
          <PaymentStep config={config} method={String(formData.payment.method ?? "")} referenceNumber={String(formData.payment.referenceNumber ?? "")} paymentProof={paymentProof} uploading={uploadingId === paymentProofConfig.id} error={documentErrors[paymentProofConfig.id]} onMethodChange={(value) => setFormData((current) => ({ ...current, payment: { ...current.payment, method: value } }))} onReferenceChange={(value) => setFormData((current) => ({ ...current, payment: { ...current.payment, referenceNumber: value } }))} onProof={(file) => void selectDocument(file, paymentProofConfig, true)} onRemoveProof={() => setPaymentProof(undefined)} />
        ) : currentStep === "confirmation" ? (
          <ConfirmationStep config={config} data={formData} programName={programName} paymentProof={paymentProof} consent={consent} busy={busy} errorMessage={errorMessage} onConsentChange={setConsent} onEdit={(step) => { setFieldErrors({}); setStepIndex(config.steps.indexOf(step)); }} onSubmit={() => void submitRegistration()} />
        ) : (
          <FieldStep step={currentStep} registrationType={config.registrationType} fields={activeFields} data={formData} errors={fieldErrors} onChange={(field, value) => setValue(currentStep as EditableStep, field.id, field.id === "hasGuardian" ? value === "true" : value)} />
        )}
      </div>
      {errorMessage ? <p className="registration-flow-error" role="alert">{errorMessage}</p> : null}
      {currentStep !== "confirmation" ? (
        <div className="registration-wizard-actions">
          <button type="button" className="registration-secondary-action" onClick={previousStep} disabled={busy}><ArrowLeft size={16} aria-hidden="true" /> Kembali</button>
          <button type="button" className="registration-primary-action" onClick={() => void nextStep()} disabled={busy}>{busy ? "Memproses..." : "Simpan & Lanjutkan"}<ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      ) : null}
    </div>
  );
}

function TrainingProgramStep({ program }: { program: NonNullable<RegistrationConfiguration["trainingProgram"]> }) {
  return (
    <section className="registration-step-section" aria-labelledby="training-form-program-title">
      <p className="registration-eyebrow"><span aria-hidden="true" />{program.category}</p>
      <h2 id="training-form-program-title">{program.name}</h2>
      <p className="registration-step-description">{program.description}</p>
      <dl className="registration-training-facts">
        <div><dt>Durasi</dt><dd>{program.duration ?? "Belum dikonfigurasi"}</dd></div>
        <div><dt>Lokasi</dt><dd>{program.location ?? "Mengikuti informasi periode"}</dd></div>
        <div><dt>Jadwal</dt><dd>{program.schedules[0]?.title ?? "Belum dikonfigurasi"}</dd></div>
      </dl>
      <p className="registration-step-description">Persyaratan dan dokumen pada langkah berikutnya mengikuti konfigurasi program ini.</p>
    </section>
  );
}

function FieldStep({ step, registrationType, fields, data, errors, onChange }: { step: EditableStep; registrationType: RegistrationType; fields: readonly RegistrationField[]; data: RegistrationFormData; errors: FieldErrors; onChange: (field: RegistrationField, value: string) => void }) {
  const groups = step === "parent" ? [
    { prefix: "father.", title: "Data ayah" },
    { prefix: "mother.", title: "Data ibu" },
    { prefix: "guardian.", title: "Data wali" }
  ] : [];
  const shownFields = (fieldList: readonly RegistrationField[]) => fieldList.filter((field) => !field.visibleWhen || String(readField(data, step, field.visibleWhen.field)) === field.visibleWhen.equals);

  return (
    <section className="registration-step-section" aria-labelledby={`step-${step}-title`}>
      <h2 id={`step-${step}-title`}>{stepHeading(step)}</h2>
      {step === "education" ? <p className="registration-step-description">Pastikan program studi yang dipilih sesuai dengan persyaratan periode pendaftaran. Pilihan program hanya referensi sampai konfigurasi periode tersedia.</p> : null}
      {step === "parent" ? (
        <>
          <p className="registration-step-description">Data wali bersifat opsional dan hanya diisi bila digunakan.</p>
          {groups.map((group) => <div className="registration-field-group" key={group.prefix}><h3>{group.title}</h3><div className="registration-field-grid">{shownFields(fields.filter((field) => field.id.startsWith(group.prefix))).map((field) => <FieldControl key={field.id} field={field} value={readField(data, step, field.id)} error={errors[field.id]} onChange={(value) => onChange(field, value)} />)}</div></div>)}
          <label className="registration-check-row"><input type="checkbox" checked={!data.parent.hasGuardian} onChange={(event) => onChange({ id: "hasGuardian", label: guardianNoDataLabel, kind: "text", required: false }, String(!event.target.checked))} /><span>{guardianNoDataLabel}</span></label>
        </>
      ) : step === "professional" ? (
        <>
          <p className="registration-step-description">Data buku pelaut dan sertifikat ditampilkan hanya bila relevan. Tidak ada persyaratan profesional yang ditetapkan pada mode pratinjau.</p>
          <div className="registration-field-grid">{shownFields(fields).map((field) => <FieldControl key={field.id} field={field} value={readField(data, step, field.id)} error={errors[field.id]} onChange={(value) => onChange(field, value)} />)}</div>
        </>
      ) : (
        <div className="registration-field-grid">{shownFields(fields).map((field) => <FieldControl key={field.id} field={field} value={readField(data, step, field.id)} error={errors[field.id]} onChange={(value) => onChange(field, value)} />)}</div>
      )}
      {step === "program" ? <p className="registration-step-description">{registrationType === "DIKLAT" ? "Periode, tanggal, lokasi, dan daftar program Diklat belum dimasukkan ke konfigurasi aktif." : "Pastikan program studi pilihan sesuai persyaratan periode. Aturan periode belum dikonfigurasi."}</p> : null}
    </section>
  );
}

function PaymentStep({ config, method, referenceNumber, paymentProof, uploading, error, onMethodChange, onReferenceChange, onProof, onRemoveProof }: {
  config: RegistrationConfiguration;
  method: string;
  referenceNumber: string;
  paymentProof?: RegistrationDocument;
  uploading: boolean;
  error?: string;
  onMethodChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onProof: (file: File) => void;
  onRemoveProof: () => void;
}) {
  const hasFees = config.fees.length > 0;
  const total = hasFees ? config.fees.reduce((sum, fee) => sum + (fee.amount ?? 0), 0) : null;

  return (
    <section className="registration-step-section" aria-labelledby="payment-title">
      <h2 id="payment-title">Rincian pembayaran</h2>
      <p className="registration-step-description">Nominal dan metode pembayaran belum dikonfigurasi. Jangan melakukan pembayaran sebelum menerima instruksi resmi.</p>
      <div className="registration-fee-list">{hasFees ? config.fees.map((fee) => <div key={fee.id}><span>{fee.name}</span><strong>{fee.amount === null ? "Belum dikonfigurasi" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(fee.amount)}</strong></div>) : <p>Biaya pendaftaran dan seleksi belum tersedia.</p>}<div className="registration-fee-total"><span>Total</span><strong>{total === null ? "Belum dikonfigurasi" : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(total)}</strong></div></div>
      <div className="registration-field-grid">
        <div className="registration-form-field"><label htmlFor="payment-method">Metode pembayaran <small> Opsional</small></label><input id="payment-method" value={method} onChange={(event) => onMethodChange(event.target.value)} placeholder="Isi mengikuti instruksi resmi" /></div>
        <div className="registration-form-field"><label htmlFor="payment-reference">Nomor / referensi pembayaran <small> Opsional</small></label><input id="payment-reference" value={referenceNumber} onChange={(event) => onReferenceChange(event.target.value)} /></div>
      </div>
      <DocumentUploader config={paymentProofConfig} document={paymentProof} error={error} uploading={uploading} onFile={onProof} onRemove={onRemoveProof} />
      <p className="registration-payment-status"><span aria-hidden="true" />Status pembayaran: menunggu konfigurasi dan verifikasi.</p>
    </section>
  );
}

function ConfirmationStep({ config, data, programName, paymentProof, consent, busy, errorMessage, onConsentChange, onEdit, onSubmit }: {
  config: RegistrationConfiguration;
  data: RegistrationFormData;
  programName: string;
  paymentProof?: RegistrationDocument;
  consent: boolean;
  busy: boolean;
  errorMessage: string;
  onConsentChange: (value: boolean) => void;
  onEdit: (step: RegistrationStepKey) => void;
  onSubmit: () => void;
}) {
  const sections: { step: RegistrationStepKey; title: string; values: [string, unknown][] }[] = [];
  const valuesFor = (step: EditableStep) => (config.fields[step] ?? []).map((field) => {
    const value = readField(data, step, field.id);
    const label = field.options?.find((option) => option.value === String(value))?.label ?? value;
    return [field.label, label] as [string, unknown];
  }).filter(([, value]) => String(value).trim());
  if (config.steps.includes("personal")) sections.push({ step: "personal", title: "Data pribadi", values: valuesFor("personal") });
  if (config.steps.includes("education")) sections.push({ step: "education", title: "Pendidikan", values: valuesFor("education") });
  if (config.steps.includes("program")) sections.push({ step: "program", title: "Program", values: config.trainingProgram ? [["Program", config.trainingProgram.name], ["Kategori", config.trainingProgram.category]] : config.registrationType === "DIKLAT" ? valuesFor("program") : [["Program studi", programName]] });
  if (config.steps.includes("parent")) sections.push({ step: "parent", title: "Data orang tua / wali", values: valuesFor("parent") });
  if (config.steps.includes("physical")) sections.push({ step: "physical", title: "Data fisik", values: valuesFor("physical") });
  if (config.steps.includes("professional")) sections.push({ step: "professional", title: "Data profesional", values: valuesFor("professional") });

  return (
    <section className="registration-step-section" aria-labelledby="confirmation-title">
      <h2 id="confirmation-title">Tinjau data sebelum mengirim</h2>
      <p className="registration-step-description">Periksa kembali informasi yang Anda isi. Anda masih dapat mengubah setiap bagian.</p>
      <div className="registration-review-list">{sections.map((section) => <article key={section.step}><header><h3>{section.title}</h3><button type="button" className="registration-text-button" onClick={() => onEdit(section.step)}>Ubah</button></header><dl>{section.values.length ? section.values.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{readDisplayValue(value)}</dd></div>) : section.step === "parent" && !data.parent.hasGuardian ? <p>{guardianNoDataLabel}</p> : <p>Belum diisi</p>}</dl></article>)}</div>
      <section className="registration-review-documents" aria-labelledby="review-documents-title"><h3 id="review-documents-title">Dokumen</h3>{data.documents.length || paymentProof ? <ul>{[...data.documents, ...(paymentProof ? [paymentProof] : [])].map((document) => <li key={document.id}>{document.label}: {document.fileName}</li>)}</ul> : <p>Belum ada dokumen dipilih.</p>}<button type="button" className="registration-text-button" onClick={() => onEdit("documents")}>Ubah dokumen</button></section>
      <label className="registration-consent"><input type="checkbox" checked={consent} onChange={(event) => onConsentChange(event.target.checked)} /><span>Saya menyatakan bahwa data yang saya berikan adalah benar dan dapat dipertanggungjawabkan.</span></label>
      <p className="registration-privacy-note">Mode pratinjau tidak mengirim atau menyimpan data pendaftar. Dokumen hanya divalidasi sementara di server dan tidak disimpan.</p>
      {errorMessage ? <p className="registration-flow-error" role="alert">{errorMessage}</p> : null}
      <button type="button" className="registration-primary-action" onClick={onSubmit} disabled={!consent || busy}>{busy ? "Memproses..." : "Kirim Pendaftaran"}<ArrowRight size={17} aria-hidden="true" /></button>
      <p className="registration-step-description">Mode pratinjau ini tidak mengirim data ke server dan tidak menghasilkan pendaftaran resmi.</p>
    </section>
  );
}

function RegistrationSuccess({ receipt }: { receipt: RegistrationReceipt }) {
  return (
    <section className="registration-success" aria-labelledby="registration-success-title">
      <span className="registration-success-icon"><CheckCircle2 size={30} aria-hidden="true" /></span>
      <p className="registration-eyebrow"><span aria-hidden="true" />Pratinjau selesai</p>
      <h1 id="registration-success-title">Pendaftaran Berhasil</h1>
      <p>Tahap pendaftaran Anda telah berhasil dikirim dalam simulasi lokal.</p>
      <div className="registration-mock-notice" role="note"><CircleAlert size={18} aria-hidden="true" /><p>Nomor ini hanya contoh dan belum tersimpan di server. Pendaftaran belum menjadi pengajuan resmi sampai backend institusi terhubung.</p></div>
      <dl className="registration-receipt"><div><dt>Nomor pendaftaran</dt><dd>{receipt.registrationNumber}</dd></div><div><dt>Jenis pendaftaran</dt><dd>{receipt.registrationType}</dd></div><div><dt>Nama peserta</dt><dd>{receipt.applicantName}</dd></div><div><dt>Status simulasi</dt><dd>Menunggu Verifikasi</dd></div></dl>
      <div className="registration-success-actions"><button type="button" className="registration-secondary-action" disabled title="Bukti cetak tersedia setelah backend dokumen terhubung"><Printer size={16} aria-hidden="true" /> Cetak Bukti Pendaftaran</button><Link className="registration-primary-action" href="/">Kembali ke Beranda<ArrowRight size={17} aria-hidden="true" /></Link></div>
    </section>
  );
}

