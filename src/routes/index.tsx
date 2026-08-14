import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { AskAnswer } from "./api/ask";
import anjaliImg from "@/assets/teacher-anjali.png";
import rajeshImg from "@/assets/teacher-rajesh.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShikshaPal — Ask your doubt, learn simply (Class 1–10)" },
      {
        name: "description",
        content:
          "Type a doubt or upload a textbook photo. Anjali Ma'am or Rajesh Sir explains it simply for your class, with an Indian voice.",
      },
      { property: "og:title", content: "ShikshaPal — Simple learning for Class 1–10" },
      {
        property: "og:description",
        content:
          "An Indian AI teacher that explains any school topic in simple words with everyday examples.",
      },
    ],
  }),
  component: Index,
});

const TEACHERS = {
  anjali: { name: "Anjali Ma'am", img: anjaliImg },
  rajesh: { name: "Rajesh Sir", img: rajeshImg },
} as const;

type TeacherId = keyof typeof TEACHERS;

const TOPICS: Record<"junior" | "senior", string[]> = {
  junior: ["Counting to 100", "Water Cycle", "Parts of a Plant", "Story Writing", "Solar System"],
  senior: ["Photosynthesis", "Fractions", "Newton's Laws", "Ancient India", "Chemical Reactions"],
};

function Index() {
  const [grade, setGrade] = useState(5);
  const [teacher, setTeacher] = useState<TeacherId>("anjali");
  const [question, setQuestion] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [studentName, setStudentName] = useState("");
  const [narration, setNarration] = useState<"idle" | "loading" | "playing" | "paused">("idle");
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);

  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const speakAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("shikshapal:name");
    if (saved) setStudentName(saved);
    const s = Number(localStorage.getItem("shikshapal:speed"));
    if (s >= 0.5 && s <= 2) setSpeed(s);
    const v = Number(localStorage.getItem("shikshapal:volume"));
    if (v >= 0 && v <= 1 && localStorage.getItem("shikshapal:volume")) setVolume(v);
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    localStorage.setItem("shikshapal:speed", String(speed));
  }, [speed]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem("shikshapal:volume", String(volume));
  }, [volume]);


  const onNameChange = (value: string) => {
    const v = value.slice(0, 30);
    setStudentName(v);
    localStorage.setItem("shikshapal:name", v.trim());
  };

  const mutation = useMutation({
    mutationFn: async (payload: { question: string }): Promise<AskAnswer> => {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: payload.question,
          grade,
          teacher,
          imageDataUrl,
          studentName: studentName.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as AskAnswer;
    },
    onSuccess: (data) => setAnswer(data),
  });

  const onFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const stopNarration = () => {
    speakAbortRef.current?.abort();
    speakAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setNarration("idle");
  };

  const togglePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setNarration("playing");
    } else {
      audio.pause();
      setNarration("paused");
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) {
      void listen();
      return;
    }
    audio.currentTime = 0;
    void audio.play();
    setNarration("playing");
  };

  const listen = async () => {
    if (!answer) return;
    stopNarration();
    const text = [answer.intro, answer.explanation, answer.example, ...answer.steps]
      .filter(Boolean)
      .join(" ");
    const controller = new AbortController();
    speakAbortRef.current = controller;
    setNarration("loading");
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, teacher, studentName: studentName.trim() || undefined }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const blob = await res.blob();
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audio.playbackRate = speed;
      audio.volume = volume;
      audioRef.current = audio;
      audio.onended = () => setNarration("paused");
      await audio.play();
      setNarration("playing");
    } catch {
      if (!controller.signal.aborted) setNarration("idle");
    }
  };


  const t = TEACHERS[teacher];

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-saffron text-saffron-foreground shadow-lg shadow-saffron/20">
            <span className="text-xl font-bold">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-ashoka">ShikshaPal</span>
        </div>
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Name
          </span>
          <input
            value={studentName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            aria-label="Your name"
            className="w-28 bg-transparent font-bold text-ashoka placeholder:font-medium placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Class
          </span>
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="bg-transparent font-bold text-ashoka focus:outline-none"
            aria-label="Select your class"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                Class {g}
              </option>
            ))}
          </select>
        </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <section className="mb-10 text-center">
          <h2 className="mb-6 text-lg font-semibold text-muted-foreground">
            Choose your favorite teacher
          </h2>
          <div className="flex justify-center gap-8">
            {(Object.keys(TEACHERS) as TeacherId[]).map((id) => {
              const selected = teacher === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    stopNarration();
                    setTeacher(id);
                  }}
                  className="group cursor-pointer"
                  aria-pressed={selected}
                >
                  <div
                    className={`size-28 rounded-2xl border-2 bg-card p-2 shadow-sm transition-all ${
                      selected
                        ? "border-saffron ring-4 ring-saffron/10"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={TEACHERS[id].img}
                      alt={`${TEACHERS[id].name} avatar`}
                      width={512}
                      height={512}
                      className="size-full rounded-lg object-contain"
                    />
                  </div>
                  <span
                    className={`mt-2 block font-medium ${selected ? "text-ashoka" : "text-muted-foreground"}`}
                  >
                    {TEACHERS[id].name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-muted">
          <div className="p-8">
            <h1 className="mb-2 text-3xl font-bold text-ashoka">What shall we learn today?</h1>
            <p className="mb-8 text-muted-foreground">
              Type your doubt or upload a picture from your textbook.
            </p>

            <div className="space-y-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[160px] w-full resize-none rounded-2xl border-2 border-border bg-muted p-6 text-lg leading-relaxed transition-all focus:border-saffron/30 focus:outline-none focus:ring-4 focus:ring-saffron/5"
                placeholder="Example: Why is the sky blue? explain like I am 10 years old..."
              />

              {imageDataUrl && (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted p-3">
                  <img
                    src={imageDataUrl}
                    alt="Uploaded topic"
                    loading="lazy"
                    className="size-16 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(undefined)}
                    className="text-sm font-semibold text-muted-foreground hover:text-ashoka"
                  >
                    Remove picture
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-3 text-muted-foreground transition-all hover:border-saffron hover:text-saffron"
                >
                  <span>Upload Image</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />

                <button
                  type="button"
                  disabled={mutation.isPending}
                  onClick={() => {
                    stopNarration();
                    mutation.mutate({ question });
                  }}
                  className="rounded-2xl bg-saffron px-10 py-4 font-bold text-saffron-foreground shadow-lg shadow-saffron/30 transition-all hover:-translate-y-0.5 hover:bg-saffron/90 disabled:translate-y-0 disabled:opacity-60"
                >
                  {mutation.isPending ? "Teacher is thinking..." : "Ask ShikshaPal"}
                </button>
              </div>

              {mutation.isError && (
                <p className="text-sm font-medium text-destructive">
                  {(mutation.error as Error).message}
                </p>
              )}
            </div>
          </div>

          {answer && (
            <div className="border-t border-chakra/10 bg-chakra/5 p-8">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-chakra/20 bg-card shadow-sm">
                  <img
                    src={t.img}
                    alt={`${t.name} avatar`}
                    loading="lazy"
                    className="size-full object-contain"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-chakra">
                      {t.name} explains{studentName.trim() ? ` to ${studentName.trim()}` : ""}:
                    </h3>
                    <div className="flex items-center gap-2">
                      {narration === "idle" || narration === "loading" ? (
                        <button
                          type="button"
                          onClick={listen}
                          disabled={narration === "loading"}
                          className="rounded-full border border-ashoka/10 bg-card px-3 py-1 text-sm font-semibold text-ashoka shadow-sm disabled:opacity-60"
                        >
                          {narration === "loading" ? "Preparing voice…" : "Listen"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={togglePause}
                          className="rounded-full border border-ashoka/10 bg-card px-3 py-1 text-sm font-semibold text-ashoka shadow-sm"
                        >
                          {narration === "paused" ? "Resume" : "Pause"}
                        </button>
                      )}
                      {narration !== "idle" && (
                        <>
                          <button
                            type="button"
                            onClick={restart}
                            className="rounded-full border border-ashoka/10 bg-card px-3 py-1 text-sm font-semibold text-ashoka shadow-sm"
                          >
                            Restart
                          </button>
                          <button
                            type="button"
                            onClick={stopNarration}
                            className="rounded-full border border-destructive/20 bg-card px-3 py-1 text-sm font-semibold text-destructive shadow-sm"
                          >
                            Stop
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-chakra/10 bg-card px-4 py-3 shadow-sm">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Voice settings
                    </span>
                    <label className="flex items-center gap-2 text-sm font-semibold text-ashoka">
                      Speed
                      <input
                        type="range"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        aria-label="Narration speed"
                        className="w-28 accent-saffron"
                      />
                      <span className="w-10 text-muted-foreground">{speed.toFixed(1)}x</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-ashoka">
                      Volume
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        aria-label="Narration volume"
                        className="w-28 accent-saffron"
                      />
                      <span className="w-10 text-muted-foreground">
                        {Math.round(volume * 100)}%
                      </span>
                    </label>
                  </div>

                  <div className="mt-4 space-y-4 leading-relaxed">
                    <p className="text-lg font-medium">{answer.intro}</p>
                    <p>{answer.explanation}</p>

                    {answer.example && (
                      <div className="rounded-xl border border-chakra/10 bg-card p-4 shadow-sm">
                        <p className="mb-1 text-sm font-bold text-chakra">Simple Example:</p>
                        <p className="text-sm italic">{answer.example}</p>
                      </div>
                    )}

                    {answer.steps.length > 0 && (
                      <ul className="space-y-2">
                        {answer.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ashoka text-[10px] font-bold text-saffron-foreground">
                              {i + 1}
                            </span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h4 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Popular topics for Class {grade}
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS[grade <= 5 ? "junior" : "senior"].map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setQuestion(`Explain ${topic} in a simple way`)}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-saffron hover:text-saffron"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-12 text-center text-sm text-muted-foreground">
        <p>ShikshaPal Learning • Making education simple for India</p>
      </footer>
    </div>
  );
}
