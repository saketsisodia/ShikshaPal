# ShikshaPal

ShikshaPal is a friendly AI learning assistant for students in Class 1 to 10. Students can type a question or upload a photo of a textbook page, choose their class, pick a male or female Indian teacher, and get a simple explanation with everyday examples. The teacher also speaks the answer aloud in a clear Indian English voice.

## Features

- **Class selection** – Choose any class from 1 to 10 to match the explanation level.
- **Teacher choice** – Pick *Anjali Ma'am* (female) or *Rajesh Sir* (male).
- **Personalised greeting** – Enter your name and the teacher greets you by name.
- **Text and image questions** – Ask by typing or upload a textbook photo.
- **Simple explanations** – Every answer includes an intro, explanation, everyday example, and short steps.
- **Voice narration** – Listen to the answer with speed, volume, pause/resume, stop, and restart controls.

## Tech Stack

- [TanStack Start](https://tanstack.com/start) – Full-stack React framework
- [TanStack Router](https://tanstack.com/router) – File-based routing
- [React 19](https://react.dev/) – UI library
- [Tailwind CSS v4](https://tailwindcss.com/) – Styling
- [shadcn/ui](https://ui.shadcn.com/) – UI components
- [Lovable AI Gateway](https://docs.lovable.dev/features/ai-gateway) – AI chat and text-to-speech

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [Bun](https://bun.sh/) or npm (Bun is recommended for this project)
- A [Lovable](https://lovable.dev) account with an AI Gateway API key

## Environment Variables

Create a `.env` file in the project root and add:

```env
LOVABLE_API_KEY=your_lovable_ai_gateway_key
```

This key is used by the server routes `/api/ask` and `/api/speak` to call the AI Gateway for answers and voice narration.

## Getting Started

1. **Clone the repository**

   ```sh
   git clone https://github.com/saketsisodia/ShikshaPal.git
   cd ShikshaPal
   ```

2. **Install dependencies**

   With Bun:

   ```sh
   bun install
   ```

   With npm:

   ```sh
   npm install
   ```

3. **Set up environment variables**

   ```sh
   cp .env.example .env  # or create .env manually
   ```

   Add your `LOVABLE_API_KEY` to `.env`.

4. **Run the development server**

   With Bun:

   ```sh
   bun dev
   ```

   With npm:

   ```sh
   npm run dev
   ```

5. **Open the app**

   Visit [http://localhost:8080](http://localhost:8080) in your browser.

## Available Scripts

| Script | Description |
| --- | --- |
| `dev` | Start the local development server |
| `build` | Build the app for production |
| `build:dev` | Build the app in development mode |
| `preview` | Preview the production build locally |
| `lint` | Run ESLint |
| `format` | Format all files with Prettier |

## Project Structure

```text
src/
  routes/           # TanStack file-based routes
    __root.tsx      # Root layout
    index.tsx       # Home page with the learning assistant UI
    api/ask.ts      # Server route: AI teacher answer
    api/speak.ts    # Server route: text-to-speech
  lib/              # Utility functions and helpers
  components/       # Reusable UI components
  styles.css        # Global styles and Tailwind theme
```

## Deployment

This project is configured for the Lovable platform. To deploy:

1. Push your code to GitHub.
2. Connect the repository in the [Lovable editor](https://lovable.dev).
3. Add `LOVABLE_API_KEY` in your project settings.
4. Publish from the Lovable editor.

## License

This project is open source and available under the [MIT License](LICENSE).
