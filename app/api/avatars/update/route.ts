import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient, requireChild } from '@/lib/supabase-server'
import { updateAvatarRequestSchema, avatarResponseSchema } from '@/lib/schemas'
import { logger } from '@/utils/logger'

/**
 * Avatar Update API Endpoint
 * Handles saving avatar customizations made by children
 * Requirements: 2.4, 4.1, 4.4, 5.3
 */

export async function PUT(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    
    // Validate request structure
    const validationResult = updateAvatarRequestSchema.safeParse(body)
    if (!validationResult.success) {
      logger.warn('Invalid avatar update request', 'API', { 
        errors: validationResult.error.errors 
      })
      return NextResponse.json({ 
        success: false,
        error: 'Invalid request data: ' + validationResult.error.errors.map(e => e.message).join(', ')
      }, { status: 400 })
    }

    const { childId, avatarConfig } = validationResult.data

    logger.info('Avatar update request received', 'API', { 
      childId, 
      configId: avatarConfig.id,
      assetCount: Object.keys(avatarConfig.assets).length
    })

    // Check if RPM API key is configured
    const rpmApiKey = process.env.RPM_API_KEY
    if (!rpmApiKey) {
      logger.error('RPM API key not configured', undefined, 'API')
      return NextResponse.json({
        success: false,
        error: 'Avatar service is not configured on the server.'
      }, { status: 500 })
    }

    // Authenticate child using access code from headers or body
    const accessCode = req.headers.get('x-child-access-code') || body.accessCode
    if (!accessCode) {
      logger.warn('Missing child access code', 'API', { childId })
      return NextResponse.json({
        success: false,
        error: 'Child authentication required'
      }, { status: 401 })
    }

    // Verify child exists and access code matches
    const { child } = await requireChild(childId, accessCode)
    if (!child) {
      return NextResponse.json({
        success: false,
        error: 'Invalid child authentication'
      }, { status: 403 })
    }

    const supabase = createSupabaseServiceClient()

    // Check if child has customization permissions
    const permissions = child.avatar_permissions || { can_customize: true }
    if (!permissions.can_customize) {
      logger.warn('Child lacks customization permissions', 'API', { childId })
      return NextResponse.json({
        success: false,
        error: 'Avatar customization is not enabled for this child'
      }, { status: 403 })
    }

    // Verify child has an existing avatar to customize
    if (!child.avatar_url) {
      logger.warn('No existing avatar to customize', 'API', { childId })
      return NextResponse.json({
        success: false,
        error: 'No avatar exists for this child. Please ask your educator to create one first.'
      }, { status: 400 })
    }

    logger.info('Starting avatar customization update', 'API', { 
      childId, 
      childName: child.name,
      existingAvatarUrl: child.avatar_url
    })

    // Create anonymous user for RPM API calls
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
    })

    if (!userResponse.ok) {
      const errorBody = await userResponse.json()
      logger.error('RPM User Creation Failed', errorBody, 'API')
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize avatar customization session'
      }, { status: 500 })
    }

    const userData = await userResponse.json()
    const userToken = userData.data.token
    logger.info('Anonymous user created for avatar update', 'API', { 
      userId: userData.data.id 
    })

    // Update avatar with new configuration using RPM API
    const updateResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarConfig.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        data: {
          assets: avatarConfig.assets,
          ...(avatarConfig.morphTargets && { morphTargets: avatarConfig.morphTargets })
        }
      })
    })

    if (!updateResponse.ok) {
      const errorBody = await updateResponse.json()
      logger.error('RPM Avatar Update Failed', errorBody, 'API')
      return NextResponse.json({
        success: false,
        error: 'Failed to update avatar customization'
      }, { status: 500 })
    }

    logger.info('Avatar customization updated successfully', 'API', { 
      avatarId: avatarConfig.id 
    })

    // Save the updated avatar permanently
    const saveResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarConfig.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    })

    if (!saveResponse.ok) {
      const errorBody = await saveResponse.json()
      logger.error('RPM Avatar Save Failed', errorBody, 'API')
      return NextResponse.json({
        success: false,
        error: 'Failed to save avatar customization'
      }, { status: 500 })
    }

    // Generate new avatar URL
    const newAvatarUrl = `https://models.readyplayer.me/${avatarConfig.id}.glb`
    
    // Generate 2D headshot URL (RPM provides this automatically)
    const headshotUrl = `https://models.readyplayer.me/${avatarConfig.id}.png`

    logger.info('Avatar saved permanently', 'API', { 
      avatarId: avatarConfig.id,
      newAvatarUrl,
      headshotUrl
    })

    // Update child profile with new avatar URLs and metadata
    const updatedMetadata = {
      ...avatarConfig.metadata,
      last_customized: new Date().toISOString(),
      customization_count: (avatarConfig.metadata.customization_count || 0) + 1
    }

    const { error: dbError } = await supabase
      .from('ChildProfile')
      .update({ 
        avatar_url: newAvatarUrl,
        avatar_headshot_url: headshotUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', childId)

    if (dbError) {
      logger.error('Database update failed', dbError, 'API')
      return NextResponse.json({
        success: false,
        error: 'Failed to save avatar changes to profile'
      }, { status: 500 })
    }

    logger.info('Child profile updated with new avatar', 'API', { 
      childId,
      newAvatarUrl,
      headshotUrl
    })

    // Return success response
    const response = {
      success: true,
      avatarUrl: newAvatarUrl,
      headshotUrl: headshotUrl
    }

    // Validate response structure
    const responseValidation = avatarResponseSchema.safeParse(response)
    if (!responseValidation.success) {
      logger.error('Invalid response structure', responseValidation.error, 'API')
      return NextResponse.json({
        success: false,
        error: 'Internal server error'
      }, { status: 500 })
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Avatar update process failed', error, 'API')
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unknown server error occurred'
    }, { status: 500 })
  }
}