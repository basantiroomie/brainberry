import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Find the assignment and verify ownership
    const existingAssignment = await prisma.moldAssignment.findFirst({
      where: { 
        id: params.id,
        child: { userId } // Ensure child belongs to authenticated user
      }
    })

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 })
    }

    const data = await req.json()
    const assignment = await prisma.moldAssignment.update({ 
      where: { id: params.id }, 
      data: { 
        status: data.status, 
        progress: data.progress, 
        lastInteraction: new Date() 
      } 
    })
    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    const userId = decoded.userId

    // Find the assignment and verify ownership
    const assignment = await prisma.moldAssignment.findFirst({
      where: { 
        id: params.id,
        child: { userId } // Ensure child belongs to authenticated user
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 })
    }

    await prisma.moldAssignment.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
