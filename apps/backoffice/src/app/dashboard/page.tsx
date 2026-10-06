import { ProtectedDashboard } from "../../features/auth/protected-dashboard";

export default function BackOfficeDashboardRoute() {
  return <ProtectedDashboard />;
}
