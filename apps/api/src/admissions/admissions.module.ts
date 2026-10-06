import { Module } from "@nestjs/common";
import { AdminAdmissionsController, PublicAdmissionsController } from "./admissions.controller";
import { AdmissionsService } from "./admissions.service";

@Module({
  controllers: [PublicAdmissionsController, AdminAdmissionsController],
  providers: [AdmissionsService]
})
export class AdmissionsModule {}
