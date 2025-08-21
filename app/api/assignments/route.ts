import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const url = new URL(req.url)
    const childId = url.searchParams.get('childId') || undefined

    if (childId) {
      // Return assignments for specific child
      const assignments = await prisma.moldAssignment.findMany({
        where: { 
          childId,
          child: { userId } // Ensure child belongs to authenticated user
        },
        include: { 
          mold: {
            include: {
              scenes: true
            }
          },
          child: true 
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(assignments)
    } else {
      // Return all assignments for user's children
      const assignments = await prisma.moldAssignment.findMany({
        where: { 
          child: { userId } // Only assignments for this user's children
        },
        include: { 
          mold: {
            include: {
              scenes: true
            }
          },
          child: true 
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(assignments)
    }
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    const data = await req.json()
    if (!data.moldId || !data.childId) {
      return NextResponse.json({ error: 'moldId & childId required' }, { status: 400 })
    }

    // Verify child belongs to authenticated user
    const child = await prisma.childProfile.findFirst({
      where: { id: data.childId, userId }
    })

    if (!child) {
      return NextResponse.json({ error: 'Child not found or unauthorized' }, { status: 404 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.moldAssignment.findFirst({
      where: { moldId: data.moldId, childId: data.childId }
    })

    if (existingAssignment) {
      return NextResponse.json({ error: 'Game already assigned to this child' }, { status: 400 })
    }

    const assignment = await prisma.moldAssignment.create({ 
      data: { moldId: data.moldId, childId: data.childId },
      include: { 
        mold: {
          include: {
            scenes: true
          }
        },
        child: true 
      }
    })
    
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
