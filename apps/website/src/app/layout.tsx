import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFrame } from "@/components/layout/site-frame";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"),
  title: {
    default: "Poltektrans SDP Palembang",
    template: "%s | Poltektrans SDP Palembang"
  },
  description:
    "Informasi pendidikan vokasi transportasi sungai, danau, dan penyeberangan di Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const hasOfficialLogo = existsSync(join(process.cwd(), "public", "assets", "logo-poltektrans.png"));

  return (
    <html lang="id">
      <body>
        <SiteFrame hasOfficialLogo={hasOfficialLogo}>{children}</SiteFrame>
      </body>
    </html>
  );
}
