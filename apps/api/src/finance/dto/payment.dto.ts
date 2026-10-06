import { FinancePaymentStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class ReviewFinancePaymentDto {
  @IsEnum(FinancePaymentStatus)
  status!: FinancePaymentStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;
}