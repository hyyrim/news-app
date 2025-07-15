import { decode } from "html-entities";
import { NextRequest } from "next/server";

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID!;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const query = searchParams.get("query") ?? "";
  const display = searchParams.get("display") ?? "10";
  const start = searchParams.get("start") ?? "1";

  const url = new URL("https://openapi.naver.com/v1/search/news.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", display);
  url.searchParams.set("start", start);
  url.searchParams.set("sort", "date");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });

  const data = await res.json();

  const cleanedItems = data.items.map((item: any) => ({
    ...item,
    title: decode(item.title.replace(/<[^>]+>/g, "")),
    description: decode(item.description.replace(/<[^>]+>/g, "")),
  }));

  return Response.json(cleanedItems);
}
