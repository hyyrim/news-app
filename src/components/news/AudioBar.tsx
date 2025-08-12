"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAudioQueue } from "@/hooks/useAudioQueue";
import { Button } from "@/components/ui/button";
import { SkipBack, SkipForward, Play, Pause } from "lucide-react";

async function fetchTtsUrl(text: string): Promise<string> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 4800) }),
  });
  if (!res.ok) {
    throw new Error("TTS 요청 실패");
  }
  const arrayBuffer = await res.arrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

export default function AudioBar() {
  const { queue, currentIndex, isPlaying, play, pause, next, prev } =
    useAudioQueue();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const userStartedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const lastItemIdRef = useRef<string | null>(null);

  const currentItem = queue[currentIndex];
  const remainingCount = useMemo(
    () => Math.max(queue.length - currentIndex - 1, 0),
    [queue.length, currentIndex]
  );
  const progressPct = useMemo(
    () => (duration > 0 ? Math.min((current / duration) * 100, 100) : 0),
    [current, duration]
  );

  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    const handleEnded = () => {
      audio.pause();
      next();
    };
    const handleTime = () => setCurrent(audio.currentTime || 0);
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleError = () => {
      audio.pause();
      pause();
      alert("오디오 재생 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.");
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("error", handleError);
    };
  }, [next, pause]);

  // 현재 아이템 변경 시: 캐시 확인 후 소스 설정, 재생 중이면 이어서 재생
  useEffect(() => {
    const loadForItem = async () => {
      if (!currentItem) return;
      const itemId = currentItem.id;
      const isNewItem = lastItemIdRef.current !== itemId;
      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;

      if (isNewItem) {
        setCurrent(0);
        setDuration(0);
        lastItemIdRef.current = itemId;
      }

      let url = urlCacheRef.current.get(itemId);
      // 재생 중이 아니거나 사용자 상호작용 이전이면 네트워크 요청을 하지 않음
      if (!url && !(isPlaying && userStartedRef.current)) {
        return;
      }

      if (!url) {
        setLoading(true);
        try {
          url = await fetchTtsUrl(currentItem.text);
          // 간단한 캐시 크기 제한(최대 6개)
          if (urlCacheRef.current.size >= 6) {
            const firstKey = urlCacheRef.current.keys().next().value as
              | string
              | undefined;
            if (firstKey) {
              const old = urlCacheRef.current.get(firstKey);
              if (old) URL.revokeObjectURL(old);
              urlCacheRef.current.delete(firstKey);
            }
          }
          urlCacheRef.current.set(itemId, url);
        } catch {
          pause();
          alert("오디오 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
          return;
        } finally {
          setLoading(false);
        }
      }

      if (url && audio.src !== url) {
        audio.src = url;
      }

      if (isPlaying && userStartedRef.current) {
        try {
          await audio.play();
        } catch {}
      }
    };

    loadForItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem, currentIndex]);

  // 재생/일시정지 토글: 사용자 상호작용 없으면 자동재생 방지
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const ensureAndPlay = async () => {
      if (!currentItem) return pause();
      const itemId = currentItem.id;
      let url = urlCacheRef.current.get(itemId);
      if (!url) {
        try {
          setLoading(true);
          url = await fetchTtsUrl(currentItem.text);
          // 캐시 크기 관리(최대 6개)
          if (urlCacheRef.current.size >= 6) {
            const firstKey = urlCacheRef.current.keys().next().value as
              | string
              | undefined;
            if (firstKey) {
              const old = urlCacheRef.current.get(firstKey);
              if (old) URL.revokeObjectURL(old);
              urlCacheRef.current.delete(firstKey);
            }
          }
          urlCacheRef.current.set(itemId, url);
        } catch {
          pause();
          alert("오디오 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
          return;
        } finally {
          setLoading(false);
        }
      }
      if (audio.src !== url) audio.src = url;
      audio.play().catch(() => pause());
    };

    if (isPlaying) {
      if (!userStartedRef.current) {
        // 사용자 제스처 전이면 자동재생 방지
        pause();
        return;
      }
      void ensureAndPlay();
    } else {
      audio.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const handlePause = () => {
    audioRef.current?.pause();
    pause();
  };

  const handlePlay = () => {
    userStartedRef.current = true;
    play();
  };

  if (!queue.length) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div
            className="truncate text-sm font-medium"
            title={currentItem?.title}
          >
            {currentItem ? currentItem.title : "No item"}
          </div>
          <div className="text-xs text-muted-foreground whitespace-nowrap">
            {remainingCount > 0 ? `${remainingCount} 남음` : "마지막 항목"}
          </div>
        </div>
        <div className="mt-1 select-none">
          <div className="h-2 w-full bg-muted rounded">
            <div
              className="h-2 bg-primary rounded"
              style={{ width: `${progressPct}%` }}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progressPct)}
              role="progressbar"
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{formatTime(current)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          aria-label="이전"
          disabled={loading || currentIndex === 0}
        >
          <SkipBack className="size-4" />
        </Button>
        {isPlaying ? (
          <Button
            variant="default"
            size="icon"
            onClick={handlePause}
            aria-label="일시정지"
            disabled={loading}
          >
            <Pause className="size-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={handlePlay}
            aria-label="재생"
            disabled={loading || !currentItem}
          >
            <Play className="size-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          aria-label="다음"
          disabled={loading || currentIndex >= queue.length - 1}
        >
          <SkipForward className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
