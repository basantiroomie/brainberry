import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST() {
  try {
    // Create a demo user
    const hashedPassword = await bcrypt.hash('demo123', 12)
    
    // Use raw SQL for now to bypass TypeScript issues
    const user = await prisma.$queryRaw`
      INSERT INTO User (id, name, email, password, role, phone, license, organization, createdAt, updatedAt)
      VALUES (
        ${crypto.randomUUID()},
        'Demo User',
        'demo@brainberry.com',
        ${hashedPassword},
        'PARENT',
        '+1-555-123-4567',
        null,
        'Demo Organization',
        datetime('now'),
        datetime('now')
      )
      RETURNING *
    ` as any

    const userId = await prisma.$queryRaw`SELECT id FROM User WHERE email = 'demo@brainberry.com'` as any
    const actualUserId = userId[0]?.id

    if (!actualUserId) {
      throw new Error('Failed to create user')
    }

    // Create demo children
    await prisma.$queryRaw`
      INSERT INTO ChildProfile (id, name, age, diagnosis, notes, accessCode, userId, createdAt)
      VALUES 
        (${crypto.randomUUID()}, 'Alice', 8, 'ADHD', 'Responds well to visual cues', '123456', ${actualUserId}, datetime('now')),
        (${crypto.randomUUID()}, 'Bobby', 7, 'ASD', 'Loves puzzles and patterns', '789012', ${actualUserId}, datetime('now'))
    `

    return NextResponse.json({ 
      message: 'Demo data created successfully',
      loginDetails: {
        email: 'demo@brainberry.com',
        password: 'demo123',
        childCodes: ['123456', '789012']
      }
    })

  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
