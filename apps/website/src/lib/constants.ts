import type { Announcement, ContactInfo, NavigationItem, ProgramStudy } from "@/types/content";

const officialSite = "https://poltektranssdp-palembang.ac.id";
export const publicNavigation: NavigationItem[] = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Tentang Kami", href: "/#tentang" },
  { label: "Akademik", href: "/#akademik" },
  { label: "Program Studi", href: "/#program-studi" },
  { label: "PMB", href: "/pmb" },
  { label: "Berita", href: "/berita" },
  { label: "Informasi", href: "/#informasi" }
];

export const programs: ProgramStudy[] = [
  {
    slug: "studi-nautika",
    name: "Studi Nautika",
    degree: "D-III",
    field: "Navigasi dan pelayaran",
    description: "Bidang pembelajaran nautika dan operasional pelayaran.",
    icon: "nautika",
    imageSrc: "/assets/program/nautika.jpg",
    imageAlt: "Taruna berlatih di atas kapal latih Poltektrans."
  },
  {
    slug: "studi-permesinan-kapal",
    name: "Studi Permesinan Kapal",
    degree: "D-III",
    field: "Permesinan dan sistem kapal",
    description: "Bidang pembelajaran permesinan serta sistem pendukung kapal.",
    icon: "mesin",
    imageSrc: "/assets/program/permesinan.jpg",
    imageAlt: "Ruang praktik mesin kapal dengan peralatan permesinan maritim."
  },
  {
    slug: "mtp-d",
    name: "MTPD",
    degree: "D-III",
    field: "Transportasi perairan daratan",
    description: "Bidang pembelajaran manajemen transportasi sungai, danau, dan penyeberangan.",
    icon: "mtp",
    imageSrc: "/assets/program/mtpd.jpg",
    imageAlt: "Kapal dan dermaga untuk transportasi perairan daratan."
  }
];

export const announcements: Announcement[] = [
  {
    category: "Informasi PMB",
    date: "24 September 2026",
    title: "Seleksi SIPENCATAR jalur mandiri Gelombang IV Tahun Akademik 2026/2027",
    href: `${officialSite}/2026/09/pengumuman-202609241036/`,
    external: true
  },
  {
    category: "Pengumuman",
    date: "28 Agustus 2026",
    title: "Informasi daftar ulang SIPENCATAR jalur mandiri Gelombang III",
    href: `${officialSite}/2026/08/pengumuman-tentang-pelaksanaan-daftar-ulang-calon-taruna-taruni-jalur-non-pola-pembibitan-mandiri-gelombang-iii-di-politeknik-transportasi-sungai-danau-dan-penyeberangan-palembang-tahun-akademik-202/`,
    external: true
  },
  {
    category: "Informasi Akademik",
    date: "Kanal resmi",
    title: "Akreditasi, e-library, dan e-learning",
    href: `${officialSite}/program-studi/`,
    external: true
  },
  {
    category: "Agenda",
    date: "Pembaruan berkala",
    title: "Agenda dan informasi kegiatan akan mengikuti publikasi institusi",
    href: `${officialSite}/berita/`,
    external: true
  }
];

export const admissionOverview = {
  label: "Penerimaan mahasiswa baru",
  status: "Informasi mengikuti pengumuman resmi",
  description: "Jalur, jadwal, dan persyaratan penerimaan dapat berubah. Gunakan pengumuman resmi Poltektrans SDP Palembang untuk memperoleh informasi terbaru.",
  officialUrl: "https://sipencatar.kemenhub.go.id/"
};

export const contactInfo: ContactInfo = {
  address: "Jl. Sabar Jaya No. 116, Palembang, Sumatera Selatan",
  phone: "+62 711 7537264",
  email: null
};

export const imageCredits = [
  { label: "Foto ferry M.V. Kasturi — Subhrajyoti07, CC BY-SA 4.0", href: "https://commons.wikimedia.org/wiki/File:M.V.Kasturi,_a_ferry_boat_sailing_on_Hooghly_river,_image_captured_from_Nimtala_burning_ghat.jpg" },
  { label: "Foto kapal layar latih — Indian Navy, Government Open Data License – India", href: "https://commons.wikimedia.org/wiki/File:Mexican_Sail_Training_Ship_Cuauhtemoc.jpg" },
  { label: "Foto taruna di kapal — Indian Navy, Government Open Data License – India", href: "https://commons.wikimedia.org/wiki/File:VISIT_OF_SRI_LANKAN_NCC_CADETS_ONBOARD_AND_INTERACTION_WITH_INDIAN_NCC_CADETS_1.jpg" }
];

export const institution = {
  name: "Politeknik Transportasi Sungai, Danau dan Penyeberangan Palembang",
  shortName: "Poltektrans SDP Palembang",
  officialUrl: officialSite,
  logoPath: "/assets/logo-poltektrans.png",
  heroImage: "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d5/M.V.Kasturi%2C_a_ferry_boat_sailing_on_Hooghly_river%2C_image_captured_from_Nimtala_burning_ghat.jpg/1280px-M.V.Kasturi%2C_a_ferry_boat_sailing_on_Hooghly_river%2C_image_captured_from_Nimtala_burning_ghat.jpg",
  learningImage: "https://upload.wikimedia.org/wikipedia/commons/7/7d/VISIT_OF_SRI_LANKAN_NCC_CADETS_ONBOARD_AND_INTERACTION_WITH_INDIAN_NCC_CADETS_1.jpg"
};
