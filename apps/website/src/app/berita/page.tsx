import type { Metadata } from "next";
import { NewsListing } from "@/components/news/news-listing";

export const metadata: Metadata = {
  title: "Kabar Institusi",
  description: "Ikuti kabar terbaru seputar kegiatan, pendidikan, prestasi, dan perkembangan Poltektrans SDP Palembang."
};

export default function NewsPage() {
  return <NewsListing />;
}