'use client'

import React, { Suspense, useCallback, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Object3D } from 'three'
import { SafeAvatarErrorBoundary } from './SafeAvatarErrorBoundary'
import { useSafeModelLoader } from '@/lib/safe-avatar-hooks'
import { validateAvatarUrl, getValidAvatarUrl, isReadyPlayerMeUrl } from '@/lib/avatar-url-utils'
import { handleAvatarLoadError, getUserFriendlyErrorMessage } from '@/lib/avatar-error-recovery'

interface SimpleAvatarViewerProps {
  avatarUrl: string
  enableControls?: boolean
  cameraMode?: 'full' | 'headshot' | 'profile'
  onModelLoad?: (model: Object3D) => void
  onModelError?: (error: any) => void
  className?: string
}

// Safe GLB loader component that validates URLs before loading
const SafeGLBLoader: React.FC<{
  url: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ url, onLoaded, onError }) => {
  const [validatedUrl, setValidatedUrl] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate URL before attempting to load
  useEffect(() => {
    const validateUrl = async () => {
      setIsValidating(true)
      setValidationError(null)
      setValidatedUrl(null)
      
      try {
        // Get properly formatted URL
        const validUrl = getValidAvatarUrl(url)
        if (!validUrl) {
          throw new Error('Invalid URL format')
        }

        // Use the avatar URL validation utility
        const validation = await validateAvatarUrl(validUrl)
        
        if (validation.isValid) {
          setValidatedUrl(validUrl)
        } else {
          throw new Error(validation.error || 'URL validation failed')
        }
      } catch (error) {
        const avatarError = handleAvatarLoadError(error, url)
        const userMessage = getUserFriendlyErrorMessage(avatarError)
        
        setValidationError(userMessage)
        setTimeout(() => {
          onError?.(error instanceof Error ? error : new Error(userMessage))
        }, 0)
      } finally {
        setIsValidating(false)
      }
    }

    validateUrl()
  }, [url, onError])

  // Show loading state while validating
  if (isValidating) {
    return (
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.03]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    )
  }

  // Show error state if validation failed
  if (validationError || !validatedUrl) {
    return (
      <group position={[0, 1, 0]}>
        {/* Fallback avatar representation */}
        <mesh>
          <boxGeometry args={[0.4, 1.8, 0.2]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
        {/* Simple face */}
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

  // Only render the actual GLB loader if URL is validated
  return <ValidatedGLBModel url={validatedUrl} onLoaded={onLoaded} onError={onError} />
}

// Component that only loads validated URLs
const ValidatedGLBModel: React.FC<{
  url: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ url, onLoaded, onError }) => {
  const meshRef = useRef<any>(null)
  const [hasError, setHasError] = useState(false)
  
  // Always call useGLTF hook with validated URL
  const gltf = useGLTF(url)
  
  // Handle successful loading
  useEffect(() => {
    if (gltf?.scene && !hasError) {
      setTimeout(() => {
        onLoaded?.(gltf.scene)
      }, 0)
    }
  }, [gltf, onLoaded, hasError])

  // Handle GLB loading errors
  useEffect(() => {
    if (gltf && !gltf.scene && !gltf.nodes) {
      setHasError(true)
      setTimeout(() => {
        const error = new Error('GLB file failed to load - no scene or nodes found')
        const avatarError = handleAvatarLoadError(error, url)
        onError?.(error)
      }, 0)
    }
  }, [gltf, onError, url])

  // Don't render if there's an error
  if (hasError || !gltf?.scene) {
    return (
      <group position={[0, 1, 0]}>
        {/* Fallback avatar representation */}
        <mesh>
          <boxGeometry args={[0.4, 1.8, 0.2]} />
          <meshStandardMaterial color="#e0e0e0" />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.15]} />
          <meshStandardMaterial color="#f0f0f0" />
        </mesh>
      </group>
    )
  }

  const scene = gltf.scene.clone()
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)

  return <primitive ref={meshRef} object={scene} />
}

const AvatarScene: React.FC<{
  avatarUrl: string
  enableControls: boolean
  cameraMode: 'full' | 'headshot' | 'profile'
  onModelLoad?: (model: Object3D) => void
  onModelError?: (error: any) => void
}> = ({ avatarUrl, enableControls, cameraMode, onModelLoad, onModelError }) => {
  // Use safe model loader to prevent rendering errors
  const {
    isLoading,
    hasError,
    handleModelLoaded,
    handleModelError
  } = useSafeModelLoader(onModelLoad, onModelError)

  // Camera configuration
  const cameraConfig = {
    full: {
      position: [0, 1, 2.5] as [number, number, number],
      target: [0, 1.0, 0] as [number, number, number],
      fov: 50
    },
    headshot: {
      position: [0, 1.8, 1.0] as [number, number, number],  // Raised Y to 1.8 for head level
      target: [0, 1.75, 0] as [number, number, number],     // Target head/face area at 1.75
      fov: 30
    },
    profile: {
      position: [0, 1.8, 0.7] as [number, number, number],  // Raised Y to 1.8, closer for tight shot
      target: [0, 1.75, 0] as [number, number, number],     // Target head/face area
      fov: 25
    }
  }

  const config = cameraConfig[cameraMode]

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      
      {/* Environment */}
      <Environment preset="studio" />
      
      {/* Avatar Model */}
      <SafeGLBLoader
        url={avatarUrl}
        onLoaded={handleModelLoaded}
        onError={handleModelError}
      />
      
      {/* Controls */}
      {enableControls && (
        <OrbitControls
          target={config.target}
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          minDistance={cameraMode === 'profile' ? 0.6 : cameraMode === 'headshot' ? 0.9 : 1.5}
          maxDistance={cameraMode === 'profile' ? 1.5 : cameraMode === 'headshot' ? 2.0 : 5}
        />
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <mesh position={[0, 1, 0]}>
          <sphereGeometry args={[0.05]} />
          <meshStandardMaterial color="lightblue" />
        </mesh>
      )}
      
      {/* Error fallback */}
      {hasError && (
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

export const SimpleAvatarViewer: React.FC<SimpleAvatarViewerProps> = ({
  avatarUrl,
  enableControls = true,
  cameraMode = 'full',
  onModelLoad,
  onModelError,
  className = ''
}) => {
  if (!avatarUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">No avatar available</p>
        </div>
      </div>
    )
  }

  const cameraConfig = {
    full: { 
      position: [0, 1, 2.5] as [number, number, number], 
      target: [0, 1.0, 0] as [number, number, number],
      fov: 50 
    },
    headshot: { 
      position: [0, 1.8, 1.0] as [number, number, number],  // Raised Y to 1.8 for head level, moved back slightly  
      target: [0, 1.75, 0] as [number, number, number],     // Target head/face area at 1.75
      fov: 30 
    },
    profile: { 
      position: [0, 1.8, 0.7] as [number, number, number],  // Raised Y to 1.8, closer for tight shot
      target: [0, 1.75, 0] as [number, number, number],     // Target head/face area
      fov: 25 
    }
  }

  const config = cameraConfig[cameraMode]

  return (
    <div className={`w-full h-full ${className}`}>
      <SafeAvatarErrorBoundary>
        <Canvas
          camera={{ position: config.position, fov: config.fov }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: 'default',
            failIfMajorPerformanceCaveat: false
          }}
          onCreated={({ camera, gl }) => {
            // Set camera to look at the target point
            camera.lookAt(config.target[0], config.target[1], config.target[2])
          }}
        >
          <Suspense fallback={null}>
            <AvatarScene
              avatarUrl={avatarUrl}
              enableControls={enableControls}
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

export default SimpleAvatarViewer