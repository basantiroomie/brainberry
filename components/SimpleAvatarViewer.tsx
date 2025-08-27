'use client'

import React, { Suspense, useCallback, useRef, useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Object3D } from 'three'
import { SafeAvatarErrorBoundary } from './SafeAvatarErrorBoundary'
import { useSafeModelLoader } from '@/lib/safe-avatar-hooks'

interface SimpleAvatarViewerProps {
  avatarUrl: string
  enableControls?: boolean
  cameraMode?: 'full' | 'headshot' | 'profile'
  onModelLoad?: (model: Object3D) => void
  onModelError?: (error: any) => void
  className?: string
}

// Simple GLB loader component
const GLBModel: React.FC<{
  url: string
  onLoaded?: (model: Object3D) => void
  onError?: (error: any) => void
}> = ({ url, onLoaded, onError }) => {
  const meshRef = useRef<any>(null)
  const [hasError, setHasError] = useState(false)
  
  // Always call useGLTF hook - never conditionally
  const gltf = useGLTF(url)
  
  // Handle successful loading
  useEffect(() => {
    if (gltf?.scene && !hasError) {
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        onLoaded?.(gltf.scene)
      }, 0)
    }
  }, [gltf, onLoaded, hasError])

  // Handle errors in useEffect, not during render
  useEffect(() => {
    if (gltf && !gltf.scene && !gltf.nodes) {
      setHasError(true)
      // Use setTimeout to avoid calling during render
      setTimeout(() => {
        const error = new Error('GLB file failed to load - no scene or nodes found')
        console.error('GLB loading error:', error)
        onError?.(error)
      }, 0)
    }
  }, [gltf, onError])

  // Don't render anything if there's an error
  if (hasError || !gltf?.scene) {
    return null
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
      position: [0, 1, 3] as [number, number, number],
      target: [0, 0.5, 0] as [number, number, number],
      fov: 50
    },
    headshot: {
      position: [0, 1.65, 0.8] as [number, number, number],
      target: [0, 1.65, 0] as [number, number, number],
      fov: 25
    },
    profile: {
      position: [0, 1.7, 0.6] as [number, number, number],
      target: [0, 1.7, 0] as [number, number, number],
      fov: 20
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
      <GLBModel
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
          minDistance={cameraMode === 'profile' ? 0.5 : cameraMode === 'headshot' ? 0.8 : 1.5}
          maxDistance={cameraMode === 'profile' ? 1.5 : cameraMode === 'headshot' ? 2.5 : 5}
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
    full: { position: [0, 1, 3] as [number, number, number], fov: 50 },
    headshot: { position: [0, 1.6, 1.5] as [number, number, number], fov: 35 },
    profile: { position: [0, 1.7, 0.6] as [number, number, number], fov: 20 }
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
          onCreated={({ gl }) => {
            // WebGL context ready
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