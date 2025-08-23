import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Public endpoint for children to fetch available game molds
// No authentication required as molds are public templates
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: molds, error } = await supabase
      .from('GameMold')
      .select(`
        id,
        name,
        category,
        experience_type,
        primary_objective,
        age_min,
        age_max,
        customization_notes
      `)
      .order('name')
    
    if (error) {
      console.error('Get child molds error:', error)
      return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
    }
    
    return NextResponse.json(molds || [])
  } catch (error) {
    console.error('Get child molds error:', error)
    return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
  }
}
