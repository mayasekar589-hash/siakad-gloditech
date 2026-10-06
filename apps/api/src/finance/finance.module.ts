import { Module } from "@nestjs/common";
import { FinanceAdminController, DemoStudentFinanceController } from "./finance.controller";
import { FinanceService } from "./finance.service";
import { FinancePaymentAdminController, DemoStudentPaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

@Module({
  controllers: [FinanceAdminController, DemoStudentFinanceController, FinancePaymentAdminController, DemoStudentPaymentController],
  providers: [FinanceService, PaymentService]
})
export class FinanceModule {}