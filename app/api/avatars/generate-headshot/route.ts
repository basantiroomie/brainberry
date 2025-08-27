import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requireEducator } from '@/lib/supabase-server'
import { ProfilePictureUtils } from '@/lib/avatar-utils'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { childId, avatarUrl } = await req.json()
    
    if (!childId || !avatarUrl) {
      return NextResponse.json({ 
        error: 'Missing required fields: childId and avatarUrl' 
      }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()
    
    // Verify the child exists and belongs to this educator
    const { data: child, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url')
      .eq('id', childId)
      .eq('educator_id', user.id)
      .single()
    
    if (childError || !child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }
    
    // Generate profile picture from avatar URL
    try {
      console.log('Generating headshot for child:', child.name, 'from URL:', avatarUrl)
      
      const profilePictureDataUrl = await ProfilePictureUtils.generateProfilePictureWithFallback(
        avatarUrl,
        256 // Standard size for profile pictures
      )
      
      if (!profilePictureDataUrl) {
        return NextResponse.json({ 
          error: 'Failed to generate profile picture from avatar URL' 
        }, { status: 400 })
      }
      
      // For now, we'll return the data URL. In a production system, you might want to:
      // 1. Upload the image to Supabase Storage
      // 2. Store the public URL in the database
      // But since we're using Ready Player Me's PNG URLs, we'll convert the avatar URL to PNG URL
      
      let headshotUrl: string
      if (avatarUrl.endsWith('.glb')) {
        headshotUrl = avatarUrl.replace('.glb', '.png')
      } else {
        // Extract code and convert to PNG URL
        const codeMatch = avatarUrl.match(/([A-Z0-9]{6})/)
        if (codeMatch) {
          headshotUrl = `https://models.readyplayer.me/${codeMatch[1]}.png`
        } else {
          return NextResponse.json({ 
            error: 'Could not determine PNG URL from avatar URL' 
          }, { status: 400 })
        }
      }
      
      // Update the child's headshot URL in the database
      const { data: updatedChild, error: updateError } = await supabase
        .from('ChildProfile')
        .update({ avatar_headshot_url: headshotUrl })
        .eq('id', childId)
        .select()
        .single()
      
      if (updateError) {
        console.error('Database update error:', updateError)
        return NextResponse.json({ 
          error: 'Failed to update child profile with headshot URL' 
        }, { status: 500 })
      }
      
      console.log('Headshot URL updated successfully for child:', child.name)
      
      return NextResponse.json({
        success: true,
        headshotUrl,
        generatedDataUrl: profilePictureDataUrl,
        child: updatedChild
      })
      
    } catch (error) {
      console.error('Profile picture generation error:', error)
      return NextResponse.json({ 
        error: 'Failed to generate profile picture',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Generate headshot API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}