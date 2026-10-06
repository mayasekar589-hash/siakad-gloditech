"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, Check, ChevronRight, ExternalLink,
  File, FileText, PlayCircle, Presentation, Search
} from "lucide-react";
import { demoStudent } from "../demo/data/student";
import {
  activeLearningCourses, learningMaterials, learningModules,
  type LearningMaterial, type LearningMaterialStatus, type LearningMaterialType
} from "./learning-data";

const base = "/pembelajaran";

type MaterialStatusFilter = "ALL" | "UNREAD" | "IN_PROGRESS" | "COMPLETED";
type MaterialTypeFilter = "ALL" | "PDF" | "VIDEO" | "PRESENTATION" | "DOCUMENT" | "LINK";

function isComplete(status: LearningMaterialStatus) {
  return status === "READ" || status === "COMPLETED";
}

function materialIcon(type: LearningMaterialType) {
  if (type === "VIDEO" || type === "EMBED") return PlayCircle;
  if (type === "PRESENTATION") return Presentation;
  if (type === "DOCUMENT" || type === "FILE") return File;
  if (type === "LINK") return ExternalLink;
  return FileText;
}

function materialTypeLabel(type: LearningMaterialType) {
  if (type === "PRESENTATION") return "Presentasi";
  if (type === "DOCUMENT" || type === "FILE") return "Dokumen";
  if (type === "EMBED") return "Video";
  return type === "PDF" ? "PDF" : type === "VIDEO" ? "Video" : "Link";
}

function materialStatusLabel(status: LearningMaterialStatus) {
  if (status === "UNREAD") return "Belum Dibaca";
  if (status === "IN_PROGRESS") return "Sedang Dipelajari";
  return "Selesai";
}

function matchesType(material: LearningMaterial, filter: MaterialTypeFilter) {
  if (filter === "ALL") return true;
  if (filter === "DOCUMENT") return material.type === "DOCUMENT" || material.type === "FILE";
  if (filter === "VIDEO") return material.type === "VIDEO" || material.type === "EMBED";
  return material.type === filter;
}

function CourseSelectorItem({ course, selected, onSelect }: {
  course: (typeof activeLearningCourses)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  const materials = learningMaterials.filter((material) => material.courseId === course.code);
  const completed = materials.filter((material) => isComplete(material.status)).length;
  const percent = materials.length ? Math.round((completed / materials.length) * 100) : 0;

  return <button aria-pressed={selected} className={`material-course-option${selected ? " is-active" : ""}`} onClick={onSelect} type="button">
    <span className="material-course-option-icon"><BookOpen size={17} /></span>
    <span className="material-course-option-copy"><strong>{course.name}</strong><small>{course.code}</small></span>
    <span className="material-course-option-stats"><strong>{completed}/{materials.length} materi</strong><span>{percent}%</span></span>
    <span className="material-course-option-track"><span style={{ width: `${percent}%` }} /></span>
  </button>;
}

function MaterialItem({ material }: { material: LearningMaterial }) {
  const Icon = materialIcon(material.type);
  const statusClass = isComplete(material.status) ? "completed" : material.status.toLowerCase();
  const detail = material.duration || material.fileSize || material.fileName;

  return <Link className="material-library-item" href={`${base}/materi/${material.id}`}>
    <span className={`material-library-icon type-${material.type.toLowerCase()}`}><Icon size={17} /></span>
    <span className="material-library-copy"><strong>{material.title}</strong><small>{material.description} · {materialTypeLabel(material.type)}{detail ? ` · ${detail}` : ""}</small></span>
    <span className={`material-library-status status-${statusClass}`}>{isComplete(material.status) ? <Check size={12} /> : null}{materialStatusLabel(material.status)}</span>
    <ChevronRight className="material-library-arrow" size={16} />
  </Link>;
}

export function CourseMaterialLibrary({ initialCourseCode }: { initialCourseCode?: string }) {
  const [selectedCode, setSelectedCode] = useState(() =>
    activeLearningCourses.some((course) => course.code === initialCourseCode)
      ? initialCourseCode as string
      : activeLearningCourses[0]?.code ?? ""
  );
  const [courseSearch, setCourseSearch] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<MaterialStatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<MaterialTypeFilter>("ALL");
  const selectedCourse = activeLearningCourses.find((course) => course.code === selectedCode);
  const allCourseMaterials = learningMaterials.filter((material) => material.courseId === selectedCode);
  const completedCount = allCourseMaterials.filter((material) => isComplete(material.status)).length;
  const progress = allCourseMaterials.length ? Math.round((completedCount / allCourseMaterials.length) * 100) : 0;
  const courseSearchValue = courseSearch.trim().toLocaleLowerCase("id");
  const visibleCourses = activeLearningCourses.filter((course) =>
    `${course.name} ${course.code}`.toLocaleLowerCase("id").includes(courseSearchValue)
  );
  const materialSearchValue = materialSearch.trim().toLocaleLowerCase("id");
  const filteredMaterials = allCourseMaterials.filter((material) => {
    const matchesSearch = !materialSearchValue || `${material.title} ${material.description} ${material.fileName}`.toLocaleLowerCase("id").includes(materialSearchValue);
    const matchesStatus = statusFilter === "ALL"
      || (statusFilter === "COMPLETED" ? isComplete(material.status) : material.status === statusFilter);
    return matchesSearch && matchesStatus && matchesType(material, typeFilter);
  });
  const completedMaterial = allCourseMaterials.find((material) => !isComplete(material.status));
  const modules = learningModules.filter((module) => module.courseId === selectedCode);

  return <div className="portal-page learning-page material-library-page">
    <nav className="material-library-breadcrumb" aria-label="Breadcrumb">
      <Link href="/dashboard">SiAkad Taruna</Link><span>/</span><Link href={`${base}`}>Pembelajaran</Link><span>/</span><strong aria-current="page">Materi</strong>
    </nav>
    <header className="material-library-heading">
      <p>MATERI PEMBELAJARAN</p>
      <h1>Materi Pembelajaran</h1>
      <span>Akses modul, video, dokumen, dan materi pembelajaran dari mata kuliah semester ini.</span>
    </header>
    <div className="material-library-layout">
      <aside className="material-course-selector" aria-label="Mata kuliah">
        <div className="material-course-selector-heading"><span>Mata Kuliah</span><small>{activeLearningCourses.length} course</small></div>
        <label className="material-course-search"><Search size={15} /><input aria-label="Cari mata kuliah" onChange={(event) => setCourseSearch(event.target.value)} placeholder="Cari mata kuliah..." type="search" value={courseSearch} /></label>
        <div className="material-course-options">
          {visibleCourses.map((course) => <CourseSelectorItem course={course} key={course.code} onSelect={() => setSelectedCode(course.code)} selected={selectedCode === course.code} />)}
          {!visibleCourses.length ? <p className="material-library-empty-search">Mata kuliah tidak ditemukan.</p> : null}
        </div>
      </aside>
      <section className="material-library-content" aria-label="Materi mata kuliah">
        {selectedCourse ? <>
          <header className="material-course-header">
            <div className="material-course-header-top"><div><p>{selectedCourse.code}</p><h2>{selectedCourse.name}</h2><span>{selectedCourse.lecturer} · Nautika {selectedCourse.className || demoStudent.className}</span></div><strong>{progress}%</strong></div>
            <div className="material-course-progress-track" role="progressbar" aria-label="Progress materi mata kuliah" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
            <div className="material-course-progress-caption"><span>{completedCount} dari {allCourseMaterials.length} materi selesai</span><Link aria-disabled={!completedMaterial} className={!completedMaterial ? "is-complete" : ""} href={completedMaterial ? `${base}/materi/${completedMaterial.id}` : "#material-list"}>{completedMaterial ? "Lanjutkan Materi" : "Materi Selesai"}<ArrowRight size={14} /></Link></div>
          </header>
          <section className="material-library-toolbar" aria-label="Pencarian dan filter materi">
            <label className="material-library-search"><Search size={15} /><input aria-label="Cari materi" onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Cari materi..." type="search" value={materialSearch} /></label>
            <div className="material-library-filters" aria-label="Filter status materi">
              {([ ["ALL", "Semua"], ["UNREAD", "Belum Dibaca"], ["IN_PROGRESS", "Sedang Dipelajari"], ["COMPLETED", "Selesai"] ] as [MaterialStatusFilter, string][]).map(([value, label]) => <button aria-pressed={statusFilter === value} className={statusFilter === value ? "is-active" : ""} key={value} onClick={() => setStatusFilter(value)} type="button">{label}</button>)}
            </div>
            <label className="material-library-type"><span>Jenis</span><select aria-label="Filter jenis materi" onChange={(event) => setTypeFilter(event.target.value as MaterialTypeFilter)} value={typeFilter}>
              <option value="ALL">Semua</option><option value="PDF">PDF</option><option value="VIDEO">Video</option><option value="PRESENTATION">Presentasi</option><option value="DOCUMENT">Dokumen</option><option value="LINK">Link</option>
            </select></label>
            <small className="material-library-result-count">{filteredMaterials.length} dari {allCourseMaterials.length} materi</small>
          </section>
          <div className="material-library-modules" id="material-list">
            {modules.map((module) => {
              const moduleMaterials = allCourseMaterials.filter((material) => material.moduleId === module.id);
              const visibleModuleMaterials = moduleMaterials.filter((material) => filteredMaterials.some((item) => item.id === material.id));
              if (!visibleModuleMaterials.length) return null;
              const moduleComplete = moduleMaterials.filter((material) => isComplete(material.status)).length;
              const moduleProgress = moduleMaterials.length ? Math.round((moduleComplete / moduleMaterials.length) * 100) : 0;
              return <section className="material-library-module" key={module.id}>
                <header className="material-library-module-heading">
                  <div><span>PERTEMUAN {String(module.order).padStart(2, "0")}</span><h3>{module.title}</h3></div>
                  <div className="material-module-progress"><span>{moduleComplete}/{moduleMaterials.length} selesai</span><div><span style={{ width: `${moduleProgress}%` }} /></div></div>
                </header>
                <div>{visibleModuleMaterials.map((material) => <MaterialItem key={material.id} material={material} />)}</div>
              </section>;
            })}
            {!filteredMaterials.length ? <div className="material-library-no-results"><Search size={21} /><strong>Materi tidak ditemukan</strong><span>Ubah kata kunci atau filter untuk melihat materi lain.</span></div> : null}
          </div>
        </> : <div className="material-library-no-results"><BookOpen size={22} /><strong>Belum ada mata kuliah aktif</strong></div>}
      </section>
    </div>
  </div>;
}