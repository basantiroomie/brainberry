import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (decoded.type !== 'child') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 })
    }

    // Get child assignments with mold details
    const assignments = await prisma.moldAssignment.findMany({
      where: { childId: decoded.childId },
      include: {
        mold: {
          include: {
            scenes: {
              include: {
                assets: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(assignments)

  } catch (error) {
    console.error('Get assignments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (decoded.type !== 'child') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 })
    }

    const { assignmentId, progress, status } = await req.json()

    // Update assignment progress
    const updated = await prisma.moldAssignment.update({
      where: { 
        id: assignmentId,
        childId: decoded.childId // Ensure child can only update their own assignments
      },
      data: {
        progress: progress !== undefined ? progress : undefined,
        status: status || undefined
      }
    })

    return NextResponse.json(updated)

  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 })
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    if (decoded.type !== 'child') {
      return NextResponse.json({ error: 'Invalid token type' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('id')

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
    }

    // Delete assignment (child can remove games from their list)
    await prisma.moldAssignment.delete({
      where: { 
        id: assignmentId,
        childId: decoded.childId // Ensure child can only delete their own assignments
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Delete assignment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
