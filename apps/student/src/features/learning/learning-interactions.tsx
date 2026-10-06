"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Check, ChevronRight, CircleHelp, FileText, MessageCircle, Send } from "lucide-react";
import type { LearningActivityStatus, LearningDiscussionThread, LearningExam, LearningQuiz } from "./learning-data";

const base = "/pembelajaran";

function dateLabel(value: string, withTime = false) {
  return new Intl.DateTimeFormat("id-ID", withTime
    ? { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function statusText(status: LearningActivityStatus) {
  if (status === "PENDING") return "Belum dikumpulkan";
  if (status === "SUBMITTED") return "Sudah dikumpulkan";
  if (status === "LATE") return "Terlambat";
  if (status === "GRADED") return "Dinilai";
  if (status === "IN_PROGRESS") return "Sedang berlangsung";
  if (status === "CLOSED") return "Ditutup";
  if (status === "NOT_STARTED") return "Belum dimulai";
  if (status === "UPCOMING") return "Akan datang";
  return "Selesai";
}

export interface AssignmentItem {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: string;
  status: LearningActivityStatus;
  courseName: string;
  instructor: string;
}

export function AssignmentFilters({ assignments }: { assignments: readonly AssignmentItem[] }) {
  const [filter, setFilter] = useState("ALL");
  const filtered = assignments.filter((assignment) => filter === "ALL" || assignment.status === filter);
  const filters: [string, string][] = [["ALL", "Semua"], ["PENDING", "Belum Dikerjakan"], ["SUBMITTED", "Sudah Dikumpulkan"], ["LATE", "Terlambat"], ["GRADED", "Dinilai"]];
  return <div className="learning-interactive-list">
    <div className="learning-filter-tabs" aria-label="Filter tugas">{filters.map(([value, label]) => <button aria-pressed={filter === value} className={filter === value ? "is-active" : ""} key={value} onClick={() => setFilter(value)} type="button">{label}<span>{value === "ALL" ? assignments.length : assignments.filter((item) => item.status === value).length}</span></button>)}</div>
    <div className="portal-panel learning-list-panel">{filtered.length ? filtered.map((assignment) => <Link className="learning-activity-row" href={`${base}/tugas/${assignment.id}`} key={assignment.id}><span className="learning-row-icon gold"><FileText size={17} /></span><span className="learning-row-copy"><strong>{assignment.title}</strong><small>{assignment.courseName} · {assignment.instructor} · Deadline {dateLabel(assignment.dueAt, true)}</small></span><span className={`learning-status learning-status-${assignment.status.toLowerCase()}`}>{statusText(assignment.status)}</span><span className="learning-row-action">Lihat Tugas<ChevronRight size={15} /></span></Link>) : <p className="learning-filter-empty">Tidak ada tugas pada filter ini.</p>}</div>
  </div>;
}

export function ExamQuizTabs({ quizzes, exams, courseName, hideQuizTab = false, hideExamTab = false }: { quizzes: readonly LearningQuiz[]; exams: readonly LearningExam[]; courseName?: string; hideQuizTab?: boolean; hideExamTab?: boolean }) {
  const initialTab = hideQuizTab ? "EXAM" : "QUIZ";
  const [tab, setTab] = useState<"QUIZ" | "EXAM">(initialTab);
  return <div className="learning-assessment-view">
    {!hideQuizTab && !hideExamTab ? <div className="learning-assessment-tabs" role="tablist" aria-label="Jenis assessment"><button aria-selected={tab === "QUIZ"} className={tab === "QUIZ" ? "is-active" : ""} onClick={() => setTab("QUIZ")} role="tab" type="button">QUIZ <span>{quizzes.length}</span></button><button aria-selected={tab === "EXAM"} className={tab === "EXAM" ? "is-active" : ""} onClick={() => setTab("EXAM")} role="tab" type="button">UJIAN <span>{exams.length}</span></button></div> : null}
    {tab === "QUIZ" ? <div className="portal-panel learning-list-panel">{quizzes.map((quiz) => <Link className="learning-activity-row" href={`${base}/quiz/${quiz.id}`} key={quiz.id}><span className="learning-row-icon green"><CircleHelp size={17} /></span><span className="learning-row-copy"><strong>{quiz.title}</strong><small>{courseName ?? quiz.courseName} · {quiz.questionCount} soal · {quiz.durationMinutes} menit</small></span><span className={`learning-status learning-status-${quiz.status.toLowerCase()}`}>{statusText(quiz.status)}</span><span className="learning-row-action">Lihat Detail<ChevronRight size={15} /></span></Link>)}</div>
      : <div className="portal-panel learning-list-panel">{exams.map((exam) => <Link className="learning-activity-row" href={`${base}/ujian/${exam.id}`} key={exam.id}><span className="learning-row-icon red"><FileText size={17} /></span><span className="learning-row-copy"><strong>{exam.title}</strong><small>{courseName ?? exam.courseName} · {dateLabel(exam.date)} · {exam.startsAt}–{exam.endsAt} · {exam.durationMinutes} menit</small></span><span className="learning-status learning-status-upcoming">Akan Datang</span><span className="learning-row-action">Lihat Detail<ChevronRight size={15} /></span></Link>)}</div>}
  </div>;
}

export function QuizAttempt({ quiz, courseName }: { quiz: LearningQuiz; courseName: string }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [question, setQuestion] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(quiz.durationMinutes * 60);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const questionCount = quiz.questionCount;

  useEffect(() => {
    if (!started || finished) return;
    const interval = window.setInterval(() => setSecondsLeft((remaining) => {
      if (remaining <= 1) {
        window.clearInterval(interval);
        setFinished(true);
        return 0;
      }
      return remaining - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [started, finished]);

  const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  if (finished) return <div className="portal-panel learning-quiz-finished"><span className="learning-summary-icon green"><Check size={20} /></span><h2>Quiz Selesai</h2><p>Jawaban tersimpan untuk sesi demonstrasi ini. Attempt ini tidak dikirim ke server akademik.</p><Link className="portal-button portal-button-secondary" href={`${base}/ujian`}>Kembali ke Ujian & Quiz<ArrowRight size={15} /></Link></div>;
  if (!started) return <div className="portal-panel learning-assessment-detail"><span className="learning-material-icon type-quiz"><CircleHelp size={21} /></span><p className="portal-eyebrow">Quiz · {courseName}</p><h1>{quiz.title}</h1><p>Evaluasi singkat untuk mengukur pemahaman materi perkuliahan.</p><div className="learning-assessment-facts"><span><strong>{questionCount}</strong> soal</span><span><strong>{quiz.durationMinutes}</strong> menit</span><span><strong>{Math.max(quiz.attemptsAllowed - quiz.attemptsUsed, 0)}</strong> attempt tersedia</span></div><div className="learning-notice">Mode demonstrasi: jawaban hanya tersimpan di sesi browser ini dan belum dikirim ke backend.</div><button className="portal-button portal-button-primary" disabled={quiz.status === "CLOSED" || quiz.status === "COMPLETED"} onClick={() => setStarted(true)} type="button">Mulai Quiz<ArrowRight size={15} /></button></div>;

  return <section className="portal-panel learning-quiz-attempt"><header className="learning-quiz-top"><div><p className="portal-eyebrow">{courseName}</p><h1>{quiz.title}</h1></div><div className="learning-quiz-timer">Waktu tersisa<strong>{timer}</strong></div></header><div className="learning-quiz-progress"><span>Question {question + 1} / {questionCount}</span><div className="learning-progress-track"><span style={{ width: `${((question + 1) / questionCount) * 100}%` }} /></div></div><article className="learning-question"><h2>{question + 1}. Pilih pernyataan yang paling tepat untuk materi {courseName}.</h2>{["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"].map((option, index) => <label className={answers[question] === option ? "is-selected" : ""} key={option}><input checked={answers[question] === option} name={`question-${question}`} onChange={() => { setAnswers((current) => ({ ...current, [question]: option })); setSaved(false); }} type="radio" />{String.fromCharCode(65 + index)}. {option}</label>)}</article><nav className="learning-question-nav" aria-label="Navigasi soal">{Array.from({ length: questionCount }, (_, index) => <button aria-current={question === index ? "step" : undefined} className={`${question === index ? "is-current" : ""}${answers[index] ? " is-answered" : ""}`} key={index} onClick={() => setQuestion(index)} type="button">{index + 1}</button>)}</nav><footer className="learning-quiz-actions"><span aria-live="polite">{saved ? "Jawaban tersimpan di sesi ini" : `${Object.keys(answers).length} jawaban terisi`}</span><div><button className="portal-button portal-button-secondary" onClick={() => setSaved(true)} type="button">Simpan Jawaban</button><button className="portal-button portal-button-primary" onClick={() => question + 1 < questionCount ? setQuestion(question + 1) : setFinished(true)} type="button">{question + 1 < questionCount ? "Soal Berikutnya" : "Selesai"}<ArrowRight size={15} /></button></div></footer></section>;
}

export function DiscussionBoard({ initialThreads, courses }: { initialThreads: readonly LearningDiscussionThread[]; courses: readonly { code: string; name: string; lecturer: string }[] }) {
  const [threads, setThreads] = useState([...initialThreads]);
  const [courseFilter, setCourseFilter] = useState("ALL");
  const [title, setTitle] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const visibleThreads = threads.filter((thread) => courseFilter === "ALL" || thread.courseId === courseFilter);

  function createThread(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const threadTitle = title.trim();
    if (!threadTitle) return;
    const course = courses.find((item) => item.code === courseFilter) ?? courses[0];
    if (!course) return;
    setThreads((current) => [{ id: `DEMO-${Date.now()}`, courseId: course.code, title: threadTitle, author: "Muhammad Rizky Pratama", postedAt: new Date().toISOString(), replies: 0 }, ...current]);
    setTitle("");
  }

  function addReply(event: React.FormEvent<HTMLFormElement>, threadId: string) {
    event.preventDefault();
    const reply = replyText[threadId]?.trim();
    if (!reply) return;
    setReplies((current) => ({ ...current, [threadId]: [...(current[threadId] ?? []), reply] }));
    setThreads((current) => current.map((thread) => thread.id === threadId ? { ...thread, replies: thread.replies + 1 } : thread));
    setReplyText((current) => ({ ...current, [threadId]: "" }));
  }

  return <div className="learning-discussion-layout"><form className="portal-panel learning-discussion-compose" onSubmit={createThread}><label htmlFor="discussion-course">Mata kuliah</label><select id="discussion-course" onChange={(event) => setCourseFilter(event.target.value)} value={courseFilter}><option value="ALL">Semua Mata Kuliah</option>{courses.map((course) => <option key={course.code} value={course.code}>{course.name}</option>)}</select><label htmlFor="discussion-title">Topik diskusi</label><textarea id="discussion-title" onChange={(event) => setTitle(event.target.value)} placeholder="Tulis pertanyaan atau topik diskusi..." rows={3} value={title} /><button className="portal-button portal-button-primary" disabled={!title.trim()} type="submit"><MessageCircle size={15} />Buat Thread</button><p>Thread disimpan lokal untuk demonstrasi.</p></form><section className="learning-thread-list">{visibleThreads.map((thread) => {const course = courses.find((item) => item.code === thread.courseId);return <article className="portal-panel learning-thread" key={thread.id}><p className="portal-eyebrow">{course?.name ?? thread.courseId}</p><h2>{thread.title}</h2><p className="learning-thread-meta">{thread.author} · {dateLabel(thread.postedAt, true)} · {thread.replies} balasan</p><button className="portal-text-link" onClick={() => setExpanded(expanded === thread.id ? null : thread.id)} type="button">{expanded === thread.id ? "Tutup diskusi" : "Lihat Diskusi"}<ChevronRight size={15} /></button>{expanded === thread.id ? <div className="learning-thread-replies">{(replies[thread.id] ?? []).map((reply, index) => <p key={`${thread.id}-${index}`}><strong>Muhammad Rizky Pratama</strong><span>{reply}</span></p>)}<form onSubmit={(event) => addReply(event, thread.id)}><input aria-label="Balasan diskusi" onChange={(event) => setReplyText((current) => ({ ...current, [thread.id]: event.target.value }))} placeholder="Tulis balasan..." value={replyText[thread.id] ?? ""} /><button aria-label="Kirim balasan" disabled={!replyText[thread.id]?.trim()} type="submit"><Send size={15} /></button></form></div> : null}</article>;})}</section></div>;
}