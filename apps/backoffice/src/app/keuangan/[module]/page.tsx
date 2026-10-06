import { notFound } from "next/navigation";
import { ProtectedDashboard } from "../../../features/auth/protected-dashboard";
import { FinanceModulePage } from "../../../features/finance/finance-module-page";

const validModules = ["tagihan", "pembayaran", "tarif-akademik", "beasiswa", "rekonsiliasi"] as const;

export default async function FinanceModuleRoute({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  if (!validModules.includes(module as (typeof validModules)[number])) notFound();

  return <ProtectedDashboard><FinanceModulePage moduleId={module as (typeof validModules)[number]} /></ProtectedDashboard>;
}