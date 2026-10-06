import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEmail, IsEnum, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID, Min, MinLength, ValidateNested } from "class-validator";
import { AdmissionPaymentStatus, AdmissionPeriodStatus, ApplicantDocumentStatus, ApplicationStatus, RegistrationType, ReRegistrationStatus, SelectionResultStatus, SelectionScoringModel } from "@prisma/client";

export class CreateApplicationDraftDto {
  @IsEnum(RegistrationType)
  registrationType!: RegistrationType;

  @IsUUID()
  admissionPeriodId!: string;
}

export class ApplicationDataDto {
  @IsOptional() @IsObject()
  personal?: Record<string, unknown>;

  @IsOptional() @IsObject()
  parent?: Record<string, unknown>;

  @IsOptional() @IsObject()
  education?: Record<string, unknown>;

  @IsOptional() @IsObject()
  physical?: Record<string, unknown>;

  @IsOptional() @IsObject()
  professional?: Record<string, unknown>;

  @IsOptional() @IsObject()
  program?: Record<string, unknown>;
}

export class CreatePeriodProgramDto {
  @IsUUID()
  admissionProgramId!: string;

  @IsOptional() @IsInt() @Min(1)
  quota?: number;

}

export class CreateRequirementDto {
  @IsString() @MinLength(1)
  title!: string;

  @IsString() @MinLength(1)
  description!: string;

  @IsOptional() @IsBoolean()
  required?: boolean;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class CreateDocumentRequirementDto {
  @IsString() @MinLength(1)
  documentCode!: string;

  @IsString() @MinLength(1)
  label!: string;

  @IsOptional() @IsBoolean()
  required?: boolean;

  @IsArray() @IsString({ each: true })
  acceptedMimeTypes!: string[];

  @IsOptional() @IsInt() @Min(1)
  maxSizeBytes?: number;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt()
  sortOrder?: number;
}

export class CreateFeeDto {
  @IsString() @MinLength(1)
  code!: string;

  @IsString() @MinLength(1)
  name!: string;

  @IsOptional() @IsInt() @Min(0)
  amount?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  required?: boolean;

  @IsOptional() @IsDateString()
  expiresAt?: string;
}

export class CreateSelectionStageDto {
  @IsString() @MinLength(1)
  code!: string;

  @IsString() @MinLength(1)
  name!: string;

  @IsInt() @Min(0)
  sortOrder!: number;

  @IsEnum(SelectionScoringModel)
  scoringModel!: SelectionScoringModel;

  @IsOptional() @IsNumber() @Min(0)
  maximumScore?: number;

  @IsOptional() @IsBoolean()
  required?: boolean;
}

export class CreateAdmissionPeriodDto {
  @IsString() @MinLength(1)
  code!: string;

  @IsString() @MinLength(1)
  name!: string;

  @IsString() @MinLength(1)
  academicYear!: string;

  @IsEnum(RegistrationType)
  registrationType!: RegistrationType;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(AdmissionPeriodStatus)
  status?: AdmissionPeriodStatus;

  @IsDateString()
  opensAt!: string;

  @IsDateString()
  closesAt!: string;

  @IsOptional() @IsInt() @Min(1)
  quota?: number;

  @IsOptional() @IsString()
  studentNumberPrefix?: string;

  @IsOptional() @IsInt() @Min(1)
  studentNumberNext?: number;

  @IsOptional() @IsInt() @Min(1)
  studentNumberWidth?: number;

  @IsOptional() @IsObject()
  registrationSettings?: Record<string, unknown>;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreatePeriodProgramDto)
  programs?: CreatePeriodProgramDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateRequirementDto)
  requirements?: CreateRequirementDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateDocumentRequirementDto)
  documents?: CreateDocumentRequirementDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateFeeDto)
  fees?: CreateFeeDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateSelectionStageDto)
  selectionStages?: CreateSelectionStageDto[];
}

export class CreateAdmissionProgramDto {
  @IsString() @MinLength(1)
  code!: string;

  @IsString() @MinLength(1)
  name!: string;

  @IsEnum(RegistrationType)
  registrationType!: RegistrationType;

  @IsOptional() @IsUUID()
  studyProgramId?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

export class ReviewDocumentDto {
  @IsEnum(ApplicantDocumentStatus)
  status!: ApplicantDocumentStatus;

  @IsOptional() @IsString()
  reason?: string;

  @IsOptional() @IsString()
  notes?: string;
}

export class ReviewPaymentDto {
  @IsEnum(AdmissionPaymentStatus)
  status!: AdmissionPaymentStatus;

  @IsOptional() @IsString()
  reason?: string;
}

export class UpdateSelectionResultDto {
  @IsEnum(SelectionResultStatus)
  status!: SelectionResultStatus;

  @IsOptional() @IsNumber() @Min(0)
  score?: number;

  @IsOptional() @IsString()
  grade?: string;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsDateString()
  scheduledAt?: string;
}

export class PublishApplicationResultDto {
  @IsEnum([ApplicationStatus.PASSED_SELECTION, ApplicationStatus.FAILED_SELECTION] as unknown as object)
  status!: Extract<ApplicationStatus, "PASSED_SELECTION" | "FAILED_SELECTION">;

  @IsBoolean()
  confirm!: boolean;

  @IsOptional() @IsString()
  notes?: string;
}

export class UpdateReRegistrationDto {
  @IsEnum(ReRegistrationStatus)
  status!: ReRegistrationStatus;

  @IsObject()
  checklist!: Record<string, boolean>;

  @IsOptional() @IsBoolean()
  confirmConversion?: boolean;
}

export class PublicStatusQueryDto {
  @IsString() @MinLength(1)
  registrationNumber!: string;

  @IsEmail()
  email!: string;
}
