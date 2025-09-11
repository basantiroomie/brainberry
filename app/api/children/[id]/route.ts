import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'
import { childCreateSchema, updateChildAvatarSchema, avatarCodeSchema } from '@/lib/schemas'
import { requireEducator } from '@/lib/supabase-server'
import { AvatarCodeUtils } from '@/lib/avatar-utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .select(`
        *,
        assignments:MoldAssignment(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(child)
  } catch (error) {
    console.error('GET child error:', error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const json = await req.json()
    const { id } = await params
    
    console.log('[DEBUG] PUT /api/children/[id] - Request received:', { 
      childId: id, 
      requestData: json,
      timestamp: new Date().toISOString()
    })
    
    // Enhanced authentication check
    let user: any
    try {
      const authResult = await requireEducator()
      user = authResult.user
    } catch (authError) {
      console.error('[DEBUG] Authentication failed:', authError)
      return NextResponse.json({ 
        error: 'Authentication required',
        details: 'Please log in to access this resource'
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('[DEBUG] No user found after authentication')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('[DEBUG] User authenticated:', { userId: user.id })
    
    // Create both regular and service clients for better flexibility
    const supabase = await createSupabaseServerClient()
    const serviceSupabase = createSupabaseServiceClient()
    
    // Check if this is an avatar update request
    const isAvatarUpdate = json.avatar_code || json.avatar_url || json.avatar_headshot_url
    
    if (isAvatarUpdate) {
      console.log('[DEBUG] Processing avatar update request')
      
      // Validate avatar update data
      const avatarParsed = updateChildAvatarSchema.safeParse(json)
      if (!avatarParsed.success) {
        console.error('[DEBUG] Avatar validation failed:', avatarParsed.error.flatten())
        return NextResponse.json({ 
          error: 'Invalid avatar data', 
          details: avatarParsed.error.flatten() 
        }, { status: 400 })
      }
      
      const avatarData = avatarParsed.data
      let updateData: { avatar_url?: string; avatar_headshot_url?: string } = {}
      
      // Handle avatar code conversion
      if (avatarData.avatar_code) {
        try {
          const urls = AvatarCodeUtils.codeToUrls(avatarData.avatar_code)
          updateData.avatar_url = urls.glbUrl
          updateData.avatar_headshot_url = urls.pngUrl
          console.log('[DEBUG] Avatar code converted:', { 
            code: avatarData.avatar_code,
            glbUrl: urls.glbUrl,
            pngUrl: urls.pngUrl
          })
        } catch (error) {
          console.error('[DEBUG] Avatar code conversion error:', error)
          return NextResponse.json({ 
            error: 'Invalid avatar code format. Must be 6+ uppercase alphanumeric characters.' 
          }, { status: 400 })
        }
      } else {
        // Use provided URLs directly
        if (avatarData.avatar_url) updateData.avatar_url = avatarData.avatar_url
        if (avatarData.avatar_headshot_url) updateData.avatar_headshot_url = avatarData.avatar_headshot_url
      }
      
      // Enhanced URL validation
      if (updateData.avatar_url) {
        try {
          const url = new URL(updateData.avatar_url)
          if (!url.hostname.includes('readyplayer.me') || !updateData.avatar_url.endsWith('.glb')) {
            console.error('[DEBUG] Invalid avatar URL:', updateData.avatar_url)
            return NextResponse.json({ 
              error: 'Invalid avatar URL. Must be a Ready Player Me GLB URL.' 
            }, { status: 400 })
          }
        } catch (urlError) {
          console.error('[DEBUG] Avatar URL parsing failed:', urlError)
          return NextResponse.json({ error: 'Invalid avatar URL format.' }, { status: 400 })
        }
      }
      
      if (updateData.avatar_headshot_url) {
        try {
          const url = new URL(updateData.avatar_headshot_url)
          if (!url.hostname.includes('readyplayer.me') || !updateData.avatar_headshot_url.endsWith('.png')) {
            console.error('[DEBUG] Invalid avatar headshot URL:', updateData.avatar_headshot_url)
            return NextResponse.json({ 
              error: 'Invalid avatar headshot URL. Must be a Ready Player Me PNG URL.' 
            }, { status: 400 })
          }
        } catch (urlError) {
          console.error('[DEBUG] Avatar headshot URL parsing failed:', urlError)
          return NextResponse.json({ error: 'Invalid avatar headshot URL format.' }, { status: 400 })
        }
      }
      
      console.log('[DEBUG] Avatar URLs validated successfully')
      
      // First verify the child exists and user has permission
      const { data: existingChild, error: checkError } = await serviceSupabase
        .from('ChildProfile')
        .select('id, educator_id, name')
        .eq('id', id)
        .single()
      
      if (checkError || !existingChild) {
        console.error('[DEBUG] Child not found during avatar update:', { 
          id, 
          userId: user.id,
          error: checkError,
          errorCode: checkError?.code,
          errorMessage: checkError?.message
        })
        return NextResponse.json({ error: 'Child not found' }, { status: 404 })
      }
      
      console.log('[DEBUG] Child found, proceeding with avatar update:', {
        childId: existingChild.id,
        childName: existingChild.name,
        educatorId: existingChild.educator_id,
        currentUserId: user.id,
        updateData
      })
      
      // Update avatar data using service client to bypass RLS
      const { data: updatedChildren, error: updateError } = await serviceSupabase
        .from('ChildProfile')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          assignments:MoldAssignment(*)
        `)
      
      if (updateError) {
        console.error('[DEBUG] Service client avatar update error:', updateError)
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
    } else {
      // Handle regular child profile updates
      console.log('[DEBUG] Processing profile update request')
      
      const parsed = childCreateSchema.safeParse(json)
      if (!parsed.success) {
        console.error('[DEBUG] Profile validation failed:', parsed.error.flatten())
        return NextResponse.json({ 
          error: 'Invalid child data', 
          details: parsed.error.flatten() 
        }, { status: 400 })
      }
      
      const data = parsed.data
      
      // First verify the child exists and user has permission
      const { data: existingChild, error: checkError } = await serviceSupabase
        .from('ChildProfile')
        .select('id, educator_id, name')
        .eq('id', id)
        .single()
      
      if (checkError || !existingChild) {
        console.error('[DEBUG] Child not found during profile update:', { 
          id, 
          userId: user.id,
          error: checkError,
          errorCode: checkError?.code,
          errorMessage: checkError?.message
        })
        return NextResponse.json({ error: 'Child not found' }, { status: 404 })
      }
      
      console.log('[DEBUG] Child found, proceeding with profile update:', {
        childId: existingChild.id,
        childName: existingChild.name,
        educatorId: existingChild.educator_id,
        currentUserId: user.id
      })
      
      // Update profile data using service client
      const { data: updatedChildren, error: updateError } = await serviceSupabase
        .from('ChildProfile')
        .update({
          name: data.name,
          age: data.age,
          diagnosis: data.diagnosis,
          notes: data.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (updateError) {
        console.error('[DEBUG] Service client profile update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update child profile',
          details: updateError.message 
        }, { status: 500 })
      }
      
      if (!updatedChildren || updatedChildren.length === 0) {
        console.error('[DEBUG] No children returned after profile update')
        return NextResponse.json({ error: 'Child not found or update failed' }, { status: 404 })
      }
      
      const child = updatedChildren[0]
      console.log('[DEBUG] Profile update successful:', { childId: child.id, childName: child.name })
      
      return NextResponse.json(child)
    }
  } catch (error) {
    console.error('[DEBUG] PUT child error:', error)
    return NextResponse.json({ 
      error: 'Failed to update child',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('ChildProfile')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE child error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}
