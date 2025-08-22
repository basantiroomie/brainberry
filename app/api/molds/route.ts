import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
import { gameMoldCreateSchema } from '@/lib/schemas'

// List & Create
export async function GET() {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    const { data: molds, error } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
    
    if (error) {
      console.error('Get molds error:', error)
      return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
    }
    
    return NextResponse.json(molds || [])
  } catch (error) {
    console.error('Get molds error:', error)
    return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const json = await req.json()
    const parsed = gameMoldCreateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    
    const data = parsed.data
    const supabase = await createSupabaseServerClient()
    
    // Create the mold first
    const { data: newMold, error: moldError } = await supabase
      .from('GameMold')
      .insert({
        name: data.name,
        category: data.category,
        structure_type: data.structure_type,
        experience_type: data.experience_type,
        primary_objective: data.primary_objective,
        rules: data.rules,
        lock_structure: data.lock_structure,
        allow_themes: data.allow_themes,
        allow_pacing: data.allow_pacing,
        allow_rewards: data.allow_rewards,
        allow_avatars: data.allow_avatars,
        customization_notes: data.customization_notes,
        age_min: data.age_min,
        age_max: data.age_max
      })
      .select()
      .single()
    
    if (moldError) {
      console.error('Create mold error:', moldError)
      return NextResponse.json({ error: 'Failed to create mold' }, { status: 500 })
    }

    return NextResponse.json(newMold)
  } catch (error) {
    console.error('Create mold error:', error)
    return NextResponse.json({ error: 'Failed to create mold' }, { status: 500 })
  }
}
