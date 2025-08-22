import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const childId = url.searchParams.get('childId')
    const sinceDays = parseInt(url.searchParams.get('days') || '7', 10)
    
    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 })
    }
    
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()
    // Use service role client to bypass RLS for child data access
    const supabase = createSupabaseServiceClient()

    // Get sessions for this child
    const { data: sessions, error: sessionsError } = await supabase
      .from('GameSession')
      .select('*')
      .eq('child_id', childId)
      .gte('started_at', since)

    if (sessionsError) {
      console.error('Child sessions query error:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Get assignments for this child
    const { data: assignments, error: assignmentsError } = await supabase
      .from('MoldAssignment')
      .select('*')
      .eq('child_id', childId)

    if (assignmentsError) {
      console.error('Child assignments query error:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    const sessionsData = sessions || []
    const assignmentsData = assignments || []

    const totalSessions = sessionsData.length
    const totalDuration = sessionsData.reduce((acc: number, s: any) => acc + (s.duration_seconds || 0), 0)
    const completedSessions = sessionsData.filter((s: any) => s.completion_status === 'completed').length
    const avgCompletion = sessionsData.length ? Math.round((completedSessions / sessionsData.length) * 100) : 0
    const completedAssignments = assignmentsData.filter((a: any) => a.status === 'completed').length

    // Extract skill metrics from sessions
    const skillAggregate: Record<string, { count: number; sum: number }> = {}
    sessionsData.forEach((s: any) => {
      if (s.skill_metrics) {
        const metrics = s.skill_metrics as Record<string, number>
        Object.entries(metrics).forEach(([k, v]) => {
          if (!skillAggregate[k]) skillAggregate[k] = { count: 0, sum: 0 }
          skillAggregate[k].count++
          skillAggregate[k].sum += v
        })
      }
    })
    const skills = Object.entries(skillAggregate).map(([skill, { count, sum }]) => ({ 
      skill, 
      value: count > 0 ? Math.round(sum / count) : 0 
    }))

    return NextResponse.json({ 
      totalSessions, 
      totalDuration, 
      avgCompletion, 
      completedAssignments,
      skills 
    })
  } catch (error) {
    console.error('Child analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
