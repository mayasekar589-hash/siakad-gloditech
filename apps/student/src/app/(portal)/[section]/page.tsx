import { notFound } from "next/navigation";
import { PortalSectionView } from "../../../features/portal/section-view";

const validSections = ["krs", "jadwal", "nilai", "presensi", "kalender", "tagihan", "dokumen", "pengumuman", "profil", "pengaturan"] as const;

export function generateStaticParams() {
  return validSections.map((section) => ({ section }));
}

export default async function PortalSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!validSections.some((item) => item === section)) notFound();
  return <PortalSectionView section={section as (typeof validSections)[number]} />;
}