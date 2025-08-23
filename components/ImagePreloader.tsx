import { useState, useEffect } from 'react'

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
      fallbackEmoji: fallbackEmojis[index] || '⭐'
    }))
    
    setImageStates(initialStates)

    // Preload all images
    let loadedCount = 0
    const totalImages = images.length

    const imagePromises = images.map((imageUrl, index) => {
      return new Promise<void>((resolve) => {
        // Skip data URLs as they're already loaded
        if (imageUrl.startsWith('data:')) {
          setImageStates(prev => prev.map((state, i) => 
            i === index ? { ...state, loaded: true } : state
          ))
          loadedCount++
          onProgress(loadedCount, totalImages)
          resolve()
          return
        }

        const img = new Image()
        
        img.onload = () => {
          setImageStates(prev => prev.map((state, i) => 
            i === index ? { ...state, loaded: true } : state
          ))
          loadedCount++
          onProgress(loadedCount, totalImages)
          resolve()
        }
        
        img.onerror = () => {
          console.warn(`Failed to load image: ${imageUrl}`)
          setImageStates(prev => prev.map((state, i) => 
            i === index ? { ...state, error: true, loaded: true } : state
          ))
          loadedCount++
          onProgress(loadedCount, totalImages)
          resolve()
        }
        
        img.src = imageUrl
      })
    })

    Promise.all(imagePromises).then(() => {
      setAllLoaded(true)
      onAllLoaded()
    })

  }, [images.join(',')]) // Re-run when images change

  return {
    imageStates,
    allLoaded,
    getImageState: (url: string) => imageStates.find(state => state.url === url)
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

  useEffect(() => {
    setImageError(false)
    setImageLoaded(false)
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
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
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
