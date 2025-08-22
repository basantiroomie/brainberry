import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const childId = url.searchParams.get('childId') || undefined
  const moldId = url.searchParams.get('moldId') || undefined
  const assignments = await prisma.moldAssignment.findMany({
    where: { childId, moldId },
    include: { mold: true, child: true },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  if (!data.moldId || !data.childId) return NextResponse.json({ error: 'moldId & childId required' }, { status: 400 })
  const assignment = await prisma.moldAssignment.create({ data: { moldId: data.moldId, childId: data.childId } })
  return NextResponse.json(assignment)
}
