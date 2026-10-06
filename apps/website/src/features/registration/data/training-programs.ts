import type { TrainingProgram } from "@/features/registration/types";

export const trainingPrograms: readonly TrainingProgram[] = [];

export function getTrainingProgram(slug: string) {
  return trainingPrograms.find((program) => program.active && program.slug === slug);
}
