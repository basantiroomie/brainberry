import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { updateAvatarRequestSchema } from '@/lib/schemas'
import { z } from 'zod'

export async function PUT(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateAvatarRequestSchema.parse(body)
    
    const { childId, avatarConfig } = validatedData

    // Create Supabase client
    const supabase = await createSupabaseServerClient()

    // Get the current user (should be authenticated)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify the child exists
    const { data: child, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, educator_id')
      .eq('id', childId)
      .single()

    if (childError || !child) {
      return NextResponse.json(
        { success: false, error: 'Child not found' },
        { status: 404 }
      )
    }

    // For now, we'll simulate the Ready Player Me API call
    // In a real implementation, you would:
    // 1. Call Ready Player Me API to update the avatar with new assets
    // 2. Get the updated avatar URL from the response
    // 3. Optionally generate a new headshot image
    
    // Simulate Ready Player Me API call
    const updatedAvatarUrl = await updateReadyPlayerMeAvatar(child.avatar_url, avatarConfig)
    const headshotUrl = await generateHeadshotFromAvatar(updatedAvatarUrl)

    // Update the child profile with new avatar URLs
    const { error: updateError } = await supabase
      .from('ChildProfile')
      .update({
        avatar_url: updatedAvatarUrl,
        avatar_headshot_url: headshotUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to save avatar changes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      avatarUrl: updatedAvatarUrl,
      headshotUrl: headshotUrl
    })

  } catch (error) {
    console.error('Avatar update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simulate Ready Player Me avatar update
async function updateReadyPlayerMeAvatar(currentAvatarUrl: string | null, avatarConfig: any): Promise<string> {
  // In a real implementation, this would call the Ready Player Me API
  // PATCH /v2/avatars/:avatarId with the new asset configuration
  
  try {
    const rpmApiKey = process.env.RPM_API_KEY
    if (!rpmApiKey) {
      console.warn('Ready Player Me API key not configured, using mock response')
      return currentAvatarUrl || 'https://models.readyplayer.me/mock-updated-avatar.glb'
    }

    // Extract avatar ID from current URL if available
    const avatarId = extractAvatarIdFromUrl(currentAvatarUrl)
    if (!avatarId) {
      throw new Error('Cannot extract avatar ID from current URL')
    }

    // Call Ready Player Me API to update avatar
    const response = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${rpmApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assets: avatarConfig.assets
      })
    })

    if (!response.ok) {
      throw new Error(`Ready Player Me API error: ${response.status}`)
    }

    const result = await response.json()
    return result.data?.renders?.[0]?.url || currentAvatarUrl || 'https://models.readyplayer.me/updated-avatar.glb'

  } catch (error) {
    console.error('Ready Player Me API call failed:', error)
    // Return the current URL as fallback
    return currentAvatarUrl || 'https://models.readyplayer.me/fallback-avatar.glb'
  }
}

// Generate 2D headshot from 3D avatar
async function generateHeadshotFromAvatar(avatarUrl: string): Promise<string> {
  // In a real implementation, this would:
  // 1. Load the 3D avatar model
  // 2. Render a headshot view
  // 3. Save the image to storage
  // 4. Return the image URL
  
  // For now, return a placeholder or the same URL
  return avatarUrl.replace('.glb', '-headshot.png')
}

// Extract avatar ID from Ready Player Me URL
function extractAvatarIdFromUrl(url: string | null): string | null {
  if (!url) return null
  
  try {
    // Ready Player Me URLs typically look like:
    // https://models.readyplayer.me/[avatar-id].glb
    const match = url.match(/\/([a-f0-9-]+)\.glb$/i)
    return match ? match[1] : null
  } catch (error) {
    console.error('Failed to extract avatar ID:', error)
    return null
  }
}