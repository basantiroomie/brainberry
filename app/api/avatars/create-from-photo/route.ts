import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
import { 
  createSuccessResponse, 
  handleApiError, 
  withErrorHandling,
  UnauthorizedError,
  ValidationException,
  handleDatabaseError
} from '@/utils/validation'
import { logger } from '@/utils/logger'

// File upload validation
function validatePhotoUpload(file: File): void {
  // Check file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new ValidationException([
      { field: 'photo', message: 'File size must be less than 10MB' }
    ])
  }

  // Check file type (JPEG/PNG only)
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
    throw new ValidationException([
      { field: 'photo', message: 'File must be a JPEG or PNG image' }
    ])
  }
}

// Ready Player Me API integration
async function createAvatarFromPhoto(photoUrl: string): Promise<string> {
  const apiKey = process.env.RPM_API_KEY
  if (!apiKey) {
    throw new Error('Ready Player Me API key not configured')
  }

  // Validate API key format
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    throw new Error('Invalid Ready Player Me API key format')
  }

  logger.info('Creating avatar from photo', 'RPM_API', { 
    photoUrl: photoUrl.substring(0, 50) + '...',
    apiKeyPrefix: apiKey.substring(0, 8) + '...'
  })

  const response = await fetch('https://api.readyplayer.me/v2/avatars', {
    method: 'POST', // CRITICAL: Must be POST, not GET
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        type: 'photo',
        image: photoUrl
      }
    })
  })

  if (!response.ok) {
    const errorData = await response.text()
    logger.error('Ready Player Me API error', new Error(errorData), 'RPM_API', {
      status: response.status,
      statusText: response.statusText,
      apiKeyPrefix: apiKey.substring(0, 8) + '...'
    })
    
    // Provide specific error messages based on status code
    if (response.status === 401) {
      throw new Error('Ready Player Me API key is invalid or expired. Please check your API key in the RPM Studio dashboard.')
    } else if (response.status === 400) {
      throw new Error('Invalid request to Ready Player Me API. Please check the photo URL format.')
    } else if (response.status === 429) {
      throw new Error('Ready Player Me API rate limit exceeded. Please try again later.')
    } else {
      throw new Error(`Avatar creation failed: ${response.status} ${response.statusText}`)
    }
  }

  const data = await response.json()
  
  // Extract avatar URL from v2 API response
  let avatarUrl = null
  
  // v2 API returns data.data.renders[0].url
  if (data.data?.renders?.[0]?.url) {
    avatarUrl = data.data.renders[0].url
  } else if (data.data?.id) {
    avatarUrl = `https://models.readyplayer.me/${data.data.id}.glb`
  } else if (data.url) {
    avatarUrl = data.url
  } else if (data.id) {
    avatarUrl = `https://models.readyplayer.me/${data.id}.glb`
  }
  
  if (!avatarUrl) {
    logger.error('Invalid RPM API response', new Error('No avatar URL found'), 'RPM_API', { response: data })
    throw new Error('Invalid response from Ready Player Me API - no avatar URL found')
  }

  logger.info('Avatar created successfully', 'RPM_API', { 
    avatarUrl: avatarUrl.substring(0, 50) + '...' 
  })

  return avatarUrl
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  // Authenticate educator
  const { user } = await requireEducator()
  if (!user) {
    throw new UnauthorizedError('Only educators can create avatars')
  }

  logger.info('Avatar creation request started', 'API', { educatorId: user.id })

  try {
    // Parse FormData
    const formData = await req.formData()
    const childId = formData.get('childId') as string
    const photo = formData.get('photo') as File

    // Validate required fields
    if (!childId) {
      throw new ValidationException([
        { field: 'childId', message: 'Child ID is required' }
      ])
    }

    if (!photo) {
      throw new ValidationException([
        { field: 'photo', message: 'Photo file is required' }
      ])
    }

    // Validate photo upload
    validatePhotoUpload(photo)

    // Validate child exists and belongs to educator
    const supabase = await createSupabaseServerClient()
    
    const { data: child, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, educator_id')
      .eq('id', childId)
      .eq('educator_id', user.id)
      .single()

    if (childError || !child) {
      logger.warn('Child not found or access denied', 'API', { 
        childId, 
        educatorId: user.id,
        error: childError 
      })
      throw new ValidationException([
        { field: 'childId', message: 'Child not found or access denied' }
      ])
    }

    // Upload photo to Supabase Storage
    const fileName = `${childId}-${Date.now()}.${photo.type.split('/')[1]}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatar-photos')
      .upload(fileName, photo, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      logger.error('Photo upload failed', uploadError, 'STORAGE')
      throw new Error('Failed to upload photo')
    }

    // Get public URL for the uploaded photo
    const { data: { publicUrl } } = supabase.storage
      .from('avatar-photos')
      .getPublicUrl(uploadData.path)

    logger.info('Photo uploaded successfully', 'API', { 
      fileName, 
      publicUrl: publicUrl.substring(0, 50) + '...' 
    })

    // Create avatar using Ready Player Me API
    const avatarUrl = await createAvatarFromPhoto(publicUrl)
    
    logger.info('Avatar created successfully', 'API', { 
      avatarUrl: avatarUrl.substring(0, 50) + '...' 
    })

    // Update child profile with avatar URL
    // Note: avatar_url column may not exist yet if migration hasn't been applied
    try {
      const { data: updatedChild, error: updateError } = await supabase
        .from('ChildProfile')
        .update({ 
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', childId)
        .select()
        .single()

      if (updateError) {
        // If column doesn't exist, log warning but continue
        if (updateError.message?.includes('avatar_url') || updateError.code === '42703') {
          logger.warn('Avatar URL column does not exist yet - migration needed', 'DATABASE', updateError)
          // Return success but note that database update failed
          return createSuccessResponse({
            success: true,
            avatarUrl,
            childId,
            childName: child.name,
            warning: 'Avatar created but database not updated - migration needed'
          }, 201)
        } else {
          logger.error('Failed to update child profile with avatar', updateError, 'DATABASE')
          handleDatabaseError(updateError)
        }
      }
    } catch (dbError) {
      logger.warn('Database update failed - possibly missing avatar columns', 'DATABASE', dbError)
      // Continue with success response since avatar was created
    }

    logger.info('Avatar creation completed successfully', 'API', { 
      childId, 
      childName: child.name,
      educatorId: user.id 
    })

    return createSuccessResponse({
      success: true,
      avatarUrl,
      childId,
      childName: child.name
    }, 201)

  } catch (error) {
    logger.error('Avatar creation failed', error, 'API')
    throw error
  }
})