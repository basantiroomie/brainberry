import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requireEducator } from '@/lib/supabase-server'

export async function GET(_req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, created_at, avatar_url')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }
    
    return NextResponse.json({
      count: children?.length || 0,
      children: children || [],
      requestedBy: user.id
    })
  } catch (error) {
    console.error('Debug children error:', error)
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 })
  }
}