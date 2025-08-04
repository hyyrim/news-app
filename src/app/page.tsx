"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import { nytSections } from "@/constants/categories";
import NewsCard from "@/components/news/NewsCard";

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selected = searchParams.get("section") || "home";
  const { data, isLoading } = useNews(selected);

  const handleSelect = (section: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const playTTS = async (text: string) => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const blob = await res.blob();
    console.log("▶️ blob size:", blob.size);
    console.log("▶️ blob type:", blob.type);

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.play().catch((err) => {
      console.error("🎧 오디오 재생 실패:", err);
    });
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {nytSections.map((section) => (
          <button
            key={section}
            onClick={() => handleSelect(section)}
            className={`px-4 py-2 rounded-full border text-sm 
              ${
                selected === section
                  ? "bg-black text-white"
                  : "bg-white text-gray-700"
              }`}
          >
            {section}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p>로딩 중...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {data?.map((item) => (
            <NewsCard
              key={item.url}
              title={item.title}
              abstract={item.abstract}
              byline={item.byline}
              image={item.image}
              url={item.url}
            />
          ))}
        </div>
      )}
    </div>
  );
}
