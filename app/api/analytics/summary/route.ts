import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const childId = url.searchParams.get('childId') || undefined
  const sinceDays = parseInt(url.searchParams.get('days') || '7', 10)
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000)

  // Safe access for gameSession delegate (workaround if Prisma types not exposing it)
  const clientAny = prisma as any
  const sessionDelegate = clientAny.gameSession
  const [sessions, assignments] = await Promise.all([
    sessionDelegate ? sessionDelegate.findMany({ where: { childId, startedAt: { gte: since } } }) : Promise.resolve([]),
    prisma.moldAssignment.findMany({ where: { childId } })
  ])

  const totalSessions = sessions.length
  const totalDuration = sessions.reduce((acc: number, s: typeof sessions[number]) => acc + s.durationSec, 0)
  const avgCompletion = sessions.length ? Math.round(sessions.reduce((a: number,s: typeof sessions[number]) => a + s.completionPercent,0) / sessions.length) : 0
  const engagementRate = assignments.length ? Math.round((assignments.filter(a => a.progress>0).length / assignments.length) * 100) : 0

  const skillAggregate: Record<string,{ count:number; sum:number }> = {}
  sessions.forEach((s: any) => {
    if (s.skillMetrics) {
      const metrics = s.skillMetrics as Record<string, number>
      Object.entries(metrics).forEach(([k,v]) => {
        if (!skillAggregate[k]) skillAggregate[k] = { count:0, sum:0 }
        skillAggregate[k].count++
        skillAggregate[k].sum += v
      })
    }
  })
  const skills = Object.entries(skillAggregate).map(([skill, { count, sum }]) => ({ skill, value: Math.round(sum / count) }))

  return NextResponse.json({ totalSessions, totalDuration, avgCompletion, engagementRate, skills })
}
