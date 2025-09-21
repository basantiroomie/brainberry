import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const resolvedParams = await params
    const supabase = await createSupabaseServerClient()
    
    const { data: mold, error } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
      .eq('id', resolvedParams.id)
      .single()
    
    if (error || !mold) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(mold)
  } catch (error) {
    console.error('Get mold error:', error)
    return NextResponse.json({ error: 'Failed to fetch mold' }, { status: 500 })
  }
}

export async function PUT(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: 'Molds are immutable.' }, { status: 405 })
}

export async function DELETE(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: 'Molds cannot be deleted.' }, { status: 405 })
}
