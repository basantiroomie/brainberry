/**
 * Avatar URL Validation and Processing Utilities
 */

export class AvatarUrlValidator {
  /**
   * Validate if a URL is a valid Ready Player Me avatar URL
   */
  static isValidAvatarUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false
    
    try {
      const urlObj = new URL(url)
      return (
        urlObj.hostname.includes('readyplayer.me') &&
        (url.endsWith('.glb') || url.endsWith('.png'))
      )
    } catch {
      return false
    }
  }

  /**
   * Convert GLB URL to PNG URL for profile pictures
   */
  static glbToPngUrl(glbUrl: string): string | null {
    if (!this.isValidAvatarUrl(glbUrl) || !glbUrl.endsWith('.glb')) {
      return null
    }
    
    return glbUrl.replace('.glb', '.png')
  }

  /**
   * Extract avatar code from Ready Player Me URL
   */
  static extractAvatarCode(url: string): string | null {
    if (!this.isValidAvatarUrl(url)) return null
    
    const match = url.match(/([A-Z0-9]{6,})\.(?:glb|png)$/)
    return match ? match[1] : null
  }

  /**
   * Generate URLs from avatar code
   */
  static codeToUrls(code: string): { glbUrl: string; pngUrl: string } | null {
    if (!code || !/^[A-Z0-9]{6,}$/.test(code)) {
      return null
    }
    
    return {
      glbUrl: `https://models.readyplayer.me/${code}.glb`,
      pngUrl: `https://models.readyplayer.me/${code}.png`
    }
  }

  /**
   * Sanitize and validate avatar URL for display
   */
  static sanitizeAvatarUrl(url: string | null | undefined): string | null {
    if (!url) return null
    
    // Remove any whitespace
    const cleanUrl = url.trim()
    
    // Validate the URL
    if (!this.isValidAvatarUrl(cleanUrl)) {
      console.warn('Invalid avatar URL:', cleanUrl)
      return null
    }
    
    return cleanUrl
  }

  /**
   * Get the best display URL for an avatar (PNG preferred for profile pics)
   */
  static getBestDisplayUrl(avatarUrl: string | null, preferPng: boolean = true): string | null {
    const sanitized = this.sanitizeAvatarUrl(avatarUrl)
    if (!sanitized) return null
    
    if (preferPng && sanitized.endsWith('.glb')) {
      const pngUrl = this.glbToPngUrl(sanitized)
      if (pngUrl) {
        // Add ReadyPlayer.me 2D render parameters for zoomed-in head snapshot
        const url = new URL(pngUrl)
        url.searchParams.set('camera', 'portrait') // Close-up headshot view
        url.searchParams.set('size', '512') // Higher resolution for better quality
        url.searchParams.set('background', '255,255,255') // Clean white background
        url.searchParams.set('quality', '95') // High quality rendering
        // Add expression for a natural look
        url.searchParams.set('expression', 'happy')
        return url.toString()
      }
    }
    
    return sanitized
  }

  /**
   * Test if avatar URL is accessible
   */
  static async testAvatarAccessibility(url: string): Promise<boolean> {
    const sanitized = this.sanitizeAvatarUrl(url)
    if (!sanitized) return false
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(sanitized, {
        method: 'HEAD',
        mode: 'cors',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      console.warn('Avatar accessibility test failed:', error)
      return false
    }
  }
}

export default AvatarUrlValidator