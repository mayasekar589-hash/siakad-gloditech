import { Controller, Get, Headers, Param, Patch, Query, UseGuards, Body } from "@nestjs/common";
import { KrsStatus, StudentAcademicStatus } from "@prisma/client";
import { AdmissionsAdminGuard } from "../admissions/admissions-admin.guard";
import { ChangeStudentStatusDto, ReviewKrsDto } from "./students.dto";
import { StudentsService } from "./students.service";

@Controller("students/admin")
@UseGuards(AdmissionsAdminGuard)
export class AdminStudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  list(@Query("query") query = "", @Query("status") status?: StudentAcademicStatus) {
    return this.students.listStudents(query, status);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.students.getStudent(id);
  }

  @Patch(":id/status")
  changeStatus(@Param("id") id: string, @Body() body: ChangeStudentStatusDto) {
    return this.students.changeStatus(id, body);
  }
}

@Controller("krs/admin")
@UseGuards(AdmissionsAdminGuard)
export class AdminKrsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  list(@Query("query") query = "", @Query("status") status?: KrsStatus) {
    return this.students.listKrs(query, status);
  }

  @Patch(":id/review")
  review(@Param("id") id: string, @Body() body: ReviewKrsDto) {
    return this.students.reviewKrs(id, body);
  }
}

@Controller("students/demo")
export class DemoStudentController {
  constructor(private readonly students: StudentsService) {}

  @Get("me")
  me(@Headers("x-student-demo-nim") nim?: string) {
    return this.students.getDemoStudent(nim);
  }
}
