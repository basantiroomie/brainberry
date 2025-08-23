# Samsung PRISM - Supabase Setup

This project uses Supabase as the backend database and authentication provider.

## Local Development Setup

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Start Local Supabase**:
   ```bash
   supabase start
   ```

3. **Run Migrations**:
   ```bash
   supabase db reset
   ```

4. **Set Environment Variables**:
   Copy `.env.local.example` to `.env.local` and update with your Supabase keys:
   ```bash
   cp .env.local.example .env.local
   ```

5. **Seed Database (Optional)**:
   ```bash
   supabase db reset --with-seed
   ```

## Production Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Deploy Migrations**:
   ```bash
   supabase db push
   ```

3. **Update Environment Variables**:
   Set the production values in your deployment platform.

## Database Schema

### Tables
- **EducatorAccount**: Educator user accounts linked to Supabase Auth
- **ChildProfile**: Child profiles with access codes for authentication
- **GameMold**: Game templates/molds with scenes and assets
- **Scene**: Individual scenes within game molds
- **Asset**: Media assets (images, audio) for scenes
- **MoldAssignment**: Assignments of game molds to children
- **GameSession**: Records of game play sessions with analytics

### Storage Buckets
- **game-assets**: Public bucket for storing game media files

### Security
- Row Level Security (RLS) enabled on all tables
- Educators can only access their own children's data
- Game molds and assets are publicly readable
- Assignments and sessions are restricted to educator-child relationships

## API Endpoints

All API routes use native Supabase client calls for optimal performance and type safety:

- `GET/POST /api/children` - Child profile management
- `GET/PUT/DELETE /api/children/[id]` - Individual child operations
- `POST /api/child-auth` - Child authentication via access code
- `GET/POST /api/assignments` - Assignment management
- `GET/PUT/DELETE /api/assignments/[id]` - Individual assignment operations
- `GET/POST /api/molds` - Game mold management
- `GET/PUT/DELETE /api/molds/[id]` - Individual mold operations
- `GET/POST /api/sessions` - Game session tracking
- `GET /api/analytics/summary` - Analytics and reporting
- `POST /api/auth/bootstrap` - Educator account initialization

## Development Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database with migrations
supabase db reset

# Reset database with migrations and seed data
supabase db reset --with-seed

# Generate types (optional)
supabase gen types typescript --local > types/supabase.ts

# Create new migration
supabase migration new <migration_name>

# Push migrations to production
supabase db push
```
