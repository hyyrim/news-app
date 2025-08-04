export const nytSections = [
  "home",
  "world",
  "technology",
  "science",
  "arts",
  "us",
  "business",
  "sports",
  "health",
  "travel",
  "movies",
] as const;

export type NytSection = (typeof nytSections)[number];
