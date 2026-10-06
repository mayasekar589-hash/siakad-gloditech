import type { Metadata } from "next";
import { RegistrationLanding } from "@/components/registration/registration-content";

export const metadata: Metadata = {
  title: "Pendaftaran",
  description: "Pilih jalur pendaftaran Poltektrans SDP Palembang yang sesuai dengan minat dan rencana karier Anda."
};

export default function RegistrationPage() {
  return <RegistrationLanding />;
}