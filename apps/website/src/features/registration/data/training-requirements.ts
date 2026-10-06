import type { TrainingProgram } from "@/features/registration/types";

export type TrainingRequirementsByProgram = Pick<TrainingProgram, "slug" | "requirements" | "eligibility" | "documents" | "fees" | "schedules">;

export const trainingRequirements: readonly TrainingRequirementsByProgram[] = [];
