import { useState, useEffect } from 'react'
import { imageCache } from '@/lib/image-cache'

interface ImagePreloaderProps {
  images: string[]
  onAllLoaded: () => void
  onProgress: (loaded: number, total: number) => void
  fallbackEmojis?: string[]
}

interface ImageLoadState {
  url: string
  loaded: boolean
  error: boolean
  fallbackEmoji?: string
  cachedUrl?: string
}

export function useImagePreloader({ images, onAllLoaded, onProgress, fallbackEmojis = [] }: ImagePreloaderProps) {
  const [imageStates, setImageStates] = useState<ImageLoadState[]>([])
  const [allLoaded, setAllLoaded] = useState(false)

  useEffect(() => {
    if (images.length === 0) {
      setAllLoaded(true)
      onAllLoaded()
      return
    }

    // Initialize image states
    const initialStates = images.map((url, index) => ({
      url,
      loaded: false,
      error: false,
      fallbackEmoji: fallbackEmojis[index] || '⭐',
      cachedUrl: undefined
    }))
    
    setImageStates(initialStates)

    let loadedCount = 0
    let errorCount = 0
    const totalImages = images.length

    const updateProgressAndState = (index: number, success: boolean, cachedUrl?: string) => {
      setImageStates(prev => {
        const next = [...prev]
        const current = next[index]
        if (!current) return prev
        next[index] = {
          ...current,
          loaded: success,
          error: !success,
          cachedUrl: success ? (cachedUrl || current.cachedUrl) : undefined
        }
        return next
      })

      if (success) {
        loadedCount++
        onProgress(loadedCount, totalImages)
      } else {
        errorCount++
      }

      // Only mark allLoaded and call onAllLoaded when ALL images loaded successfully
      if (loadedCount === totalImages && errorCount === 0) {
        setAllLoaded(true)
        onAllLoaded()
      }
    }

    const attemptPreload = async (url: string, index: number, attempt: number = 1): Promise<void> => {
      try {
        const dataUrl = await imageCache.preloadImage(url)
        updateProgressAndState(index, true, dataUrl)
      } catch (e) {
        if (attempt < 2) {
          // brief retry after a short delay
          setTimeout(() => {
            attemptPreload(url, index, attempt + 1).catch(() => {})
          }, 400)
        } else {
          updateProgressAndState(index, false)
        }
      }
    }

    images.forEach((url, index) => {
      attemptPreload(url, index).catch(() => {})
    })

  }, [images.join(',')]) // Re-run when images change

  return {
    imageStates,
    allLoaded,
    getImageState: (url: string) => imageStates.find(state => state.url === url),
    getCachedUrl: (url: string) => {
      const state = imageStates.find(state => state.url === url)
      return state?.cachedUrl || imageCache.getCachedImage(url) || url
    }
  }
}

interface SmartImageProps {
  src: string
  alt: string
  className?: string
  fallbackEmoji?: string
  onLoad?: () => void
  onError?: () => void
}

export function SmartImage({ src, alt, className = '', fallbackEmoji = '⭐', onLoad, onError }: SmartImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Get cached image URL for instant loading
  const cachedSrc = imageCache.getCachedImage(src) || src

  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
    
    // If we have a cached version, mark as loaded immediately
    if (imageCache.isCached(src)) {
      setImageLoaded(true)
      onLoad?.()
      return
    }

  // We keep spinner until success or real error; no forced timeout error now
  }, [src])

  const handleLoad = () => {
    setImageLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    onError?.()
  }

  if (imageError || !src) {
    return (
      <div className={`flex items-center justify-center text-4xl ${className}`}>
        {fallbackEmoji}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={cachedSrc}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-150`}
        onLoad={handleLoad}
        onError={handleError}
        loading="eager"
        decoding="sync"
        crossOrigin="anonymous"
      />
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="text-2xl">⏳</div>
        </div>
      )}
    </div>
  )
}

export default useImagePreloader
