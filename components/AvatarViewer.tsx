'use client'

import React, { Suspense, useCallback, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Object3D } from 'three'
import { AvatarViewerProps } from '@/types/avatar'

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
    console.error('AvatarViewer 3D Error:', error, errorInfo)
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

// GLB Avatar component for displaying Ready Player Me avatars
const GLBAvatar: React.FC<{
  modelSrc: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ modelSrc, onLoaded, onError }) => {
  const meshRef = useRef<any>(null)
  
  // Use useGLTF hook to load the GLB model
  let gltf: any = null
  let loadError: any = null
  
  try {
    gltf = useGLTF(modelSrc)
  } catch (error) {
    loadError = error
  }

  // Handle successful loading
  React.useEffect(() => {
    if (gltf?.scene && onLoaded) {
      console.log('GLB avatar loaded successfully:', gltf)
      onLoaded(gltf.scene)
    }
  }, [gltf, onLoaded])

  // Handle loading errors
  React.useEffect(() => {
    if (loadError && onError) {
      console.error('GLB loading failed:', loadError)
      onError(loadError)
    }
  }, [loadError, onError])

  // If there's an error or no scene, return null
  if (loadError || !gltf?.scene) {
    return null
  }

  // Clone the scene to avoid issues with multiple instances
  const scene = gltf.scene.clone()
  
  // Scale and position the avatar appropriately
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)

  return <primitive ref={meshRef} object={scene} />
}

const AvatarScene: React.FC<{
  avatarUrl: string
  enableControls: boolean
  enableAnimations: boolean
  cameraMode: 'full' | 'headshot'
  onModelLoad?: (model: Object3D) => void
}> = ({ avatarUrl, enableControls, enableAnimations, cameraMode, onModelLoad }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Camera configuration based on mode
  const cameraConfig = {
    full: {
      position: [0, 1, 3] as [number, number, number],
      target: [0, 0.5, 0] as [number, number, number],
      fov: 50
    },
    headshot: {
      position: [0, 1.6, 1.5] as [number, number, number],
      target: [0, 1.6, 0] as [number, number, number],
      fov: 35
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
    setLoadError('Failed to load avatar model')
  }, [])

  // Set up a timeout for loading
  React.useEffect(() => {
    setIsLoading(true)
    setLoadError(null)
    
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Avatar loading timeout')
        setIsLoading(false)
        setLoadError('Loading timeout')
      }
    }, 15000) // 15 second timeout

    return () => clearTimeout(timeout)
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
          minDistance={cameraMode === 'headshot' ? 0.8 : 1.5}
          maxDistance={cameraMode === 'headshot' ? 2.5 : 5}
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
  className = ''
}) => {
  // If no avatar URL is provided, show fallback
  if (!avatarUrl) {
    return (
      <div className={`w-full h-full ${className}`}>
        <NoAvatarFallback />
      </div>
    )
  }

  const cameraConfig = {
    full: {
      position: [0, 1, 3] as [number, number, number],
      fov: 50
    },
    headshot: {
      position: [0, 1.6, 1.5] as [number, number, number],
      fov: 35
    }
  }

  const config = cameraConfig[cameraMode]

  return (
    <div className={`w-full h-full ${className}`}>
      <AvatarViewerErrorBoundary>
        <Canvas
          camera={{
            position: config.position,
            fov: config.fov
          }}
          shadows
          gl={{ 
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
          }}
        >
          <Suspense fallback={null}>
            <AvatarScene
              avatarUrl={avatarUrl}
              enableControls={enableControls}
              enableAnimations={enableAnimations}
              cameraMode={cameraMode}
              onModelLoad={onModelLoad}
            />
          </Suspense>
        </Canvas>
        <Suspense fallback={<LoadingFallback />}>
          {/* This ensures loading state is shown while Canvas loads */}
        </Suspense>
      </AvatarViewerErrorBoundary>
    </div>
  )
}

export default AvatarViewer