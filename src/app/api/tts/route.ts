import { NextResponse } from "next/server";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function POST(req: Request) {
  const { text } = await req.json();

  try {
    const audio = await client.textToSpeech.convert("EXAVITQu4vr4xnSDxMaL", {
      text,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    return new Response(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    console.error("TTS API 오류:", err);
    return NextResponse.json({ error: "TTS 실패" }, { status: 500 });
  }
}
