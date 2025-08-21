import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporary simplified version without authentication for now
export async function GET() {
  try {
    const children = await prisma.childProfile.findMany({
      include: { assignments: true }
    })
    return NextResponse.json(children)
  } catch (error) {
    console.error('Get children error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.name || !data.age) {
      return NextResponse.json({ error: 'Name & age required' }, { status: 400 })
    }

    // Generate simple access code for now
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString()

    const child = await prisma.childProfile.create({
      data: {
        name: data.name,
        age: data.age,
        diagnosis: data.diagnosis || 'UNKNOWN',
        notes: data.notes,
        accessCode,
        userId: data.userId || 'temp-user' // Temporary user ID
      }
    })

    return NextResponse.json(child)
  } catch (error) {
    console.error('Create child error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
