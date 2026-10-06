import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Matches, Max, Min, MinLength } from "class-validator";

const academicYearPattern = /^20\d{2}\/20\d{2}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export class CreateBillingDto {
  @IsUUID()
  studentId!: string;

  @IsOptional()
  @IsUUID()
  tariffId?: string;

  @IsOptional()
  @IsUUID()
  scholarshipId?: string;

  @IsString()
  @Matches(academicYearPattern)
  academicYear!: string;

  @IsInt()
  @Min(1)
  @Max(14)
  semester!: number;

  @IsString()
  @MinLength(1)
  billingType!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsOptional()
  @Transform(({ value }) => typeof value === "string" && value.trim() ? Number(value) : value)
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  @Matches(datePattern)
  dueDate!: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateBillingDto {
  @IsOptional() @IsString() @Matches(academicYearPattern) academicYear?: string;
  @IsOptional() @IsInt() @Min(1) @Max(14) semester?: number;
  @IsOptional() @IsString() @MinLength(1) billingType?: string;
  @IsOptional() @IsString() @MinLength(1) description?: string;
  @IsOptional() @Transform(({ value }) => typeof value === "string" && value.trim() ? Number(value) : value) @IsInt() @Min(1) amount?: number;
  @IsOptional() @IsString() @Matches(datePattern) dueDate?: string;
  @IsOptional() @IsString() note?: string;
}

export class CancelBillingDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}

export class BillingImportDto {
  @IsArray()
  @ArrayMaxSize(5000)
  rows!: unknown[];

  @IsOptional()
  @Transform(({ value }) => value === true || value === "true")
  confirmWarnings?: boolean;
}