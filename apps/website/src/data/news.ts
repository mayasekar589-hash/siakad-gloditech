export type NewsCategory =
  | "Kehidupan Kampus"
  | "Akademik"
  | "Prestasi"
  | "Informasi Institusi"
  | "Kegiatan"
  | "Agenda"
  | "Pengumuman";

export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  category: NewsCategory;
  date: string;
  excerpt: string;
  image: string;
  imageAlt: string;
  content?: string[];
  sourceName: string;
  sourceUrl?: string;
};

export const newsArticles: NewsArticle[] = [
  {
    id: "pelantikan-angkatan-36",
    slug: "pelantikan-angkatan-36-dan-pertemuan-hangat-keluarga",
    title: "Pelantikan Angkatan 36 dan pertemuan hangat keluarga",
    category: "Kehidupan Kampus",
    date: "16 Desember 2025",
    excerpt: "Poltektrans SDP Palembang membagikan kabar pelantikan Angkatan 36 dan pertemuan keluarga dalam suasana kebersamaan.",
    image: "/assets/news/pelantikan-angkatan-36.png",
    imageAlt: "Dokumentasi resmi Pelantikan Angkatan 36 Poltektrans SDP Palembang.",
    sourceName: "Poltektrans SDP Palembang",
    sourceUrl: "https://poltektranssdp-palembang.ac.id/2025/12/momen-spesial-di-poltektrans-sdp-palembang-pelantikan-angkatan-36-dan-pertemuan-hangat-keluarga/"
  },
  {
    id: "casn-kemenhub-134-lulusan",
    slug: "134-lulusan-casn-kementerian-perhubungan",
    title: "134 lulusan dilantik sebagai CASN Kementerian Perhubungan",
    category: "Informasi Institusi",
    date: "3 Desember 2025",
    excerpt: "Kabar resmi mengenai 134 lulusan Poltektrans SDP Palembang yang dilantik sebagai CASN Kementerian Perhubungan.",
    image: "/assets/news/casn-kemenhub.png",
    imageAlt: "Thumbnail resmi berita pelantikan lulusan Poltektrans sebagai CASN Kementerian Perhubungan.",
    sourceName: "Poltektrans SDP Palembang",
    sourceUrl: "https://poltektranssdp-palembang.ac.id/2025/12/resmi-dilantik-134-lulusan-poltektrans-sdp-palembang-siap-perkuat-konektivitas-nasional-sebagai-casn-kemenhub/"
  },
  {
    id: "bon-voyage-perwira-siswa",
    slug: "bon-voyage-perwira-siswa-diklat-tingkat-iii",
    title: "Bon Voyage bagi Perwira Siswa Diklat Peningkatan Tingkat III",
    category: "Kegiatan",
    date: "25 November 2025",
    excerpt: "Kabar kegiatan Bon Voyage Perwira Siswa Diklat Peningkatan Tingkat III yang dimuat pada kanal resmi institusi.",
    image: "/assets/news/bon-voyage.png",
    imageAlt: "Dokumentasi resmi kegiatan Bon Voyage Perwira Siswa Poltektrans SDP Palembang.",
    sourceName: "Poltektrans SDP Palembang",
    sourceUrl: "https://poltektranssdp-palembang.ac.id/2025/11/perkuat-profesionalisme-pelaut-politeknik-transportasi-sdp-palembang-gelar-acara-bon-voyage-perwira-siswa-diklat-peningkatan-tingkat-iii-angkatan-v/"
  }
];

export const newsCategories: Array<"Semua" | NewsCategory> = [
  "Semua",
  "Kehidupan Kampus",
  "Akademik",
  "Prestasi",
  "Informasi Institusi",
  "Kegiatan",
  "Pengumuman"
];