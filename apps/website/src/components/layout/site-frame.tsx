"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

export function SiteFrame({ hasOfficialLogo, children }: { hasOfficialLogo: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const isRegistrationRoute = pathname === "/pendaftaran" || pathname.startsWith("/pendaftaran/");

  return (
    <>
      <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
      <SiteHeader hasOfficialLogo={hasOfficialLogo} />
      <main id="main-content">{children}</main>
      {!isRegistrationRoute ? <SiteFooter hasOfficialLogo={hasOfficialLogo} /> : null}
    </>
  );
}