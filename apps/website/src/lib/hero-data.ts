export type HeroSlide = {
  id: string;
  image: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: "transport-vokasi",
    image: "/assets/hero/hero-04.webp",
    imageAlt: "Taruna mengenal praktik di atas kapal latih AE 2 Poltektrans SDP Palembang.",
    eyebrow: "POLITEKNIK TRANSPORTASI SUNGAI, DANAU DAN PENYEBERANGAN PALEMBANG",
    title: "Membentuk Generasi\nTransportasi yang Profesional",
    description: "Pendidikan vokasi yang membentuk kompetensi, karakter, dan kesiapan profesional di bidang transportasi sungai, danau, dan penyeberangan."
  },
  {
    id: "kompetensi-perairan",
    image: "/assets/hero/hero-05.webp",
    imageAlt: "Taruna dan taruni berfoto bersama di gerbang Poltektrans SDP Palembang.",
    eyebrow: "POLTEKTRANS SDP PALEMBANG",
    title: "Temukan Langkah Anda\ndi Dunia Transportasi",
    description: "Jelajahi pendidikan vokasi untuk transportasi sungai, danau, dan penyeberangan."
  },
  {
    id: "karakter-taruna",
    image: "/assets/hero/hero-01.webp",
    imageAlt: "Taruna, taruni, dan civitas institusi dalam kegiatan kebersamaan kampus.",
    eyebrow: "KARAKTER DAN KEBERSAMAAN",
    title: "Bertumbuh dengan Disiplin\ndan Tanggung Jawab",
    description: "Lingkungan pendidikan yang mendorong pembentukan karakter, rasa tanggung jawab, dan semangat melayani."
  },
  {
    id: "praktik-kapal",
    image: "/assets/hero/hero-03.webp",
    imageAlt: "Civitas Poltektrans SDP Palembang dalam kegiatan peringatan kampus.",
    eyebrow: "KEHIDUPAN KAMPUS",
    title: "Belajar, Berkarya,\nMelayani Masyarakat",
    description: "Pembelajaran vokasi mempertemukan pengetahuan dengan pengenalan nyata terhadap lingkungan kerja transportasi."
  },
  {
    id: "wawasan-transportasi",
    image: "/assets/hero/hero-02.webp",
    imageAlt: "Forum tentang inovasi keselamatan dan efisiensi operasi kapal penyeberangan.",
    eyebrow: "WAWASAN TRANSPORTASI",
    title: "Memahami Perubahan\nDunia Transportasi",
    description: "Ikuti informasi, kegiatan, dan pengembangan pengetahuan di bidang transportasi perairan."
  }
];
