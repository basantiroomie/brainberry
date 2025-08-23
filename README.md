## BrainBerry Therapeutic Game Platform

### Immutable Mold Library & Personalization

Game Molds are developer-authored, versioned templates of therapeutic mini-games (e.g., Matching Cards, Sequencing Puzzle). They define structure, pacing boundaries, rules, and scenes with placeholder assets. Molds are seeded via Supabase SQL migrations and are immutable at runtime (no create/update/delete via public APIs).

Children (or educators on their behalf) generate personalized playable instances using GenAI assisted customization:
1. Child selects a mold (e.g., Matching Cards) from catalog.
2. Child enters interests ("favorite animals", "family members", etc.) which form a customization prompt.
3. A `MoldCustomizationRequest` row is created with target slots (cards, images, text).
4. Background worker / edge function calls AI providers to generate asset URLs & text.
5. A `PersonalizedMold` row stores the resolved config (cards array with generated images/text).
6. Gameplay loads from `PersonalizedMold.config` ensuring original mold integrity.

Tables introduced:
- `GameMold` (immutable templates)
- `PersonalizedMold` (child-specific playable instance)
- `MoldCustomizationRequest` (tracks generation lifecycle)

APIs:
- `GET /api/molds` (educator authenticated) – list immutable molds.
- `GET/POST /api/personalized-molds` – list or create personalized instances (child or educator context).

Future (not yet implemented here):
- Endpoint to submit customization requests and poll status.
- Worker to process `MoldCustomizationRequest` and update result + create/update `PersonalizedMold` config.

This repo currently stubs personalization; implement workers / AI integration next.
