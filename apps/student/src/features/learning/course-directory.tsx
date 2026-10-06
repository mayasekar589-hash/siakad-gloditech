"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, BookOpen, ChevronLeft, ChevronRight, CircleHelp, FileText,
  GraduationCap, LayoutGrid, List, Search, UserRound, UsersRound
} from "lucide-react";
import { demoStudent } from "../demo/data/student";
import {
  activeLearningCourses, learningAssignments, learningCourseActivity,
  learningExams, learningMaterials, learningQuizzes
} from "./learning-data";

const base = "/pembelajaran/mata-kuliah";
const itemsPerPage = 6;
const courseCovers: Record<string, { src: string; position?: string }> = {
  NAU401: { src: "/assets/learning/navigasi.jpg", position: "center 48%" },
  NAU402: { src: "/assets/learning/meteorologi.webp", position: "center 48%" },
  NAU403: { src: "/assets/learning/keselamatan.jpg", position: "center 50%" },
  NAU404: { src: "/assets/learning/komunikasi.webp", position: "center 55%" },
  NAU405: { src: "/assets/learning/bahasa-maritim.webp", position: "center 62%" },
  NAU406: { src: "/assets/learning/kesamaptaan.webp", position: "center 58%" },
  NAU407: { src: "/assets/learning/dinas-jaga.jpg", position: "center 50%" }
};

type Course = (typeof activeLearningCourses)[number];
type CourseStatus = "IN_PROGRESS" | "NOT_STARTED" | "COMPLETED";

function progressFor(courseCode: string) {
  return learningCourseActivity.find((activity) => activity.courseId === courseCode)?.progressPercent ?? 0;
}

function statusFor(progress: number): CourseStatus {
  if (progress === 0) return "NOT_STARTED";
  if (progress >= 100) return "COMPLETED";
  return "IN_PROGRESS";
}

function CourseProgressRing({ progress }: { progress: number }) {
  return <span className="course-directory-ring" style={{ "--course-progress": `${progress}%` } as React.CSSProperties} aria-label={`Progress ${progress}%`}>
    <span>{progress}%</span>
  </span>;
}

function CourseCard({ course, layout }: { course: Course; layout: "grid" | "list" }) {
  const progress = progressFor(course.code);
  const materials = learningMaterials.filter((item) => item.courseId === course.code);
  const assignments = learningAssignments.filter((item) => item.courseId === course.code);
  const quizzes = learningQuizzes.filter((item) => item.courseId === course.code);
  const exams = learningExams.filter((item) => item.courseId === course.code);
  const cover = courseCovers[course.code] ?? courseCovers.NAU401;
  const status = statusFor(progress);
  const statusLabel = status === "IN_PROGRESS" ? "Sedang Berjalan" : status === "NOT_STARTED" ? "Belum Dimulai" : "Selesai";

  return <article className={`course-directory-card is-${layout}`}>
    <div className="course-directory-cover">
      <Image alt="" fill sizes={layout === "grid" ? "(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" : "180px"} src={cover.src} style={{ objectPosition: cover.position }} />
      <span>{course.credits} SKS</span>
    </div>
    <div className="course-directory-content">
      <div className="course-directory-identity">
        <div className="course-directory-code-row">
          <span className="course-directory-code">{course.code}</span>
          <span className={`course-directory-status status-${status.toLowerCase()}`}>{statusLabel}</span>
        </div>
        <CourseProgressRing progress={progress} />
      </div>
      <h2>{course.name}</h2>
      <div className="course-directory-meta">
        <span><UserRound size={14} />{course.lecturer}</span>
        <span><UsersRound size={14} />Nautika {course.className || demoStudent.className}</span>
      </div>
      <div className="course-directory-progress">
        <div><span>Progress pembelajaran</span><strong>{progress}%</strong></div>
        <div className="learning-progress-track" role="progressbar" aria-label={`Progress ${course.name}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="course-directory-activities" aria-label="Ringkasan aktivitas">
        <div><BookOpen size={15} /><strong>{materials.filter((item) => item.status !== "UNREAD").length}/{materials.length}</strong><span>Materi</span></div>
        <div><FileText size={15} /><strong>{assignments.filter((item) => item.status === "SUBMITTED" || item.status === "GRADED").length}/{assignments.length}</strong><span>Tugas</span></div>
        <div><CircleHelp size={15} /><strong>{quizzes.filter((item) => item.status === "COMPLETED").length}/{quizzes.length}</strong><span>Quiz</span></div>
        <div><GraduationCap size={15} /><strong>{exams.length}</strong><span>Ujian</span></div>
      </div>
      <Link className="course-directory-cta" href={`${base}/${course.code}`}>Buka Mata Kuliah<ArrowRight size={16} /></Link>
    </div>
  </article>;
}

export function CourseDirectoryExperience() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [semesterFilter, setSemesterFilter] = useState("ALL");
  const [lecturerFilter, setLecturerFilter] = useState("ALL");
  const [sort, setSort] = useState("name-asc");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const semesters = [...new Set(activeLearningCourses.map((course) => course.semester))].sort((a, b) => a - b);
  const lecturers = [...new Set(activeLearningCourses.map((course) => course.lecturer))].sort((a, b) => a.localeCompare(b, "id"));
  const query = search.trim().toLocaleLowerCase("id");
  const filteredCourses = activeLearningCourses.filter((course) => {
    const progress = progressFor(course.code);
    const matchesQuery = !query || `${course.name} ${course.code} ${course.lecturer}`.toLocaleLowerCase("id").includes(query);
    const matchesStatus = statusFilter === "ALL" || statusFor(progress) === statusFilter;
    const matchesSemester = semesterFilter === "ALL" || String(course.semester) === semesterFilter;
    const matchesLecturer = lecturerFilter === "ALL" || course.lecturer === lecturerFilter;
    return matchesQuery && matchesStatus && matchesSemester && matchesLecturer;
  }).sort((first, second) => {
    if (sort === "progress-asc") return progressFor(first.code) - progressFor(second.code);
    if (sort === "progress-desc") return progressFor(second.code) - progressFor(first.code);
    if (sort === "recent") {
      const firstOpened = learningCourseActivity.find((activity) => activity.courseId === first.code)?.lastOpenedAt ?? "";
      const secondOpened = learningCourseActivity.find((activity) => activity.courseId === second.code)?.lastOpenedAt ?? "";
      return secondOpened.localeCompare(firstOpened);
    }
    return first.name.localeCompare(second.name, "id");
  });
  const pageCount = Math.max(1, Math.ceil(filteredCourses.length / itemsPerPage));
  const currentPage = Math.min(page, pageCount);
  const visibleCourses = filteredCourses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  function resetPage<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  return <div className="portal-page learning-page course-directory-page">
    <nav className="course-directory-breadcrumb" aria-label="Breadcrumb">
      <Link href="/dashboard">SiAkad Taruna</Link><span>/</span><Link href="/pembelajaran">Pembelajaran</Link><span>/</span><strong aria-current="page">Mata Kuliah Saya</strong>
    </nav>
    <section className="course-directory-hero" aria-labelledby="course-directory-title">
      <div className="course-directory-hero-copy">
        <p>PEMBELAJARAN</p>
        <h1 id="course-directory-title">Mata Kuliah Saya</h1>
        <span>Mata kuliah aktif berasal dari KRS yang telah disetujui pada semester berjalan.</span>
        <span>Akses materi, tugas, ujian, dan diskusi pada setiap mata kuliah.</span>
      </div>
      <div className="course-directory-metrics" aria-label="Ringkasan pembelajaran">
        <Metric icon={BookOpen} value={activeLearningCourses.length} label="Mata Kuliah Aktif" />
        <Metric icon={FileText} value={62} label="Total Materi" />
        <Metric icon={FileText} value={learningAssignments.length} label="Total Tugas" />
        <Metric icon={CircleHelp} value={learningQuizzes.length} label="Total Quiz" />
        <Metric icon={GraduationCap} value={learningExams.length} label="Total Ujian" />
      </div>
    </section>
    <section className="course-directory-toolbar" aria-label="Filter mata kuliah">
      <label className="course-directory-search"><Search size={16} /><input onChange={(event) => resetPage(setSearch, event.target.value)} placeholder="Cari mata kuliah, dosen, atau kode..." type="search" value={search} /></label>
      <select aria-label="Filter status" onChange={(event) => resetPage(setStatusFilter, event.target.value)} value={statusFilter}>
        <option value="ALL">Semua Status</option><option value="IN_PROGRESS">Sedang Berjalan</option><option value="NOT_STARTED">Belum Dimulai</option><option value="COMPLETED">Selesai</option>
      </select>
      <select aria-label="Filter semester" onChange={(event) => resetPage(setSemesterFilter, event.target.value)} value={semesterFilter}>
        <option value="ALL">Semua Semester</option>{semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
      </select>
      <select aria-label="Filter dosen" onChange={(event) => resetPage(setLecturerFilter, event.target.value)} value={lecturerFilter}>
        <option value="ALL">Semua Dosen</option>{lecturers.map((lecturer) => <option key={lecturer} value={lecturer}>{lecturer}</option>)}
      </select>
      <div className="course-directory-toolbar-spacer" />
      <div className="course-directory-view-toggle" aria-label="Tampilan mata kuliah">
        <button aria-label="Tampilan grid" aria-pressed={layout === "grid"} className={layout === "grid" ? "is-active" : ""} onClick={() => setLayout("grid")} type="button"><LayoutGrid size={15} /><span>Grid</span></button>
        <button aria-label="Tampilan list" aria-pressed={layout === "list"} className={layout === "list" ? "is-active" : ""} onClick={() => setLayout("list")} type="button"><List size={15} /><span>List</span></button>
      </div>
      <label className="course-directory-sort"><span>Urutkan</span><select aria-label="Urutkan mata kuliah" onChange={(event) => resetPage(setSort, event.target.value)} value={sort}>
        <option value="name-asc">Nama A-Z</option><option value="progress-asc">Progress Terendah</option><option value="progress-desc">Progress Tertinggi</option><option value="recent">Terbaru</option>
      </select></label>
    </section>
    <section className={`course-directory-results view-${layout}`} aria-label="Daftar mata kuliah">
      {visibleCourses.length ? visibleCourses.map((course) => <CourseCard course={course} key={course.code} layout={layout} />) : <div className="course-directory-empty"><Search size={23} /><strong>Mata kuliah tidak ditemukan</strong><span>Coba ubah kata kunci atau pilihan filter.</span></div>}
    </section>
    <footer className="course-directory-pagination">
      <span>Menampilkan {filteredCourses.length ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredCourses.length)} dari {filteredCourses.length} mata kuliah</span>
      <div><button aria-label="Halaman sebelumnya" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} type="button"><ChevronLeft size={16} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => <button aria-current={currentPage === pageNumber ? "page" : undefined} className={currentPage === pageNumber ? "is-active" : ""} key={pageNumber} onClick={() => setPage(pageNumber)} type="button">{pageNumber}</button>)}<button aria-label="Halaman berikutnya" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))} type="button"><ChevronRight size={16} /></button></div>
    </footer>
  </div>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) {
  return <div className="course-directory-metric"><span><Icon size={17} /></span><strong>{value}</strong><small>{label}</small></div>;
}