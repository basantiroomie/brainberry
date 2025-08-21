import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessionCreateSchema } from '@/lib/schemas'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const childId = url.searchParams.get('childId') || undefined
  const sessions = await (prisma as any).gameSession.findMany({ where: { childId }, orderBy: { startedAt: 'desc' }, take: 100 })
  return NextResponse.json(sessions)
}

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = sessionCreateSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  // Auto-set endedAt (approximate) and maintain assignment linkage cohesion
  const session = await (prisma as any).gameSession.create({ data: {
    childId: data.childId,
    moldId: data.moldId,
    assignmentId: data.assignmentId,
    durationSec: data.durationSec,
    completionPercent: data.completionPercent,
    mode: data.mode,
    notes: data.notes,
    skillMetrics: data.skillMetrics,
    endedAt: new Date()
  } })
  // If assignment present, update lastInteraction, progress, and status heuristically
  if (data.assignmentId) {
    try {
  const assignment = await prisma.moldAssignment.findUnique({ where: { id: data.assignmentId } })
      if (assignment) {
        const newProgress = Math.max(assignment.progress, data.completionPercent)
        let newStatus = assignment.status
        if (data.completionPercent >= 100) newStatus = 'completed'
        else if (data.completionPercent > 0 && assignment.status === 'assigned') newStatus = 'in-progress'
        await prisma.moldAssignment.update({ where: { id: assignment.id }, data: { lastInteraction: new Date(), progress: newProgress, status: newStatus } })
      }
    } catch (e) {
      // Silent fail for prototype; could log
    }
  }
  return NextResponse.json(session)
}
