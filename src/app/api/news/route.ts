import { NextRequest } from "next/server";

const NYT_API_KEY = process.env.NYT_API_KEY!;
const BASE_URL = "https://api.nytimes.com/svc/topstories/v2";

export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section") ?? "home";

  const url = `${BASE_URL}/${section}.json?api-key=${NYT_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    return new Response("NYT API fetch error", { status: 500 });
  }

  const data = await res.json();

  // 1. 유효한 뉴스만 필터링
  const validItems = data.results.filter((item: any) => {
    return (
      item.title?.trim() &&
      item.abstract?.trim() &&
      item.url?.trim() &&
      item.multimedia?.[0]?.url
    );
  });

  // 2. 정제된 데이터 매핑
  const items = validItems.map((item: any) => ({
    title: item.title,
    abstract: item.abstract,
    byline: item.byline,
    url: item.url,
    published_date: item.published_date,
    image: item.multimedia?.[0]?.url,
  }));

  return Response.json(items);
}
