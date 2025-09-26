# Setup Guide

This guide covers local development and environment configuration for BrainBerry, including Gemini, Supabase, Ready Player Me, and ElevenLabs.

## Prerequisites

- Node.js 18+ (20 LTS recommended)
- pnpm
- Git
- Supabase CLI (Optional, for local DB) – `npm install -g supabase`
- VS Code

## 1) Clone and install

```bash
git clone https://github.com/basantiroomie/brainberry.git
cd brainberry
npm install -g pnpm
pnpm install
```

## 2) Environment variables

Create your env file from the template and fill in values:

```bash
cp .env.local.example .env.local
# edit with your preferred editor
```

## 3) Keys and service setup

### Supabase (Required)
1. Create a project at https://supabase.com
3. Go to project settings
3. Settings → API: copy and set in .env.local
	 - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
	 - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	 - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (server-only)
4. Add `http://localhost:3000` to Allowed URLs in Auth settings for local dev.

### Google Gemini (Required for AI features)
- Get a key at: https://aistudio.google.com/app/api-keys
- Set `GEMINI_API_KEY` in .env.local

### Ready Player Me (Avatars)
1. Go to https://studio.readyplayer.me → add application
2. Obtain:
	 - `RPM_APP_ID`
	 - `RPM_SUBDOMAIN` (partner string, e.g. `your-subdomain.readyplayer.me`)
3. Go to https://studio.readyplayer.me/developer-tools/api-keys
4. Obtain:
	 - `RPM_API_KEY` (server)
5. Set all values in .env.local

### ElevenLabs (Premium TTS; Optional)
- Create an API key: https://elevenlabs.io
- Set `ELEVENLABS_API_KEY`
- Used by `lib/tts-config.ts` and `lib/tts-utils.ts` when present; otherwise browser SpeechSynthesis is used.

## 4) Run locally

```bash
pnpm dev
# open http://localhost:3000
```

## 5) Verify your setup

- Supabase basic test
	- Navigate to `/app/login` and check console hints (it logs if URL/key are present in dev)
	- API test route: `app/api/test-db/route.ts` uses Supabase service key

- Gemini content generation
	- Ensure `GEMINI_API_KEY` set
	- API route `app/api/chat/route.ts` responds with env status; logs length and prefix in dev

- Gemini TTS
	- `POST /api/tts/gemini` with `{ text: "Hello" }` attempts TTS models
	- Fallbacks to optimized browser TTS when unavailable

- Live audio (advanced)
	- `POST /api/chat/voice-livekit` manages a session with supported Live models; requires valid `GEMINI_API_KEY`
	- ffmpeg is used via `ffmpeg-static` for audio conversion; no extra install needed in Node, but ensure platform supports it

- Ready Player Me
	- Avatar creation relies on `RPM_API_KEY` and `NEXT_PUBLIC_RPM_SUBDOMAIN`
	- Missing keys will surface warnings via `avatar-env-config.ts`

## 6) Optional: local Supabase

```bash
npm install -g supabase   # once
supabase start            # start local stack
supabase studio           # web UI
supabase db reset         # reset with seed data
```

Then point your env to local URLs/keys if you use the local stack.

## Libraries used (selected)

- Next.js 15, React 19, TypeScript 5
- Supabase JS, SSR helpers
- Google Generative AI SDKs: `@google/generative-ai`, `@google/genai`
- Three.js, @react-three/fiber, @react-three/drei for 3D
- Tailwind CSS, Radix UI, lucide-react
- face-api.js, ffmpeg-static, wavefile, ws
- Zod, React Hook Form
- Vitest, Testing Library, Playwright

## Troubleshooting

- pnpm not found
	- Install: `npm install -g pnpm`

- Node version mismatch
	- Use Node 18+ (20 LTS recommended). With nvm: `nvm use 20`

- Env changes not taking effect
	- Confirm `.env.local` exists at project root. Restart `pnpm dev` after edits.

- Supabase auth/CORS issues
	- In Supabase Auth settings, allow `http://localhost:3000` for Redirect URLs and Site URL.

	- Check `GEMINI_API_KEY` length and prefix; logs appear in dev for `app/api/chat/route.ts` and TTS routes.

- Ready Player Me failures
	- Ensure `RPM_API_KEY` and `NEXT_PUBLIC_RPM_SUBDOMAIN` are set; see console warnings from `avatar-env-config.ts`.

- Port 3000 busy
	- Stop the conflicting process or run with `PORT=3001 pnpm dev`.

For architecture and feature overview, see `README.md`.
