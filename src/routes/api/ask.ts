import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const AskInput = z.object({
  question: z.string().max(2000),
  grade: z.number().int().min(1).max(10),
  teacher: z.enum(["anjali", "rajesh"]),
  studentName: z.string().max(40).optional(),
  imageDataUrl: z.string().optional(),
});

const TEACHERS = {
  anjali: "Anjali Ma'am, a warm, encouraging Indian school teacher",
  rajesh: "Rajesh Sir, a friendly, patient Indian school teacher",
} as const;

export type AskAnswer = {
  intro: string;
  explanation: string;
  example: string;
  steps: string[];
};

export const Route = createFileRoute("/api/ask")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI is not configured yet.", { status: 500 });

        const parsed = AskInput.safeParse(await request.json());
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const data = parsed.data;

        if (!data.question.trim() && !data.imageDataUrl) {
          return new Response("Please type a question or upload a picture.", { status: 400 });
        }

        const name = (data.studentName ?? "").trim().slice(0, 30);
        const nameLine = name
          ? `The student's name is ${name}. The "intro" MUST begin by greeting them by name, for example "Namaste ${name} beta!". Use the name once more later if it feels natural, but do not overuse it.`
          : `You do not know the student's name, so address them warmly as "beta".`;

        const system = `You are ${TEACHERS[data.teacher]} teaching an Indian student in Class ${data.grade} (CBSE/NCERT style).
Explain in very simple English suited to Class ${data.grade}. Use short sentences and everyday Indian examples (cricket, chapati, auto-rickshaw, school bus, mangoes).
${nameLine}
Never use difficult words without explaining them. Be encouraging.
Reply ONLY with a JSON object of this exact shape and nothing else:
{"intro": "one friendly sentence naming the topic", "explanation": "2-4 short simple sentences", "example": "one everyday real-life example, 2-3 sentences", "steps": ["3 to 5 very short steps or key points"]}`;

        const userContent: Array<Record<string, unknown>> = [
          {
            type: "text",
            text:
              data.question.trim() ||
              "Please explain what is shown in this picture from my textbook.",
          },
        ];
        if (data.imageDataUrl) {
          userContent.push({ type: "image_url", image_url: { url: data.imageDataUrl } });
        }

        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: system },
              { role: "user", content: userContent },
            ],
          }),
        });

        if (res.status === 429)
          return new Response("Too many questions right now. Please try again in a minute.", { status: 429 });
        if (res.status === 402)
          return new Response("AI credits are over. Please top up to keep learning.", { status: 402 });
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error(`Ask failed [${res.status}]: ${body}`);
          return new Response("Teacher could not answer right now. Please try again.", { status: 502 });
        }

        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const raw = json.choices?.[0]?.message?.content ?? "";
        const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

        let answer: AskAnswer;
        try {
          const p = JSON.parse(cleaned) as Partial<AskAnswer>;
          answer = {
            intro: p.intro ?? "Let's understand this together!",
            explanation: p.explanation ?? cleaned,
            example: p.example ?? "",
            steps: Array.isArray(p.steps) ? p.steps.slice(0, 6) : [],
          };
        } catch {
          answer = {
            intro: "Let's understand this together!",
            explanation: cleaned || "Sorry, I could not explain that. Please ask again.",
            example: "",
            steps: [],
          };
        }

        return Response.json(answer);
      },
    },
  },
});
