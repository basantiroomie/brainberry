import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Test if avatar columns exist by trying to select them
    const { data: testChild, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url, avatar_permissions')
      .limit(1)
      .single()
    
    if (error) {
      // If error mentions column doesn't exist, we need to add it
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        return NextResponse.json({ 
          columnsExist: false, 
          error: error.message,
          needsMigration: true 
        })
      }
      
      // Other errors (like no data) are fine
      return NextResponse.json({ 
        columnsExist: true, 
        error: error.message,
        needsMigration: false 
      })
    }
    
    return NextResponse.json({ 
      columnsExist: true, 
      testChild,
      needsMigration: false 
    })
  } catch (error) {
    console.error('Test avatar columns error:', error)
    return NextResponse.json({ error: 'Failed to test columns', details: error }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Try to add the columns using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          -- Add avatar_url column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ChildProfile' AND column_name='avatar_url') THEN
            ALTER TABLE public."ChildProfile" ADD COLUMN avatar_url TEXT;
          END IF;
          
          -- Add avatar_headshot_url column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ChildProfile' AND column_name='avatar_headshot_url') THEN
            ALTER TABLE public."ChildProfile" ADD COLUMN avatar_headshot_url TEXT;
          END IF;
          
          -- Add avatar_permissions column if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ChildProfile' AND column_name='avatar_permissions') THEN
            ALTER TABLE public."ChildProfile" ADD COLUMN avatar_permissions JSONB DEFAULT '{
              "can_customize": true,
              "can_chat": true,
              "chat_time_limit_minutes": 30
            }'::jsonb;
          END IF;
          
          -- Add index if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_child_profile_avatar_url') THEN
            CREATE INDEX idx_child_profile_avatar_url ON public."ChildProfile"(avatar_url);
          END IF;
        END $$;
      `
    })
    
    if (error) {
      console.error('SQL execution error:', error)
      return NextResponse.json({ error: 'Failed to add columns', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: 'Avatar columns added successfully' })
  } catch (error) {
    console.error('Add avatar columns error:', error)
    return NextResponse.json({ error: 'Failed to add columns', details: error }, { status: 500 })
  }
}