import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient()
    
    console.log('Debug: Attempting to fetch children from database...')
    
    // Get all children with their access codes
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, age, access_code, created_at')
      .order('created_at', { ascending: false })
    
    console.log('Debug: Query result:', { children, error })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      count: children?.length || 0,
      children: children || [],
      debug: {
        query: 'SELECT id, name, age, access_code, created_at FROM ChildProfile ORDER BY created_at DESC',
        error: error
      }
    })
  } catch (error) {
    console.error('Debug children error:', error)
    return NextResponse.json({ error: 'Failed to fetch children', details: error }, { status: 500 })
  }
}