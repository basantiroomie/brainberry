/**
 * API Error Prevention System
 * 
 * This module provides robust error handling and fallbacks for API calls
 * to prevent UI breakage when network requests fail.
 */

interface ApiCallOptions {
  timeout?: number
  retries?: number
  fallbackData?: any
  cache?: boolean
}

interface ApiCache {
  [key: string]: {
    data: any
    timestamp: number
    ttl: number
  }
}

class ApiErrorPrevention {
  private cache: ApiCache = {}
  private readonly DEFAULT_TIMEOUT = 10000 // 10 seconds
  private readonly DEFAULT_RETRIES = 2
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Makes a safe API call with error handling and fallbacks
   */
  async safeApiCall<T>(
    url: string, 
    options: RequestInit = {}, 
    apiOptions: ApiCallOptions = {}
  ): Promise<{ data: T | null; error: string | null; fromCache: boolean }> {
    const {
      timeout = this.DEFAULT_TIMEOUT,
      retries = this.DEFAULT_RETRIES,
      fallbackData = null,
      cache = true
    } = apiOptions

    const cacheKey = `${url}:${JSON.stringify(options)}`

    // Check cache first
    if (cache) {
      const cached = this.cache[cacheKey]
      if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
        return { data: cached.data, error: null, fromCache: true }
      }
    }

    // Attempt the API call with retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Cache successful response
        if (cache) {
          this.cache[cacheKey] = {
            data,
            timestamp: Date.now(),
            ttl: this.DEFAULT_CACHE_TTL
          }
        }

        return { data, error: null, fromCache: false }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // If this is the last attempt, return error or fallback
        if (attempt === retries) {
          console.error(`API call failed after ${retries + 1} attempts:`, {
            url,
            error: errorMessage,
            attempt: attempt + 1
          })

          return {
            data: fallbackData,
            error: errorMessage,
            fromCache: false
          }
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // This should never be reached, but just in case
    return {
      data: fallbackData,
      error: 'Maximum retries exceeded',
      fromCache: false
    }
  }

  /**
   * Clears the API cache
   */
  clearCache(): void {
    this.cache = {}
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { totalEntries: number; cacheSize: number } {
    const entries = Object.keys(this.cache).length
    const size = JSON.stringify(this.cache).length
    return {
      totalEntries: entries,
      cacheSize: size
    }
  }
}

// Global instance
export const apiErrorPrevention = new ApiErrorPrevention()

/**
 * React hook for safe API calls
 */
export function useSafeApiCall<T>(
  url: string | null,
  options: RequestInit = {},
  apiOptions: ApiCallOptions = {}
) {
  const [data, setData] = React.useState<T | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [fromCache, setFromCache] = React.useState(false)

  React.useEffect(() => {
    if (!url) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    let isMounted = true

    const makeCall = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await apiErrorPrevention.safeApiCall<T>(url, options, apiOptions)
        
        if (isMounted) {
          setData(result.data)
          setError(result.error)
          setFromCache(result.fromCache)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'API call failed')
          setData(apiOptions.fallbackData || null)
          setFromCache(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    makeCall()

    return () => {
      isMounted = false
    }
  }, [url, JSON.stringify(options), JSON.stringify(apiOptions)])

  return { data, error, isLoading, fromCache }
}

// Import React for the hook
import React from 'react'