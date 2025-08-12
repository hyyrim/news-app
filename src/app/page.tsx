"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNews } from "@/hooks/useNews";
import { nytSections } from "@/constants/categories";
import NewsCard from "@/components/news/NewsCard";
import TopSlider from "@/components/news/TopSlider";
import AudioBar from "@/components/news/AudioBar";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import LoadingSpinner from "@/components/common/LoadingSpinner";

function PageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selected = searchParams.get("section") || "home";
  const { data, isLoading, error } = useNews(selected);
  const setQueue = useAudioQueue((s) => s.setQueue);

  // Tabs scroll fade state
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const update = () => {
      const canScroll = el.scrollWidth > el.clientWidth + 1;
      if (!canScroll) {
        setShowLeftFade(false);
        setShowRightFade(false);
        return;
      }
      const left = el.scrollLeft > 1;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
      setShowLeftFade(left);
      setShowRightFade(right);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [selected]);

  useEffect(() => {
    if (!data?.length) return;
    const items = data.map((item, idx) => ({
      id: `${idx}-${item.url}`,
      title: item.title,
      text: `${item.title}. ${item.abstract}`,
    }));
    setQueue(items);
  }, [data, setQueue]);

  const handleSelect = (section: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      <TopSlider />

      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur py-2 -mx-4 px-4">
        <div className="edge-fade-wrap">
          <div
            className={`edge-fade edge-fade-left ${
              showLeftFade ? "edge-fade-visible" : ""
            }`}
          />
          <div
            className={`edge-fade edge-fade-right ${
              showRightFade ? "edge-fade-visible" : ""
            }`}
          />
          <div
            ref={tabsRef}
            className="flex gap-2 overflow-x-auto scrollbar-none"
          >
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
        </div>
        <AudioBar />
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mt-6 border border-destructive/30 bg-destructive/5 text-destructive rounded-md p-3 text-sm">
          뉴스를 불러오는 데 실패했어요. 잠시 후 다시 시도해 주세요.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
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

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-6 py-20 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <PageInner />
    </Suspense>
  );
}
