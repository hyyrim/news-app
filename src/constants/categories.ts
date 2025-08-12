export const nytSections = [
  "Home",
  "World",
  "Technology",
  "Science",
  "Arts",
  "US",
  "Business",
  "Sports",
  "Health",
  "Travel",
  "Movies",
] as const;

export type NytSection = (typeof nytSections)[number];
