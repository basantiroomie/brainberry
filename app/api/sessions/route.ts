import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
import { sessionCreateSchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(req.url)
    const childId = url.searchParams.get('childId')
    
    const supabase = await createSupabaseServerClient()
    
    let query = supabase
      .from('GameSession')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(100)
    
    if (childId) {
      query = query.eq('child_id', childId)
    }
    
    const { data: sessions, error } = await query
    
    if (error) {
      console.error('Get sessions error:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }
    
    return NextResponse.json(sessions || [])
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const json = await req.json()
    const parsed = sessionCreateSchema.safeParse(json)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    
    const data = parsed.data
    const supabase = await createSupabaseServerClient()
    
    // Create the session
    const { data: session, error } = await supabase
      .from('GameSession')
      .insert({
        child_id: data.childId,
        mold_id: data.moldId,
        assignment_id: data.assignmentId,
        duration_seconds: data.durationSec,
        completion_status: data.completionPercent >= 100 ? 'completed' : 'in_progress',
        score: data.completionPercent || 0,
        progress_data: data.skillMetrics || {},
        ended_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Create session error:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }
    
    // Update assignment progress if assignment present
    if (data.assignmentId) {
      try {
        const { data: assignment, error: assignmentError } = await supabase
          .from('MoldAssignment')
          .select('*')
          .eq('id', data.assignmentId)
          .single()
        
        if (!assignmentError && assignment) {
          const newProgress = Math.max(assignment.progress || 0, data.completionPercent)
          let newStatus = assignment.status
          if (data.completionPercent >= 100) newStatus = 'completed'
          else if (data.completionPercent > 0 && assignment.status === 'assigned') newStatus = 'in-progress'
          
          await supabase
            .from('MoldAssignment')
            .update({ 
              progress: newProgress, 
              status: newStatus 
            })
            .eq('id', assignment.id)
        }
      } catch (e) {
        console.error('Update assignment error:', e)
        // Silent fail for prototype
      }
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Create session error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
