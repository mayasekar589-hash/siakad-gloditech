import type { RegistrationCategory, RegistrationType } from "@/features/registration/types";

export interface AdmissionRouteOption {
  id: string;
  slug: string;
  category: RegistrationCategory;
  registrationType: RegistrationType;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  accent: "navy" | "teal";
}

export const sipencatarRoutes: readonly AdmissionRouteOption[] = [
  {
    id: "pola-pembibitan",
    slug: "pola-pembibitan",
    category: "SIPENCATAR",
    registrationType: "POLA_PEMBIBITAN",
    title: "Pola Pembibitan",
    description: "Penerimaan calon taruna/taruni melalui jalur pola pembibitan Kementerian Perhubungan.",
    imageSrc: "/assets/news/pelantikan-angkatan-36.png",
    imageAlt: "Taruna Poltektrans mengikuti kegiatan pelantikan di lingkungan kampus.",
    accent: "navy"
  },
  {
    id: "non-pola-pembibitan",
    slug: "non-pola-pembibitan",
    category: "SIPENCATAR",
    registrationType: "NON_POLA_PEMBIBITAN",
    title: "Non Pola Pembibitan",
    description: "Penerimaan calon taruna/taruni melalui jalur mandiri/non pola pembibitan.",
    imageSrc: "/assets/admissions/taruna-kapal.jpg",
    imageAlt: "Taruna Poltektrans menjalani praktik di atas kapal.",
    accent: "teal"
  }
];
