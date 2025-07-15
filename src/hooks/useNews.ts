import { useQuery } from "@tanstack/react-query";
import { NewsItem } from "../lib/types";

export const useNews = (query: string) => {
  return useQuery<NewsItem[]>({
    queryKey: ["news", query],
    queryFn: async () => {
      const res = await fetch(`/api/news?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5분 캐싱
  });
};
