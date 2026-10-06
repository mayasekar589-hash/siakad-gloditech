import { ScholarshipStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Min, MinLength } from "class-validator";

export class CreateTariffDto {
  @IsString() @MinLength(2) code!: string;
  @IsString() @MinLength(2) name!: string;
  @IsString() @MinLength(2) kind!: string;
  @IsOptional() @IsUUID() studyProgramId?: string;
  @IsOptional() @IsString() pathway?: string;
  @IsInt() @Min(1) semester!: number;
  @IsString() @Matches(/^20\d{2}\/20\d{2}$/) academicYear!: string;
  @Transform(({ value }) => typeof value === "string" ? Number(value) : value) @IsInt() @Min(1) amount!: number;
  @IsOptional() active?: boolean;
}

export class ReviewScholarshipDto {
  @IsEnum(ScholarshipStatus) status!: ScholarshipStatus;
  @IsOptional() @IsString() reason?: string;
}

export class CreateScholarshipDto {
  @IsUUID() studentId!: string;
  @IsString() @MinLength(2) kind!: string;
  @IsString() @Matches(/^20\d{2}\/20\d{2}$/) academicYear!: string;
  @Transform(({ value }) => typeof value === "string" ? Number(value) : value) @IsInt() @Min(1) amount!: number;
  @IsString() @MinLength(2) provider!: string;
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsOptional() @IsString() documentName?: string;
  @IsOptional() @IsString() note?: string;
}

export class ReconciliationImportDto {
  @IsArray() @ArrayMaxSize(5000) rows!: unknown[];
}

export class MasterDataImportDto {
  @IsArray() @ArrayMaxSize(5000) rows!: unknown[];
}