import { useQuery } from "@tanstack/react-query";
import { NewsItem } from "@/lib/types";

export const useNews = (section: string) => {
  return useQuery<NewsItem[]>({
    queryKey: ["nyt-news", section],
    queryFn: async () => {
      const res = await fetch(`/api/news?section=${section}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
};
