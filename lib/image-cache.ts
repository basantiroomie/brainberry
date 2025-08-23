// Global image cache for fast access
class ImageCacheManager {
  private cache = new Map<string, string>()
  private preloadedImages = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<string>>()

  // Preload and cache an image
  async preloadImage(url: string): Promise<string> {
    // Return cached version if available
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // Return existing promise if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // Skip data URLs - they're already optimized
    if (url.startsWith('data:')) {
      this.cache.set(url, url)
      return url
    }

    // Create loading promise
    const loadingPromise = new Promise<string>((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        // Create a canvas to convert to data URL for instant loading
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        
        ctx?.drawImage(img, 0, 0)
        
        try {
          // Convert to data URL for instant access
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
          this.cache.set(url, dataUrl)
          this.preloadedImages.set(url, img)
          this.loadingPromises.delete(url)
          resolve(dataUrl)
        } catch (error) {
          console.warn(`Failed to cache image: ${url}`, error)
          // Fallback to original URL
          this.cache.set(url, url)
          this.loadingPromises.delete(url)
          resolve(url)
        }
      }
      
      img.onerror = () => {
        console.warn(`Failed to load image for caching: ${url}`)
        this.loadingPromises.delete(url)
        reject(new Error(`Failed to load image: ${url}`))
      }
      
      // Set crossOrigin to handle external images
      img.crossOrigin = 'anonymous'
      img.src = url
    })

    this.loadingPromises.set(url, loadingPromise)
    return loadingPromise
  }

  // Preload multiple images in batches
  async preloadImages(urls: string[], batchSize: number = 5): Promise<void> {
    const batches = []
    for (let i = 0; i < urls.length; i += batchSize) {
      batches.push(urls.slice(i, i + batchSize))
    }

    for (const batch of batches) {
      await Promise.allSettled(batch.map(url => this.preloadImage(url)))
    }
  }

  // Get cached image URL (returns data URL for instant loading)
  getCachedImage(url: string): string | null {
    return this.cache.get(url) || null
  }

  // Check if image is cached
  isCached(url: string): boolean {
    return this.cache.has(url)
  }

  // Clear cache for specific URLs (useful when game is deleted)
  clearImages(urls: string[]): void {
    urls.forEach(url => {
      this.cache.delete(url)
      this.preloadedImages.delete(url)
      this.loadingPromises.delete(url)
    })
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear()
    this.preloadedImages.clear()
    this.loadingPromises.clear()
  }

  // Get cache stats
  getCacheStats() {
    return {
      cachedImages: this.cache.size,
      loadingImages: this.loadingPromises.size,
      totalSize: Array.from(this.cache.values()).reduce((total, dataUrl) => {
        return total + (dataUrl.length * 0.75) // Rough size estimation
      }, 0)
    }
  }
}

// Global singleton instance
export const imageCache = new ImageCacheManager()

// Hook for using image cache in React components
export function useImageCache() {
  return {
    preloadImage: (url: string) => imageCache.preloadImage(url),
    preloadImages: (urls: string[], batchSize?: number) => imageCache.preloadImages(urls, batchSize),
    getCachedImage: (url: string) => imageCache.getCachedImage(url),
    isCached: (url: string) => imageCache.isCached(url),
    clearImages: (urls: string[]) => imageCache.clearImages(urls),
    clearAll: () => imageCache.clearAll(),
    getCacheStats: () => imageCache.getCacheStats()
  }
}
