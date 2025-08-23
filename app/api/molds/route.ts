import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
// NOTE: Molds are now immutable developer-seeded templates.
// Creation via API has been disabled. If you need to seed/update molds,
// use Supabase SQL migrations or an internal admin script not exposed to educators.
// (Old create logic removed / guarded.)
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

export async function POST(_req: NextRequest) {
  return NextResponse.json({ error: 'Molds are immutable. Use migrations to add new molds.' }, { status: 405 })
}
