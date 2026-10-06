import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRegistrationOption, RegistrationDetail, registrationOptions } from "@/components/registration/registration-content";

export function generateStaticParams() {
  return registrationOptions.filter(({ slug }) => slug !== "diklat").map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const option = getRegistrationOption(slug);
  return { title: option ? option.title : "Pendaftaran" };
}

export default async function RegistrationOptionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const option = getRegistrationOption(slug);
  if (!option) notFound();

  return <RegistrationDetail option={option} />;
}