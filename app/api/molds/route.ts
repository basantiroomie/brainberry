import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
// NOTE: Molds are now immutable developer-seeded templates.
// Creation via API has been disabled. If you need to seed/update molds,
// use Supabase SQL migrations or an internal admin script not exposed to educators.
// (Old create logic removed / guarded.)
import { gameMoldCreateSchema } from '@/lib/schemas'

// List & Create
export async function GET(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    const summary = req.nextUrl.searchParams.get('summary')

    // Prefer the extended/modern column set; gracefully fall back if migrations aren't applied
    const summarySelectModern = 'id,name,category,structure_type,experience_type,primary_objective,version,age_min,age_max,metadata'
    const summarySelectLegacy = 'id,name,category,structure_type,experience_type,primary_objective,version,age_min,age_max'
    const fullSelect = `*, scenes:Scene(*, assets:Asset(*))`

    async function runSelect(select: string) {
      return await supabase
        .from('GameMold')
        .select(select as any)
        .order('updated_at', { ascending: false })
    }

    let molds: any[] | null = null
    let error: any | null = null

    if (summary) {
      // First try modern schema (includes metadata)
      const res1 = await runSelect(summarySelectModern)
      molds = res1.data
      error = res1.error

      // If the error is due to a missing column (likely metadata), retry with legacy selection
      if (error && error.message?.includes('column') && error.message?.includes('does not exist')) {
        console.warn('[molds] Falling back to legacy column set due to missing migrations:', error.message)
        const res2 = await runSelect(summarySelectLegacy)
        molds = res2.data
        error = res2.error
      }
    } else {
      const res = await runSelect(fullSelect)
      molds = res.data
      error = res.error
    }

    if (error) {
      console.error('Get molds error:', error)

      // Check if it's a paused project error
      if (error.message?.includes('column') && error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Database schema issue - some migrations may not be applied', 
          details: error.message 
        }, { status: 500 })
      }

      // Check for connection/timeout errors that might indicate paused project
      if (error.message?.includes('timeout') || error.message?.includes('connection') || error.code === 'PGRST301') {
        return NextResponse.json({ 
          error: 'Database connection issue - project may be paused. Please check Supabase dashboard.', 
          details: error.message 
        }, { status: 503 })
      }

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
