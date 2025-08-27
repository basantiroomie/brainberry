import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { AvatarUrlValidator } from '@/lib/avatar-url-validator'

export async function POST(req: NextRequest) {
  try {
    const { avatarUrl, childId } = await req.json()

    // Validate inputs
    if (!avatarUrl || !childId) {
      return NextResponse.json({ 
        error: 'Avatar URL and child ID are required' 
      }, { status: 400 })
    }

    // Validate avatar URL
    if (!AvatarUrlValidator.isValidAvatarUrl(avatarUrl) || !avatarUrl.endsWith('.glb')) {
      return NextResponse.json({ 
        error: 'Invalid avatar URL. Must be a Ready Player Me GLB URL.' 
      }, { status: 400 })
    }

    // For now, we'll use a client-side approach since Three.js headshot generation
    // requires a browser environment. We'll return the expected PNG URL.
    const pngUrl = AvatarUrlValidator.glbToPngUrl(avatarUrl)
    
    if (!pngUrl) {
      return NextResponse.json({ 
        error: 'Could not generate PNG URL from GLB URL' 
      }, { status: 400 })
    }

    // Test if the PNG URL is accessible (Ready Player Me might have it)
    try {
      const testResponse = await fetch(pngUrl, { method: 'HEAD' })
      if (testResponse.ok) {
        // PNG already exists, use it
        const supabase = await createSupabaseServerClient()
        
        const { error: updateError } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: pngUrl })
          .eq('id', childId)

        if (updateError) {
          console.error('Failed to update headshot URL:', updateError)
          return NextResponse.json({ 
            error: 'Failed to save headshot URL' 
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          headshotUrl: pngUrl,
          method: 'ready-player-me-png'
        })
      }
    } catch (error) {
      console.log('Ready Player Me PNG not available, will need client-side generation')
    }

    // If PNG doesn't exist, we need client-side generation
    // Return instructions for client-side generation
    return NextResponse.json({
      success: true,
      requiresClientGeneration: true,
      avatarUrl,
      childId,
      message: 'Headshot generation required on client side'
    })

  } catch (error) {
    console.error('Headshot generation API error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate headshot' 
    }, { status: 500 })
  }
}