import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

function extractTextFromCheerio($: cheerio.CheerioAPI): {
  title: string;
  byline?: string;
  paragraphs: string[];
} {
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const docTitle = $("title").first().text().trim();
  const title = (ogTitle || docTitle || "").trim();

  const byline =
    $(
      'meta[name="byl"], meta[name="author"], .byline, [itemprop="author"], [rel="author"]'
    )
      .first()
      .text()
      .trim() ||
    $('meta[property="article:author"]').attr("content") ||
    undefined;

  $("script, style, noscript, iframe").remove();

  const containers = [
    "article",
    "main",
    "#story, #story-body, #main-story, #content",
    ".story, .article, .article-body, .entry-content, .post-content, .l-container, .content__article-body",
  ];

  const scopeCandidates = containers.map((selector) => $(selector).first());
  const scope = scopeCandidates.find((c) => c.length) ?? $("body");

  const paragraphs: string[] = [];
  scope.find("p").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text && text.length > 20) paragraphs.push(text);
  });

  if (paragraphs.length < 3) {
    scope.find("li, h2, h3").each((_, el) => {
      const text = $(el).text().replace(/\s+/g, " ").trim();
      if (text && text.length > 20) paragraphs.push(text);
    });
  }

  return { title, byline, paragraphs };
}

function containsProxyWarning(text: string): boolean {
  const lowered = text.toLowerCase();
  return (
    lowered.includes("warning: target url returned error") ||
    lowered.includes("403: forbidden") ||
    lowered.includes("maybe requiring captcha")
  );
}

async function fetchViaReadabilityProxy(targetUrl: string) {
  const attempts = [
    `https://r.jina.ai/${targetUrl}`,
    `https://r.jina.ai/http://${new URL(targetUrl).host}${
      new URL(targetUrl).pathname
    }${new URL(targetUrl).search}`,
  ];

  for (const proxyUrl of attempts) {
    const res = await fetch(proxyUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9,ko;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) continue;
    const text = await res.text();
    if (!text || containsProxyWarning(text)) continue;

    const paragraphs = text
      .split(/\n{2,}|\r\n\r\n|\n•\s|•\s/)
      .map((s) => s.replace(/^•\s*/, "").trim())
      .filter((s) => s.length > 0 && s.length > 20);
    if (paragraphs.length > 0) {
      return { title: "", byline: undefined, paragraphs } as const;
    }
  }
  return null;
}

function normalizeUrlForDomain(input: string): string | null {
  try {
    const u = new URL(input);
    if (u.hostname.endsWith("nytimes.com")) {
      u.protocol = "https:";
      if (!u.hostname.startsWith("www.")) {
        u.hostname = `www.${u.hostname}`;
      }
      return u.toString();
    }
    return u.toString();
  } catch {
    return null;
  }
}

function getAmpCandidates(url: string): string[] {
  try {
    const u = new URL(url);
    const candidates: string[] = [];
    const ampQuery = new URL(u.toString());
    ampQuery.searchParams.set("outputType", "amp");
    candidates.push(ampQuery.toString());

    if (u.pathname.endsWith(".html")) {
      const ampPath = u.pathname.replace(/\.html$/, "/amp.html");
      const ampUrl = new URL(u.toString());
      ampUrl.pathname = ampPath;
      candidates.push(ampUrl.toString());
    }
    return candidates;
  } catch {
    return [];
  }
}

function applyMozillaReadability(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article || !article.textContent) return null;
  const paragraphs = article.textContent
    .split(/\n{2,}|\r\n\r\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  if (paragraphs.length === 0) return null;
  return { title: article.title ?? "", paragraphs };
}

export async function GET(req: NextRequest) {
  const targetUrlRaw = req.nextUrl.searchParams.get("url");
  const forceProxy =
    req.nextUrl.searchParams.get("proxy") === "1" ||
    req.nextUrl.searchParams.get("forceProxy") === "1";
  if (!targetUrlRaw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const normalizedUrl = normalizeUrlForDomain(targetUrlRaw);
  if (!normalizedUrl) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  try {
    const urlObj = new URL(normalizedUrl);
    const isNyTimes = urlObj.hostname.endsWith("nytimes.com");

    if (forceProxy || isNyTimes) {
      const proxyData = await fetchViaReadabilityProxy(normalizedUrl);
      if (proxyData && proxyData.paragraphs.length > 0) {
        return NextResponse.json({
          title: proxyData.title,
          byline: proxyData.byline,
          paragraphs: proxyData.paragraphs,
          content: proxyData.paragraphs.join("\n\n"),
          sourceUrl: normalizedUrl,
          via: "proxy",
        });
      }
    }

    const tryFetchAndExtract = async (urlToFetch: string) => {
      const res = await fetch(urlToFetch, {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.9,ko;q=0.8",
          referer: urlToFetch,
        },
        cache: "no-store",
      });

      if (!res.ok) return null;
      const html = await res.text();

      const readability = applyMozillaReadability(html, urlToFetch);
      if (readability && readability.paragraphs.length >= 3) {
        return {
          title: readability.title,
          byline: undefined,
          paragraphs: readability.paragraphs,
        };
      }

      const $ = cheerio.load(html);

      let title =
        $('meta[property="og:title"]').attr("content") ||
        $("title").first().text().trim();
      let byline = $('meta[name="author"]').attr("content") || undefined;
      let paragraphs: string[] = [];

      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const json = JSON.parse($(el).text());
          const nodes = Array.isArray(json) ? json : [json];
          for (const node of nodes) {
            if (
              node &&
              (node["@type"] === "NewsArticle" || node.type === "NewsArticle")
            ) {
              if (typeof node.headline === "string" && !title)
                title = node.headline;
              if (typeof node.articleBody === "string" && !paragraphs.length) {
                paragraphs = node.articleBody
                  .split(/\n{2,}|\r\n\r\n/)
                  .map((s: string) => s.trim())
                  .filter((s: string) => s.length > 20);
              }
            }
          }
        } catch {}
      });

      if (!paragraphs.length) {
        const extracted = extractTextFromCheerio($);
        title = extracted.title || title;
        byline = extracted.byline || byline;
        paragraphs = extracted.paragraphs;
      }

      if (!paragraphs.length) return null;
      return { title, byline, paragraphs };
    };

    let extracted = await tryFetchAndExtract(normalizedUrl);

    if (!extracted) {
      const ampCandidates = getAmpCandidates(normalizedUrl);
      for (const ampUrl of ampCandidates) {
        extracted = await tryFetchAndExtract(ampUrl);
        if (extracted) break;
      }
    }

    if (!extracted) {
      const fallback = await fetchViaReadabilityProxy(normalizedUrl);
      if (fallback) {
        extracted = {
          title: fallback.title,
          byline: fallback.byline,
          paragraphs: fallback.paragraphs,
        };
      }
    }

    if (!extracted) {
      return NextResponse.json(
        { error: "No content extracted" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      title: extracted.title,
      byline: extracted.byline,
      paragraphs: extracted.paragraphs,
      content: extracted.paragraphs.join("\n\n"),
      sourceUrl: normalizedUrl,
      via: "origin-amp-or-proxy",
    });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}
