import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { assignmentUpdateSchema } from '@/lib/schemas'
import { requireEducator } from '@/lib/supabase-server'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const resolvedParams = await params
    const json = await req.json()
    const parsed = assignmentUpdateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    
    const data = parsed.data
    const supabase = await createSupabaseServerClient()
    
    const { data: assignment, error } = await supabase
      .from('MoldAssignment')
      .update({
        status: data.status,
        progress: data.progress
      })
      .eq('id', resolvedParams.id)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }
    
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('PUT assignment error:', error)
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params
    
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('MoldAssignment')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE assignment error:', error)
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
  }
}
