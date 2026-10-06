export interface TrainingCategory {
  id: string;
  name: string;
  slug: string;
  matchText: string;
}

export const trainingCategories: readonly TrainingCategory[] = [
  {
    id: "diklat-peningkatan",
    name: "Diklat Peningkatan",
    slug: "peningkatan",
    matchText: "peningkatan"
  },
  {
    id: "diklat-keterampilan",
    name: "Diklat Keterampilan",
    slug: "keterampilan",
    matchText: "keterampilan"
  }
];

export function getTrainingCategory(slug: string) {
  return trainingCategories.find((category) => category.slug === slug);
}