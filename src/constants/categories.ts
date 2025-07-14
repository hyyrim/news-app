export const categories = [
  "기술",
  "경제",
  "환경",
  "스포츠",
  "문화",
  "건강",
] as const;
export type Category = (typeof categories)[number];
