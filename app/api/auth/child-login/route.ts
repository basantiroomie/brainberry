import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { accessCode } = await req.json()

    if (!accessCode) {
      return NextResponse.json({ error: 'Access code is required' }, { status: 400 })
    }

    // Find child by access code using raw SQL
    const children = await prisma.$queryRaw`
      SELECT c.*, u.name as parentName FROM ChildProfile c
      JOIN User u ON c.userId = u.id
      WHERE c.accessCode = ${accessCode.toString()}
      LIMIT 1
    ` as any[]

    if (children.length === 0) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 })
    }

    const child = children[0]

    // Create JWT token for child
    const token = jwt.sign(
      { childId: child.id, userId: child.userId, type: 'child' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    return NextResponse.json({
      child: {
        id: child.id,
        name: child.name,
        age: child.age,
        diagnosis: child.diagnosis
      },
      token
    })

  } catch (error) {
    console.error('Child login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
