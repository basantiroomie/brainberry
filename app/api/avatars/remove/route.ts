import { NextRequest, NextResponse } from 'next/server'
import { requireEducator, createSupabaseServiceClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId } = await req.json()
    
    if (!childId) {
      return NextResponse.json({ error: 'Child ID is required' }, { status: 400 })
    }

    logger.info('Avatar removal request', 'API', { childId, educatorId: user.id })

    // Use service client to bypass RLS
    const supabase = createSupabaseServiceClient()
    
    // First verify the child exists
    const { data: child, error: checkError } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url')
      .eq('id', childId)
      .single()
    
    if (checkError || !child) {
      logger.error('Child not found during avatar removal', 'API', { childId, error: checkError })
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    // Remove avatar URLs from child profile
    const { data: updatedChild, error: updateError } = await supabase
      .from('ChildProfile')
      .update({
        avatar_url: null,
        avatar_headshot_url: null
      })
      .eq('id', childId)
      .select()
      .single()

    if (updateError) {
      logger.error('Failed to remove avatar from child profile', updateError, 'API')
      return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
    }

    logger.info('Avatar removed successfully', 'API', { 
      childId, 
      childName: child.name,
      hadAvatar: !!child.avatar_url 
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Avatar removed successfully',
      child: updatedChild
    })

  } catch (error) {
    logger.error('Avatar removal failed', error, 'API')
    return NextResponse.json({ 
      error: 'Failed to remove avatar' 
    }, { status: 500 })
  }
}