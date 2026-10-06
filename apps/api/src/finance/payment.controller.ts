import { BadRequestException, Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { FinancePaymentStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsString, Max, Min } from "class-validator";
import { AdmissionsAdminGuard } from "../admissions/admissions-admin.guard";
import { ReviewFinancePaymentDto } from "./dto/payment.dto";
import { PaymentService } from "./payment.service";

class PaymentListQuery {
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() academicYear?: string;
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsEnum(FinancePaymentStatus) status?: FinancePaymentStatus;
  @IsOptional() @IsDateString() from?: string;
  @IsOptional() @IsDateString() to?: string;
  @IsOptional() @Type(() => Number) @Min(1) @Max(1000000) page?: number;
  @IsOptional() @Type(() => Number) @Min(1) @Max(100) pageSize?: number;
}

interface UploadedPaymentProof {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@Controller("finance/admin/payments")
@UseGuards(AdmissionsAdminGuard)
export class FinancePaymentAdminController {
  constructor(private readonly payments: PaymentService) {}

  @Get()
  list(@Query() query: PaymentListQuery) {
    return this.payments.list(query);
  }

  @Get(":id/proof")
  async proof(@Param("id", ParseUUIDPipe) id: string) {
    const file = await this.payments.getProof(id);
    const safeName = file.fileName.replace(/[\r\n"\\]/g, "_");
    return new StreamableFile(file.body, { type: file.mimeType, disposition: `inline; filename="${safeName}"` });
  }

  @Get(":id")
  detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.payments.get(id);
  }

  @Patch(":id/review")
  review(@Param("id", ParseUUIDPipe) id: string, @Body() body: ReviewFinancePaymentDto) {
    return this.payments.review(id, body);
  }
}

@Controller("students/demo/billings")
export class DemoStudentPaymentController {
  constructor(private readonly payments: PaymentService) {}

  @Post(":billingId/payments")
  @UseInterceptors(FileInterceptor("proof", { limits: { fileSize: Number(process.env.PAYMENT_PROOF_MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024) } }))
  submit(
    @Headers("x-student-demo-nim") nim: string | undefined,
    @Param("billingId", ParseUUIDPipe) billingId: string,
    @Body("paymentMethod") paymentMethod: string,
    @Body("paymentReference") paymentReference: string,
    @UploadedFile() file?: UploadedPaymentProof
  ) {
    if (!file) throw new BadRequestException("Bukti pembayaran wajib diunggah.");
    return this.payments.submitStudentPayment(nim, billingId, paymentMethod, paymentReference, file);
  }
}