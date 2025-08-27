/**
 * Avatar Error Prevention System
 * 
 * This module provides comprehensive error prevention for avatar loading
 * to ensure that 404 errors and network failures don't break the UI.
 */

interface AvatarValidationResult {
  isValid: boolean
  error?: string
  fallbackUrl?: string
}

interface AvatarCache {
  [url: string]: {
    isValid: boolean
    lastChecked: number
    error?: string
  }
}

class AvatarErrorPrevention {
  private cache: AvatarCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly VALIDATION_TIMEOUT = 3000 // 3 seconds

  /**
   * Validates an avatar URL and returns a safe result
   */
  async validateAvatarUrl(url: string): Promise<AvatarValidationResult> {
    if (!url || typeof url !== 'string') {
      return {
        isValid: false,
        error: 'Invalid URL format'
      }
    }

    // Check cache first
    const cached = this.cache[url]
    if (cached && (Date.now() - cached.lastChecked) < this.CACHE_DURATION) {
      return {
        isValid: cached.isValid,
        error: cached.error
      }
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.VALIDATION_TIMEOUT)
      
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const result: AvatarValidationResult = {
        isValid: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      }

      // Cache the result
      this.cache[url] = {
        isValid: response.ok,
        lastChecked: Date.now(),
        error: result.error
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error'
      
      // Cache the error
      this.cache[url] = {
        isValid: false,
        lastChecked: Date.now(),
        error: errorMessage
      }

      return {
        isValid: false,
        error: errorMessage
      }
    }
  }

  /**
   * Gets a safe avatar URL with fallback options
   */
  async getSafeAvatarUrl(primaryUrl?: string | null, fallbackUrl?: string | null): Promise<string | null> {
    // Try primary URL first
    if (primaryUrl) {
      const validation = await this.validateAvatarUrl(primaryUrl)
      if (validation.isValid) {
        return primaryUrl
      }
    }

    // Try fallback URL
    if (fallbackUrl) {
      const validation = await this.validateAvatarUrl(fallbackUrl)
      if (validation.isValid) {
        return fallbackUrl
      }
    }

    // No valid URLs found
    return null
  }

  /**
   * Prevalidates a list of avatar URLs to warm the cache
   */
  async prevalidateUrls(urls: string[]): Promise<void> {
    const validUrls = urls.filter(url => url && typeof url === 'string')
    
    // Validate in parallel but limit concurrency
    const batchSize = 5
    for (let i = 0; i < validUrls.length; i += batchSize) {
      const batch = validUrls.slice(i, i + batchSize)
      await Promise.allSettled(
        batch.map(url => this.validateAvatarUrl(url))
      )
    }
  }

  /**
   * Clears the validation cache
   */
  clearCache(): void {
    this.cache = {}
  }

  /**
   * Gets cache statistics for debugging
   */
  getCacheStats(): { totalEntries: number; validUrls: number; invalidUrls: number } {
    const entries = Object.values(this.cache)
    return {
      totalEntries: entries.length,
      validUrls: entries.filter(e => e.isValid).length,
      invalidUrls: entries.filter(e => !e.isValid).length
    }
  }
}

// Global instance
export const avatarErrorPrevention = new AvatarErrorPrevention()

/**
 * React hook for safe avatar loading
 */
export function useSafeAvatar(primaryUrl?: string | null, fallbackUrl?: string | null) {
  const [safeUrl, setSafeUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    const loadSafeUrl = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await avatarErrorPrevention.getSafeAvatarUrl(primaryUrl, fallbackUrl)
        
        if (isMounted) {
          setSafeUrl(url)
          if (!url) {
            setError('No valid avatar URLs found')
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load avatar')
          setSafeUrl(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSafeUrl()

    return () => {
      isMounted = false
    }
  }, [primaryUrl, fallbackUrl])

  return { safeUrl, isLoading, error }
}

// Import React for the hook
import React from 'react'