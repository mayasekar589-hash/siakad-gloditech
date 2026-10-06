import type { Metadata } from "next";
import { DM_Serif_Display, Lora, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap"
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-lora",
  display: "swap"
});

export const metadata: Metadata = {
  title: "SiAkad Taruna | Poltektrans SDP Palembang",
  description: "Sistem Informasi Akademik Taruna Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${dmSerifDisplay.variable} ${lora.variable}`}>
      <body>{children}</body>
    </html>
  );
}