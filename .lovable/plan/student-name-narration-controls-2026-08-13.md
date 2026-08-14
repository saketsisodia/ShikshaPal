# Student name + narration controls

## What changes for the student

1. **Student name**
   - A "Your name" input sits in the top bar next to the class picker (empty by default, saved in the browser so it is remembered next visit).
   - The teacher greets and addresses the student by name in the answer ("Namaste Aarav beta!") and the same name is spoken in the audio.
   - If no name is entered, the teacher speaks exactly as it does today ("beta"), so nothing breaks.
   - The answer card heading becomes "Anjali Ma'am explains to Aarav:" when a name is present.

2. **Narration controls**
   - The single "Listen" button becomes a small control group: **Listen / Pause / Resume**, plus a **Stop** button.
   - Pause freezes the audio where it is; Resume continues from the same point; Stop ends narration and resets to the start.
   - Starting a new question or switching teacher automatically stops any playing narration.
   - While the audio is still being prepared, the button shows "Preparing voice…" and Stop cancels that request too.

## Technical notes

- `src/routes/index.tsx`
  - New `studentName` state persisted to `localStorage` (read in `useEffect` to avoid hydration mismatch), trimmed and capped at 30 characters.
  - Send `studentName` in the `/api/ask` and `/api/speak` request bodies.
  - Replace the `speaking` boolean with a `narration` state: `"idle" | "loading" | "playing" | "paused"`, driven by the existing `audioRef`.
  - Handlers: `listen()` (fetch + play), `togglePause()` (`audio.pause()` / `audio.play()`), `stopNarration()` (`pause()`, `currentTime = 0`, revoke object URL, abort in-flight fetch via `AbortController`, reset state).
  - Call `stopNarration()` on new mutation submit and on teacher change.

- `src/routes/api/ask.ts`
  - Extend the Zod schema with optional `studentName` (string, max 40).
  - Add to the system prompt: address the student by that name naturally once or twice; when absent, keep current behaviour.

- `src/routes/api/speak.ts`
  - Accept optional `studentName` and keep the existing Indian-accent prompt wrapper; no other change needed since the name already arrives inside the answer text.

No backend or database changes; styling reuses existing saffron/ashoka/chakra tokens.
