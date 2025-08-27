// Wawa Lipsync Manager for Avatar Lip-Sync Animation
import { Lipsync } from 'wawa-lipsync'
import { BlendShapeTargets, VisemeMapping, LipsyncConfig } from '@/types/avatar'

/**
 * Global Lipsync Manager Instance
 * Handles real-time lip-sync animation using Wawa Lipsync library
 */
export class LipsyncManager {
  private lipsync: Lipsync
  private audioContext: AudioContext | null = null
  private audioSource: AudioBufferSourceNode | null = null
  private isProcessing = false
  private animationFrameId: number | null = null
  private onVisemeCallback?: (blendShapes: Partial<BlendShapeTargets>) => void

  // Viseme to Ready Player Me morph target mapping
  private readonly visemeToMorphTarget: VisemeMapping = {
    'A': { jawOpen: 0.8, mouthSmile: 0.1 },
    'E': { jawOpen: 0.5, mouthSmile: 0.6 },
    'I': { jawOpen: 0.2, mouthSmile: 0.8 },
    'O': { jawOpen: 0.7, mouthFunnel: 0.8 },
    'U': { jawOpen: 0.3, mouthFunnel: 0.9 },
    'B': { jawOpen: 0.1, mouthSmile: 0.0 },
    'C': { jawOpen: 0.4, mouthFunnel: 0.3 },
    'D': { jawOpen: 0.3, mouthSmile: 0.2 },
    'F': { jawOpen: 0.2, mouthFunnel: 0.1 },
    'G': { jawOpen: 0.4, mouthSmile: 0.1 },
    'H': { jawOpen: 0.3, mouthSmile: 0.0 },
    'K': { jawOpen: 0.4, mouthSmile: 0.0 },
    'L': { jawOpen: 0.2, mouthSmile: 0.3 },
    'M': { jawOpen: 0.0, mouthSmile: 0.0 },
    'N': { jawOpen: 0.2, mouthSmile: 0.1 },
    'P': { jawOpen: 0.0, mouthSmile: 0.0 },
    'Q': { jawOpen: 0.5, mouthFunnel: 0.6 },
    'R': { jawOpen: 0.3, mouthSmile: 0.2 },
    'S': { jawOpen: 0.1, mouthSmile: 0.4 },
    'T': { jawOpen: 0.2, mouthSmile: 0.1 },
    'V': { jawOpen: 0.2, mouthFunnel: 0.2 },
    'W': { jawOpen: 0.3, mouthFunnel: 0.7 },
    'X': { jawOpen: 0.3, mouthSmile: 0.2 },
    'Y': { jawOpen: 0.2, mouthSmile: 0.6 },
    'Z': { jawOpen: 0.2, mouthSmile: 0.3 },
    'rest': { jawOpen: 0.0, mouthSmile: 0.0, mouthFunnel: 0.0 }
  }

  constructor(config?: Partial<LipsyncConfig>) {
    this.lipsync = new Lipsync()
    
    // Apply custom viseme mapping if provided
    if (config?.visemeToMorphTarget) {
      this.visemeToMorphTarget = { ...this.visemeToMorphTarget, ...config.visemeToMorphTarget }
    }

    // Initialize audio context if provided
    if (config?.audioContext) {
      this.setAudioContext(config.audioContext)
    }
  }

  /**
   * Set audio context for processing
   */
  setAudioContext(context: AudioContext) {
    this.audioContext = context
    // Note: Wawa Lipsync may need specific setup for audio context
    // This will be implemented based on the library's API
  }

  /**
   * Set audio source for lip-sync processing
   */
  setAudioSource(source: AudioBufferSourceNode) {
    this.audioSource = source
    // Connect audio source to lipsync processor
    // Implementation depends on Wawa Lipsync API
  }

  /**
   * Set callback for viseme updates
   */
  setVisemeCallback(callback: (blendShapes: Partial<BlendShapeTargets>) => void) {
    this.onVisemeCallback = callback
  }

  /**
   * Start processing audio for lip-sync
   */
  startProcessing() {
    if (this.isProcessing) return

    this.isProcessing = true
    this.processAudioFrame()
  }

  /**
   * Stop processing audio
   */
  stopProcessing() {
    this.isProcessing = false
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // Reset to rest position
    if (this.onVisemeCallback) {
      this.onVisemeCallback(this.visemeToMorphTarget['rest'])
    }
  }

  /**
   * Process audio frame and update visemes
   */
  private processAudioFrame() {
    if (!this.isProcessing) return

    try {
      // Process audio with Wawa Lipsync
      this.lipsync.processAudio()
      
      // Get current viseme
      const currentViseme = this.lipsync.viseme || 'rest'
      
      // Map viseme to morph targets
      const morphTargets = this.visemeToMorphTarget[currentViseme] || this.visemeToMorphTarget['rest']
      
      // Trigger callback with blend shapes
      if (this.onVisemeCallback) {
        this.onVisemeCallback(morphTargets)
      }
    } catch (error) {
      console.error('Lipsync processing error:', error)
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(() => this.processAudioFrame())
  }

  /**
   * Process audio from HTML audio element
   */
  processAudioElement(audioElement: HTMLAudioElement) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }

    try {
      // Create media element source
      const source = this.audioContext.createMediaElementSource(audioElement)
      
      // Connect to destination (speakers)
      source.connect(this.audioContext.destination)
      
      // Set up for lipsync processing
      this.setAudioSource(source as any) // Type assertion for compatibility
      
      // Start processing when audio plays
      audioElement.addEventListener('play', () => {
        this.startProcessing()
      })
      
      // Stop processing when audio ends
      audioElement.addEventListener('ended', () => {
        this.stopProcessing()
      })
      
      audioElement.addEventListener('pause', () => {
        this.stopProcessing()
      })
      
    } catch (error) {
      console.error('Error setting up audio element for lipsync:', error)
    }
  }

  /**
   * Process audio from Speech Synthesis
   */
  processSpeechSynthesis(utterance: SpeechSynthesisUtterance) {
    // For browser TTS, we'll use word boundary events for basic lip-sync
    // since we can't directly access the audio stream
    
    utterance.onboundary = (event) => {
      if (event.name === 'word' && this.onVisemeCallback) {
        // Simulate mouth movement for word boundaries
        const randomVisemes = ['A', 'E', 'I', 'O', 'U']
        const randomViseme = randomVisemes[Math.floor(Math.random() * randomVisemes.length)]
        const morphTargets = this.visemeToMorphTarget[randomViseme]
        
        this.onVisemeCallback(morphTargets)
        
        // Reset after a short delay
        setTimeout(() => {
          if (this.onVisemeCallback) {
            this.onVisemeCallback(this.visemeToMorphTarget['rest'])
          }
        }, 100 + Math.random() * 100)
      }
    }

    utterance.onstart = () => {
      this.isProcessing = true
    }

    utterance.onend = () => {
      this.stopProcessing()
    }
  }

  /**
   * Get current viseme
   */
  getCurrentViseme(): string {
    return this.lipsync.viseme || 'rest'
  }

  /**
   * Check if currently processing
   */
  isActive(): boolean {
    return this.isProcessing
  }

  /**
   * Cleanup resources
   */
  dispose() {
    this.stopProcessing()
    this.audioContext = null
    this.audioSource = null
    this.onVisemeCallback = undefined
  }
}

// Global instance for use across components
let globalLipsyncManager: LipsyncManager | null = null

/**
 * Get or create global lipsync manager instance
 */
export function getLipsyncManager(config?: Partial<LipsyncConfig>): LipsyncManager {
  if (!globalLipsyncManager) {
    globalLipsyncManager = new LipsyncManager(config)
  }
  return globalLipsyncManager
}

/**
 * Reset global lipsync manager (useful for testing)
 */
export function resetLipsyncManager() {
  if (globalLipsyncManager) {
    globalLipsyncManager.dispose()
    globalLipsyncManager = null
  }
}

export default LipsyncManager