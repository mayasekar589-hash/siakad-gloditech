import { demoCourses, krsEnrollments } from "../demo/data/courses";
import { demoStudent } from "../demo/data/student";

export type LearningMaterialType = "PDF" | "PRESENTATION" | "DOCUMENT" | "VIDEO" | "LINK" | "FILE" | "EMBED";
export type LearningMaterialStatus = "UNREAD" | "READ" | "IN_PROGRESS" | "COMPLETED";
export type LearningActivityStatus = "PENDING" | "SUBMITTED" | "LATE" | "GRADED" | "UPCOMING" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";

export interface LearningMaterial {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  description: string;
  type: LearningMaterialType;
  url: string;
  fileName: string;
  fileSize: string;
  duration: string;
  order: number;
  isPublished: boolean;
  publishedAt: string;
  status: LearningMaterialStatus;
}

export interface LearningModule {
  id: string;
  courseId: string;
  title: string;
  order: number;
}

export interface LearningAssignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: string;
  status: LearningActivityStatus;
  grade?: number;
}

export interface LearningQuiz {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  opensAt: string;
  closesAt: string;
  durationMinutes: number;
  questionCount: number;
  attemptsAllowed: number;
  attemptsUsed: number;
  status: LearningActivityStatus;
}

export interface LearningExam {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  date: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  questionCount: number;
  status: "UPCOMING" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";
  instructions: string[];
}

export interface LearningDiscussionThread {
  id: string;
  courseId: string;
  title: string;
  author: string;
  postedAt: string;
  replies: number;
}

export interface LearningCourseActivity {
  courseId: string;
  lastOpenedAt: string;
  progressPercent: number;
}

export interface LearningAnnouncement {
  id: string;
  courseId: string;
  title: string;
  instructor: string;
  publishedAt: string;
}

export const approvedLearningEnrollments = krsEnrollments.filter(
  (enrollment) => enrollment.semester === demoStudent.semester && enrollment.status === "APPROVED" && enrollment.isActive
);

export const activeLearningCourses = approvedLearningEnrollments.flatMap((enrollment) => {
  const course = demoCourses.find((item) => item.code === enrollment.courseCode);
  return course ? [{ ...course, semester: enrollment.semester, enrollmentStatus: enrollment.status }] : [];
});

const learningProgressSeeds = [72, 80, 60, 54, 68, 41, 32];
export const learningCourseActivity: readonly LearningCourseActivity[] = activeLearningCourses.map((course, index) => ({
  courseId: course.code,
  lastOpenedAt: `2026-10-${String(Math.max(1, 2 - Math.floor(index / 2))).padStart(2, "0")}T${String(14 - index).padStart(2, "0")}:00:00+07:00`,
  progressPercent: learningProgressSeeds[index] ?? 0
}));

const moduleTemplates = ["Pengenalan", "Konsep Dasar", "Aplikasi", "Evaluasi"] as const;
const materialTemplates: { title: string; type: LearningMaterialType; fileName: string; fileSize: string; duration: string }[] = [
  { title: "Materi Pengantar", type: "PDF", fileName: "materi-pengantar.pdf", fileSize: "2.4 MB", duration: "" },
  { title: "Modul Pembelajaran", type: "PRESENTATION", fileName: "modul-pembelajaran.pptx", fileSize: "4.8 MB", duration: "" },
  { title: "Video Pembelajaran", type: "VIDEO", fileName: "video-pembelajaran.mp4", fileSize: "", duration: "18 menit" },
  { title: "Bahan Bacaan", type: "DOCUMENT", fileName: "bahan-bacaan.docx", fileSize: "1.2 MB", duration: "" },
  { title: "Slide Perkuliahan", type: "PRESENTATION", fileName: "slide-perkuliahan.pptx", fileSize: "3.1 MB", duration: "" },
  { title: "Video Praktik", type: "VIDEO", fileName: "video-praktik.mp4", fileSize: "", duration: "12 menit" },
  { title: "Panduan Latihan", type: "PDF", fileName: "panduan-latihan.pdf", fileSize: "980 KB", duration: "" },
  { title: "Referensi Tambahan", type: "LINK", fileName: "referensi-online", fileSize: "", duration: "" },
  { title: "Lembar Kerja", type: "FILE", fileName: "lembar-kerja.pdf", fileSize: "760 KB", duration: "" },
  { title: "Rangkuman Modul", type: "PDF", fileName: "rangkuman-modul.pdf", fileSize: "1.5 MB", duration: "" }
];

export const learningModules: readonly LearningModule[] = activeLearningCourses.flatMap((course) =>
  moduleTemplates.map((title, index) => ({
    id: `${course.code}-M${String(index + 1).padStart(2, "0")}`,
    courseId: course.code,
    title: `${title} ${course.name}`,
    order: index + 1
  }))
);

export const learningMaterials: readonly LearningMaterial[] = activeLearningCourses.flatMap((course, courseIndex) =>
  materialTemplates.map((template, materialIndex) => {
    const moduleNumber = Math.min(Math.floor(materialIndex / 3), moduleTemplates.length - 1) + 1;
    const moduleId = `${course.code}-M${String(moduleNumber).padStart(2, "0")}`;
    const status: LearningMaterialStatus = courseIndex === 0
      ? materialIndex >= 8 ? "UNREAD" : materialIndex === 7 ? "IN_PROGRESS" : materialIndex < 6 ? "COMPLETED" : "READ"
      : materialIndex === 1 && courseIndex < 3 ? "UNREAD" : materialIndex % 3 === 0 ? "COMPLETED" : "READ";
    return {
      id: `${course.code}-MAT${materialIndex + 1}`,
      courseId: course.code,
      moduleId,
      title: template.title,
      description: `${moduleTemplates[moduleNumber - 1]} untuk ${course.name}.`,
      type: template.type,
      url: `/pembelajaran/materi/${course.code}-MAT${materialIndex + 1}`,
      fileName: `${course.code.toLowerCase()}-${template.fileName}`,
      fileSize: template.fileSize,
      duration: template.duration,
      order: materialIndex + 1,
      isPublished: true,
      publishedAt: "2026-09-28T08:00:00+07:00",
      status
    };
  })
);

export const learningAssignments: readonly LearningAssignment[] = activeLearningCourses.flatMap((course, courseIndex) =>
  Array.from({ length: 4 }, (_, taskIndex) => ({
    id: `${course.code}-T${String(taskIndex + 1).padStart(2, "0")}`,
    courseId: course.code,
    title: `Tugas ${taskIndex + 1}: ${course.name}`,
    description: `Tugas demonstrasi untuk mata kuliah ${course.name}.`,
    dueAt: `2026-10-${String(8 + courseIndex + taskIndex).padStart(2, "0")}T23:59:00+07:00`,
    status: courseIndex === 0 ? (taskIndex < 3 ? "SUBMITTED" as const : "PENDING" as const)
      : courseIndex === 2 && taskIndex === 0 ? "PENDING" as const
      : courseIndex === 1 && taskIndex === 0 ? "GRADED" as const
      : courseIndex === 3 && taskIndex === 0 ? "LATE" as const : "SUBMITTED" as const
  }))
);

export const learningQuizzes: readonly LearningQuiz[] = activeLearningCourses.flatMap((course, courseIndex) =>
  Array.from({ length: 3 }, (_, quizIndex) => ({
    id: `${course.code}-Q${String(quizIndex + 1).padStart(2, "0")}`,
    courseId: course.code,
    courseName: course.name,
    title: `Kuis ${quizIndex + 1}: ${course.name}`,
    opensAt: `2026-10-${String(5 + courseIndex + quizIndex).padStart(2, "0")}T08:00:00+07:00`,
    closesAt: `2026-10-${String(5 + courseIndex + quizIndex).padStart(2, "0")}T23:59:00+07:00`,
    durationMinutes: 30,
    questionCount: quizIndex === 1 ? 15 : 10,
    attemptsAllowed: 2,
    attemptsUsed: courseIndex === 0 && quizIndex < 2 ? 1 : 0,
    status: courseIndex === 0 ? (quizIndex < 2 ? "COMPLETED" as const : "NOT_STARTED" as const) : "COMPLETED" as const
  }))
);

export const learningExams: readonly LearningExam[] = activeLearningCourses.map((course, index) => ({
  id: `${course.code}-EXAM-UTS`,
  courseId: course.code,
  courseName: course.name,
  title: "Ujian Tengah Semester",
  date: `2026-10-${String(15 + (index % 3)).padStart(2, "0")}`,
  startsAt: "09:00",
  endsAt: "11:00",
  durationMinutes: 120,
  questionCount: 50,
  status: "UPCOMING",
  instructions: [
    "Pastikan koneksi internet stabil sebelum memulai ujian.",
    "Baca setiap pertanyaan dengan teliti sebelum memilih jawaban.",
    "Jawaban dapat ditinjau kembali sebelum ujian dikumpulkan."
  ]
}));

export const learningDiscussionThreads: readonly LearningDiscussionThread[] = [
  { id: "NAU401-D01", courseId: "NAU401", title: "Bagaimana menentukan safety margin pada perencanaan pelayaran?", author: "Capt. Ahmad Fauzi", postedAt: "2026-10-02T08:00:00+07:00", replies: 24 },
  { id: "NAU402-D01", courseId: "NAU402", title: "Pengaruh tekanan udara terhadap perubahan cuaca maritim", author: "Dr. Budi Santoso", postedAt: "2026-10-01T12:00:00+07:00", replies: 12 },
  { id: "NAU403-D01", courseId: "NAU403", title: "Prosedur keselamatan saat kondisi darurat di kapal", author: "Capt. Dimas Prasetyo", postedAt: "2026-09-30T09:30:00+07:00", replies: 8 }
];

export const learningAnnouncements: readonly LearningAnnouncement[] = activeLearningCourses.slice(0, 3).map((course, index) => ({
  id: `${course.code}-ANN01`,
  courseId: course.code,
  title: index === 0 ? "Materi Pertemuan 5 telah tersedia." : `Pembaruan pembelajaran ${course.name}`,
  instructor: course.lecturer,
  publishedAt: "2026-10-02T08:00:00+07:00"
}));

export const learningSummary = {
  activeCourses: activeLearningCourses.length,
  unreadMaterials: learningMaterials.filter((material) => material.status === "UNREAD").length,
  pendingAssignments: learningAssignments.filter((assignment) => assignment.status === "PENDING").length,
  upcomingQuizzes: learningQuizzes.filter((quiz) => quiz.status === "UPCOMING" || quiz.status === "NOT_STARTED").length
};

export const learningProgressTrend = [
  { month: "Agu", progress: 36 },
  { month: "Sep", progress: 42 },
  { month: "Okt", progress: 47 },
  { month: "Nov", progress: 53 },
  { month: "Des", progress: 58 }
] as const;