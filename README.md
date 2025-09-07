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
2. Personalized Molds generated per child using AI prompts (interests -> themed assets)
3. Polymorphic Game Player: routes config to correct mini‑game implementation
4. Educator / Child role separation with RLS (Row Level Security) in Supabase
5. Image preloading + caching + optimized rendering (performance hooks & smart loader)
6. Centralized validation & error handling (Zod + structured API responses)
7. Production‑safe logging with contextual levels & performance markers
8. Extensible type‑safe domain model (`types/game.ts`)
9. Future: customization request workflow & background AI fulfillment

Tech Stack:
- Framework: Next.js 15 (App Router, Edge‑compatible middleware)
- Language: TypeScript (strict domain typing)
- Backend as a Service: Supabase (Postgres, Auth, RLS, Storage)
- Auth: Supabase email auth (middleware protected routes)
- Data Validation: Zod
- UI / Styling: Tailwind CSS, next-themes, Lucide Icons
- AI Integration: Google Gemini (generative game asset prompts)
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
GEMINI_API_KEY=your_gemini_key                           # for AI generation
HUGGINGFACE_API_KEY=optional_for_image_generation
NODE_ENV=development
```

Minimum required to run locally: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

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

### Key Domain Types (`types/game.ts`)
`GameConfig` → normalized config powering polymorphic player.
`Card`, `Category`, `PersonalizedMold` → AI-personalizable entities.

---
## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 401 Unauthorized | Missing/expired Supabase auth | Re-login; check cookies in devtools |
| Env var undefined | .env.local missing key | Add required variable & restart dev server |
| DB mismatch | Migrations not applied | Run `pnpm supabase:reset-seed` |
| AI key errors | GEMINI_API_KEY absent | Add key or skip AI-dependent actions |

---
## Roadmap (Condensed)
- [ ] Customization request workflow & async processing
- [ ] Complete removal of remaining console logs
- [ ] Rich analytics & educator dashboards
- [ ] Puzzle / Drawing / Storytelling mold implementations
- [ ] Accessibility & inclusive UX improvements
- [ ] Test coverage (>70%) & performance profiling

---
## License
Internal / Restricted – add explicit license before open sourcing.

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
