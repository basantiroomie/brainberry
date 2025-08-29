'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'

interface AvatarSnapshotGeneratorProps {
  avatarUrl: string
  onSnapshotGenerated: (dataUrl: string) => void
  onError?: (error: string) => void
  size?: number
  autoGenerate?: boolean
  className?: string
  childId?: string // Optional: if provided, will save snapshot to server
}

// Simple avatar model component using Ready Player Me API
const AvatarModel: React.FC<{
  url: string
  onLoaded?: () => void
  onError?: (error: any) => void
}> = ({ url, onLoaded, onError }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // Extract avatar ID from GLB URL and create proper Ready Player Me image URL
  const avatarId = url.split('/').pop()?.replace('.glb', '') || ''
  const imageUrl = `https://models.readyplayer.me/${avatarId}.png?camera=portrait&size=512`
  
  const handleImageLoad = () => {
    setImageLoaded(true)
    onLoaded?.()
  }
  
  const handleImageError = () => {
    console.error('Failed to load Ready Player Me image:', imageUrl)
    onError?.('Failed to load avatar image')
  }
  
  return (
    <img
      src={imageUrl}
      alt="Avatar"
      onLoad={handleImageLoad}
      onError={handleImageError}
      style={{ display: 'none' }} // Hidden, just for loading
      crossOrigin="anonymous"
    />
  )
}

// Simple canvas-based avatar renderer
const CanvasAvatarRenderer: React.FC<{
  avatarUrl: string
  size: number
  onRendered: (dataUrl: string) => void
  onError: (error: string) => void
}> = ({ avatarUrl, size, onRendered, onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const renderAvatar = async () => {
      try {
        // Extract avatar ID from GLB URL
        const avatarId = avatarUrl.split('/').pop()?.replace('.glb', '') || ''
        
        // Only try Ready Player Me PNG for long codes (24+ characters)
        if (avatarId.length >= 24) {
          const imageUrl = `https://models.readyplayer.me/${avatarId}.png`
          
          // Create image element
          const img = new Image()
          img.crossOrigin = 'anonymous'
          
          img.onload = () => {
            const canvas = canvasRef.current
            if (!canvas) return
            
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            
            // Set canvas size
            canvas.width = size
            canvas.height = size
            
            // Clear canvas with transparent background
            ctx.clearRect(0, 0, size, size)
            
            // Draw the avatar image
            ctx.drawImage(img, 0, 0, size, size)
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/png', 0.9)
            onRendered(dataUrl)
          }
          
          img.onerror = () => {
            // If Ready Player Me PNG fails, fall back to error
            onError('Ready Player Me PNG not available for this avatar')
          }
          
          img.src = imageUrl
        } else {
          // For short codes, immediately fall back to error (will trigger SVG generator)
          onError('Avatar ID too short for Ready Player Me PNG')
        }
      } catch (error) {
        onError(`Error rendering avatar: ${error}`)
      }
    }
    
    renderAvatar()
  }, [avatarUrl, size, onRendered, onError])
  
  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }}
      width={size}
      height={size}
    />
  )
}

export const AvatarSnapshotGenerator: React.FC<AvatarSnapshotGeneratorProps> = ({
  avatarUrl,
  onSnapshotGenerated,
  onError,
  size = 256,
  autoGenerate = true,
  className = '',
  childId
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleAvatarRendered = useCallback(async (dataUrl: string) => {
    if (hasGenerated) return
    
    setIsGenerating(true)
    
    try {
      console.log('Avatar snapshot generated successfully')
      
      // If childId is provided, save to server
      if (childId) {
        try {
          const response = await fetch('/api/avatars/save-snapshot', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              childId,
              snapshotDataUrl: dataUrl
            })
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Snapshot saved to server:', result.snapshotUrl)
            onSnapshotGenerated(result.snapshotUrl || dataUrl)
          } else {
            console.warn('Failed to save snapshot to server, using data URL')
            onSnapshotGenerated(dataUrl)
          }
        } catch (saveError) {
          console.warn('Error saving snapshot to server:', saveError)
          onSnapshotGenerated(dataUrl)
        }
      } else {
        onSnapshotGenerated(dataUrl)
      }
      
      setHasGenerated(true)
    } catch (error) {
      console.error('Error processing avatar snapshot:', error)
      onError?.('Failed to process profile picture')
    } finally {
      setIsGenerating(false)
    }
  }, [childId, onSnapshotGenerated, onError, hasGenerated])

  const handleRenderError = useCallback((error: string) => {
    console.error('Avatar render error:', error)
    onError?.(error)
    setIsGenerating(false)
  }, [onError])

  if (!avatarUrl || hasGenerated) {
    return null
  }

  return (
    <div className={`avatar-snapshot-generator ${className}`}>
      {autoGenerate && !hasGenerated && (
        <CanvasAvatarRenderer
          avatarUrl={avatarUrl}
          size={size}
          onRendered={handleAvatarRendered}
          onError={handleRenderError}
        />
      )}
      
      {isGenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-full">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

export default AvatarSnapshotGenerator