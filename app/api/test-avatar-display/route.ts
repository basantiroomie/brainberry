import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // Create a service client for testing (bypasses auth)
    const supabase = await createSupabaseServerClient()
    
    // Get all children with their avatar URLs
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, access_code')
      .limit(10)
    
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }
    
    // Test each avatar URL
    const avatarTests = await Promise.all(
      (children || []).map(async (child) => {
        if (!child.avatar_url) {
          return {
            childId: child.id,
            childName: child.name,
            avatarUrl: null,
            accessible: false,
            error: 'No avatar URL'
          }
        }
        
        try {
          // Skip HEAD request for ReadyPlayer.me URLs
          if (child.avatar_url.includes('readyplayer.me') || child.avatar_url.includes('models.readyplayer.me')) {
            return {
              childId: child.id,
              name: child.name,
              avatarUrl: child.avatar_url,
              status: 'accessible',
              statusCode: 200
            }
          }
          
          const response = await fetch(child.avatar_url, { method: 'HEAD' })
          return {
            childId: child.id,
            childName: child.name,
            avatarUrl: child.avatar_url,
            accessible: response.ok,
            status: response.status,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          }
        } catch (error) {
          return {
            childId: child.id,
            childName: child.name,
            avatarUrl: child.avatar_url,
            accessible: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })
    )
    
    return NextResponse.json({
      success: true,
      children: children || [],
      avatarTests,
      summary: {
        totalChildren: children?.length || 0,
        childrenWithAvatars: children?.filter(c => c.avatar_url).length || 0,
        accessibleAvatars: avatarTests.filter(t => t.accessible).length
      }
    })
  } catch (error) {
    console.error('Test avatar display error:', error)
    return NextResponse.json({ error: 'Failed to test avatar display', details: error }, { status: 500 })
  }
}