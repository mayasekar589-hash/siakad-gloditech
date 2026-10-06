export type NavigationItem = {
  label: string;
  href: string;
};

export type ProgramStudy = {
  slug: string;
  name: string;
  degree: string;
  field: string;
  description: string;
  icon: "nautika" | "mesin" | "mtp";
  imageSrc: string;
  imageAlt: string;
};

export type NewsArticle = {
  category: string;
  date: string;
  title: string;
  excerpt: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  imageCredit: string;
  imageCreditHref: string;
  imageLicense: string;
};

export type Announcement = {
  category: "Pengumuman" | "Agenda" | "Informasi Akademik" | "Informasi PMB";
  date: string;
  title: string;
  href: string;
  external?: boolean;
};

export type ContactInfo = {
  address: string;
  phone: string;
  email: string | null;
};
