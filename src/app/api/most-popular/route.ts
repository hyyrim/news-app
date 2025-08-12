const NYT_API_KEY = process.env.NYT_API_KEY!;
const BASE_URL = "https://api.nytimes.com/svc/mostpopular/v2/viewed/1.json";

interface NytMostPopularItem {
  title?: string;
  abstract?: string;
  url?: string;
  byline?: string;
  media?: Array<{
    ["media-metadata"]?: Array<{ url?: string } | undefined>;
  }>;
}

export async function GET() {
  const url = `${BASE_URL}?api-key=${NYT_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok)
    return new Response("NYT Most Popular fetch error", { status: 500 });

  const data: { results?: NytMostPopularItem[] } = await res.json();
  const results = (data?.results ?? [])
    .filter((item) => !!item.title && !!item.abstract && !!item.url)
    .map((item) => {
      const firstMedia = item.media?.[0];
      const mediaMeta = firstMedia?.["media-metadata"] || [];
      const image = mediaMeta[mediaMeta.length - 1]?.url || null;
      return {
        title: item.title ?? "",
        abstract: item.abstract ?? "",
        url: item.url ?? "",
        byline: item.byline ?? "",
        image,
      };
    });

  return Response.json(results);
}
