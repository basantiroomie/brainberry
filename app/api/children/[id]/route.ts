import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { childCreateSchema } from '@/lib/schemas'
import { requireEducator } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .select(`
        *,
        assignments:MoldAssignment(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(child)
  } catch (error) {
    console.error('GET child error:', error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const json = await req.json()
    const parsed = childCreateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    
    const { id } = await params
    const data = parsed.data
    const supabase = await createSupabaseServerClient()
    
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .update({
        name: data.name,
        age: data.age,
        diagnosis: data.diagnosis,
        notes: data.notes
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
    }
    
    return NextResponse.json(child)
  } catch (error) {
    console.error('PUT child error:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('ChildProfile')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE child error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}
