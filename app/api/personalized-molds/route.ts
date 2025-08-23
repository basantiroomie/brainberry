import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// List personalized molds for current child (by session) or educator's children
export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Determine if user is educator or child by presence in EducatorAccount
    const { data: educator } = await supabase.from('EducatorAccount').select('id').eq('id', user.id).maybeSingle()

    if (educator) {
      // Educator: fetch personalized molds for their children
      const { data, error } = await supabase
        .from('PersonalizedMold')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json(data || [])
    } else {
      // Child: need to map user -> child profile (assuming user.id stored or mapping table)
      // For now attempt child profile with matching id (adjust if auth model differs)
      const { data: child } = await supabase.from('ChildProfile').select('id').eq('id', user.id).maybeSingle()
      if (!child) return NextResponse.json([])
      const { data, error } = await supabase
        .from('PersonalizedMold')
        .select('*')
        .eq('child_id', child.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json(data || [])
    }
  } catch (e) {
    console.error('List personalized molds error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// Create a new personalized mold (child initiated)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { mold_id, child_id, title, config } = body || {}
    if (!mold_id) return NextResponse.json({ error: 'mold_id required' }, { status: 400 })
    if (!child_id) return NextResponse.json({ error: 'child_id required' }, { status: 400 })

    const { data, error } = await supabase
      .from('PersonalizedMold')
      .insert({ mold_id, child_id, title, config })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (e) {
    console.error('Create personalized mold error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}