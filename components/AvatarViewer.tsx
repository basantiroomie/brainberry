'use client'

import React, { Suspense, useCallback, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Object3D } from 'three'
import { AvatarViewerProps } from '@/types/avatar'
import { 
  avatarCacheManager, 
  getCachedAvatarModel, 
  cacheAvatarModel 
} from '@/lib/avatar-cache-manager'
import { 
  handleAvatarError, 
  AvatarErrorType 
} from '@/lib/avatar-error-handler'
import { retryAvatarLoad } from '@/lib/avatar-retry-manager'
import { logger } from '@/utils/logger'
import { useSafeAvatar } from '@/lib/avatar-error-prevention'
import { SafeAvatarErrorBoundary } from './SafeAvatarErrorBoundary'

// Preload function to handle errors better
const preloadGLTF = (url: string) => {
  try {
    useGLTF.preload(url)
  } catch (error) {
    console.warn('Failed to preload GLB:', url, error)
  }
}

// AvatarViewerProps is now imported from types/avatar.ts

interface AvatarViewerErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class AvatarViewerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  AvatarViewerErrorBoundaryState
> {
  state: AvatarViewerErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: Error): AvatarViewerErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log meaningful errors, not empty objects
    if (error && (error.message || error.stack)) {
      console.error('AvatarViewer 3D Error:', {
        error: error.message || error.toString(),
        stack: error.stack,
        errorInfo: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    } else {
      console.warn('AvatarViewer: Empty error caught, likely a network or loading issue')
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
            <div className="text-center p-4">
              <div className="text-gray-500 mb-2">
                <svg
                  className="w-12 h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <p className="text-sm text-gray-600">Unable to load 3D avatar</p>
              <p className="text-xs text-gray-500 mt-1">
                Please try refreshing or contact support
              </p>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Internal component that always calls useGLTF with performance monitoring and caching
const GLTFModel: React.FC<{
  url: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ url, onLoaded, onError }) => {
  const meshRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const loadStartTime = useRef<number>(0)
  
  // Check cache first
  const cachedModel = getCachedAvatarModel(url)
  
  // Always call useGLTF hook - this is required by React hooks rules
  const gltf = useGLTF(url)

  useEffect(() => {
    loadStartTime.current = performance.now()
    setIsLoading(true)
    setHasError(false)
  }, [url])

  useEffect(() => {
    if (gltf?.scene && !hasError) {
      const loadTime = performance.now() - loadStartTime.current
      
      // Log successful load
      if (process.env.NODE_ENV === 'development') {
        logger.debug('Avatar model loaded', 'AVATAR_VIEWER', {
          url,
          loadTime: `${loadTime.toFixed(2)}ms`,
          cached: !!cachedModel,
          animationCount: gltf.animations?.length || 0
        })
      }

      // Cache the model if not already cached
      if (!cachedModel) {
        cacheAvatarModel(url, gltf.scene)
      }

      setIsLoading(false)
      
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        onLoaded?.(gltf.scene)
      }, 0)
    }
  }, [gltf, url, onLoaded, cachedModel, hasError])

  useEffect(() => {
    // Check for loading errors with enhanced error handling
    if (gltf && !hasError) {
      if (gltf.scene === undefined && gltf.nodes === undefined) {
        const error = new Error('GLB file failed to load - no scene or nodes found')
        
        handleAvatarError(
          AvatarErrorType.LOADING_ERROR,
          'Failed to load GLB model',
          error,
          { avatarUrl: url, operation: 'gltf-load' }
        )

        setIsLoading(false)
        setHasError(true)
        
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          onError?.(error)
        }, 0)
        return
      }
    }
  }, [gltf, onError, url, hasError])

  // Don't render if there's an error
  if (hasError) {
    return null
  }

  // Return cached model if available
  if (cachedModel && !isLoading) {
    const scene = cachedModel.clone()
    scene.scale.setScalar(1)
    scene.position.set(0, 0, 0)
    return <primitive ref={meshRef} object={scene} />
  }

  if (!gltf?.scene) {
    return null
  }

  // Clone the scene to avoid issues with multiple instances
  const scene = gltf.scene.clone()
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)

  return <primitive ref={meshRef} object={scene} />
}

// GLB Avatar component for displaying Ready Player Me avatars with retry logic
const GLBAvatar: React.FC<{
  modelSrc: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ modelSrc, onLoaded, onError }) => {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const retryAttemptRef = useRef(0)

  // Memoize callbacks to prevent dependency array changes
  const handleLoaded = useCallback((model: Object3D) => {
    setLoadError(null)
    setIsRetrying(false)
    retryAttemptRef.current = 0
    onLoaded?.(model)
  }, [onLoaded])

  const handleError = useCallback(async (error: any) => {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    logger.error(`GLB avatar loading error (attempt ${retryAttemptRef.current + 1}) for ${modelSrc}`, errorObj, 'AVATAR_VIEWER')

    // Try retry mechanism
    if (retryAttemptRef.current < 2) { // Max 2 retries
      setIsRetrying(true)
      retryAttemptRef.current++
      
      logger.info(
        `Retrying avatar load (attempt ${retryAttemptRef.current + 1}/3)`,
        'AVATAR_VIEWER'
      )

      // Use retry manager for the load operation
      const retryResult = await retryAvatarLoad(
        async () => {
          // Force reload by clearing cache and preloading again
          useGLTF.clear(modelSrc)
          useGLTF.preload(modelSrc)
          return Promise.resolve()
        },
        modelSrc
      )

      if (!retryResult.success) {
        setLoadError(errorObj.message || 'Failed to load model')
        setIsRetrying(false)
        onError?.(errorObj)
      }
    } else {
      setLoadError(errorObj.message || 'Failed to load model')
      setIsRetrying(false)
      onError?.(errorObj)
    }
  }, [modelSrc, onError])

  // Validate URL with enhanced error handling
  useEffect(() => {
    if (!modelSrc || typeof modelSrc !== 'string') {
      const error = new Error(`Invalid avatar URL: ${modelSrc}`)
      
      handleAvatarError(
        AvatarErrorType.VALIDATION_ERROR,
        'Invalid avatar URL provided',
        error,
        { avatarUrl: modelSrc, operation: 'url-validation' }
      )

      setLoadError(error.message)
      
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        handleError(error)
      }, 0)
      return
    }

    // Check if URL is accessible before attempting to load
    const validateUrl = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
        
        const response = await fetch(modelSrc, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          throw new Error(`Avatar not found: ${response.status} ${response.statusText}`)
        }
        
        // Reset error state if URL is valid
        setLoadError(null)
        setIsRetrying(false)
        retryAttemptRef.current = 0
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to validate avatar URL'
        console.warn('Avatar URL validation failed:', {
          url: modelSrc,
          error: errorMessage,
          isAbortError: error instanceof Error && error.name === 'AbortError'
        })
        
        // If it's a 404 or network error, set error immediately
        if (errorMessage.includes('404') || errorMessage.includes('not found')) {
          setLoadError('Avatar not found - this avatar may have been deleted or moved')
          
          // Use setTimeout to avoid calling during render
          setTimeout(() => {
            handleError(new Error(errorMessage))
          }, 0)
        }
        // For other errors, let the GLTFModel component try to load anyway
      }
    }

    validateUrl()
  }, [modelSrc, handleError])

  // If there's an error or invalid URL, show fallback avatar
  if (loadError || !modelSrc || typeof modelSrc !== 'string') {
    return (
      <group position={[0, 1, 0]}>
        {/* Simple fallback avatar representation */}
        <mesh>
          <boxGeometry args={[0.4, 1.8, 0.2]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        {/* Add a simple face */}
        <mesh position={[0, 0.85, 0.12]}>
          <sphereGeometry args={[0.02]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-0.05, 0.82, 0.12]}>
          <sphereGeometry args={[0.015]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[0.05, 0.82, 0.12]}>
          <sphereGeometry args={[0.015]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    )
  }

  // Preload the model with error handling
  useEffect(() => {
    const preloadModel = async () => {
      try {
        useGLTF.preload(modelSrc)
      } catch (error) {
        logger.warn('Failed to preload GLB', 'AVATAR_VIEWER', { 
          url: modelSrc, 
          error 
        })
      }
    }

    preloadModel()
  }, [modelSrc])

  return (
    <>
      <GLTFModel
        url={modelSrc}
        onLoaded={handleLoaded}
        onError={handleError}
      />
      {isRetrying && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      )}
    </>
  )
}

const AvatarScene: React.FC<{
  avatarUrl: string
  enableControls: boolean
  enableAnimations: boolean
  cameraMode: 'full' | 'headshot' | 'profile'
  onModelLoad?: (model: Object3D) => void
  onModelError?: (error: any) => void
}> = ({ avatarUrl, enableControls, enableAnimations, cameraMode, onModelLoad, onModelError }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Camera configuration based on mode
  const cameraConfig = {
    full: {
      position: [0, 1, 2.5] as [number, number, number], // <-- MATCH THE CHANGE
      target: [0, 1.0, 0] as [number, number, number], // <-- RAISE THE TARGET from 0.5 to 1.0
      fov: 50
    },
    headshot: {
      position: [0, 1.65, 0.8] as [number, number, number],
      target: [0, 1.6, 0] as [number, number, number], // <-- TARGET THE HEAD
      fov: 25
    },
    profile: {
      position: [0, 1.7, 0.6] as [number, number, number], // Very close to face
      target: [0, 1.7, 0] as [number, number, number], // Focus on head/face area
      fov: 20 // Very tight zoom for profile picture
    }
  }

  const config = cameraConfig[cameraMode]

  const handleModelLoad = useCallback((model: Object3D) => {
    console.log('Avatar model loaded successfully:', model)
    setIsLoading(false)
    setLoadError(null)
    
    // Call the external callback if provided
    if (onModelLoad) {
      onModelLoad(model)
    }
  }, [onModelLoad])

  const handleModelError = useCallback((error: any) => {
    console.error('Avatar model loading error:', error)
    setIsLoading(false)
    
    // Provide more detailed error messages
    let errorMessage = 'Failed to load avatar model'
    
    if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error?.status) {
      errorMessage = `Network error: ${error.status}`
    }
    
    setLoadError(errorMessage)
    
    // Call the external error handler if provided
    if (onModelError) {
      onModelError(error)
    }
  }, [onModelError])

  // Set up a timeout for loading and validate URL
  useEffect(() => {
    setIsLoading(true)
    setLoadError(null)
    
    // Validate avatar URL
    if (!avatarUrl || typeof avatarUrl !== 'string') {
      console.error('Invalid avatar URL provided:', avatarUrl)
      setIsLoading(false)
      setLoadError('Invalid avatar URL')
      return
    }

    // Check if URL is accessible
    if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/')) {
      console.error('Avatar URL must be a valid HTTP URL or relative path:', avatarUrl)
      setIsLoading(false)
      setLoadError('Invalid avatar URL format')
      return
    }

    let timeoutId: NodeJS.Timeout

    // Test network connectivity to the avatar URL
    const testConnectivity = async () => {
      try {
        // Try a HEAD request first to check if the resource exists
        const controller = new AbortController()
        const connectivityTimeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout for connectivity test
        
        // Skip HEAD request for ReadyPlayer.me URLs as they often don't support it
        if (avatarUrl.includes('readyplayer.me') || avatarUrl.includes('models.readyplayer.me')) {
          clearTimeout(connectivityTimeoutId)
          return // Skip connectivity test for ReadyPlayer.me URLs
        }
        
        const response = await fetch(avatarUrl, { 
          method: 'HEAD',
          mode: 'cors',
          cache: 'no-cache',
          signal: controller.signal
        })
        
        clearTimeout(connectivityTimeoutId)
        
        if (!response.ok) {
          throw new Error(`Avatar not found: ${response.status} ${response.statusText}`)
        }
        
        console.log('Avatar URL is accessible:', {
          url: avatarUrl,
          status: response.status,
          contentType: response.headers.get('content-type'),
          contentLength: response.headers.get('content-length')
        })
        
      } catch (error) {
        console.warn('Avatar connectivity test failed:', {
          url: avatarUrl,
          error: error instanceof Error ? error.message : error,
          name: error instanceof Error ? error.name : 'Unknown',
          isAbortError: error instanceof Error && error.name === 'AbortError',
          isCorsError: error instanceof Error && error.message.includes('CORS'),
          isNetworkError: error instanceof Error && error.message.includes('network')
        })
        // Don't fail immediately - the useGLTF hook might still work
        // This is just for debugging
      }
    }
    
    testConnectivity()
    
    timeoutId = setTimeout(() => {
      console.warn('Avatar loading timeout for URL:', avatarUrl)
      setIsLoading(false)
      setLoadError('Loading timeout - please check your internet connection')
    }, 20000) // 20 second timeout (increased for slow connections)

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [avatarUrl])

  return (
    <>
      {/* Lighting setup */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Environment for realistic reflections */}
      <Environment preset="studio" />
      
      {/* GLB Avatar component */}
      <GLBAvatar
        modelSrc={avatarUrl}
        onLoaded={handleModelLoad}
        onError={handleModelError}
      />
      
      {/* Camera controls */}
      {enableControls && (
        <OrbitControls
          target={config.target}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={cameraMode === 'profile' ? 0.5 : cameraMode === 'headshot' ? 0.8 : 1.5}
          maxDistance={cameraMode === 'profile' ? 1.5 : cameraMode === 'headshot' ? 2.5 : 5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
        />
      )}
      
      {/* Show loading or error state */}
      {isLoading && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
      )}
      
      {loadError && (
        <group position={[0, 1, 0]}>
          <mesh>
            <boxGeometry args={[0.4, 1.8, 0.2]} />
            <meshStandardMaterial color="lightgray" />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <sphereGeometry args={[0.15]} />
            <meshStandardMaterial color="lightgray" />
          </mesh>
        </group>
      )}
    </>
  )
}

const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading avatar...</p>
    </div>
  </div>
)

const NoAvatarFallback: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full bg-gray-50 rounded-lg">
    <div className="text-center p-4">
      <div className="text-gray-400 mb-2">
        <svg
          className="w-16 h-16 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-600">No avatar available</p>
      <p className="text-xs text-gray-500 mt-1">
        An avatar needs to be created first
      </p>
    </div>
  </div>
)

export const AvatarViewer: React.FC<AvatarViewerProps> = ({
  avatarUrl,
  enableControls = true,
  enableAnimations = true,
  cameraMode = 'full',
  onModelLoad,
  onModelError,
  onHeadshotCapture,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [hasValidationError, setHasValidationError] = useState(false)
  
  // Use safe avatar loading
  const { safeUrl, isLoading: urlValidating, error: urlError } = useSafeAvatar(avatarUrl)
  
  // Enhanced debug logging with performance context (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('AvatarViewer received URL', 'AVATAR_VIEWER', {
        avatarUrl,
        safeUrl,
        type: typeof avatarUrl,
        length: avatarUrl?.length,
        isValid: avatarUrl && typeof avatarUrl === 'string' && avatarUrl.length > 0,
        cameraMode,
        enableControls,
        enableAnimations,
        urlError
      })
    }
  }, [avatarUrl, safeUrl, cameraMode, enableControls, enableAnimations, urlError])

  // Handle URL validation errors
  useEffect(() => {
    if (urlError) {
      setHasValidationError(true)
      if (onModelError) {
        onModelError(new Error(`Avatar URL validation failed: ${urlError}`))
      }
    } else {
      setHasValidationError(false)
    }
  }, [urlError, onModelError])

  // Headshot capture functionality
  const captureHeadshot = useCallback(() => {
    if (!canvasRef.current) {
      console.error('Canvas ref not available for headshot capture')
      return null
    }

    try {
      // Get the canvas element from React Three Fiber
      const canvas = canvasRef.current.querySelector('canvas') as HTMLCanvasElement
      if (!canvas) {
        console.error('Canvas element not found for headshot capture')
        return null
      }

      // Create a new canvas for the headshot
      const headshotCanvas = document.createElement('canvas')
      const ctx = headshotCanvas.getContext('2d')
      if (!ctx) {
        console.error('Could not get 2D context for headshot canvas')
        return null
      }

      // Set headshot dimensions (square format for profile pictures)
      const size = 256
      headshotCanvas.width = size
      headshotCanvas.height = size

      // Draw the current frame to the headshot canvas
      ctx.drawImage(canvas, 0, 0, size, size)

      // Convert to data URL
      const dataUrl = headshotCanvas.toDataURL('image/png', 0.9)
      
      console.log('Headshot captured successfully')
      
      // Call the callback if provided
      if (onHeadshotCapture) {
        onHeadshotCapture(dataUrl)
      }
      
      return dataUrl
    } catch (error) {
      console.error('Error capturing headshot:', error)
      return null
    }
  }, [onHeadshotCapture])

  // Expose capture function via ref if needed
  useEffect(() => {
    if (onModelLoad) {
      // Add capture function to the model load callback context
      const originalOnModelLoad = onModelLoad
      onModelLoad = (model: Object3D) => {
        originalOnModelLoad(model)
        // Attach capture function to the model for external access
        ;(model as any).captureHeadshot = captureHeadshot
      }
    }
  }, [onModelLoad, captureHeadshot])

  // Show loading state while validating URL
  if (urlValidating) {
    return (
      <div className={`w-full h-full ${className}`}>
        <LoadingFallback />
      </div>
    )
  }

  // If no avatar URL is provided or validation failed, show fallback
  if (!avatarUrl || hasValidationError || !safeUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('AvatarViewer: No valid avatar URL available', {
        avatarUrl,
        hasValidationError,
        safeUrl,
        urlError
      })
    }
    return (
      <div className={`w-full h-full ${className}`}>
        <NoAvatarFallback />
      </div>
    )
  }

  const cameraConfig = {
    full: {
      position: [0, 1, 2.5] as [number, number, number], // <-- Adjusted Z from 3 to 2.5 for a closer default
      fov: 50
    },
    headshot: {
      position: [0, 1.6, 1.2] as [number, number, number], // <-- Adjusted Z from 1.5 to 1.2 for a better headshot
      fov: 35
    },
    profile: {
      position: [0, 1.7, 0.6] as [number, number, number],
      fov: 20
    }
  }

  const config = cameraConfig[cameraMode]

  return (
    <div className={`w-full h-full ${className}`} ref={canvasRef}>
      <SafeAvatarErrorBoundary>
        <Canvas
          camera={{
            position: config.position,
            fov: config.fov
          }}
          shadows
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            powerPreference: 'default', // Use default instead of high-performance for compatibility
            failIfMajorPerformanceCaveat: false, // Don't fail on slower hardware
            stencil: false, // Disable stencil buffer to reduce memory usage
            depth: true // Ensure depth buffer is enabled
          }}
          dpr={[1, 2]} // Limit device pixel ratio for performance
          onCreated={({ gl, scene, camera }) => {
            try {
              // Safely log WebGL context info with error handling (only in development)
              if (process.env.NODE_ENV === 'development' && gl && gl.getContext) {
                const webglContext = gl.getContext()
                if (webglContext && typeof webglContext.getParameter === 'function') {
                  logger.debug('WebGL context created', 'AVATAR_VIEWER', {
                    renderer: webglContext.getParameter(webglContext.RENDERER),
                    vendor: webglContext.getParameter(webglContext.VENDOR),
                    version: webglContext.getParameter(webglContext.VERSION),
                    maxTextureSize: webglContext.getParameter(webglContext.MAX_TEXTURE_SIZE),
                    maxVertexAttribs: webglContext.getParameter(webglContext.MAX_VERTEX_ATTRIBS)
                  })
                }
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                logger.error('Error accessing WebGL context', error, 'AVATAR_VIEWER')
              }
            }
          }}
        >
          <Suspense fallback={null}>
            <AvatarScene
              avatarUrl={safeUrl}
              enableControls={enableControls}
              enableAnimations={enableAnimations}
              cameraMode={cameraMode}
              onModelLoad={onModelLoad}
              onModelError={onModelError}
            />
          </Suspense>
        </Canvas>
      </SafeAvatarErrorBoundary>
    </div>
  )
}

export default AvatarViewer