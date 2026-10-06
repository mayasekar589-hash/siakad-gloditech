"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { activeAuthProvider } from "./auth-provider";
import type { BackOfficeSession } from "./auth-provider";
import { DashboardContent } from "../dashboard/components/dashboard-content";
import { DashboardShell } from "../dashboard/components/dashboard-shell";

export function ProtectedDashboard({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<BackOfficeSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    void activeAuthProvider.getSession().then((currentSession) => {
      if (!active) return;
      if (!currentSession?.authenticated) {
        router.replace("/login");
        return;
      }
      setSession(currentSession);
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, [router]);

  async function logout() {
    await activeAuthProvider.logout();
    router.replace("/login");
  }

  if (checkingSession || !session) {
    return <main aria-live="polite" className="dashboard-loading">Memeriksa sesi demo...</main>;
  }

  return <DashboardShell onLogout={() => void logout()} session={session}>{children ?? <DashboardContent />}</DashboardShell>;
}
