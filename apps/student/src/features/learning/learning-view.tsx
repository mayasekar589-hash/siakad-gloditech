import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity, Anchor, ArrowLeft, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight,
  CircleHelp, CloudSun, Compass, FileText, GraduationCap, Languages, PlayCircle,
  Presentation, Radio, ShieldCheck, Video
} from "lucide-react";
import { demoStudent } from "../demo/data/student";
import { attendanceSummary } from "../demo/data/attendance";
import { weeklySchedule } from "../demo/data/schedule";
import {
  activeLearningCourses, learningAnnouncements, learningAssignments, learningMaterials,
  learningCourseActivity, learningDiscussionThreads, learningExams, learningModules,
  learningQuizzes, type LearningActivityStatus,
  type LearningMaterial, type LearningMaterialType
} from "./learning-data";
import { AssignmentFilters, DiscussionBoard, ExamQuizTabs, QuizAttempt, type AssignmentItem } from "./learning-interactions";
import { CourseDirectoryExperience } from "./course-directory";
import { CourseMaterialLibrary } from "./course-material-library";
import { AssignmentExperience } from "./assignment-experience";
import { AssignmentDetailExperience } from "./assignment-detail-experience";
import { AssessmentCenter } from "./assessment-center";
import { LearningCalendarExperience } from "./learning-calendar-experience";

const base = "/pembelajaran";

function formatDate(value: string | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("id-ID", options).format(date.getTime());
}

function PageHeading({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <header className="learning-heading"><div><p className="portal-eyebrow">Pembelajaran</p><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}

function ActivityStatus({ status }: { status: LearningActivityStatus }) {
  const label = status === "PENDING" ? "Belum dikumpulkan" : status === "SUBMITTED" ? "Sudah dikumpulkan" : status === "LATE" ? "Terlambat" : status === "GRADED" ? "Dinilai" : status === "NOT_STARTED" ? "Belum dimulai" : status === "UPCOMING" ? "Akan datang" : status === "IN_PROGRESS" ? "Sedang berlangsung" : status === "CLOSED" ? "Ditutup" : "Selesai";
  return <span className={`learning-status learning-status-${status.toLowerCase()}`}>{label}</span>;
}

function materialIcon(type: LearningMaterialType) {
  if (type === "VIDEO") return Video;
  if (type === "PRESENTATION") return Presentation;
  if (type === "EMBED") return PlayCircle;
  if (type === "LINK") return ArrowRight;
  return FileText;
}

function getCourseMaterials(courseId: string) {
  return learningMaterials.filter((material) => material.courseId === courseId);
}

function getCourseAssignments(courseId: string) {
  return learningAssignments.filter((assignment) => assignment.courseId === courseId);
}

function getCourseQuizzes(courseId: string) {
  return learningQuizzes.filter((quiz) => quiz.courseId === courseId);
}

function courseProgress(courseId: string) {
  const recordedProgress = learningCourseActivity.find((activity) => activity.courseId === courseId)?.progressPercent;
  if (recordedProgress !== undefined) return recordedProgress;
  const materials = getCourseMaterials(courseId);
  const assignments = getCourseAssignments(courseId);
  const quizzes = getCourseQuizzes(courseId);
  const materialProgress = materials.length ? materials.filter((material) => material.status !== "UNREAD").length / materials.length : 0;
  const assignmentProgress = assignments.length ? assignments.filter((assignment) => assignment.status === "SUBMITTED").length / assignments.length : 0;
  const quizProgress = quizzes.length ? quizzes.filter((quiz) => quiz.status === "COMPLETED").length / quizzes.length : 0;
  return Math.round((materialProgress * .3 + assignmentProgress * .2 + quizProgress * .5) * 100);
}

const courseLearningTabs = [
  ["overview", "Overview"], ["materi", "Materi"], ["tugas", "Tugas"],
  ["quiz", "Quiz"], ["ujian", "Ujian"], ["diskusi", "Diskusi"], ["progress", "Progress"]
] as const;

function LearningNavigation({ courseId, activeTab }: { courseId: string; activeTab: string }) {
  return <nav className="learning-tabs" aria-label="Navigasi mata kuliah">{courseLearningTabs.map(([id, label]) => <Link aria-current={activeTab === id ? "page" : undefined} className={activeTab === id ? "is-active" : ""} href={`${base}/mata-kuliah/${courseId}${id === "overview" ? "" : `/${id}`}`} key={id}>{label}</Link>)}</nav>;
}

function LearningDashboard() {
  const now = new Date();
  const academicYear = now.getMonth() >= 7
    ? `${now.getFullYear()}/${now.getFullYear() + 1}`
    : `${now.getFullYear() - 1}/${now.getFullYear()}`;
  const pendingAssignments = learningAssignments.filter((assignment) => assignment.status === "PENDING" || assignment.status === "LATE");
  const upcomingQuizzes = learningQuizzes.filter((quiz) => quiz.status === "UPCOMING" || quiz.status === "NOT_STARTED");
  const upcomingExams = learningExams.filter((exam) => exam.status === "UPCOMING");
  const averageProgress = 72;
  const latestCourseActivity = [...learningCourseActivity]
    .sort((left, right) => right.lastOpenedAt.localeCompare(left.lastOpenedAt))
    .flatMap((activity) => activeLearningCourses.filter((course) => course.code === activity.courseId))
    .slice(0, 3);
  const recentMaterials = [...learningMaterials].sort((left, right) => right.publishedAt.localeCompare(left.publishedAt)).slice(0, 3);
  const weekdayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayName = weekdayNames[now.getDay()];
  const todaysClasses = weeklySchedule.filter((course) => course.day === todayName).sort((left, right) => left.startTime.localeCompare(right.startTime));
  const nextClass = weeklySchedule.map((course) => {
    const scheduledDay = weekdayNames.indexOf(course.day);
    const daysAhead = (scheduledDay - now.getDay() + 7) % 7;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
    const [hours, minutes] = course.startTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() < now.getTime()) date.setDate(date.getDate() + 7);
    return { course, date };
  }).sort((left, right) => left.date.getTime() - right.date.getTime())[0];
  const nextDayClasses = nextClass
    ? weeklySchedule.filter((course) => course.day === nextClass.course.day).sort((left, right) => left.startTime.localeCompare(right.startTime))
    : [];
  const upcomingClassEvents = weeklySchedule.map((course) => {
    const scheduledDay = weekdayNames.indexOf(course.day);
    const daysAhead = (scheduledDay - now.getDay() + 7) % 7;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
    const [hours, minutes] = course.startTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
    if (date.getTime() < now.getTime()) date.setDate(date.getDate() + 7);
    return { id: course.code, kind: "Kuliah", title: `Kuliah: ${course.name}`, courseName: course.name, date, detail: `${course.startTime} · ${course.room}`, route: "/jadwal", tone: "green" };
  }).sort((left, right) => left.date.getTime() - right.date.getTime()).slice(0, 3);
  const upcomingEvents = [
    ...upcomingQuizzes.map((quiz) => ({ id: quiz.id, kind: "Quiz", title: quiz.title.replace(/^Kuis/, "Quiz"), courseName: quiz.courseName, date: new Date(quiz.opensAt), detail: "Online", route: `${base}/quiz/${quiz.id}`, tone: "violet" })),
    ...pendingAssignments.map((assignment) => ({ id: assignment.id, kind: "Tugas", title: assignment.title, courseName: activeLearningCourses.find((course) => course.code === assignment.courseId)?.name ?? assignment.courseId, date: new Date(assignment.dueAt), detail: "Deadline", route: `${base}/tugas/${assignment.id}`, tone: "gold" })),
    ...upcomingExams.map((exam) => ({ id: exam.id, kind: "Ujian", title: exam.title, courseName: exam.courseName, date: new Date(`${exam.date}T${exam.startsAt}:00+07:00`), detail: `${exam.startsAt}–${exam.endsAt} · ${activeLearningCourses.find((course) => course.code === exam.courseId)?.room ?? ""}`, route: `${base}/ujian/${exam.id}`, tone: "danger" })),
    ...upcomingClassEvents
  ].filter((event) => event.date.getTime() >= now.getTime()).sort((left, right) => left.date.getTime() - right.date.getTime()).slice(0, 4);
  const taskItems = pendingAssignments.slice(0, 3);
  const attendanceRate = attendanceSummary.find((item) => item.label === "Hadir")?.percent ?? 0;
  const attendanceTotal = attendanceSummary.reduce((total, item) => total + item.count, 0);
  const summaryItems = [
    { label: "Mata Kuliah Aktif", value: String(activeLearningCourses.length), detail: "Dari KRS berjalan", Icon: BookOpen },
    { label: "Progress Pembelajaran", value: `${averageProgress}%`, detail: "Rata-rata semua mata kuliah", Icon: Activity },
    { label: "Materi", value: "24", detail: "12 belum dibaca", Icon: FileText },
    { label: "Tugas Aktif", value: "3", detail: "2 perlu dikerjakan", Icon: Check },
    { label: "Quiz/Ujian", value: "2", detail: "Dalam 14 hari", Icon: CircleHelp },
    { label: "Kehadiran", value: `${attendanceRate}%`, detail: `${attendanceSummary.find((item) => item.label === "Hadir")?.count ?? 0} dari ${attendanceTotal} pertemuan`, Icon: CalendarDays }
  ];
  function courseIcon(name: string) {
    if (/navigasi/i.test(name)) return Compass;
    if (/meteorologi/i.test(name)) return CloudSun;
    if (/keselamatan/i.test(name)) return ShieldCheck;
    if (/komunikasi/i.test(name)) return Radio;
    if (/bahasa/i.test(name)) return Languages;
    if (/olahraga/i.test(name)) return Activity;
    return Anchor;
  }

  return <div className="portal-page learning-page learning-home">
    <header className="learning-home-header">
      <p className="learning-home-breadcrumb">SiAkad Taruna <span>/</span> Pembelajaran <span>/</span> <strong>Beranda Pembelajaran</strong></p>
      <div className="learning-home-heading"><div><p className="learning-home-kicker">Pembelajaran</p><h1>Pembelajaran Saya</h1><p>Ringkasan aktivitas, progres, dan agenda pembelajaran semester ini.</p></div><label className="learning-home-semester"><span>Periode aktif</span><select aria-label="Semester aktif" defaultValue={demoStudent.semester}><option value={demoStudent.semester}>Semester {demoStudent.semester} · {academicYear}</option></select></label></div>
    </header>
    <section className="learning-home-summary" aria-label="Ringkasan pembelajaran">{summaryItems.map(({ label, value, detail, Icon }) => <article className="learning-home-metric" key={label}><span className="learning-home-metric-icon"><Icon size={19} aria-hidden="true" /></span><div><strong>{value}</strong><span>{label}</span><small>{detail}</small></div></article>)}</section>
    <section className="learning-home-feature-grid">
      <article className="learning-home-resume">
        <div className="learning-home-section-heading"><div><p className="portal-eyebrow">Terakhir dipelajari</p><h2>Lanjutkan Pembelajaran</h2></div><Anchor size={19} aria-hidden="true" /></div>
        {(() => {
          const course = latestCourseActivity[0] ?? activeLearningCourses[0];
          if (!course) return <p className="learning-home-empty">Belum ada mata kuliah aktif.</p>;
          const Icon = courseIcon(course.name);
          const progress = courseProgress(course.code);
          const materials = getCourseMaterials(course.code);
          const assignments = getCourseAssignments(course.code);
          const quizzes = getCourseQuizzes(course.code);
          return <div className="learning-home-resume-body"><span className="learning-home-course-icon"><Icon size={23} /></span><div className="learning-home-resume-copy"><span className="learning-home-course-code">{course.code}</span><h3>{course.name}</h3><p>{course.lecturer}</p><small>{course.className} · Semester {course.semester}</small><div className="learning-home-resume-progress"><div><span>Progress pembelajaran</span><strong>{progress}%</strong></div><div className="learning-home-progress-track" role="progressbar" aria-label={`Progress ${course.name}`} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div></div><div className="learning-home-resume-meta"><span>{materials.filter((material) => material.status !== "UNREAD").length}/{materials.length} Materi</span><span>{assignments.filter((assignment) => assignment.status === "SUBMITTED" || assignment.status === "GRADED").length}/{assignments.length} Tugas</span><span>{quizzes.filter((quiz) => quiz.status === "COMPLETED").length}/{quizzes.length} Quiz</span></div></div><Link className="learning-home-resume-link" href={`${base}/mata-kuliah/${course.code}`}>Lanjutkan Belajar <ArrowRight size={15} /></Link></div>;
        })()}
      </article>
      <article className="learning-home-progress">
        <div className="learning-home-section-heading"><div><p className="portal-eyebrow">Semester {demoStudent.semester}</p><h2>Progress Pembelajaran</h2></div></div>
        <div className="learning-home-progress-overview"><div className="learning-home-donut" role="img" aria-label={`Rata-rata progress ${averageProgress}%`} style={{ background: `conic-gradient(#49d2b4 0 36%, #0B76B7 36% ${averageProgress}%, #DFE7EE ${averageProgress}% 100%)` }}><div><strong>{averageProgress}%</strong><span>Rata-rata Progress</span></div></div><div className="learning-home-breakdown">{[{ label: "Materi", value: 68 }, { label: "Tugas", value: 74 }, { label: "Quiz", value: 70 }].map((item) => <div className="learning-home-breakdown-row" key={item.label}><span>{item.label}</span><strong>{item.value}%</strong><div className="learning-home-mini-track"><span style={{ width: `${item.value}%` }} /></div></div>)}</div></div>
      </article>
      <article className="learning-home-panel learning-home-schedule"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">{weekdayNames[now.getDay()]}, {formatDate(now, { day: "numeric", month: "long" })}</p><h2>Jadwal Kuliah Hari Ini</h2></div><Link href="/jadwal" aria-label="Buka jadwal lengkap" className="learning-home-icon-link"><CalendarDays size={16} /></Link></div>{todaysClasses.length ? <div className="learning-home-schedule-list">{todaysClasses.map((course) => <Link href={`${base}/mata-kuliah/${course.code}`} className="learning-home-schedule-row" key={course.code}><time>{course.startTime}</time><i /><span><strong>{course.name}</strong><small>{course.room}</small></span></Link>)}</div> : <div className="learning-home-no-class">{nextClass ? <><small>Jadwal berikutnya · {nextClass.course.day} {formatDate(nextClass.date, { day: "numeric", month: "short" })}</small><div className="learning-home-schedule-list">{nextDayClasses.map((course) => <Link href={`${base}/mata-kuliah/${course.code}`} className="learning-home-schedule-row" key={course.code}><time>{course.startTime}</time><i /><span><strong>{course.name}</strong><small>{course.room}</small></span></Link>)}</div></> : <span>Tidak ada jadwal kuliah hari ini.</span>}</div>}</article>
    </section>
    <section className="learning-home-course-activity-grid">
      <article className="learning-home-panel learning-home-courses"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">Semester {demoStudent.semester} · {activeLearningCourses.length} mata kuliah</p><h2>Mata Kuliah Saya</h2></div><Link href={`${base}/mata-kuliah`} className="learning-home-view-all">Lihat Semua <ArrowRight size={14} /></Link></div><div className="learning-home-course-table" role="table" aria-label="Mata kuliah aktif"><div className="learning-home-course-row learning-home-course-head" role="row"><span role="columnheader">Mata Kuliah</span><span role="columnheader">Progress</span><span role="columnheader">Materi</span><span role="columnheader">Tugas</span><span role="columnheader">Quiz</span><span role="columnheader"><span className="sr-only">Buka mata kuliah</span></span></div>{activeLearningCourses.slice(0, 4).map((course) => {
        const Icon = courseIcon(course.name);
        const materials = getCourseMaterials(course.code);
        const assignments = getCourseAssignments(course.code);
        const quizzes = getCourseQuizzes(course.code);
        const progress = courseProgress(course.code);
        return <Link className="learning-home-course-row" href={`${base}/mata-kuliah/${course.code}`} role="row" key={course.code}><span className="learning-home-course-name" role="cell"><i><Icon size={18} /></i><span><small>{course.code}</small><strong>{course.name}</strong><em>{course.lecturer}</em></span></span><span className="learning-home-course-progress" role="cell"><span><i className="learning-home-progress-track"><b style={{ width: `${progress}%` }} /></i><strong>{progress}%</strong></span></span><span className="learning-home-course-counts" role="cell"><span className="learning-home-course-count"><strong>{materials.filter((material) => material.status !== "UNREAD").length}/{materials.length}</strong><small>materi</small></span><span className="learning-home-course-count"><strong>{assignments.filter((assignment) => assignment.status === "SUBMITTED" || assignment.status === "GRADED").length}/{assignments.length}</strong><small>tugas</small></span><span className="learning-home-course-count"><strong>{quizzes.filter((quiz) => quiz.status === "COMPLETED").length}/{quizzes.length}</strong><small>quiz</small></span></span><ChevronRight className="learning-home-course-arrow" size={16} aria-hidden="true" /></Link>;
      })}</div></article>
      <article className="learning-home-panel learning-home-nearest"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">Agenda</p><h2>Aktivitas Terdekat</h2></div><Link href={`${base}/kalender`} aria-label="Buka kalender pembelajaran" className="learning-home-icon-link"><CalendarDays size={16} /></Link></div>{upcomingEvents.length ? <div className="learning-home-agenda">{upcomingEvents.map((event) => <Link className="learning-home-agenda-row" href={event.route} key={`${event.kind}-${event.id}`}><time className={`is-${event.tone}`}><strong>{event.date.getDate()}</strong><span>{event.date.toLocaleDateString("id-ID", { month: "short" })}</span></time><span><small>{event.kind}</small><strong>{event.title}</strong><em>{event.courseName} · {event.detail}</em></span></Link>)}</div> : <p className="learning-home-empty">Belum ada aktivitas terdekat.</p>}</article>
    </section>
    <section className="learning-home-lower-grid">
      <article className="learning-home-panel learning-home-tasks"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">Tindak lanjut</p><h2>Tugas yang Perlu Dikerjakan</h2></div><Link href={`${base}/tugas`} className="learning-home-view-all">Semua Tugas <ArrowRight size={14} /></Link></div><div className="learning-home-plain-list">{taskItems.map((assignment) => <Link className="learning-home-list-row" href={`${base}/tugas/${assignment.id}`} key={assignment.id}><span className={`learning-home-list-icon ${assignment.status === "SUBMITTED" || assignment.status === "GRADED" ? "is-recent" : assignment.status === "LATE" ? "is-overdue" : "is-task"}`}><FileText size={16} /></span><span><strong>{assignment.title}</strong><small>{activeLearningCourses.find((course) => course.code === assignment.courseId)?.name}{assignment.status === "PENDING" || assignment.status === "LATE" ? ` · Deadline ${formatDate(assignment.dueAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : " · Sudah dikumpulkan"}</small></span><ActivityStatus status={assignment.status} /></Link>)}</div></article>
      <article className="learning-home-panel learning-home-materials"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">Baru diterbitkan</p><h2>Materi Terbaru</h2></div><Link href={`${base}/materi`} className="learning-home-view-all">Semua Materi <ArrowRight size={14} /></Link></div><div className="learning-home-plain-list">{recentMaterials.map((material) => <Link className="learning-home-list-row" href={`${base}/materi/${material.id}`} key={material.id}><span className="learning-home-list-icon is-material"><BookOpen size={16} /></span><span><strong>{material.title}</strong><small>{activeLearningCourses.find((course) => course.code === material.courseId)?.name} · {formatDate(material.publishedAt, { day: "numeric", month: "short" })}</small></span><em className={material.status === "UNREAD" ? "is-unread" : "is-read"}>{material.status === "UNREAD" ? "Belum dibaca" : "Sudah dibaca"}</em></Link>)}</div></article>
      <article className="learning-home-panel learning-home-recent"><div className="learning-home-section-heading"><div><p className="portal-eyebrow">Jejak belajar</p><h2>Aktivitas Pembelajaran Terakhir</h2></div></div><div className="learning-home-plain-list">{latestCourseActivity.map((course) => {
        const lastOpened = learningCourseActivity.find((item) => item.courseId === course.code)?.lastOpenedAt;
        return <Link className="learning-home-list-row" href={`${base}/mata-kuliah/${course.code}`} key={course.code}><span className="learning-home-list-icon is-recent"><Activity size={16} /></span><span><strong>{course.name}</strong><small>Terakhir dibuka · {lastOpened ? formatDate(lastOpened, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Belum ada aktivitas"}</small></span><ChevronRight size={15} /></Link>;
      })}</div></article>
    </section>
  </div>;
}

function CourseDirectory() {
  return <CourseDirectoryExperience />;
}

function MaterialRow({ material }: { material: LearningMaterial }) {
  const Icon = materialIcon(material.type);
  return <Link className="learning-material-row" href={`${base}/materi/${material.id}`}>
    <span className={`learning-material-icon type-${material.type.toLowerCase()}`}><Icon size={18} /></span>
    <span className="learning-row-copy"><strong>{material.title}</strong><small>{material.description}</small></span>
    <span className={`learning-material-state state-${material.status.toLowerCase()}`}>{material.status === "COMPLETED" ? <Check size={14} /> : null}{material.status === "UNREAD" ? "Belum Dibaca" : material.status === "COMPLETED" ? "Selesai" : "Sedang Dipelajari"}</span>
    <ChevronRight size={16} />
  </Link>;
}

function CourseDetail({ courseId, tab }: { courseId: string; tab?: string }) {
  const course = activeLearningCourses.find((item) => item.code === courseId);
  if (!course) notFound();
  const selectedTab = tab ?? "overview";
  const materials = getCourseMaterials(course.code);
  const assignments = getCourseAssignments(course.code);
  const quizzes = getCourseQuizzes(course.code);
  const exams = learningExams.filter((exam) => exam.courseId === course.code);
  const modules = learningModules.filter((module) => module.courseId === course.code);
  const progress = courseProgress(course.code);
  return <div className="portal-page learning-page">
    <Link href={`${base}/mata-kuliah`} className="portal-back-link"><ArrowLeft size={15} />Mata Kuliah Saya</Link>
    <header className="learning-course-hero"><div><p className="portal-eyebrow">{course.code} · Semester {course.semester}</p><h1>{course.name}</h1><p>{course.lecturer} <span>·</span> {demoStudent.className}</p></div><div className="learning-course-hero-progress"><strong>{progress}%</strong><span>progress pembelajaran</span><div className="learning-progress-track"><span style={{ width: `${progress}%` }} /></div></div></header>
    <LearningNavigation activeTab={selectedTab} courseId={course.code} />
    {selectedTab === "overview" ? <><section className="learning-detail-grid"><div className="portal-panel learning-detail-panel"><p className="portal-eyebrow">Tentang mata kuliah</p><h2>Selamat datang di {course.name}</h2><p className="learning-description">Pembelajaran {course.name} mencakup materi perkuliahan, aktivitas terstruktur, tugas, dan evaluasi untuk mendukung capaian akademik semester ini.</p><dl className="learning-course-meta"><div><dt>Dosen</dt><dd>{course.lecturer}</dd></div><div><dt>Kelas</dt><dd>{course.className}</dd></div><div><dt>Jadwal</dt><dd>{course.day}, {course.startTime}–{course.endTime}</dd></div><div><dt>Lokasi</dt><dd>{course.room}</dd></div><div><dt>Bobot</dt><dd>{course.credits} SKS</dd></div></dl></div>
      <div className="portal-panel learning-detail-panel"><div className="learning-section-heading"><div><p className="portal-eyebrow">Dari dosen</p><h2>Pengumuman Dosen</h2></div></div>{learningAnnouncements.filter((announcement) => announcement.courseId === course.code).map((announcement) => <article className="learning-announcement" key={announcement.id}><span className="learning-row-icon blue"><CalendarDays size={17} /></span><div><strong>{announcement.title}</strong><p>{announcement.instructor} · {formatDate(announcement.publishedAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</p></div></article>)}</div></section>
      <section className="learning-overview-activity"><div className="portal-panel learning-list-panel"><div className="learning-section-heading"><div><p className="portal-eyebrow">Baru diterbitkan</p><h2>Materi Terbaru</h2></div></div>{materials.slice(0, 2).map((material) => <MaterialRow material={material} key={material.id} />)}</div><div className="portal-panel learning-list-panel"><div className="learning-section-heading"><div><p className="portal-eyebrow">Aktivitas berikutnya</p><h2>Assignment Berikutnya</h2></div></div>{assignments.slice(0, 1).map((assignment) => <Link className="learning-activity-row" href={`${base}/tugas/${assignment.id}`} key={assignment.id}><span className="learning-row-icon gold"><FileText size={17} /></span><span className="learning-row-copy"><strong>{assignment.title}</strong><small>Deadline {formatDate(assignment.dueAt, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</small></span><ActivityStatus status={assignment.status} /></Link>)}</div><div className="portal-panel learning-list-panel"><div className="learning-section-heading"><div><p className="portal-eyebrow">Evaluasi berikutnya</p><h2>Quiz Berikutnya</h2></div></div>{quizzes.slice(-1).map((quiz) => <Link className="learning-activity-row" href={`${base}/quiz/${quiz.id}`} key={quiz.id}><span className="learning-row-icon green"><CircleHelp size={17} /></span><span className="learning-row-copy"><strong>{quiz.title}</strong><small>{quiz.questionCount} soal · {quiz.durationMinutes} menit · {formatDate(quiz.opensAt)}</small></span><ActivityStatus status={quiz.status} /></Link>)}</div></section></> : null}
    {selectedTab === "materi" ? <section className="portal-panel learning-module-panel"><div className="learning-section-heading"><div><p className="portal-eyebrow">Materi pertemuan</p><h2>Modul Pembelajaran</h2></div><span className="learning-count">{materials.filter((material) => material.status === "COMPLETED" || material.status === "READ").length} / {materials.length} dibaca</span></div>{modules.map((module) => <section className="learning-module" key={module.id}><div className="learning-module-heading"><span>PERTEMUAN {String(module.order).padStart(2, "0")}</span><h3>{module.title}</h3></div>{materials.filter((material) => material.moduleId === module.id).map((material) => <MaterialRow material={material} key={material.id} />)}</section>)}</section> : null}
    {selectedTab === "tugas" ? <AssignmentFilters assignments={toAssignmentItems(assignments)} /> : null}
    {selectedTab === "quiz" ? <QuizList quizzes={quizzes} courseName={course.name} hideExamTab /> : null}
    {selectedTab === "ujian" ? <ExamList exams={exams} courseName={course.name} hideQuizTab /> : null}
    {selectedTab === "diskusi" ? <DiscussionBoard initialThreads={learningDiscussionThreads.filter((thread) => thread.courseId === course.code)} courses={activeLearningCourses} /> : null}
    {selectedTab === "progress" ? <ProgressPanel courseCode={course.code} /> : null}
  </div>;
}

function toAssignmentItems(assignments: typeof learningAssignments): AssignmentItem[] {
  return assignments.map((assignment) => {
    const course = activeLearningCourses.find((item) => item.code === assignment.courseId);
    return { ...assignment, courseName: course?.name ?? "Mata Kuliah", instructor: course?.lecturer ?? "" };
  });
}

function AssignmentListPage() {
  return <AssignmentExperience assignments={toAssignmentItems(learningAssignments)} />;
}

function QuizList({ quizzes, courseName, hideExamTab = false }: { quizzes: typeof learningQuizzes; courseName?: string; hideExamTab?: boolean }) {
  return <ExamQuizTabs hideExamTab={hideExamTab} quizzes={quizzes} exams={[]} courseName={courseName} />;
}

function ExamList({ exams, courseName, hideQuizTab = false }: { exams: typeof learningExams; courseName?: string; hideQuizTab?: boolean }) {
  return <ExamQuizTabs hideQuizTab={hideQuizTab} quizzes={[]} exams={exams} courseName={courseName} />;
}

function AllAssessmentsPage() {
  return <AssessmentCenter />;
}

function ProgressPanel({ courseCode }: { courseCode: string }) {
  const course = activeLearningCourses.find((item) => item.code === courseCode);
  if (!course) return null;
  const materials = getCourseMaterials(courseCode);
  const assignments = getCourseAssignments(courseCode);
  const quizzes = getCourseQuizzes(courseCode);
  const exams = learningExams.filter((exam) => exam.courseId === courseCode);
  const progress = courseProgress(courseCode);
  return <section className="portal-panel learning-progress-course"><div className="learning-section-heading"><div><p className="portal-eyebrow">{course.code} · {demoStudent.className}</p><h2>{course.name}</h2></div><strong>{progress}%</strong></div><div className="learning-progress-track"><span style={{ width: `${progress}%` }} /></div><div className="learning-progress-breakdown"><span>{materials.filter((material) => material.status !== "UNREAD").length} / {materials.length} materi</span><span>{assignments.filter((assignment) => assignment.status === "SUBMITTED" || assignment.status === "GRADED").length} / {assignments.length} tugas</span><span>{quizzes.filter((quiz) => quiz.status === "COMPLETED").length} / {quizzes.length} quiz</span><span>{exams.filter((exam) => exam.status === "COMPLETED").length} / {exams.length} ujian</span></div></section>;
}

function MaterialDetail({ materialId }: { materialId: string }) {
  const material = learningMaterials.find((item) => item.id === materialId);
  if (!material) notFound();
  const course = activeLearningCourses.find((item) => item.code === material.courseId);
  const Icon = materialIcon(material.type);
  return <div className="portal-page learning-page"><Link href={`${base}/mata-kuliah/${material.courseId}/materi`} className="portal-back-link"><ArrowLeft size={15} />Kembali ke materi {course?.name}</Link><section className="portal-panel learning-material-detail"><span className={`learning-material-icon type-${material.type.toLowerCase()}`}><Icon size={22} /></span><p className="portal-eyebrow">{course?.name} · Pertemuan {String(material.order).padStart(2, "0")}</p><h1>{material.title}</h1><p>{material.description}</p><dl className="learning-course-meta"><div><dt>Jenis</dt><dd>{material.type}</dd></div><div><dt>File</dt><dd>{material.fileName}</dd></div><div><dt>Ukuran</dt><dd>{material.fileSize || material.duration}</dd></div><div><dt>Status</dt><dd>{material.status === "UNREAD" ? "Belum dibaca" : material.status === "READ" ? "Sudah dibaca" : "Selesai"}</dd></div></dl><div className="learning-placeholder"><Icon size={24} /><strong>Materi demonstrasi</strong><span>Konten file akan tersedia melalui integrasi penyimpanan akademik.</span></div></section></div>;
}

function CalendarView() {
  return <LearningCalendarExperience />;
}

function LearningMaterialsPage({ filesOnly = false }: { filesOnly?: boolean }) {
  if (filesOnly) {
    const files = learningMaterials.filter((material) => ["PDF", "PRESENTATION", "DOCUMENT", "FILE"].includes(material.type));
    return <div className="portal-page learning-page"><PageHeading title="File Pembelajaran" description="File materi dari mata kuliah KRS aktif." /><section className="portal-panel learning-module-panel">{files.map((material) => <MaterialRow material={material} key={material.id} />)}</section></div>;
  }
  return <CourseMaterialLibrary />;
}

function CourseMaterialsPage({ courseId }: { courseId: string }) {
  if (!activeLearningCourses.some((item) => item.code === courseId)) notFound();
  return <CourseMaterialLibrary initialCourseCode={courseId} />;
}

function AssignmentDetail({ assignmentId }: { assignmentId: string }) {
  const assignment = learningAssignments.find((item) => item.id === assignmentId);
  if (!assignment) notFound();
  const course = activeLearningCourses.find((item) => item.code === assignment.courseId);
  if (!course) notFound();
  return <AssignmentDetailExperience assignment={{ ...assignment, courseName: course.name, instructor: course.lecturer }} />;
}

function QuizDetail({ quizId }: { quizId: string }) {
  const quiz = learningQuizzes.find((item) => item.id === quizId);
  if (!quiz) notFound();
  const course = activeLearningCourses.find((item) => item.code === quiz.courseId);
  if (!course) notFound();
  return <div className="portal-page learning-page"><Link href={`${base}/ujian`} className="learning-back-link"><ArrowLeft size={15} />Kembali ke Ujian & Quiz</Link><QuizAttempt courseName={course.name} quiz={quiz} /></div>;
}

function ExamDetail({ examId }: { examId: string }) {
  const exam = learningExams.find((item) => item.id === examId);
  if (!exam) notFound();
  const course = activeLearningCourses.find((item) => item.code === exam.courseId);
  if (!course) notFound();
  return <div className="portal-page learning-page"><Link href={`${base}/ujian`} className="learning-back-link"><ArrowLeft size={15} />Kembali ke Ujian & Quiz</Link><section className="portal-panel learning-assessment-detail"><span className="learning-material-icon type-exam"><GraduationCap size={22} /></span><p className="portal-eyebrow">Ujian Formal · {course.name}</p><h1>{exam.title}</h1><h2>{course.name}</h2><div className="learning-assessment-facts"><span><strong>{formatDate(exam.date, { day: "numeric", month: "long", year: "numeric" })}</strong> tanggal</span><span><strong>{exam.startsAt}–{exam.endsAt}</strong> waktu</span><span><strong>{exam.durationMinutes}</strong> menit</span><span><strong>{exam.questionCount}</strong> soal</span></div><section className="learning-instructions"><h3>Instruksi</h3><ol>{exam.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol></section><div className="learning-notice">Ujian demonstrasi belum memiliki backend penyimpanan jawaban atau proctoring.</div><button className="portal-button portal-button-primary" disabled={exam.status === "UPCOMING" || exam.status === "CLOSED"} type="button">{exam.status === "COMPLETED" ? "Ujian Selesai" : exam.status === "UPCOMING" ? "Akan Datang" : "Mulai Ujian"}<ArrowRight size={15} /></button></section></div>;
}

function DiscussionPage({ courseId }: { courseId?: string }) {
  const threads = learningDiscussionThreads.filter((thread) => !courseId || thread.courseId === courseId);
  return <div className="portal-page learning-page"><PageHeading title="Diskusi" description="Bertukar pertanyaan dan ide dengan dosen serta taruna dari mata kuliah aktif." /><DiscussionBoard courses={activeLearningCourses} initialThreads={threads} /></div>;
}

export function LearningView({ path }: { path: string[] }) {
  if (!path.length) return <LearningDashboard />;
  if (path[0] === "mata-kuliah" && path.length === 1) return <CourseDirectory />;
  if (path[0] === "mata-kuliah" && path.length === 2) return <CourseDetail courseId={path[1]} />;
  if (path[0] === "mata-kuliah" && path.length >= 3) return <CourseDetail courseId={path[1]} tab={path[2]} />;
  if (path[0] === "tugas" && path.length === 1) return <AssignmentListPage />;
  if (path[0] === "tugas" && path[1]) return <AssignmentDetail assignmentId={path[1]} />;
  if (path[0] === "ujian" && path.length === 1) return <AllAssessmentsPage />;
  if (path[0] === "ujian" && path[1]) return <ExamDetail examId={path[1]} />;
  if ((path[0] === "quiz" || path[0] === "kuis") && path[1]) return <QuizDetail quizId={path[1]} />;
  if (path[0] === "diskusi") return <DiscussionPage courseId={path[1]} />;
  if (path[0] === "kalender") return <CalendarView />;
  if (path[0] === "materi" && path[1] && activeLearningCourses.some((course) => course.code === path[1])) return <CourseMaterialsPage courseId={path[1]} />;
  if (path[0] === "materi" && path[1]) return <MaterialDetail materialId={path[1]} />;
  if (path[0] === "materi") return <LearningMaterialsPage />;
  if (path[0] === "file") return <LearningMaterialsPage filesOnly />;
  if (path[0] === "progress") return <LearningDashboard />;
  notFound();
}