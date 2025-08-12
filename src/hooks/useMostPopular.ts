import { useQuery } from "@tanstack/react-query";
import { NewsItem } from "@/lib/types";

export function useMostPopular() {
  return useQuery<NewsItem[]>({
    queryKey: ["nyt-most-popular"],
    queryFn: async () => {
      const res = await fetch("/api/most-popular");
      if (!res.ok) throw new Error("Failed to fetch most popular");
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });
}
