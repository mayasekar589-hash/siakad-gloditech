import type { Metadata } from "next";
import { TrainingCatalogPage } from "@/components/registration/training-catalog";

export const metadata: Metadata = {
  title: "Program Diklat",
  description: "Pilih program pendidikan dan pelatihan yang sesuai dengan kebutuhan Anda."
};

export default function TrainingCatalogRoute() {
  return <TrainingCatalogPage />;
}