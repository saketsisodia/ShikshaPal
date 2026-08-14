import { createFileRoute } from "@tanstack/react-router";

const VOICES = {
  anjali: "Kore",
  rajesh: "Charon",
} as const;

export const Route = createFileRoute("/api/speak")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI not configured", { status: 500 });

        const body = (await request.json()) as {
          text?: string;
          teacher?: keyof typeof VOICES;
        };
        const text = (body.text ?? "").slice(0, 2500).trim();
        if (!text) return new Response("Missing text", { status: 400 });
        const voiceName = VOICES[body.teacher ?? "anjali"] ?? VOICES.anjali;

        const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Say the following slowly and clearly like a kind Indian school teacher speaking Indian English to a child: ${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName } },
              },
            },
          }),
        });

        if (!res.ok) {
          const errorBody = await res.text().catch(() => "");
          return new Response(`Speech failed [${res.status}]: ${errorBody}`, {
            status: res.status,
          });
        }

        return new Response(res.body, {
          headers: { "Content-Type": "audio/wav" },
        });
      },
    },
  },
});
