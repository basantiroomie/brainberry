import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check if avatar_url column exists and get all children with their avatar status
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, access_code')
      .limit(10)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ 
        error: 'Database error', 
        details: error,
        message: 'Failed to query children'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      children: children || [],
      avatarStatus: children?.map(child => ({
        id: child.id,
        name: child.name,
        hasAvatar: !!child.avatar_url,
        avatarUrl: child.avatar_url,
        accessCode: child.access_code
      })) || [],
      message: 'Avatar flow debug data retrieved successfully'
    })
  } catch (error) {
    console.error('Debug avatar flow error:', error)
    return NextResponse.json({ 
      error: 'Failed to debug avatar flow', 
      details: error 
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { childId, avatarUrl } = await req.json()
    
    if (!childId || !avatarUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        required: ['childId', 'avatarUrl']
      }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()
    
    // Test updating a child's avatar
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .update({ avatar_url: avatarUrl })
      .eq('id', childId)
      .select()
      .single()
    
    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ 
        error: 'Failed to update avatar', 
        details: error 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      child,
      message: 'Avatar updated successfully'
    })
  } catch (error) {
    console.error('Test avatar update error:', error)
    return NextResponse.json({ 
      error: 'Failed to test avatar update', 
      details: error 
    }, { status: 500 })
  }
}