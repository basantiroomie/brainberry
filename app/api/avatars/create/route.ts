import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const childId = formData.get('childId') as string
    const photo = formData.get('photo') as File

    if (!childId || !photo) {
      return NextResponse.json(
        { error: 'Child ID and photo are required' },
        { status: 400 }
      )
    }

    // For now, we'll redirect to Ready Player Me for avatar creation
    // In a full implementation, you might want to:
    // 1. Upload the photo to a storage service
    // 2. Call Ready Player Me API to create avatar from photo
    // 3. Store the resulting avatar URL

    console.log('Avatar creation requested:', {
      childId,
      photoSize: photo.size,
      photoType: photo.type
    })

    // Return a response that indicates the client should open Ready Player Me
    return NextResponse.json({
      success: true,
      message: 'Please use the Ready Player Me interface to create your avatar',
      redirectToRPM: true
    })

  } catch (error) {
    console.error('Error creating avatar:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}