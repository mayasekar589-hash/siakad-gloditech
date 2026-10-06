import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrainingCatalogPage, TrainingProgramDetailPage } from "@/components/registration/training-catalog";
import { getTrainingCategory, trainingCategories } from "@/features/registration/data/training-categories";
import { getTrainingProgram, trainingPrograms } from "@/features/registration/data/training-programs";

export function generateStaticParams() {
  return [
    ...trainingCategories.map(({ slug }) => ({ slug })),
    ...trainingPrograms.filter((program) => program.active).map(({ slug }) => ({ slug }))
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = getTrainingProgram(slug);
  const category = getTrainingCategory(slug);
  return { title: category?.name ?? program?.name ?? "Program Diklat" };
}

export default async function TrainingProgramDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getTrainingCategory(slug);
  if (category) return <TrainingCatalogPage category={category} />;

  const program = getTrainingProgram(slug);
  if (!program) notFound();
  return <TrainingProgramDetailPage program={program} />;
}