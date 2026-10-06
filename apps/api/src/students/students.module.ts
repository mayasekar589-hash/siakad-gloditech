import { Module } from "@nestjs/common";
import { AdminKrsController, AdminStudentsController, DemoStudentController } from "./students.controller";
import { StudentsService } from "./students.service";

@Module({
  controllers: [AdminStudentsController, AdminKrsController, DemoStudentController],
  providers: [StudentsService]
})
export class StudentsModule {}
