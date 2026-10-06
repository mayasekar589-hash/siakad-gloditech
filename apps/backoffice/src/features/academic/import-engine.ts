import type { AcademicCollection, AcademicWorkspaceData, AttendanceRecord, CeremonyRegistration, ClassOffering, Curriculum, CurriculumCourseAssignment, GradeRecord, GraduationEvaluation, KrsRecord } from "./domain";
import type { ImportPreview, ImportReadyRow } from "./import-validation";

function acceptedRows(preview: ImportPreview) {
  return preview.rows.filter((row) => (row.state === "VALID" || row.state === "WARNING") && row.payload);
}

function recordsFor<T>(rows: ImportReadyRow[], collection: AcademicCollection): T[] {
  return rows.flatMap((row) => row.payload?.collection === collection ? [row.payload.record as T] : []);
}

export function applyValidatedImport(data: AcademicWorkspaceData, preview: ImportPreview): AcademicWorkspaceData {
  const rows = acceptedRows(preview);
  const additions = <T,>(collection: AcademicCollection) => recordsFor<T>(rows, collection);
  const curricula = additions<Curriculum>("curricula");
  const curriculumAssignments = additions<CurriculumCourseAssignment>("curriculumAssignments");
  const assignmentsByCurriculum = new Map<string, string[]>();
  curriculumAssignments.forEach((assignment) => assignmentsByCurriculum.set(assignment.curriculumId, [...(assignmentsByCurriculum.get(assignment.curriculumId) ?? []), assignment.courseId]));
  const updatedCurricula = [...data.curricula, ...curricula].map((curriculum) => ({
    ...curriculum,
    courseIds: [...new Set([...curriculum.courseIds, ...(assignmentsByCurriculum.get(curriculum.id) ?? [])])]
  }));

  const importedKrsRows = additions<KrsRecord>("krs");
  const groupedKrs = new Map<string, KrsRecord>();
  for (const record of importedKrsRows) {
    const current = groupedKrs.get(record.id);
    groupedKrs.set(record.id, current ? { ...current, offeringIds: [...new Set([...current.offeringIds, ...record.offeringIds])] } : record);
  }

  const attendanceRecords = additions<AttendanceRecord>("attendanceRecords");
  const attendance = [...data.attendance];
  for (const record of attendanceRecords) {
    const summary = attendance.find((item) => item.studentId === record.studentId && item.offeringId === record.offeringId);
    if (summary) {
      summary.meetings += 1;
      if (record.status === "HADIR") summary.present += 1;
      else if (record.status === "IZIN") summary.excused += 1;
      else if (record.status === "SAKIT") summary.sick += 1;
      else summary.absent += 1;
    } else {
      attendance.push({ id: `rekap-${record.studentId}-${record.offeringId}`, studentId: record.studentId, offeringId: record.offeringId, meetings: 1, present: record.status === "HADIR" ? 1 : 0, excused: record.status === "IZIN" ? 1 : 0, sick: record.status === "SAKIT" ? 1 : 0, absent: record.status === "ALPA" ? 1 : 0 });
    }
  }

  const ceremonyRegistrations = additions<CeremonyRegistration>("ceremonyRegistrations");
  const allCeremonyRegistrations = [...data.ceremonyRegistrations, ...ceremonyRegistrations];
  const ceremonies = [...data.ceremonies].map((ceremony) => ({
    ...ceremony,
    registrationIds: allCeremonyRegistrations.filter((registration) => registration.ceremonyId === ceremony.id).map((registration) => registration.id)
  }));
  const graduations = additions<GraduationEvaluation>("graduations");
  const graduatedIds = new Set(graduations.filter((item) => item.status === "GRADUATED").map((item) => item.studentId));

  const next: AcademicWorkspaceData = {
    ...data,
    programs: [...data.programs, ...additions<AcademicWorkspaceData["programs"][number]>("programs")],
    lecturers: [...data.lecturers, ...additions<AcademicWorkspaceData["lecturers"][number]>("lecturers")],
    students: [...data.students, ...additions<AcademicWorkspaceData["students"][number]>("students")].map((student) => graduatedIds.has(student.id) ? { ...student, status: "LULUS" } : student),
    curricula: updatedCurricula,
    curriculumAssignments: [...data.curriculumAssignments, ...curriculumAssignments],
    courses: [...data.courses, ...additions<AcademicWorkspaceData["courses"][number]>("courses")],
    offerings: [...data.offerings, ...additions<ClassOffering>("offerings")],
    schedules: [...data.schedules, ...additions<AcademicWorkspaceData["schedules"][number]>("schedules")],
    krs: [...data.krs, ...groupedKrs.values()],
    grades: [...data.grades, ...additions<GradeRecord>("grades")],
    attendance,
    attendanceRecords: [...data.attendanceRecords, ...attendanceRecords],
    graduationRules: data.graduationRules,
    graduations: [...data.graduations, ...graduations],
    ceremonies,
    ceremonyRegistrations: allCeremonyRegistrations,
    calendarEvents: [...data.calendarEvents, ...additions<AcademicWorkspaceData["calendarEvents"][number]>("calendarEvents")]
  };
  return next;
}

export function acceptedImportCount(preview: ImportPreview): number {
  return acceptedRows(preview).length;
}

export function collectedImportIssues(preview: ImportPreview) {
  return preview.rows.flatMap((row) => [...row.errors, ...row.warnings]);
}

export function importedRowsForHistory(preview: ImportPreview): ImportReadyRow[] {
  return preview.rows.filter((row) => row.state !== "SKIPPED");
}

export type ImportCommitResult = { data: AcademicWorkspaceData; count: number; collectionCounts: Partial<Record<AcademicCollection, number>> };

export function commitImport(data: AcademicWorkspaceData, preview: ImportPreview): ImportCommitResult {
  const committedRows = acceptedRows(preview);
  const next = applyValidatedImport(data, preview);
  const collectionCounts: Partial<Record<AcademicCollection, number>> = {};
  for (const row of committedRows) {
    const collection = row.payload?.collection;
    if (collection) collectionCounts[collection] = (collectionCounts[collection] ?? 0) + 1;
  }
  return { data: next, count: committedRows.length, collectionCounts };
}
