import { NextRequest, NextResponse } from 'next/server'
import { requireEducator, createSupabaseServiceClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId, snapshotDataUrl } = await req.json()
    
    if (!childId || !snapshotDataUrl) {
      return NextResponse.json({ 
        error: 'Child ID and snapshot data URL are required' 
      }, { status: 400 })
    }

    // Validate data URL format
    if (!snapshotDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ 
        error: 'Invalid snapshot data URL format' 
      }, { status: 400 })
    }

    logger.info('Avatar snapshot save request', 'API', { childId, educatorId: user.id })

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient()
    
    // First verify the child exists
    const { data: child, error: checkError } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url')
      .eq('id', childId)
      .single()
    
    if (checkError || !child) {
      logger.error('Child not found during snapshot save', 'API', { childId, error: checkError })
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    try {
      // Convert data URL to buffer
      const base64Data = snapshotDataUrl.split(',')[1]
      const buffer = Buffer.from(base64Data, 'base64')
      
      // Generate filename
      const fileName = `snapshot-${childId}-${Date.now()}.png`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatar-photos')
        .upload(fileName, buffer, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        logger.error('Snapshot upload failed', uploadError, 'STORAGE')
        throw new Error('Failed to upload snapshot')
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatar-photos')
        .getPublicUrl(uploadData.path)

      // Update child profile with snapshot URL
      const { data: updatedChild, error: updateError } = await supabase
        .from('ChildProfile')
        .update({
          avatar_headshot_url: publicUrl
        })
        .eq('id', childId)
        .select()
        .single()

      if (updateError) {
        logger.error('Failed to update child with snapshot URL', updateError, 'API')
        return NextResponse.json({ error: 'Failed to save snapshot' }, { status: 500 })
      }

      logger.info('Avatar snapshot saved successfully', 'API', { 
        childId, 
        childName: child.name,
        snapshotUrl: publicUrl
      })

      return NextResponse.json({ 
        success: true, 
        message: 'Avatar snapshot saved successfully',
        snapshotUrl: publicUrl,
        child: updatedChild
      })

    } catch (storageError) {
      logger.error('Storage operation failed', storageError, 'API')
      
      // Fallback: just return the data URL for immediate use
      logger.info('Using data URL as fallback for snapshot', 'API')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Snapshot generated (using data URL)',
        snapshotUrl: snapshotDataUrl,
        child: child
      })
    }

  } catch (error) {
    logger.error('Avatar snapshot save failed', error, 'API')
    return NextResponse.json({ 
      error: 'Failed to save avatar snapshot' 
    }, { status: 500 })
  }
}