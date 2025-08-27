import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const { childId, avatarUrl } = await request.json()

    if (!childId || !avatarUrl) {
      return NextResponse.json(
        { error: 'Child ID and avatar URL are required' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServiceClient()

    // Update the child profile with the new avatar URL
    const { data, error } = await supabase
      .from('ChildProfile')
      .update({
        avatar_url: avatarUrl,
        avatar_headshot_url: avatarUrl, // For now, use the same URL for headshot
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)
      .select()
      .single()

    if (error) {
      console.error('Database error updating avatar:', error)
      return NextResponse.json(
        { error: 'Failed to update avatar in database' },
        { status: 500 }
      )
    }

    console.log('Avatar updated successfully:', {
      childId,
      avatarUrl,
      updatedProfile: data
    })

    return NextResponse.json({
      success: true,
      avatarUrl: data.avatar_url,
      headshotUrl: data.avatar_headshot_url,
      message: 'Avatar updated successfully'
    })

  } catch (error) {
    console.error('Error updating avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}