import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(req.url)
    const childId = url.searchParams.get('childId')
    const moldId = url.searchParams.get('moldId')
    
    const supabase = await createSupabaseServerClient()
    
    let query = supabase
      .from('MoldAssignment')
      .select(`
        *,
        mold:GameMold(*),
        child:ChildProfile(*)
      `)
      .order('assigned_at', { ascending: false })
    
    if (childId) query = query.eq('child_id', childId)
    if (moldId) query = query.eq('mold_id', moldId)
    
    const { data: assignments, error } = await query
    
    if (error) {
      console.error('Get assignments error:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }
    
    return NextResponse.json(assignments || [])
  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const data = await req.json()
    if (!data.mold_id || !data.child_id) {
      return NextResponse.json({ error: 'mold_id & child_id required' }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()
    
    const { data: assignment, error } = await supabase
      .from('MoldAssignment')
      .insert({
        mold_id: data.mold_id,
        child_id: data.child_id,
        educator_id: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Create assignment error:', error)
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }
    
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
