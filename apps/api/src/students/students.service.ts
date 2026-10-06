import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { KrsStatus, StudentAcademicStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { ChangeStudentStatusDto, ReviewKrsDto } from "./students.dto";

export const DEMO_STUDENT_NIM = "202501001";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStudents(query = "", status?: StudentAcademicStatus) {
    const search = query.trim();
    return this.prisma.student.findMany({
      where: {
        ...(status ? { academicStatus: status } : {}),
        ...(search ? { OR: [
          { studentNumber: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { studyProgram: { name: { contains: search, mode: "insensitive" } } }
        ] } : {})
      },
      include: {
        studyProgram: { select: { id: true, code: true, name: true } },
        krsRecords: { orderBy: { updatedAt: "desc" }, take: 1, select: { id: true, academicYear: true, term: true, status: true, rejectionReason: true, updatedAt: true } },
        _count: { select: { grades: true, attendanceRecords: true } }
      },
      orderBy: [{ studentNumber: "asc" }, { name: "asc" }],
      take: 500
    });
  }

  async getStudent(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        studyProgram: true,
        applicant: { select: { email: true, phone: true } },
        sourceApplication: { select: { registrationNumber: true, status: true } },
        krsRecords: { include: { statusHistory: { orderBy: { createdAt: "desc" } }, items: { include: { offering: { include: { course: true, lecturer: true, schedules: true } } } } }, orderBy: { updatedAt: "desc" } },
        grades: { include: { offering: { include: { course: true } } }, orderBy: { updatedAt: "desc" } },
        statusHistory: { orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }] },
        graduationEvaluations: { orderBy: { academicYear: "desc" }, take: 1 }
      }
    });
    if (!student) throw new NotFoundException("Mahasiswa tidak ditemukan.");
    return student;
  }

  async changeStatus(studentId: string, input: ChangeStudentStatusDto, actorLabel = "Administrator Back Office") {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true, academicStatus: true } });
    if (!student) throw new NotFoundException("Mahasiswa tidak ditemukan.");
    if (!input.reason.trim()) throw new UnprocessableEntityException("Alasan perubahan status wajib diisi.");
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.student.update({ where: { id: studentId }, data: { academicStatus: input.status } });
      await transaction.studentStatusHistory.create({ data: {
        studentId,
        oldStatus: student.academicStatus,
        newStatus: input.status,
        effectiveAt: new Date(input.effectiveAt),
        reason: input.reason.trim(),
        notes: input.notes?.trim() || null,
        actorLabel
      } });
      return updated;
    });
  }

  async listKrs(query = "", status?: KrsStatus) {
    const search = query.trim();
    return this.prisma.krsRecord.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { student: { OR: [
          { studentNumber: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { studyProgram: { name: { contains: search, mode: "insensitive" } } }
        ] } } : {})
      },
      include: { student: { include: { studyProgram: { select: { id: true, name: true } } } }, statusHistory: { orderBy: { createdAt: "desc" } }, items: { include: { offering: { include: { course: true } } } } },
      orderBy: [{ updatedAt: "desc" }],
      take: 500
    });
  }

  async reviewKrs(krsId: string, input: ReviewKrsDto) {
    if (input.status === KrsStatus.REJECTED && !input.reason?.trim()) throw new UnprocessableEntityException("Alasan penolakan KRS wajib diisi.");
    const record = await this.prisma.krsRecord.findUnique({ where: { id: krsId }, include: { student: { select: { academicStatus: true } } } });
    if (!record) throw new NotFoundException("Registrasi akademik tidak ditemukan.");
    if (input.status === KrsStatus.APPROVED && record.student.academicStatus !== StudentAcademicStatus.AKTIF) {
      throw new UnprocessableEntityException("KRS tidak dapat disetujui karena status mahasiswa bukan AKTIF.");
    }
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.krsRecord.update({ where: { id: krsId }, data: {
        status: input.status,
        rejectionReason: input.status === KrsStatus.REJECTED ? input.reason!.trim() : null
      }, include: { student: { include: { studyProgram: true } }, items: { include: { offering: { include: { course: true } } } } } });
      await transaction.krsStatusHistory.create({ data: {
        krsId,
        oldStatus: record.status,
        newStatus: input.status,
        reason: input.reason?.trim() || null,
        actorLabel: "Administrator Back Office"
      } });
      return updated;
    });
  }

  async getDemoStudent(nim: string | undefined) {
    if (process.env.NODE_ENV === "production") throw new ForbiddenException("Taruna authentication is required.");
    if (nim !== DEMO_STUDENT_NIM) throw new ForbiddenException("NIM demo tidak valid.");
    const student = await this.prisma.student.findUnique({ where: { studentNumber: DEMO_STUDENT_NIM }, include: {
      studyProgram: { select: { id: true, name: true } },
      krsRecords: { include: { statusHistory: { orderBy: { createdAt: "desc" } }, items: { include: { offering: { include: { course: true, lecturer: true, schedules: true } } } } }, orderBy: { updatedAt: "desc" } },
      grades: { include: { offering: { include: { course: true } } }, orderBy: { updatedAt: "desc" } },
      statusHistory: { orderBy: [{ effectiveAt: "desc" }, { createdAt: "desc" }] }
    } });
    if (!student) throw new NotFoundException("Data Taruna demo belum tersedia di database akademik.");
    return student;
  }
}
