import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, FileText, MapPin } from "lucide-react";
import { RegistrationWizard } from "@/components/registration/registration-wizard";
import { registrationConfig, registrationStepLabels } from "@/features/registration/config";
import type { TrainingCategory } from "@/features/registration/data/training-categories";
import { trainingPrograms } from "@/features/registration/data/training-programs";
import type { RegistrationConfiguration, RegistrationStepKey, TrainingProgram } from "@/features/registration/types";

const statusLabels = {
  OPEN: "Pendaftaran dibuka",
  CLOSED: "Pendaftaran ditutup",
  COMING_SOON: "Segera hadir"
} as const;

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(`${date}T00:00:00`));
}

function ProgramCard({ program }: { program: TrainingProgram }) {
  return (
    <article className="registration-training-card">
      <div className="registration-training-card-image">
        {program.imageSrc ? <Image src={program.imageSrc} alt={`Foto program ${program.name}`} fill sizes="(max-width: 700px) 100vw, (max-width: 980px) 50vw, 33vw" /> : <div className="registration-training-image-placeholder" aria-hidden="true"><FileText size={23} /></div>}
      </div>
      <div className="registration-training-card-copy">
        <p className="registration-eyebrow">{program.category}</p>
        <h2>{program.name}</h2>
        <p>{program.shortDescription}</p>
        <dl>
          <div><dt>Status</dt><dd data-status={program.status}>{statusLabels[program.status]}</dd></div>
          {program.duration ? <div><dt>Durasi</dt><dd>{program.duration}</dd></div> : null}
          <div><dt>Biaya</dt><dd>{program.fees.length ? "Sesuai rincian periode" : "Biaya mengikuti ketentuan periode pendaftaran."}</dd></div>
        </dl>
        <Link className="registration-card-action" href={`/pendaftaran/diklat/${program.slug}`}><span>Lihat Detail</span><ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
    </article>
  );
}

export function TrainingCatalogPage({ category }: { category?: TrainingCategory }) {
  const activePrograms = trainingPrograms.filter((program) => {
    if (!program.active) return false;
    return !category || program.category.toLocaleLowerCase("id-ID").includes(category.matchText);
  });

  return (
    <div className="registration-page registration-training-page">
      <section className="registration-training-hero">
        <div className="registration-shell">
          <Link className="registration-back-link" href="/pendaftaran"><ArrowLeft size={16} aria-hidden="true" /> Semua jenis pendaftaran</Link>
          <p className="registration-eyebrow"><span aria-hidden="true" />Diklat · Pendidikan dan Pelatihan</p>
          <h1>{category?.name ?? "Program Diklat"}</h1>
          <p>Pilih program pendidikan dan pelatihan yang sesuai dengan kebutuhan Anda.</p>
        </div>
      </section>
      <section className="registration-shell registration-training-catalog" aria-labelledby="training-list-title">
        <div className="registration-training-catalog-heading"><div><p className="registration-eyebrow">Katalog</p><h2 id="training-list-title">{category ? `${category.name} yang tersedia` : "Program yang tersedia"}</h2></div><span>{activePrograms.length} program</span></div>
        {activePrograms.length ? <div className="registration-training-grid">{activePrograms.map((program) => <ProgramCard key={program.id} program={program} />)}</div> : <div className="registration-training-empty"><FileText size={21} aria-hidden="true" /><div><h3>{category ? `${category.name} belum tersedia` : "Program Diklat belum tersedia"}</h3><p>Belum ada data program yang dikonfigurasi untuk ditampilkan. Nama program, periode, persyaratan, dan biaya akan mengikuti informasi resmi.</p></div></div>}
      </section>
    </div>
  );
}

export function TrainingProgramDetailPage({ program }: { program: TrainingProgram }) {
  const isOpen = program.status === "OPEN";
  const firstSchedule = program.schedules[0];
  const fees = program.fees.length ? program.fees : [];

  return (
    <div className="registration-page registration-training-page">
      <section className="registration-training-detail-hero">
        {program.imageSrc ? <div className="registration-training-detail-image"><Image src={program.imageSrc} alt={`Foto ${program.name}`} fill priority sizes="100vw" /></div> : null}
        <div className="registration-shell registration-training-detail-copy">
          <Link className="registration-back-link" href="/pendaftaran/diklat"><ArrowLeft size={16} aria-hidden="true" /> Kembali ke katalog Diklat</Link>
          <p className="registration-eyebrow"><span aria-hidden="true" />{program.category}</p>
          <h1>{program.name}</h1>
          <p>{program.description}</p>
          <span className="registration-training-status" data-status={program.status}>{statusLabels[program.status]}</span>
          {isOpen ? <Link className="registration-primary-action" href={`/pendaftaran/diklat/${program.slug}/daftar`}>Daftar Program Ini<ArrowRight size={17} aria-hidden="true" /></Link> : <span className="registration-training-disabled">Pendaftaran program ini belum dibuka.</span>}
        </div>
      </section>

      <div className="registration-shell registration-training-detail-content">
        <section className="registration-training-overview"><div><p className="registration-eyebrow">Informasi program</p><h2>Gambaran pelatihan</h2></div><div><p>{program.description}</p><dl className="registration-training-facts"><div><dt><Clock3 size={15} aria-hidden="true" /> Durasi</dt><dd>{program.duration ?? "Belum dikonfigurasi"}</dd></div><div><dt><MapPin size={15} aria-hidden="true" /> Lokasi</dt><dd>{program.location ?? "Mengikuti informasi periode"}</dd></div><div><dt><CalendarDays size={15} aria-hidden="true" /> Periode</dt><dd>{firstSchedule ? formatDate(firstSchedule.startDate) ?? firstSchedule.title : "Belum dikonfigurasi"}</dd></div></dl></div></section>
        <section className="registration-training-detail-section"><p className="registration-eyebrow">Persyaratan</p><h2>Ketentuan program</h2>{program.requirements.length ? <ul>{program.requirements.map((requirement) => <li key={requirement.id}>{requirement.title}{requirement.description ? ` · ${requirement.description}` : ""}</li>)}</ul> : <p>Persyaratan belum dikonfigurasi untuk program ini.</p>}{program.eligibility.length ? <ul>{program.eligibility.map((requirement) => <li key={requirement.id}>{requirement.title} · {requirement.description}</li>)}</ul> : null}</section>
        <section className="registration-training-detail-section"><p className="registration-eyebrow">Dokumen</p><h2>Dokumen yang diperlukan</h2>{program.documents.length ? <ul>{program.documents.map((document) => <li key={document.id}><span>{document.label}</span>{document.required ? <strong>Wajib</strong> : <small>Opsional</small>}{document.description ? <p>{document.description}</p> : null}</li>)}</ul> : <p>Dokumen belum dikonfigurasi untuk program ini.</p>}</section>
        <section className="registration-training-detail-section"><p className="registration-eyebrow">Biaya</p><h2>Rincian biaya</h2>{fees.length ? <dl className="registration-training-fees">{fees.map((fee) => <div key={fee.id}><dt>{fee.name}</dt><dd>{fee.amount === null ? "Mengikuti ketentuan periode pendaftaran." : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(fee.amount)}</dd></div>)}</dl> : <p>Biaya mengikuti ketentuan periode pendaftaran.</p>}</section>
        <section className="registration-training-detail-section"><p className="registration-eyebrow">Jadwal</p><h2>Periode dan tanggal</h2>{program.schedules.length ? <ul>{program.schedules.map((schedule) => <li key={schedule.id}>{schedule.title}: {formatDate(schedule.startDate) ?? "Tanggal belum tersedia"}{schedule.endDate ? ` – ${formatDate(schedule.endDate)}` : ""}</li>)}</ul> : <p>Jadwal dan batas pendaftaran belum dikonfigurasi.</p>}</section>
        <section className="registration-training-detail-section"><p className="registration-eyebrow">Alur</p><h2>Tahapan program</h2><ol className="registration-training-flow">{(program.registrationFlow.length ? program.registrationFlow : ["program", "personal", "professional", "documents", "payment", "confirmation"]).map((step, index) => <li key={`${step}-${index}`}><span>{index + 1}</span><strong>{registrationStepLabels[step as RegistrationStepKey] ?? step}</strong></li>)}</ol></section>
        {isOpen ? <Link className="registration-primary-action" href={`/pendaftaran/diklat/${program.slug}/daftar`}>Daftar Program Ini<ArrowRight size={17} aria-hidden="true" /></Link> : null}
      </div>
    </div>
  );
}

export function TrainingProgramRegistrationPage({ program }: { program: TrainingProgram }) {
  const base = registrationConfig.DIKLAT;
  const config: RegistrationConfiguration = {
    ...base,
    title: program.name,
    description: program.description,
    trainingProgram: program,
    programs: [{ id: program.id, code: program.slug, name: program.name, active: program.active }],
    requirements: program.requirements,
    documents: program.documents,
    fees: program.fees,
    schedules: program.schedules,
    steps: program.registrationFlow.length ? program.registrationFlow : base.steps,
    fields: { ...base.fields, professional: program.professionalFields }
  };

  return <div className="registration-page registration-detail-page"><RegistrationWizard config={config} />{!program.active ? <p className="registration-training-disabled">Program ini sedang tidak aktif.</p> : null}</div>;
}

