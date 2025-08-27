/**
 * Avatar URL Utilities
 * 
 * Utilities for handling avatar URLs from different providers,
 * especially ReadyPlayer.me which has specific requirements.
 */

/**
 * Check if a URL is from ReadyPlayer.me
 */
export function isReadyPlayerMeUrl(url: string): boolean {
  return url.includes('readyplayer.me') || url.includes('models.readyplayer.me')
}

/**
 * Validate avatar URL based on provider
 */
export async function validateAvatarUrl(url: string): Promise<{
  isValid: boolean
  error?: string
}> {
  try {
    // Basic URL format validation
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return { isValid: false, error: 'Invalid URL format' }
    }

    // For ReadyPlayer.me URLs, skip HTTP validation as they often don't support HEAD requests
    // but work fine for GLB loading
    if (isReadyPlayerMeUrl(url)) {
      return { isValid: true }
    }

    // For other providers, try to validate with HEAD request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        return { isValid: true }
      } else {
        return { isValid: false, error: `HTTP ${response.status}: ${response.statusText}` }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // If HEAD request fails, try a GET request with range header as fallback
      try {
        const getController = new AbortController()
        const getTimeoutId = setTimeout(() => getController.abort(), 3000)
        
        const getResponse = await fetch(url, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
          headers: { 'Range': 'bytes=0-0' },
          signal: getController.signal
        })
        
        clearTimeout(getTimeoutId)
        
        if (getResponse.ok || getResponse.status === 206) {
          return { isValid: true }
        } else {
          return { isValid: false, error: `HTTP ${getResponse.status}: ${getResponse.statusText}` }
        }
      } catch {
        return { isValid: false, error: fetchError instanceof Error ? fetchError.message : 'Validation failed' }
      }
    }
  } catch (error) {
    return { isValid: false, error: error instanceof Error ? error.message : 'Validation failed' }
  }
}

/**
 * Sanitize ReadyPlayer.me URL to ensure it's properly formatted
 */
export function sanitizeReadyPlayerMeUrl(url: string): string {
  if (!isReadyPlayerMeUrl(url)) {
    return url
  }

  // Ensure the URL ends with .glb if it's a ReadyPlayer.me model URL
  if (url.includes('models.readyplayer.me') && !url.endsWith('.glb')) {
    return `${url}.glb`
  }

  return url
}

/**
 * Get avatar URL with proper error handling
 */
export function getValidAvatarUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') {
    return null
  }

  try {
    // Basic URL validation
    new URL(url)
    
    // Sanitize ReadyPlayer.me URLs
    return sanitizeReadyPlayerMeUrl(url)
  } catch {
    return null
  }
}