import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient, requireEducator } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

// A publicly available, neutral base template ID from Ready Player Me
const MALE_TEMPLATE_ID = '645cd1eff23d0562d3f9d290'

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate the Educator
    const { user } = await requireEducator()
    if (!user) {
      logger.warn('Unauthorized avatar creation attempt', 'API')
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    // Try to parse as JSON first, then fall back to FormData
    let childId: string
    let photoBuffer: ArrayBuffer
    let photoType: string

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      // Handle JSON request with base64 image
      const body = await req.json()
      childId = body.childId
      
      if (!body.imageData || !body.imageData.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 })
      }
      
      // Parse data URL
      const [header, base64Data] = body.imageData.split(',')
      const mimeMatch = header.match(/data:image\/([^;]+)/)
      photoType = mimeMatch ? `image/${mimeMatch[1]}` : 'image/jpeg'
      
      // Convert base64 to buffer
      photoBuffer = Buffer.from(base64Data, 'base64')
      
    } else if (contentType.includes('multipart/form-data')) {
      // Handle FormData request
      try {
        const formData = await req.formData()
        childId = formData.get('childId') as string
        const photo = formData.get('photo') as File
        
        if (!photo) {
          return NextResponse.json({ error: 'Photo file is required' }, { status: 400 })
        }
        
        photoBuffer = await photo.arrayBuffer()
        photoType = photo.type
        
        // Validate file size and type
        if (photoBuffer.byteLength > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 })
        }
        
      } catch (parseError) {
        logger.error('FormData parsing failed', parseError, 'API')
        return NextResponse.json({ 
          error: 'Invalid form data. Please try uploading the image again.' 
        }, { status: 400 })
      }
    } else {
      return NextResponse.json({ 
        error: 'Content-Type must be application/json or multipart/form-data' 
      }, { status: 400 })
    }

    if (!childId || !photoBuffer) {
      return NextResponse.json({ error: 'childId and photo are required' }, { status: 400 })
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(photoType)) {
      return NextResponse.json({ error: 'File must be a JPEG or PNG image' }, { status: 400 })
    }

    logger.info('Avatar creation request received', 'API', { 
      childId, 
      photoSize: photoBuffer.byteLength, 
      photoType,
      educatorId: user.id 
    })

    const supabase = createSupabaseServiceClient()
    const rpmApiKey = process.env.RPM_API_KEY
    if (!rpmApiKey) {
      throw new Error('Avatar service is not configured on the server.')
    }

    // Validate child exists
    const { data: child, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, educator_id')
      .eq('id', childId)
      .single()

    if (childError || !child) {
      logger.warn('Child not found', 'API', { 
        childId, 
        educatorId: user.id,
        error: childError 
      })
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    logger.info('Starting avatar creation process', 'API', { childId, educatorId: user.id })

    // --- START OF THE CORRECTED WORKFLOW ---
    // This follows the working approach from test-photo-to-avatar.js

    // Step 1: Create Anonymous User to get user token
    logger.info('Creating anonymous user for avatar creation', 'API')
    const userResponse = await fetch('https://api.readyplayer.me/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rpmApiKey}`
      },
      body: JSON.stringify({
        data: {
          appName: 'brainberry',
          requestToken: true
        }
      })
    });

    if (!userResponse.ok) {
      const errorBody = await userResponse.json();
      logger.error('RPM User Creation Failed', errorBody, 'API');
      throw new Error('Failed to initialize avatar creation session.');
    }

    const userData = await userResponse.json();
    const userToken = userData.data.token;
    const userId = userData.data.id;
    logger.info(`Anonymous user created: ${userId}`, 'API');

    // Step 2: Create Draft Avatar from Template
    const createDraftResponse = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${MALE_TEMPLATE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        data: {
          partner: 'brainberry',
          bodyType: 'fullbody'
        }
      })
    });

    if (!createDraftResponse.ok) {
      const errorBody = await createDraftResponse.json();
      logger.error('RPM Draft Creation Failed', errorBody, 'API');
      throw new Error('Failed to create draft avatar.');
    }

    const draftAvatarData = await createDraftResponse.json();
    const avatarId = draftAvatarData.data.id;
    logger.info(`Draft avatar created: ${avatarId}`, 'API');

    // Step 3: Update Avatar with Photo
    const base64Photo = Buffer.from(photoBuffer).toString('base64');
    const photoDataUrl = `data:${photoType};base64,${base64Photo}`;
        
    const updateWithPhotoResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        data: {
          type: 'photo',
          image: photoDataUrl
        }
      })
    });

    if (!updateWithPhotoResponse.ok) {
      const errorBody = await updateWithPhotoResponse.json();
      logger.error('RPM Photo Update Failed', errorBody, 'API');
      // Continue with template avatar if photo update fails
      logger.warn('Photo update failed, using template avatar', 'API');
    } else {
      logger.info(`Photo applied successfully to avatar ${avatarId}`, 'API');
    }
     
    // Step 4: Save Avatar Permanently
    const saveFinalResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (!saveFinalResponse.ok) {
      const errorBody = await saveFinalResponse.json();
      logger.error('RPM Final Save Failed', errorBody, 'API');
      throw new Error('Failed to save the final avatar.');
    }
        
    // The final avatar URL follows the CDN pattern
    const finalAvatarUrl = `https://models.readyplayer.me/${avatarId}.glb`;
    logger.info(`Avatar saved permanently. URL: ${finalAvatarUrl}`, 'API');

    // --- END OF THE CORRECTED WORKFLOW ---

    // Step 5: Update the ChildProfile in your database with the FINAL URL
    const { error: dbError } = await supabase
      .from('ChildProfile')
      .update({ avatar_url: finalAvatarUrl })
      .eq('id', childId)

    if (dbError) {
      logger.error('Database update failed', dbError, 'API');
      throw new Error('Failed to save the avatar to the child profile.');
    }

    logger.info(`Database updated for child ${childId}`, 'API');
    return NextResponse.json({ success: true, avatarUrl: finalAvatarUrl });

  } catch (error) {
    logger.error('Avatar creation process failed', error, 'API')
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'An unknown server error occurred.',
    }, { status: 500 })
  }
}