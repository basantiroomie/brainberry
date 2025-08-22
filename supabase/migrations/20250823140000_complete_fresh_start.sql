-- Complete fresh database schema - bypassing all previous migrations
-- This creates everything from scratch

-- Drop everything first
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Create EducatorAccount table (primary user type)
CREATE TABLE public."EducatorAccount" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE,
    name text,
    institution text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create ChildProfile table (students managed by educators)
CREATE TABLE public."ChildProfile" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    age integer CHECK (age > 0 AND age < 18),
    diagnosis text,
    notes text,
    access_code text UNIQUE NOT NULL CHECK (length(access_code) <= 6),
    educator_id uuid REFERENCES public."EducatorAccount"(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create GameMold table (game templates/structures)
CREATE TABLE public."GameMold" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    category text,
    structure_type text,
    experience_type text,
    primary_objective text,
    rules jsonb DEFAULT '{}',
    lock_structure boolean DEFAULT false,
    allow_themes boolean DEFAULT true,
    allow_pacing boolean DEFAULT true,
    allow_rewards boolean DEFAULT true,
    allow_avatars boolean DEFAULT true,
    customization_notes text,
    age_min integer,
    age_max integer,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Scene table (parts of game molds)
CREATE TABLE public."Scene" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mold_id uuid REFERENCES public."GameMold"(id) ON DELETE CASCADE NOT NULL,
    scene_index integer NOT NULL,
    name text,
    description text,
    config jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mold_id, scene_index)
);

-- Create Asset table (resources used in scenes)
CREATE TABLE public."Asset" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    scene_id uuid REFERENCES public."Scene"(id) ON DELETE CASCADE NOT NULL,
    asset_type text NOT NULL,
    name text,
    url text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create MoldAssignment table (educators assign molds to children)
CREATE TABLE public."MoldAssignment" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mold_id uuid REFERENCES public."GameMold"(id) ON DELETE CASCADE NOT NULL,
    child_id uuid REFERENCES public."ChildProfile"(id) ON DELETE CASCADE NOT NULL,
    educator_id uuid REFERENCES public."EducatorAccount"(id) ON DELETE CASCADE NOT NULL,
    assigned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    due_date timestamp with time zone,
    status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
    notes text,
    UNIQUE(mold_id, child_id)
);

-- Create GameSession table (tracks child gameplay)
CREATE TABLE public."GameSession" (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid REFERENCES public."ChildProfile"(id) ON DELETE CASCADE NOT NULL,
    mold_id uuid REFERENCES public."GameMold"(id) ON DELETE CASCADE NOT NULL,
    assignment_id uuid REFERENCES public."MoldAssignment"(id) ON DELETE SET NULL,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at timestamp with time zone,
    duration_seconds integer,
    progress_data jsonb DEFAULT '{}',
    completion_status text DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'abandoned')),
    score integer,
    achievements jsonb DEFAULT '[]'
);

-- Create indexes for better performance
CREATE INDEX idx_child_profile_educator_id ON public."ChildProfile"(educator_id);
CREATE INDEX idx_child_profile_access_code ON public."ChildProfile"(access_code);
CREATE INDEX idx_scene_mold_id ON public."Scene"(mold_id);
CREATE INDEX idx_asset_scene_id ON public."Asset"(scene_id);
CREATE INDEX idx_mold_assignment_child_id ON public."MoldAssignment"(child_id);
CREATE INDEX idx_mold_assignment_educator_id ON public."MoldAssignment"(educator_id);
CREATE INDEX idx_game_session_child_id ON public."GameSession"(child_id);
CREATE INDEX idx_game_session_started_at ON public."GameSession"(started_at);

-- Set up Row Level Security (RLS) policies
ALTER TABLE public."EducatorAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ChildProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GameMold" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Scene" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Asset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MoldAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."GameSession" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for EducatorAccount
CREATE POLICY "Educators can view their own account" ON public."EducatorAccount"
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Educators can update their own account" ON public."EducatorAccount"
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own educator account" ON public."EducatorAccount"
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for ChildProfile
CREATE POLICY "Educators can view their own children" ON public."ChildProfile"
    FOR SELECT USING (educator_id = auth.uid());

CREATE POLICY "Educators can insert children" ON public."ChildProfile"
    FOR INSERT WITH CHECK (educator_id = auth.uid());

CREATE POLICY "Educators can update their own children" ON public."ChildProfile"
    FOR UPDATE USING (educator_id = auth.uid());

CREATE POLICY "Educators can delete their own children" ON public."ChildProfile"
    FOR DELETE USING (educator_id = auth.uid());

-- RLS Policies for GameMold (public read, admin write)
CREATE POLICY "Anyone can view game molds" ON public."GameMold"
    FOR SELECT USING (true);

-- RLS Policies for Scene (public read)
CREATE POLICY "Anyone can view scenes" ON public."Scene"
    FOR SELECT USING (true);

-- RLS Policies for Asset (public read)
CREATE POLICY "Anyone can view assets" ON public."Asset"
    FOR SELECT USING (true);

-- RLS Policies for MoldAssignment
CREATE POLICY "Educators can view their assignments" ON public."MoldAssignment"
    FOR SELECT USING (educator_id = auth.uid());

CREATE POLICY "Educators can create assignments" ON public."MoldAssignment"
    FOR INSERT WITH CHECK (educator_id = auth.uid());

CREATE POLICY "Educators can update their assignments" ON public."MoldAssignment"
    FOR UPDATE USING (educator_id = auth.uid());

CREATE POLICY "Educators can delete their assignments" ON public."MoldAssignment"
    FOR DELETE USING (educator_id = auth.uid());

-- RLS Policies for GameSession
CREATE POLICY "Educators can view sessions of their children" ON public."GameSession"
    FOR SELECT USING (
        child_id IN (
            SELECT id FROM public."ChildProfile" WHERE educator_id = auth.uid()
        )
    );

CREATE POLICY "Children can create their own sessions" ON public."GameSession"
    FOR INSERT WITH CHECK (true); -- We'll handle this in application logic

CREATE POLICY "Children can update their own sessions" ON public."GameSession"
    FOR UPDATE USING (true); -- We'll handle this in application logic

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant permissions for authenticated users (educators)
GRANT SELECT, INSERT, UPDATE, DELETE ON public."EducatorAccount" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."ChildProfile" TO authenticated;
GRANT SELECT ON public."GameMold" TO authenticated;
GRANT SELECT ON public."Scene" TO authenticated;
GRANT SELECT ON public."Asset" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."MoldAssignment" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."GameSession" TO authenticated;

-- Grant permissions for anonymous users (for child gameplay)
GRANT SELECT ON public."GameMold" TO anon;
GRANT SELECT ON public."Scene" TO anon;
GRANT SELECT ON public."Asset" TO anon;
GRANT SELECT, INSERT, UPDATE ON public."GameSession" TO anon;
GRANT SELECT ON public."ChildProfile" TO anon;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
