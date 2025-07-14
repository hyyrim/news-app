import { useQuery } from "@tanstack/react-query";
import { fetchNewsFromNaver } from "@/lib/api";

export function useNews(category: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["news", category],
    queryFn: () => fetchNewsFromNaver(category),
    staleTime: 1000 * 60 * 3, // 3분 캐싱
  });

  return { data, isLoading };
}
