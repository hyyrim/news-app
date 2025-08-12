"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function ArticleInner() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    title: string;
    byline?: string;
    content: string;
  } | null>(null);

  const textForTTS = useMemo(() => {
    if (!data) return "";
    return `${data.title}. ${data.content}`.slice(0, 4800);
  }, [data]);

  useEffect(() => {
    const run = async () => {
      if (!targetUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/scrape?url=${encodeURIComponent(targetUrl)}`
        );
        if (!res.ok) throw new Error("스크래핑 실패");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "에러";
        setError(message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [targetUrl]);

  const playTTS = async () => {
    if (!textForTTS) return;
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textForTTS }),
      });
      if (!res.ok) throw new Error("TTS 실패");
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
    } catch {
      alert("오디오 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  if (!targetUrl) return <div className="p-6">잘못된 접근입니다.</div>;
  if (loading)
    return (
      <div className="p-6 py-20 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  if (error) return <div className="p-6">에러: {error}</div>;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <div className="flex items-start gap-3">
        <button onClick={playTTS} className="px-3 py-2 border rounded">
          전체 듣기
        </button>
      </div>

      <h1 className="text-2xl font-bold mt-4">{data?.title}</h1>
      {data?.byline && <p className="text-gray-600 mt-1">{data.byline}</p>}

      <article className="prose mt-6 whitespace-pre-wrap">
        {data?.content}
      </article>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 py-20 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <ArticleInner />
    </Suspense>
  );
}
