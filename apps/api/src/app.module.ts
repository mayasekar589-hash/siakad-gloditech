import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AdmissionsModule } from "./admissions/admissions.module";
import { StudentsModule } from "./students/students.module";
import { FinanceModule } from "./finance/finance.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ["../../.env", ".env"] }),
    PrismaModule,
    HealthModule,
    AdmissionsModule,
    StudentsModule,
    FinanceModule
  ]
})
export class AppModule {}