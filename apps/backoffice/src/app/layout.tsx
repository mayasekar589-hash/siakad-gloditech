import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "SiAkad Back Office | Poltektrans SDP Palembang",
  description: "Portal akses layanan akademik Back Office Poltektrans SDP Palembang."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="backoffice-body">{children}</body>
    </html>
  );
}