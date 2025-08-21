import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const child = await prisma.childProfile.findUnique({ where: { id: params.id }, include: { assignments: true } })
  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(child)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const data = await req.json()
  const child = await prisma.childProfile.update({ where: { id: params.id }, data: { name: data.name, age: data.age, diagnosis: data.diagnosis, notes: data.notes } })
  return NextResponse.json(child)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.childProfile.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
