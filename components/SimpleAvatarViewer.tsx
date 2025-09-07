'use client'

import React, { Suspense, useCallback, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { Object3D } from 'three'
// Preserve skinned mesh skeletons when cloning GLTFs
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
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
  const poseAppliedRef = useRef(false)
  const bonesRef = useRef<{ [key: string]: any } | null>(null)
  const baseQuatRef = useRef<{ [key: string]: any }>({})
  const baseRotXRef = useRef<{ [key: string]: number }>({})
  const currentPoseRef = useRef<'natural' | 'folded'>('natural')
  const startTimeRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0)
  
  // Always call useGLTF hook with validated URL
  const gltf = useGLTF(url)
  
  // Remove early onLoaded call with original scene; we'll provide the rendered clone instead

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

  const scene = useMemo(() => cloneSkeleton(gltf.scene), [gltf])
  scene.scale.setScalar(1)
  scene.position.set(0, 0, 0)

  // Helpers to find and cache common RPM/Mixamo bones
  const forceSkeletonUpdate = useCallback((root: Object3D) => {
    try {
      root.traverse((child: any) => {
        if (child && child.isSkinnedMesh && child.skeleton) {
          child.skeleton.update()
          child.needsUpdate = true
        }
      })
    } catch {}
  }, [])

  const sanitize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isLeftName = (n: string) => {
    const s = sanitize(n)
    return s.includes('left') || s.includes('arml') || s.includes('handl') || s.includes('forearml') || s.includes('upperarml') || s.includes('shoulderl') || s.endsWith('l')
  }
  const isRightName = (n: string) => {
    const s = sanitize(n)
    return s.includes('right') || s.includes('armr') || s.includes('handr') || s.includes('forearmr') || s.includes('upperarmr') || s.includes('shoulderr') || s.endsWith('r')
  }
  const findBoneInSkeletons = useCallback((root: Object3D, names: string[]) => {
    let match: any = null
    const wanted = names.map(sanitize)
    root.traverse((child: any) => {
      if (match) return
      if (child && child.isSkinnedMesh && child.skeleton) {
        const bones = child.skeleton.bones || []
        for (const b of bones) {
          const bn = sanitize(b.name || '')
          if (wanted.some(w => bn.includes(w))) { match = b; break }
        }
      }
      if (child && child.isBone && child.name) {
        const bn = sanitize(child.name)
        if (wanted.some(w => bn.includes(w))) { match = child }
      }
    })
    return match
  }, [])

  const findByNames = useCallback((root: Object3D, names: string[]) => {
    for (const n of names) {
      const o = root.getObjectByName(n)
      if (o) return o as any
    }
    // fallback to skeleton search
    return findBoneInSkeletons(root, names)
  }, [findBoneInSkeletons])

  // Generic inference when specific names are missing
  const inferBone = useCallback((root: Object3D, side: 'L' | 'R', category: 'upperArm' | 'lowerArm' | 'hand' | 'shoulder' | 'clavicle') => {
    let candidate: any = null
    const all: any[] = []
    root.traverse((child: any) => {
      if (child && child.isSkinnedMesh && child.skeleton) {
        (child.skeleton.bones || []).forEach((b: any) => all.push(b))
      } else if (child && child.isBone) {
        all.push(child)
      }
    })
    const wantLeft = side === 'L'
    const sideCheck = wantLeft ? isLeftName : isRightName
    const tokensByCat: Record<string, string[]> = {
      upperArm: ['upperarm','uparm','armupper','arm'],
      lowerArm: ['lowerarm','forearm','loarm','armlower'],
      hand: ['hand','wrist'],
      shoulder: ['shoulder'],
      clavicle: ['clavicle','collar']
    }
    const tokens = tokensByCat[category]
    const score = (name: string) => {
      const s = sanitize(name)
      let pts = 0
      if (sideCheck(name)) pts += 5
      tokens.forEach(t => { if (s.includes(t)) pts += 3 })
      if (category === 'upperArm' && s.includes('arm')) pts += 1
      return pts
    }
    let bestPts = -1
    for (const b of all) {
      const pts = score(b.name || '')
      if (pts > bestPts) { bestPts = pts; candidate = b }
    }
    return bestPts > 0 ? candidate : null
  }, [])

  const cacheBone = useCallback((key: string, bone: any) => {
    if (!bone) return
    if (!bonesRef.current) bonesRef.current = {}
    bonesRef.current![key] = bone
    baseQuatRef.current[key] = bone.quaternion.clone()
    baseRotXRef.current[key] = bone.rotation.x
  }, [])

  const captureRig = useCallback((root: Object3D) => {
    if (!root || bonesRef.current) return
    // Log discovered bone names to aid mapping across rigs
    try {
      const discovered: Set<string> = new Set()
      root.traverse((child: any) => {
        if (child && child.isBone && child.name) discovered.add(child.name)
        if (child && child.isSkinnedMesh && child.skeleton) {
          (child.skeleton.bones || []).forEach((b: any) => b?.name && discovered.add(b.name))
        }
      })
      if (discovered.size > 0) {
        console.log('🦴 Discovered bones:', Array.from(discovered))
      }
    } catch {}
    let leftShoulder = findByNames(root, ['LeftShoulder', 'mixamorigLeftShoulder', 'Shoulder_L', 'clavicle_l', 'l_shoulder']) || inferBone(root, 'L', 'shoulder') || inferBone(root, 'L', 'clavicle')
    let rightShoulder = findByNames(root, ['RightShoulder', 'mixamorigRightShoulder', 'Shoulder_R', 'clavicle_r', 'r_shoulder']) || inferBone(root, 'R', 'shoulder') || inferBone(root, 'R', 'clavicle')
    let leftUpperArm = findByNames(root, ['LeftArm', 'LeftUpperArm', 'mixamorigLeftArm', 'UpperArm_L', 'upper_arm.L', 'upperarm_l']) || inferBone(root, 'L', 'upperArm')
    let rightUpperArm = findByNames(root, ['RightArm', 'RightUpperArm', 'mixamorigRightArm', 'UpperArm_R', 'upper_arm.R', 'upperarm_r']) || inferBone(root, 'R', 'upperArm')
    let leftLowerArm = findByNames(root, ['LeftForeArm', 'LeftLowerArm', 'mixamorigLeftForeArm', 'LowerArm_L', 'forearm.L', 'lowerarm_l']) || inferBone(root, 'L', 'lowerArm')
    let rightLowerArm = findByNames(root, ['RightForeArm', 'RightLowerArm', 'mixamorigRightForeArm', 'LowerArm_R', 'forearm.R', 'lowerarm_r']) || inferBone(root, 'R', 'lowerArm')
    let leftHand = findByNames(root, ['LeftHand', 'mixamorigLeftHand', 'Hand_L', 'hand.L']) || inferBone(root, 'L', 'hand')
    let rightHand = findByNames(root, ['RightHand', 'mixamorigRightHand', 'Hand_R', 'hand.R']) || inferBone(root, 'R', 'hand')
    const spine = findByNames(root, ['Spine', 'mixamorigSpine', 'spine'])
    const chest = findByNames(root, ['Chest', 'Spine1', 'UpperChest', 'mixamorigSpine1', 'mixamorigSpine2'])
    const neck = findByNames(root, ['Neck', 'mixamorigNeck'])

    ;[
      ['leftShoulder', leftShoulder],
      ['rightShoulder', rightShoulder],
      ['leftUpperArm', leftUpperArm],
      ['rightUpperArm', rightUpperArm],
      ['leftLowerArm', leftLowerArm],
      ['rightLowerArm', rightLowerArm],
      ['leftHand', leftHand],
      ['rightHand', rightHand],
      ['spine', spine],
      ['chest', chest],
      ['neck', neck]
    ].forEach(([k, b]) => cacheBone(k as string, b))

    console.log('✅ Selected bones for posing:', {
      leftShoulder: leftShoulder?.name, rightShoulder: rightShoulder?.name,
      leftUpperArm: leftUpperArm?.name, rightUpperArm: rightUpperArm?.name,
      leftLowerArm: leftLowerArm?.name, rightLowerArm: rightLowerArm?.name,
      leftHand: leftHand?.name, rightHand: rightHand?.name
    })
  }, [cacheBone, findByNames])

  const deg = Math.PI / 180

  const restoreBase = useCallback((keys: string[]) => {
    keys.forEach((k) => {
      const b = bonesRef.current?.[k]
      if (b && baseQuatRef.current[k]) {
        b.quaternion.copy(baseQuatRef.current[k])
      }
    })
  }, [])

  const applyNaturalPose = useCallback(() => {
    if (!bonesRef.current) return
    restoreBase(['leftShoulder','rightShoulder','leftUpperArm','rightUpperArm','leftLowerArm','rightLowerArm','leftHand','rightHand'])
    const lU = bonesRef.current.leftUpperArm
    const rU = bonesRef.current.rightUpperArm
    const lL = bonesRef.current.leftLowerArm
    const rL = bonesRef.current.rightLowerArm
    const lS = bonesRef.current.leftShoulder
    const rS = bonesRef.current.rightShoulder
    // Gentle shoulder roll
    if (lS) { lS.rotateZ(6*deg); lS.rotateX(-3*deg) }
    if (rS) { rS.rotateZ(-6*deg); rS.rotateX(-3*deg) }
    // Drop arms ~30° from T-pose
    if (lU) { lU.rotateZ(-30*deg); lU.rotateX(5*deg) }
    if (rU) { rU.rotateZ(30*deg);  rU.rotateX(5*deg) }
    // Small elbow bend
    if (lL) { lL.rotateX(8*deg) }
    if (rL) { rL.rotateX(8*deg) }
    meshRef.current?.updateMatrixWorld(true)
    if (meshRef.current) forceSkeletonUpdate(meshRef.current)
  }, [restoreBase])

  const applyFoldedArmsPose = useCallback(() => {
    if (!bonesRef.current) return
    restoreBase(['leftShoulder','rightShoulder','leftUpperArm','rightUpperArm','leftLowerArm','rightLowerArm','leftHand','rightHand'])
    const lU = bonesRef.current.leftUpperArm
    const rU = bonesRef.current.rightUpperArm
    const lL = bonesRef.current.leftLowerArm
    const rL = bonesRef.current.rightLowerArm
    const lH = bonesRef.current.leftHand
    const rH = bonesRef.current.rightHand
    // Shoulders slight inward yaw helps crossing
    const lS = bonesRef.current.leftShoulder
    const rS = bonesRef.current.rightShoulder
    if (lS) { lS.rotateY(10*deg) }
    if (rS) { rS.rotateY(-10*deg) }

    // Upper arms: bring inward across chest mostly via Y (yaw), small Z to keep close
    if (lU) { lU.rotateY(45*deg); lU.rotateZ(-10*deg) }
    if (rU) { rU.rotateY(-45*deg); rU.rotateZ(10*deg) }

    // Forearms: bend sharply to cross
    if (lL) { lL.rotateX(-90*deg); lL.rotateZ(10*deg) }
    if (rL) { rL.rotateX(-90*deg); rL.rotateZ(-10*deg) }

    // Hands: turn inward
    if (lH) { lH.rotateY(25*deg) }
    if (rH) { rH.rotateY(-25*deg) }
    meshRef.current?.updateMatrixWorld(true)
    if (meshRef.current) forceSkeletonUpdate(meshRef.current)
  }, [restoreBase])

  // Apply only the natural pose once (no looping animations)
  useEffect(() => {
    if (!meshRef.current) return
    captureRig(meshRef.current)
    applyNaturalPose()
    currentPoseRef.current = 'natural'
    poseAppliedRef.current = true
  }, [applyNaturalPose, captureRig])

  // Call onLoaded with the actual rendered instance (clone) once it's mounted
  useEffect(() => {
    if (!hasError && meshRef.current) {
      captureRig(meshRef.current)
      applyNaturalPose()
      currentPoseRef.current = 'natural'
      poseAppliedRef.current = true
      setTimeout(() => {
        onLoaded?.(meshRef.current)
      }, 0)
    }
  }, [hasError, onLoaded, scene, captureRig, applyNaturalPose])

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

export const SimpleAvatarViewer: React.FC<SimpleAvatarViewerProps & { disableAnimation?: boolean }> = ({
  avatarUrl,
  enableControls = true,
  cameraMode = 'full',
  onModelLoad,
  onModelError,
  className = '',
  disableAnimation = true // default to true since animations removed
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