import { notFound } from "next/navigation";
import { ProtectedDashboard } from "../../../features/auth/protected-dashboard";
import { StudentLifeWorkspace } from "../../../features/student-life/student-life-workspace";

const supportedModules = ["status-mahasiswa", "registrasi-akademik"] as const;

type SupportedModule = (typeof supportedModules)[number];

export default async function StudentLifeRoute({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!supportedModules.includes(module as SupportedModule)) notFound();
  return <ProtectedDashboard><StudentLifeWorkspace workspace={module as SupportedModule} /></ProtectedDashboard>;
}
