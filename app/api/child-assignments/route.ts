import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const childId = url.searchParams.get('childId')
    
    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 })
    }
    
    // Use service role client to bypass RLS for child data access
    const supabase = createSupabaseServiceClient()
    
    // Get assignments for this child with related mold data
    const { data: assignments, error } = await supabase
      .from('MoldAssignment')
      .select(`
        *,
        mold:GameMold(
          id,
          name,
          category,
          primary_objective,
          age_min,
          age_max
        )
      `)
      .eq('child_id', childId)
      .order('assigned_at', { ascending: false })
    
    if (error) {
      console.error('Get child assignments error:', error)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }
    
    // Transform to match expected format
    const transformedAssignments = (assignments || []).map(assignment => ({
      id: assignment.id,
      moldName: assignment.mold?.name || 'Unknown Game',
      assignedAt: assignment.assigned_at,
      completedAt: assignment.status === 'completed' ? assignment.assigned_at : null,
      progress: assignment.progress || 0,
      status: assignment.status,
      mold: {
        id: assignment.mold?.id || '',
        name: assignment.mold?.name || 'Unknown Game',
        category: assignment.mold?.category || 'General',
        primaryObjective: assignment.mold?.primary_objective || '',
        difficulty: 'Medium' // Default difficulty, could be calculated from age range
      }
    }))
    
    return NextResponse.json(transformedAssignments)
  } catch (error) {
    console.error('Child assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}
