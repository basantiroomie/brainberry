## BrainBerry – Personalized Therapeutic Learning Games

Short Description:
BrainBerry is a GenAI‑assisted therapeutic mini‑game platform that lets educators create safe, personalized cognitive and developmental training experiences for children. Immutable “Game Molds” define structured, evidence‑informed game templates; AI then fills these molds with child‑relevant themed content (images, labels, prompts) while preserving pedagogical integrity.

Target Audience:
- Neurodiverse children (early childhood to pre‑teen) needing engaging repetition & adaptive reinforcement
- Educators / therapists / caregivers supervising therapeutic or learning sessions
- Product teams exploring structured + AI hybrid content delivery for pediatric interventions

Unique Selling Proposition (USP):
- Separation of pedagogy (immutable molds) from personalization (AI generated assets)
- Guard‑railed AI generation with schema + validation to preserve therapeutic intent
- Rapid personalization without compromising auditability or safety
- Structured Supabase schema enabling analytics, assignments, and longitudinal tracking

Core Features:
1. Immutable Game Molds (e.g., Matching Cards, Sorting Challenge) versioned via SQL migrations
2. Personalized Molds generated per child using AI prompts (interests → themed assets)
3. Polymorphic Game Player: routes config to correct mini‑game implementation
4. Conversational Child Portal:
   - Text chat with Gemini TTS audio and real‑time lipsync on a 3D avatar
   - Voice chat powered by Gemini Live (low‑latency, streaming)
5. 3D Avatar System (Ready Player Me compatible):
   - Natural idle + folded‑arms poses with subtle breathing
   - Robust morph target mapping for lipsync across RPM variants
6. Educator / Child role separation with RLS (Row Level Security) in Supabase
7. Image preloading + caching + optimized rendering (performance hooks & smart loader)
8. Centralized validation & error handling (Zod + structured API responses)
9. Production‑safe logging with contextual levels & performance markers
10. Extensible type‑safe domain model (`types/`)

Tech Stack:
- Framework: Next.js 15 (App Router)
- Language: TypeScript (strict)
- Backend as a Service: Supabase (Postgres, Auth, RLS, Storage)
- Auth: Supabase email auth (middleware protected routes)
- Data Validation: Zod
- UI / Styling: Tailwind CSS, next-themes, Lucide Icons
- 3D/Realtime: three.js, @react-three/fiber, @react-three/drei, SkeletonUtils
- Lipsync: wawa-lipsync
- AI Integration: Google Gemini
  - Speech Generation: `gemini-2.5-*-tts`
  - Live API (streaming audio): `gemini-live-2.5-flash-preview`, fallback `gemini-2.0-flash-live-001`
- Audio Tooling (server): ffmpeg / `ffmpeg-static` (optional)
- Charts / Visualization: Recharts
- Tooling: ESLint, TypeScript, pnpm, Supabase CLI

High‑Level Architecture Flow:
Educator seeds Mold (migration) -> Child selects Mold -> Provides interest prompts -> (Future) Customization Request queued -> AI generates themed assets -> PersonalizedMold stored -> Player loads config -> Gameplay & metrics recorded.

---
## Getting Started

### 1. Prerequisites
- Node.js 18+ (recommended 20 LTS)
- pnpm installed (`npm i -g pnpm`)
- Supabase CLI (`npm i -g supabase`)
- Google Gemini API key (for AI personalization) *(optional until full flow wired)*

### 2. Clone & Install
```bash
git clone <your-fork-or-repo-url>
cd v1
pnpm install
```

### 3. Environment Variables
Create a `.env.local` file at the project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=public_anon_key
SUPABASE_SERVICE_ROLE_KEY=service_role_key               # server-only (never expose client side)
GEMINI_API_KEY=your_gemini_key                           # required for TTS + Live
ENABLE_FFMPEG=1                                          # optional; enables server PCM conversion for voice chat
HUGGINGFACE_API_KEY=optional_for_image_generation
NODE_ENV=development
```

Minimum required to run locally: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Text chat TTS and voice chat will additionally require `GEMINI_API_KEY`. For best Live results, set `ENABLE_FFMPEG=1` (uses `ffmpeg-static`).

### 4. Start Local Supabase (Optional – if using local Postgres)
```bash
supabase start
# To apply migrations + seed
pnpm supabase:reset-seed
```

This spins up Postgres, Studio, Auth, Storage on ports defined in `supabase/config.toml`.

### 5. Database Migrations
If you modified schema locally and want to push:
```bash
pnpm supabase:push
```
To regenerate TypeScript types from the DB:
```bash
pnpm supabase:types
```

### 6. Run the App
```bash
pnpm dev
```
App serves at: http://localhost:3000

### 7. Build & Production Start
```bash
pnpm build
pnpm start
```

---
## Usage Walkthrough

### Roles
- Educator: Authenticates, manages children, views molds, assigns personalized games.
- Child: Accesses a simplified interface to play personalized or catalog games.

### Basic Flow (Current Implementation)
1. Sign up / log in as educator.
2. Create child profiles via `/api/children` UI flows.
3. List available molds (immutable templates) – Matching Cards & Sorting Challenge supported.
4. Generate (or load existing) personalized mold configs (stubbed / direct for now).
5. Launch Polymorphic Game Player – selects the proper mini‑game based on `gameConfig.game_type`.

### Personalization (Present vs Near-Term)
Current: Direct embedding of sample configs without async request lifecycle.
Planned: Submit `MoldCustomizationRequest` -> background worker invokes Gemini -> persists `PersonalizedMold` -> child notified when ready.

### Directory Highlights
```
app/                 Next.js route handlers & UI (App Router)
	api/               REST-ish endpoints (Supabase + validation)
	child/, educator/  Role-specific UI surfaces
lib/                 Supabase clients, AI integration, schemas
types/               Domain model (game + DB types)
utils/               Logger, validation & optimization helpers
hooks/               Performance & state management hooks
supabase/            Config, migrations, seed data
```

---
## Conversational & Avatar System

### Text Chat with Gemini TTS + Lipsync
- API: `app/api/tts/gemini/route.ts`
  - Uses official Gemini TTS models (e.g., `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts`).
  - Requests `responseModalities: ["AUDIO"]` and returns base64 audio with `isRealAudio: true` when successful.
  - Fallback path returns Gemini‑optimized text for browser TTS when audio isn’t available.
- Client: `components/AvatarTextChat.tsx`
  - Calls `/api/tts/gemini` and, when `isRealAudio` is true, plays the returned audio and drives lipsync.
  - Falls back to enhanced browser TTS with boundary‑driven lip cues.
- Lipsync: `lib/lipsync-manager.ts`
  - Wawa Lipsync processes real audio (`processAudioFile`) and browser TTS (`processSpeechSynthesis`).
  - Emits canonical blendshapes (`jawOpen`, `mouthSmile`, `mouthFunnel`), mapped to Ready Player Me morphs.

Quick Test (TTS):
1. `pnpm dev` → open `/child`.
2. Send a message in Text Chat.
3. Look for “AvatarTextChat: Using REAL Gemini TTS audio” in the console.

### Voice Chat with Gemini Live
- API: `app/api/chat/voice-livekit/route.ts`
  - Creates a Live session using your preferred model hierarchy: `gemini-live-2.5-flash-preview` → `gemini-2.0-flash-live-001` → `gemini-2.5-flash-preview-native-audio-dialog`.
  - Streams microphone audio; if `ENABLE_FFMPEG=1`, converts WebM chunks to `audio/pcm;rate=16000` via `ffmpeg-static`. Otherwise sends WebM directly.
  - Ensures `responseModalities: ["AUDIO"]` so the model returns playable audio.
- Client: `components/AvatarVoiceChat.tsx`
  - Uses `MediaRecorder` to capture mic chunks and posts to the Live API route.
  - Plays received base64 audio and drives lipsync.

Quick Test (Live):
1. Add `GEMINI_API_KEY` (and `ENABLE_FFMPEG=1` for best compatibility).
2. Open the Voice Chat UI, allow mic permissions.
3. Speak and confirm avatar audio + mouth motion.

### 3D Avatar Posing (Global)
- Viewer: `components/SimpleAvatarViewer.tsx`
  - Clones GLB with `SkeletonUtils.clone` to preserve skinning.
  - Discovers bones from all skinned meshes (name heuristics for RPM/Mixamo rigs) and applies two static poses:
    - Natural Idle (slight arm drop + subtle breathing)
    - Folded Arms (crossed at chest)
  - Toggles pose every 5 seconds. Breathing stays active.
- Used across child pages (chat, “My Stuff”, etc.), so the non‑T‑pose stance is consistent.

Configuration Tips:
- To adjust pose angles or toggle interval, edit `SimpleAvatarViewer.tsx` pose helpers.
- To disable pose toggling, comment the `setInterval` block and apply only the natural pose on load.

### Key Domain Types (`types/game.ts`)
`GameConfig` → normalized config powering polymorphic player.
`Card`, `Category`, `PersonalizedMold` → AI-personalizable entities.

### API Endpoints (Selected)
- `GET /api/molds` – list available game molds (educator scope)
- `GET /api/personalized-molds` – list personalized instances
- `GET /api/personalized-molds/:id` – fetch config for play
- `POST /api/children` – create child profile

### Logging & Error Handling
Use `logger` (in `utils/logger.ts`) instead of `console.log`.
API routes should wrap handlers with validation & `withErrorHandling` (see `utils/validation.ts`).

---
## Extending the Platform

Add a New Game Mold:
1. Create SQL migration inserting a new row into `GameMold` with a schema-compliant placeholder config.
2. Implement a new player component under `app/child/components/players/`.
3. Extend polymorphic switch in `PolymorphicGamePlayer`.
4. Update `types/game.ts` if new structure fields are needed.

Integrate Full Personalization Pipeline (Future):
1. Implement `/api/customization-requests` POST to enqueue requests.
2. Add edge function / worker polling pending requests.
3. Call Gemini / image generation providers; validate JSON with Zod.
4. Persist finalized assets to `PersonalizedMold`.
5. Notify educator/child (websocket or polling).

---
## Troubleshooting
| Issue | Cause | Fix |
|------|-------|-----|
| 401 Unauthorized | Missing/expired Supabase auth | Re‑login; check cookies in devtools |
| Env var undefined | `.env.local` missing key | Add required variable & restart dev server |
| DB mismatch | Migrations not applied | Run `pnpm supabase:reset-seed` |
| AI key errors | `GEMINI_API_KEY` absent | Add key and restart dev server |
| TTS plays with browser voice | TTS route didn’t return audio | Check server logs; ensure `isRealAudio: true` in `/api/tts/gemini` response |
| “Unexpected token < … is not valid JSON” | Parsing HTML error page as JSON | Client checks content‑type; ensure route isn’t erroring (watch dev console) |
| Live: “Mime type 'audio/webm' not supported” | Model expects PCM | Set `ENABLE_FFMPEG=1` and ensure `ffmpeg-static` is installed |
| Live: `spawn .../ffmpeg ENOENT` | ffmpeg not found in env | Keep `ENABLE_FFMPEG=1` (uses `ffmpeg-static`) or install system ffmpeg |
| Live: long silences / timeouts | Session not returning audio | Verify model name, API key quota, and that `responseModalities: ["AUDIO"]` is set |
| Lipsync not moving | Avatar morph names differ | Open console logs to collect morph targets; extend mapping in `AvatarTextChat.tsx` |
| Avatar still in T‑pose | Bone names differ | Viewer infers bones; if needed, share console “🦴 Discovered bones / ✅ Selected bones” for tweaks |

---
## Notes for Contributors (Avatar & Audio)
- Prefer `SkeletonUtils.clone` when reusing GLB scenes with skinning.
- Keep pose helpers non‑destructive: always restore base quaternions before applying a new pose.
- When adjusting Live audio handling, keep `responseModalities: ["AUDIO"]` and `audio/pcm;rate=16000` compatibility in mind.
- Never log secrets; scrub API keys and PII in server logs.

---
## Contributing
1. Fork & branch: `feat/<short-feature>`
2. Follow existing type patterns (`types/`) & logging conventions
3. Run lint before PR: `pnpm lint`
4. Provide migration SQL for any schema changes

---
## Quick Start (TL;DR)
```bash
pnpm install
cp .env.example .env.local   # then fill in keys
supabase start               # optional local backend
pnpm dev
# open http://localhost:3000
```

Happy building & personalizing! 🍓
