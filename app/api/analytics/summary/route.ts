import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(req.url)
    const childId = url.searchParams.get('childId') || undefined
    const sinceDays = parseInt(url.searchParams.get('days') || '7', 10)
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await createSupabaseServerClient()

    // Get sessions with optional childId filter
    let sessionsQuery = supabase
      .from('GameSession')
      .select('*')
      .gte('started_at', since)
    
    if (childId) {
      sessionsQuery = sessionsQuery.eq('child_id', childId)
    }

    // Get assignments with optional childId filter
    let assignmentsQuery = supabase
      .from('MoldAssignment')
      .select('*')
    
    if (childId) {
      assignmentsQuery = assignmentsQuery.eq('child_id', childId)
    }

    const [sessionsResult, assignmentsResult] = await Promise.all([
      sessionsQuery,
      assignmentsQuery
    ])

    if (sessionsResult.error) {
      console.error('Sessions query error:', sessionsResult.error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }
    
    if (assignmentsResult.error) {
      console.error('Assignments query error:', assignmentsResult.error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    const sessions = sessionsResult.data || []
    const assignments = assignmentsResult.data || []

    const totalSessions = sessions.length
    const totalDuration = sessions.reduce((acc: number, s: any) => acc + (s.duration_sec || 0), 0)
    const avgCompletion = sessions.length ? 
      Math.round(sessions.reduce((a: number, s: any) => a + (s.completion_percent || 0), 0) / sessions.length) : 0
    const engagementRate = assignments.length ? 
      Math.round((assignments.filter(a => (a.progress || 0) > 0).length / assignments.length) * 100) : 0

    const skillAggregate: Record<string, { count: number; sum: number }> = {}
    sessions.forEach((s: any) => {
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

    return NextResponse.json({ totalSessions, totalDuration, avgCompletion, engagementRate, skills })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
