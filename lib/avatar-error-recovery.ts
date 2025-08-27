/**
 * Avatar Error Recovery Utilities
 * 
 * Provides comprehensive error recovery and debugging for avatar loading issues.
 */

export interface AvatarLoadError {
  type: 'network' | 'validation' | 'rendering' | 'unknown'
  message: string
  url?: string
  statusCode?: number
  timestamp: Date
}

/**
 * Log avatar errors with context
 */
export function logAvatarError(error: AvatarLoadError): void {
  console.error('[Avatar Error]', {
    type: error.type,
    message: error.message,
    url: error.url,
    statusCode: error.statusCode,
    timestamp: error.timestamp.toISOString()
  })
}

/**
 * Create a standardized avatar error
 */
export function createAvatarError(
  type: AvatarLoadError['type'],
  message: string,
  url?: string,
  statusCode?: number
): AvatarLoadError {
  return {
    type,
    message,
    url,
    statusCode,
    timestamp: new Date()
  }
}

/**
 * Handle avatar loading errors with recovery strategies
 */
export function handleAvatarLoadError(error: any, url: string): AvatarLoadError {
  let avatarError: AvatarLoadError

  if (error instanceof TypeError && error.message.includes('fetch')) {
    avatarError = createAvatarError('network', 'Network error loading avatar', url)
  } else if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
    avatarError = createAvatarError('validation', 'Avatar URL validation failed - likely ReadyPlayer.me HEAD request issue', url, 400)
  } else if (error.message?.includes('404')) {
    avatarError = createAvatarError('validation', 'Avatar not found', url, 404)
  } else if (error.message?.includes('WebGL') || error.message?.includes('three')) {
    avatarError = createAvatarError('rendering', 'WebGL/Three.js rendering error', url)
  } else {
    avatarError = createAvatarError('unknown', error.message || 'Unknown avatar loading error', url)
  }

  logAvatarError(avatarError)
  return avatarError
}

/**
 * Get fallback avatar URL or configuration
 */
export function getFallbackAvatarConfig() {
  return {
    showFallback: true,
    fallbackMessage: 'Avatar temporarily unavailable',
    retryable: true
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverableAvatarError(error: AvatarLoadError): boolean {
  // Network errors and validation errors are often recoverable
  return error.type === 'network' || error.type === 'validation'
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: AvatarLoadError): string {
  switch (error.type) {
    case 'network':
      return 'Unable to load avatar. Please check your internet connection.'
    case 'validation':
      return 'Avatar is temporarily unavailable. Please try again later.'
    case 'rendering':
      return 'Unable to display avatar. Your device may not support 3D graphics.'
    default:
      return 'Avatar is temporarily unavailable.'
  }
}