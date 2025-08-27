// Avatar system TypeScript types
import { Object3D } from 'three'
import * as React from 'react'

export interface AvatarViewerProps {
  avatarUrl: string | null
  enableControls?: boolean
  enableAnimations?: boolean
  cameraMode?: 'full' | 'headshot' | 'profile'
  onModelLoad?: (model: Object3D) => void
  onModelError?: (error: any) => void
  onHeadshotCapture?: (dataUrl: string) => void
  className?: string
  style?: React.CSSProperties
}

export interface AvatarCustomizerProps {
  childId: string
  currentAvatarUrl: string | null
  onAvatarUpdate: (newUrl: string) => void
}

export interface AvatarChatbotProps {
  avatarUrl: string
  childId: string
  onMessageSent?: (message: string) => void
}

// TTS Configuration Types
export interface TTSConfig {
  engine: 'speechSynthesis' | 'elevenlabs'
  preferredVoices: string[]
  fallbackVoice: string
  rate: number
  pitch: number
  volume: number
  onBoundary?: (event: SpeechSynthesisEvent) => void
  voiceFilters: {
    excludeRobotic: boolean
    preferNeural: boolean
    preferLocal: boolean
  }
}

export interface ElevenLabsConfig {
  apiKey: string
  voiceId: string
  model: string
  stability: number
  similarity_boost: number
}

export interface TTSVoice {
  name: string
  lang: string
  localService: boolean
  default: boolean
  voiceURI: string
}

// Avatar Animation Types
export interface BlendShapeTargets {
  jawOpen: number
  mouthSmile: number
  mouthFunnel: number
  eyeBlinkLeft: number
  eyeBlinkRight: number
}

export interface AnimationState {
  isIdle: boolean
  isSpeaking: boolean
  currentBlendShapes: Partial<BlendShapeTargets>
}

// Wawa Lipsync Types
export interface LipsyncManager {
  processAudio(): void
  viseme: string
  setAudioContext(context: AudioContext): void
  setAudioSource(source: AudioBufferSourceNode): void
}

export interface VisemeMapping {
  [viseme: string]: Partial<BlendShapeTargets>
}

export interface LipsyncConfig {
  visemeToMorphTarget: VisemeMapping
  audioContext?: AudioContext
  smoothingFactor: number
}

// API Response Types
export interface CreateAvatarRequest {
  childId: string
  photo: File
}

export interface CreateAvatarResponse {
  success: boolean
  avatarUrl?: string
  headshotUrl?: string
  error?: string
}

export interface UpdateAvatarRequest {
  childId: string
  avatarConfig: any
}

export interface UpdateAvatarResponse {
  success: boolean
  avatarUrl?: string
  headshotUrl?: string
  error?: string
}

export interface AvatarAssetsResponse {
  categories: {
    [category: string]: {
      id: string
      name: string
      thumbnailUrl: string
      assetUrl: string
    }[]
  }
}

// Avatar Permissions
export interface AvatarPermissions {
  can_customize: boolean
  can_chat: boolean
  chat_time_limit_minutes: number
}