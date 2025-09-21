// Avatar utilities index - exports all avatar-related utilities
import { AvatarCodeUtils } from './avatar-service'

export { default as AvatarService } from './avatar-service'
export { AvatarCodeUtils } from './avatar-service'
export { LipsyncManager, getLipsyncManager, resetLipsyncManager } from './lipsync-manager'
export { AvatarTTS, ElevenLabsTTS, createTTSInstance } from './tts-utils'
export { ttsConfig, elevenLabsConfig, getBestVoice } from './tts-config'

// Re-export types
export type {
  AvatarViewerProps,
  AvatarCustomizerProps,
  AvatarChatbotProps,
  TTSConfig,
  ElevenLabsConfig,
  BlendShapeTargets,
  AnimationState,
  LipsyncManager as LipsyncManagerType,
  VisemeMapping,
  LipsyncConfig
} from '@/types/avatar'

export type {
  AvatarCode,
  AvatarCodeToUrls,
  UpdateChildAvatar
} from './schemas'

/**
 * Profile Picture Generation Utilities
 */
export class ProfilePictureUtils {
  /**
   * Generate a 2D profile picture from Ready Player Me PNG URL
   * @param pngUrl - Ready Player Me PNG URL
   * @param size - Desired size for the profile picture (default: 256)
   * @returns Promise<string> - Data URL of the generated profile picture
   */
  static async generateProfilePicture(pngUrl: string, size: number = 256): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Create canvas for processing
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            reject(new Error('Could not get 2D context'))
            return
          }
          
          // Set canvas size
          canvas.width = size
          canvas.height = size
          
          // Calculate crop area for headshot (focus on upper portion)
          const sourceWidth = img.width
          const sourceHeight = img.height
          const cropSize = Math.min(sourceWidth, sourceHeight)
          const cropX = (sourceWidth - cropSize) / 2
          const cropY = Math.max(0, sourceHeight * 0.1) // Start slightly from top to focus on face
          
          // Draw cropped and resized image
          ctx.drawImage(
            img,
            cropX, cropY, cropSize, cropSize * 0.8, // Source crop (focus on head/face area)
            0, 0, size, size // Destination
          )
          
          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.9)
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image from URL: ${pngUrl}`))
      }
      
      img.src = pngUrl
    })
  }

  /**
   * Test if a Ready Player Me PNG URL is accessible
   * @param pngUrl - Ready Player Me PNG URL to test
   * @returns Promise<boolean> - True if accessible, false otherwise
   */
  static async testPngUrlAccessibility(pngUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(pngUrl, { 
        method: 'HEAD', 
        mode: 'cors',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      console.log('PNG URL accessibility test:', {
        url: pngUrl,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type')
      })
      
      return response.ok
    } catch (error) {
      console.warn('PNG URL accessibility test failed:', {
        url: pngUrl,
        error: error instanceof Error ? error.message : error,
        isAbortError: error instanceof Error && error.name === 'AbortError'
      })
      return false
    }
  }

  /**
   * Generate profile picture with fallback handling
   * @param avatarUrl - GLB URL or avatar code
   * @param size - Desired size for the profile picture
   * @returns Promise<string | null> - Data URL or null if generation fails
   */
  static async generateProfilePictureWithFallback(
    avatarUrl: string | null, 
    size: number = 256
  ): Promise<string | null> {
    if (!avatarUrl) {
      return null
    }

    try {
      let pngUrl: string

      // Check if it's already a PNG URL
      if (avatarUrl.endsWith('.png')) {
        pngUrl = avatarUrl
      } else if (avatarUrl.endsWith('.glb')) {
        // Convert GLB URL to PNG URL
        pngUrl = avatarUrl.replace('.glb', '.png')
      } else {
        // Try to extract avatar code and convert
        const code = AvatarCodeUtils.extractCodeFromGlbUrl(avatarUrl)
        if (code) {
          pngUrl = AvatarCodeUtils.codeToPngUrl(code)
        } else {
          console.warn('Could not determine PNG URL from avatar URL:', avatarUrl)
          return null
        }
      }

      // Test accessibility first
      const isAccessible = await this.testPngUrlAccessibility(pngUrl)
      if (!isAccessible) {
        console.warn('PNG URL is not accessible:', pngUrl)
        return null
      }

      // Generate profile picture
      return await this.generateProfilePicture(pngUrl, size)
    } catch (error) {
      console.error('Profile picture generation failed:', error)
      return null
    }
  }
}