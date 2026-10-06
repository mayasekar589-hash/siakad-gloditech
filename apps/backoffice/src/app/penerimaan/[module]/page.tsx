import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { ProtectedDashboard } from "../../../features/auth/protected-dashboard";
import { AdmissionsModulePage } from "../../../features/admissions/admissions-module-page";
import { AdmissionsOperationsPage } from "../../../features/admissions/admissions-operations-page";
import { AdmissionPeriodsPage } from "../../../features/admissions/admission-periods-page";

const validModules = ["periode", "pendaftar", "seleksi", "verifikasi-dokumen", "pembayaran", "kelulusan-seleksi", "registrasi-ulang"] as const;

export default async function AdmissionsModuleRoute({ params, searchParams }: { params: Promise<{ module: string }>; searchParams?: Promise<{ tab?: string }> }) {
  const { module } = await params;
  const { tab } = await searchParams ?? {};

  const legacyRoutes: Record<string, string> = {
    "verifikasi-dokumen": "/penerimaan/pendaftar?tab=dokumen",
    pembayaran: "/penerimaan/pendaftar?tab=pembayaran",
    "kelulusan-seleksi": "/penerimaan/seleksi?tab=hasil-akhir"
  };
  if (legacyRoutes[module]) redirect(legacyRoutes[module]);
  if (!validModules.includes(module as (typeof validModules)[number])) notFound();

  if (module === "periode") {
    return <ProtectedDashboard><AdmissionPeriodsPage /></ProtectedDashboard>;
  }

  if (["pendaftar", "seleksi", "registrasi-ulang"].includes(module)) {
    return <ProtectedDashboard><AdmissionsOperationsPage initialTab={tab} workspace={module as "pendaftar" | "seleksi" | "registrasi-ulang"} /></ProtectedDashboard>;
  }

  return <ProtectedDashboard><AdmissionsModulePage moduleId={module} /></ProtectedDashboard>;
}
