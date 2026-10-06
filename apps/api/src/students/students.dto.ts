import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { KrsStatus, StudentAcademicStatus } from "@prisma/client";

export class ChangeStudentStatusDto {
  @IsEnum(StudentAcademicStatus)
  status!: StudentAcademicStatus;

  @IsDateString()
  effectiveAt!: string;

  @IsString() @MinLength(1)
  reason!: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class ReviewKrsDto {
  @IsEnum(KrsStatus)
  status!: KrsStatus;

  @IsOptional() @IsString()
  reason?: string;
}
