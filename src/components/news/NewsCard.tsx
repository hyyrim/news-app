// components/NewsCard.tsx
"use client";

import { useState } from "react";

interface Props {
  title: string;
  abstract: string;
  byline: string;
  image?: string | null;
  url: string;
}

export default function NewsCard({
  title,
  abstract,
  byline,
  image,
  url,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playTTS = async (text: string) => {
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ TTS 요청 실패:", res.status, errorText);
        return;
      }

      const arrayBuffer = await res.arrayBuffer();

      // 👇 arrayBuffer로부터 명확히 Blob 생성
      const audioBlob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      console.log("🎧 생성된 오디오 blob:", audioBlob);

      // 👉 URL 생성
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      // 🎵 사용자 이벤트 내에서 재생 (클릭 시 실행되어야 함)
      await audio.play();
    } catch (err) {
      console.error("🎧 TTS 재생 중 에러:", err);
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border p-4 rounded-md hover:shadow"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-48 object-cover rounded mb-3"
        />
      )}

      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-700">{abstract}</p>
      <p className="text-xs text-gray-500 mt-2">{byline}</p>

      <button
        onClick={(e) => {
          e.preventDefault();
          playTTS(title + " " + abstract);
        }}
        disabled={isPlaying}
        className="text-sm text-blue-600 hover:underline mt-2"
      >
        {isPlaying ? "재생 중..." : "▶ 요약 듣기"}
      </button>
    </a>
  );
}
