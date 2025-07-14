const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET!;

export interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

export const fetchNewsFromNaver = async (
  query: string,
  display: number = 10,
  start: number = 1
): Promise<NewsItem[]> => {
  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.append("query", query);
  url.searchParams.append("display", display.toString());
  url.searchParams.append("start", start.toString());
  url.searchParams.append("sort", "date");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });

  if (!res.ok) {
    throw new Error(`Naver API error: ${res.statusText}`);
  }

  const data = await res.json();

  // 필요 없는 HTML 태그 제거
  const cleanedItems = data.items.map((item: NewsItem) => ({
    ...item,
    title: item.title.replace(/<[^>]+>/g, ""),
    description: item.description.replace(/<[^>]+>/g, ""),
  }));

  console.log(cleanedItems);
  return cleanedItems;
};
