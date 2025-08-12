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
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

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

    const handleEnded = () => next();
    const handleTime = () => setCurrent(audio.currentTime || 0);
    const handleLoaded = () => setDuration(audio.duration || 0);
    const handleError = () => {
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

  useEffect(() => {
    setCurrent(0);
    setDuration(0);
  }, [currentItem?.id]);

  useEffect(() => {
    let revokedUrl: string | null = null;
    const run = async () => {
      if (!currentItem) return;
      if (!isPlaying) return;
      setLoading(true);
      try {
        const url = await fetchTtsUrl(currentItem.text);
        revokedUrl = url;
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        await audioRef.current.play();
      } catch {
        pause();
        alert("오디오 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [currentIndex, currentItem, currentItem?.text, isPlaying, pause]);

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
            onClick={pause}
            aria-label="일시정지"
            disabled={loading}
          >
            <Pause className="size-4" />
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            onClick={play}
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
