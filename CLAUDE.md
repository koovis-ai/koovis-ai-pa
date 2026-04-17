# Koovis — Web Frontend

## What This Repo Is

Koovis (Personal AI by Koovis AI) web frontend. Next.js 15 app connecting to the backend API at `api.koovis.ai`. Deployed to `pa.koovis.ai` via Vercel.

## Tech Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19**, **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (new-york style, neutral base, dark mode)
- **next-themes** for dark/light mode toggle
- **Custom SSE hook** — backend uses POST-based SSE with custom event types
- **react-markdown** + **rehype-highlight** + **remark-gfm** for chat rendering
- **react-dropzone** for file upload
- **Web Speech API** for voice input (browser-native)
- **PWA** with manual service worker registration

## Project Structure

```
src/
├── app/
│   ├── globals.css           # Tailwind + shadcn theme vars (dark/light)
│   ├── layout.tsx            # Root layout (Providers wrapper)
│   ├── page.tsx              # Public landing page (no auth)
│   ├── login/page.tsx        # Passphrase login
│   └── chat/
│       ├── layout.tsx        # Auth guard + sidebar + header
│       └── page.tsx          # Main chat page
├── components/
│   ├── chat/                 # ChatMessages, ChatInput, MessageBubble, etc.
│   ├── sidebar/              # SessionSidebar, SessionItem
│   ├── input/                # VoiceInput, FileUpload
│   ├── ui/                   # shadcn components (generated)
│   ├── Providers.tsx         # ThemeProvider + AuthProvider + SW registration
│   └── ThemeToggle.tsx
├── contexts/
│   ├── AuthContext.tsx        # JWT in localStorage
│   └── SessionsContext.tsx    # Session state for sidebar ↔ chat
├── hooks/
│   ├── useSSEChat.ts         # Custom SSE streaming
│   ├── useSessions.ts        # Session CRUD
│   └── useVoice.ts           # Web Speech API
├── lib/
│   ├── api.ts                # fetch wrapper + Bearer injection + 401 redirect
│   ├── sse-parser.ts         # ReadableStream SSE parser
│   ├── utils.ts              # cn() utility
│   └── constants.ts          # API_URL, STORAGE_KEYS, ROUTES
└── types/
    ├── index.ts              # Message, Session, ToolCall, etc.
    └── speech.d.ts           # Web Speech API types
```

## Key Patterns

- **Auth:** JWT stored in `localStorage` under `koovis_pa_token`. Passphrase login via `POST /api/auth/login`. 401 auto-redirects to `/login`.
- **SSE Streaming:** `POST /api/chat` returns SSE with events: `token`, `tool_start`, `tool_result`, `done`, `error`, `session`. Custom parser in `sse-parser.ts`.
- **Cross-component communication:** Custom DOM events (`koovis:session`, `koovis:load-messages`, `koovis:new-chat`) for sidebar ↔ chat page.
- **Routes:** Public landing at `/`. Chat at `/chat` (auth-guarded). Login at `/login`.

## Backend API

Base: `https://api.koovis.ai/api`

- `POST /auth/login` — passphrase → JWT
- `POST /chat` — SSE streaming chat
- `GET /sessions` — list sessions
- `GET /sessions/:id/messages` — session history
- `DELETE /sessions/:id` — delete session
- `POST /upload` — file upload (multipart)
- `GET /status` — system status
- `GET /health` — health check

## Commands

```bash
npm run dev     # Start dev server (localhost:3000)
npm run build   # Production build
npm run start   # Serve production build
npm run lint    # ESLint
```

## Canonical Documents (in koovis-hq)

- **Start here:** `koovis-hq/projects/koovis-pa/README.md` — doc map + status snapshot
- **Product Spec** (what Koovis PA is, market, GTM): `koovis-hq/docs/blueprints/PA_PRODUCT_SPEC.md`
- **Execution Blueprint** (MVP, architecture, week-by-week): `koovis-hq/projects/koovis-pa/BLUEPRINT.md`
- **Decisions** (why we chose X, append-only): `koovis-hq/projects/koovis-pa/DECISIONS.md`
- **System architecture & infra**: `koovis-hq/docs/blueprints/MASTER_BLUEPRINT_v5.md` — §4.6 (infra, absorbed from old PA_INFRASTRUCTURE) and §8 (Koovis Intelligence Layer, absorbed from old KOOVIS_PA)

Note: `PA_INFRASTRUCTURE.md` and `KOOVIS_PA.md` were archived — their content was absorbed into MASTER_BLUEPRINT_v5.md.

## Historical

Renamed from "Jarvis" to "PA Koovis" on 2026-02-22, then to "Koovis" on 2026-04-11. Archive contains original blueprints.
