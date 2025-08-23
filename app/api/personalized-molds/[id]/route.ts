import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { data: personalizedMold, error } = await supabase
      .from('PersonalizedMold')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !personalizedMold) {
      return NextResponse.json({ error: 'Personalized mold not found' }, { status: 404 })
    }

    return NextResponse.json(personalizedMold)

  } catch (error) {
    console.error('Get personalized mold error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('PersonalizedMold')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete personalized mold error:', error)
      return NextResponse.json({ error: 'Failed to delete personalized mold' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete personalized mold error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
