import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function PUT(req: NextRequest) {
  try {
    const json = await req.json()
    
    console.log('[DEBUG] PUT /api/child-avatar - Request received:', { 
      requestData: json,
      timestamp: new Date().toISOString()
    })
    
    // Validate required fields
    if (!json.childId || !json.avatar_url || !json.avatar_headshot_url) {
      return NextResponse.json({ 
        error: 'Missing required fields: childId, avatar_url, avatar_headshot_url' 
      }, { status: 400 })
    }
    
    const { childId, avatar_url, avatar_headshot_url } = json
    
    // Enhanced URL validation
    try {
      // Validate avatar_url (GLB file)
      const glbUrl = new URL(avatar_url)
      if (!glbUrl.hostname.includes('readyplayer.me') || !avatar_url.endsWith('.glb')) {
        console.error('[DEBUG] Invalid avatar URL:', avatar_url)
        return NextResponse.json({ 
          error: 'Invalid avatar URL. Must be a Ready Player Me GLB URL.' 
        }, { status: 400 })
      }
      
      // Validate avatar_headshot_url (PNG file)
      const pngUrl = new URL(avatar_headshot_url)
      if (!pngUrl.hostname.includes('readyplayer.me') || !avatar_headshot_url.endsWith('.png')) {
        console.error('[DEBUG] Invalid avatar headshot URL:', avatar_headshot_url)
        return NextResponse.json({ 
          error: 'Invalid avatar headshot URL. Must be a Ready Player Me PNG URL.' 
        }, { status: 400 })
      }
    } catch (urlError) {
      console.error('[DEBUG] URL parsing failed:', urlError)
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 })
    }
    
    console.log('[DEBUG] Avatar URLs validated successfully')
    
    // Use service client to bypass RLS for child avatar updates
    const serviceSupabase = createSupabaseServiceClient()
    
    // First verify the child exists
    const { data: existingChild, error: checkError } = await serviceSupabase
      .from('ChildProfile')
      .select('id, name')
      .eq('id', childId)
      .single()
    
    if (checkError || !existingChild) {
      console.error('[DEBUG] Child not found during avatar update:', { 
        childId,
        error: checkError,
        errorCode: checkError?.code,
        errorMessage: checkError?.message
      })
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }
    
    console.log('[DEBUG] Child found, proceeding with avatar update:', {
      childId: existingChild.id,
      childName: existingChild.name,
      avatarUrl: avatar_url,
      headshotUrl: avatar_headshot_url
    })
    
    // Update avatar data
    const { data: updatedChildren, error: updateError } = await serviceSupabase
      .from('ChildProfile')
      .update({
        avatar_url,
        avatar_headshot_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)
      .select(`
        *,
        assignments:MoldAssignment(*)
      `)
    
    if (updateError) {
      console.error('[DEBUG] Avatar update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update child avatar',
        details: updateError.message 
      }, { status: 500 })
    }
    
    if (!updatedChildren || updatedChildren.length === 0) {
      console.error('[DEBUG] No children returned after avatar update')
      return NextResponse.json({ error: 'Child not found or update failed' }, { status: 404 })
    }
    
    const child = updatedChildren[0]
    console.log('[DEBUG] Avatar update successful:', { 
      childId: child.id, 
      childName: child.name,
      avatarUrl: child.avatar_url,
      headshotUrl: child.avatar_headshot_url
    })
    
    return NextResponse.json({ 
      success: true, 
      child,
      message: 'Avatar updated successfully' 
    })
    
  } catch (error) {
    console.error('[DEBUG] PUT child-avatar error:', error)
    return NextResponse.json({ 
      error: 'Failed to update avatar',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
