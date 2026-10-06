import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingProgramRegistrationPage } from "@/components/registration/training-catalog";
import { getTrainingProgram, trainingPrograms } from "@/features/registration/data/training-programs";

export function generateStaticParams() {
  return trainingPrograms.filter((program) => program.active && program.status === "OPEN").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getTrainingProgram(slug);
  return { title: program ? `Daftar ${program.name}` : "Pendaftaran Program Diklat" };
}

export default async function TrainingProgramRegistrationRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = getTrainingProgram(slug);
  if (!program || !program.active || program.status !== "OPEN") notFound();
  return <TrainingProgramRegistrationPage program={program} />;
}