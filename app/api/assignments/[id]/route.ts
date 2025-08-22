import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  const assignment = await prisma.moldAssignment.update({ where: { id: params.id }, data: { status: data.status, progress: data.progress, lastInteraction: new Date() } })
  return NextResponse.json(assignment)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.moldAssignment.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
