"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
}

export default function AudioTTSPlayer({ text }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
    };
  }, []);

  const handlePlay = async () => {
    if (!text?.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 4800) }),
      });
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      await audioRef.current.play();
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    audioRef.current?.pause();
  };

  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={handlePlay}
        disabled={loading}
        className="px-3 py-1 border rounded"
      >
        {loading ? "생성 중..." : "재생"}
      </button>
      <button onClick={handlePause} className="px-3 py-1 border rounded">
        일시정지
      </button>
    </div>
  );
}
