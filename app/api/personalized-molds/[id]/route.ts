import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: personalizedMold, error } = await supabase
      .from('PersonalizedMold')
      .select('*')
      .eq('id', params.id)
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
