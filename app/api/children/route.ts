import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const children = await prisma.childProfile.findMany({ include: { assignments: true } })
  return NextResponse.json(children)
}

export async function POST(req: NextRequest) {
  const data = await req.json()
  if (!data.name || !data.age) return NextResponse.json({ error: 'Name & age required' }, { status: 400 })
  const child = await prisma.childProfile.create({ data: { name: data.name, age: data.age, diagnosis: data.diagnosis || 'UNKNOWN', notes: data.notes } })
  return NextResponse.json(child)
}
