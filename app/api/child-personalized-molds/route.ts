import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Public endpoint for children to fetch their personalized molds by child_id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const child_id = searchParams.get('child_id')
    
    console.log('Child personalized molds API called with child_id:', child_id)
    
    if (!child_id) {
      console.log('No child_id provided')
      return NextResponse.json({ error: 'child_id required' }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()
    console.log('Supabase client created')
    
    const { data: personalizedMolds, error } = await supabase
      .from('PersonalizedMold')
      .select(`
        id,
        title,
        config,
        created_at,
        mold_id
      `)
      .eq('child_id', child_id)
      .order('created_at', { ascending: false })
    
    console.log('Database query result:', { data: personalizedMolds, error })
    
    if (error) {
      console.error('Get child personalized molds error:', error)
      return NextResponse.json({ error: 'Failed to fetch personalized molds' }, { status: 500 })
    }
    
    console.log('Returning personalized molds:', personalizedMolds?.length || 0, 'items')
    return NextResponse.json(personalizedMolds || [])
  } catch (error) {
    console.error('Get child personalized molds catch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
