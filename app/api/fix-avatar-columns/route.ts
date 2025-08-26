import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Try to add avatar columns if they don't exist
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public."ChildProfile" 
        ADD COLUMN IF NOT EXISTS avatar_url TEXT,
        ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
        ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
          "can_customize": true,
          "can_chat": true,
          "chat_time_limit_minutes": 30
        }'::jsonb;
        
        CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_url ON public."ChildProfile"(avatar_url);
      `
    })
    
    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ error: 'SQL execution failed', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, result: data })
  } catch (error) {
    console.error('Fix columns error:', error)
    return NextResponse.json({ error: 'Failed to fix columns', details: error }, { status: 500 })
  }
}