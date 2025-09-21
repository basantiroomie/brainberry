// Avatar caching and memory management system
import { logger } from '@/utils/logger'
import { Object3D, Texture, Material, BufferGeometry, Mesh } from 'three'

export interface CacheEntry {
  key: string
  data: any
  size: number
  lastAccessed: Date
  accessCount: number
  type: 'model' | 'texture' | 'audio' | 'image'
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictions: number
}

export class AvatarCacheManager {
  private static instance: AvatarCacheManager
  private cache = new Map<string, CacheEntry>()
  private maxSize = 100 * 1024 * 1024 // 100MB default
  private maxEntries = 50
  private currentSize = 0
  private hits = 0
  private misses = 0
  private evictions = 0

  static getInstance(): AvatarCacheManager {
    if (!AvatarCacheManager.instance) {
      AvatarCacheManager.instance = new AvatarCacheManager()
    }
    return AvatarCacheManager.instance
  }

  /**
   * Set cache limits
   */
  setLimits(maxSize: number, maxEntries: number): void {
    this.maxSize = maxSize
    this.maxEntries = maxEntries
    this.enforceLimit()
    
    logger.debug(
      `Avatar cache limits updated: ${(maxSize / 1024 / 1024).toFixed(1)}MB, ${maxEntries} entries`,
      'AVATAR_CACHE'
    )
  }

  /**
   * Store item in cache
   */
  set(key: string, data: any, type: CacheEntry['type']): void {
    const size = this.calculateSize(data, type)
    
    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.remove(key)
    }

    const entry: CacheEntry = {
      key,
      data,
      size,
      lastAccessed: new Date(),
      accessCount: 1,
      type
    }

    this.cache.set(key, entry)
    this.currentSize += size

    logger.cache('set', key, { size, type })

    // Enforce cache limits
    this.enforceLimit()
  }

  /**
   * Get item from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (entry) {
      entry.lastAccessed = new Date()
      entry.accessCount++
      this.hits++
      
      logger.cache('hit', key, { 
        accessCount: entry.accessCount,
        type: entry.type 
      })
      
      return entry.data
    }

    this.misses++
    logger.cache('miss', key)
    return null
  }

  /**
   * Check if item exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Remove item from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (entry) {
      this.cache.delete(key)
      this.currentSize -= entry.size
      
      // Dispose of 3D resources
      this.disposeEntry(entry)
      
      logger.cache('clear', key, { size: entry.size })
      return true
    }
    
    return false
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    // Dispose of all 3D resources
    this.cache.forEach(entry => this.disposeEntry(entry))
    
    this.cache.clear()
    this.currentSize = 0
    this.hits = 0
    this.misses = 0
    this.evictions = 0
    
    logger.cache('clear', 'all')
  }

  /**
   * Enforce cache size and entry limits
   */
  private enforceLimit(): void {
    // Remove entries if over limit
    while (this.cache.size > this.maxEntries || this.currentSize > this.maxSize) {
      const oldestEntry = this.findLeastRecentlyUsed()
      
      if (oldestEntry) {
        this.remove(oldestEntry.key)
        this.evictions++
        
        logger.debug(
          `Cache eviction: ${oldestEntry.key} (LRU)`,
          'AVATAR_CACHE',
          { size: oldestEntry.size, type: oldestEntry.type }
        )
      } else {
        break // No more entries to remove
      }
    }
  }

  /**
   * Find least recently used entry
   */
  private findLeastRecentlyUsed(): CacheEntry | null {
    let oldestEntry: CacheEntry | null = null
    let oldestTime = Date.now()

    this.cache.forEach(entry => {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime()
        oldestEntry = entry
      }
    })

    return oldestEntry
  }

  /**
   * Calculate size of cached data
   */
  private calculateSize(data: any, type: CacheEntry['type']): number {
    try {
      switch (type) {
        case 'model':
          return this.calculate3DModelSize(data)
        case 'texture':
          return this.calculateTextureSize(data)
        case 'audio':
          return this.calculateAudioSize(data)
        case 'image':
          return this.calculateImageSize(data)
        default:
          // Fallback: estimate JSON size
          return new Blob([JSON.stringify(data)]).size
      }
    } catch (error) {
      logger.warn('Failed to calculate cache entry size', 'AVATAR_CACHE', error)
      return 1024 // Default 1KB estimate
    }
  }

  /**
   * Calculate 3D model size
   */
  private calculate3DModelSize(model: Object3D): number {
    let size = 0

    model.traverse((child) => {
      // Type-safe geometry check
      const meshChild = child as Mesh
      if (meshChild.geometry) {
        if (meshChild.geometry instanceof BufferGeometry) {
          const attributes = meshChild.geometry.attributes
          Object.values(attributes).forEach((attribute: any) => {
            if (attribute?.array?.byteLength) {
              size += attribute.array.byteLength
            }
          })
        }
      }

      // Material size (textures)
      if (meshChild.material) {
        const materials = Array.isArray(meshChild.material) ? meshChild.material : [meshChild.material]
        materials.forEach((material: any) => {
          size += this.calculateMaterialSize(material)
        })
      }
    })

    return size
  }

  /**
   * Calculate material size (mainly textures)
   */
  private calculateMaterialSize(material: Material): number {
    let size = 0

    // Check for textures in material
    Object.values(material).forEach(value => {
      if (value && typeof value === 'object' && 'image' in value) {
        const texture = value as Texture
        size += this.calculateTextureSize(texture)
      }
    })

    return size
  }

  /**
   * Calculate texture size
   */
  private calculateTextureSize(texture: Texture): number {
    if (!texture.image) return 0

    const image = texture.image
    const width = image.width || image.videoWidth || 512
    const height = image.height || image.videoHeight || 512
    
    // Estimate 4 bytes per pixel (RGBA)
    return width * height * 4
  }

  /**
   * Calculate audio size
   */
  private calculateAudioSize(audio: AudioBuffer | HTMLAudioElement | Blob): number {
    if (audio instanceof AudioBuffer) {
      return audio.length * audio.numberOfChannels * 4 // 32-bit float
    }
    
    if (audio instanceof Blob) {
      return audio.size
    }
    
    // Estimate for HTML audio element
    return 1024 * 1024 // 1MB estimate
  }

  /**
   * Calculate image size
   */
  private calculateImageSize(image: HTMLImageElement | ImageBitmap | Blob): number {
    if (image instanceof Blob) {
      return image.size
    }
    
    if (image instanceof HTMLImageElement || image instanceof ImageBitmap) {
      const width = image.width || 512
      const height = image.height || 512
      return width * height * 4 // RGBA
    }
    
    return 1024 // Default estimate
  }

  /**
   * Dispose of cached entry resources
   */
  private disposeEntry(entry: CacheEntry): void {
    try {
      switch (entry.type) {
        case 'model':
          this.dispose3DModel(entry.data)
          break
        case 'texture':
          if (entry.data && typeof entry.data.dispose === 'function') {
            entry.data.dispose()
          }
          break
        // Audio and image don't need special disposal
      }
    } catch (error) {
      logger.warn('Failed to dispose cache entry', 'AVATAR_CACHE', error)
    }
  }

  /**
   * Dispose of 3D model resources
   */
  private dispose3DModel(model: Object3D): void {
    model.traverse((child) => {
      const meshChild = child as Mesh
      // Dispose geometry
      if (meshChild.geometry) {
        meshChild.geometry.dispose()
      }

      // Dispose materials and textures
      if (meshChild.material) {
        const materials = Array.isArray(meshChild.material) ? meshChild.material : [meshChild.material]
        materials.forEach((material: any) => {
          // Dispose textures
          Object.values(material).forEach(value => {
            if (value && typeof value === 'object' && 'dispose' in value) {
              (value as any).dispose()
            }
          })
          
          // Dispose material
          material.dispose()
        })
      }
    })
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.currentSize,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.misses / totalRequests : 0,
      evictions: this.evictions
    }
  }

  /**
   * Get cache entries by type
   */
  getEntriesByType(type: CacheEntry['type']): CacheEntry[] {
    return Array.from(this.cache.values()).filter(entry => entry.type === type)
  }

  /**
   * Get cache usage summary
   */
  getUsageSummary(): {
    stats: CacheStats
    sizeByType: Record<CacheEntry['type'], number>
    entriesByType: Record<CacheEntry['type'], number>
    topEntries: CacheEntry[]
  } {
    const stats = this.getStats()
    const sizeByType: Record<CacheEntry['type'], number> = {
      model: 0,
      texture: 0,
      audio: 0,
      image: 0
    }
    const entriesByType: Record<CacheEntry['type'], number> = {
      model: 0,
      texture: 0,
      audio: 0,
      image: 0
    }

    this.cache.forEach(entry => {
      sizeByType[entry.type] += entry.size
      entriesByType[entry.type]++
    })

    // Get top 10 entries by access count
    const topEntries = Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)

    return {
      stats,
      sizeByType,
      entriesByType,
      topEntries
    }
  }

  /**
   * Preload avatar model
   */
  async preloadModel(url: string): Promise<Object3D | null> {
    const cacheKey = `model:${url}`
    
    // Check cache first
    const cached = this.get(cacheKey)
    if (cached) {
      return cached.clone() // Return a clone to avoid modifying cached version
    }

    try {
      // Dynamic import to avoid loading GLTFLoader if not needed
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const loader = new GLTFLoader()
      
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject)
      })

      if (gltf.scene) {
        this.set(cacheKey, gltf.scene, 'model')
        logger.debug(`Avatar model preloaded and cached: ${url}`, 'AVATAR_CACHE')
        return gltf.scene.clone()
      }

      return null
    } catch (error) {
      logger.error('Failed to preload avatar model', error, 'AVATAR_CACHE')
      return null
    }
  }

  /**
   * Cleanup old entries based on age
   */
  cleanupOldEntries(maxAge: number = 30 * 60 * 1000): number { // 30 minutes default
    const now = Date.now()
    let cleaned = 0

    this.cache.forEach((entry, key) => {
      if (now - entry.lastAccessed.getTime() > maxAge) {
        this.remove(key)
        cleaned++
      }
    })

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} old cache entries`, 'AVATAR_CACHE')
    }

    return cleaned
  }
}

// Convenience functions
export const avatarCacheManager = AvatarCacheManager.getInstance()

export const cacheAvatarModel = (url: string, model: Object3D): void => {
  avatarCacheManager.set(`model:${url}`, model, 'model')
}

export const getCachedAvatarModel = (url: string): Object3D | null => {
  return avatarCacheManager.get(`model:${url}`)
}

export const preloadAvatarModel = (url: string): Promise<Object3D | null> => {
  return avatarCacheManager.preloadModel(url)
}

export const clearAvatarCache = (): void => {
  avatarCacheManager.clear()
}

export const getAvatarCacheStats = (): CacheStats => {
  return avatarCacheManager.getStats()
}