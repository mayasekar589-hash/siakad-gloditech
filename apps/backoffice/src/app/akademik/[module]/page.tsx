import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ProtectedDashboard } from "../../../features/auth/protected-dashboard";
import { AcademicModulePage } from "../../../features/academic/academic-module-page";
import { academicModules } from "../../../features/academic/workspace";

export default async function AcademicModuleRoute({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!academicModules.some((item) => item.id === module)) notFound();
  if (module === "mahasiswa") redirect("/kemahasiswaan/status-mahasiswa");

  return <ProtectedDashboard><AcademicModulePage moduleId={module} /></ProtectedDashboard>;
}