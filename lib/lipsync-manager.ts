import { Lipsync, VISEMES } from 'wawa-lipsync'
import { BlendShapeTargets, VisemeMapping, LipsyncConfig } from '@/types/avatar'

/**
 * Interface for LipsyncManager to allow for SSR compatibility
 */
interface ILipsyncManager {
  setVisemeCallback(callback: (blendShapes: Partial<BlendShapeTargets>) => void): void
  processSpeechSynthesis(utterance: SpeechSynthesisUtterance): void
  processAudioFile(audioUrl: string): Promise<void>
  connectMicrophone(): Promise<void>
  stopProcessing(): void
  isActive(): boolean
  getCurrentViseme(): VISEMES | 'rest'
  getAudioContext(): AudioContext | null
  dispose(): void
}

/**
 * Enhanced Lipsync Manager using Wawa Lipsync library
 * Provides real-time lip-sync animation with proper audio processing
 */
export class LipsyncManager implements ILipsyncManager {
  private lipsync: Lipsync | null = null
  private audioContext: AudioContext | null = null
  private isProcessing = false
  private animationFrameId: number | null = null
  private onVisemeCallback?: (blendShapes: Partial<BlendShapeTargets>) => void
  private currentAudio: HTMLAudioElement | null = null
  // Track attached utterance listeners so we don't leak or overwrite handlers
  private utteranceListeners = new WeakMap<SpeechSynthesisUtterance, {
    start?: EventListenerOrEventListenerObject
    boundary?: EventListenerOrEventListenerObject
    end?: EventListenerOrEventListenerObject
    error?: EventListenerOrEventListenerObject
  }>()

  // Enhanced viseme to Ready Player Me morph target mapping
  // Using comprehensive blend shape names that work with most 3D avatars
  private readonly visemeToMorphTarget: Record<VISEMES | 'rest', Partial<BlendShapeTargets>> = {
    [VISEMES.sil]: { jawOpen: 0.0, mouthSmile: 0.0, mouthFunnel: 0.0 }, // Silence
    [VISEMES.PP]: { jawOpen: 0.05, mouthSmile: 0.0, mouthFunnel: 0.0 }, // P, B, M sounds - slight jaw close
    [VISEMES.FF]: { jawOpen: 0.15, mouthSmile: 0.0, mouthFunnel: 0.3 }, // F, V sounds
    [VISEMES.TH]: { jawOpen: 0.2, mouthSmile: 0.1, mouthFunnel: 0.0 }, // TH sounds
    [VISEMES.DD]: { jawOpen: 0.4, mouthSmile: 0.2, mouthFunnel: 0.0 }, // D, T, N, L sounds
    [VISEMES.kk]: { jawOpen: 0.5, mouthSmile: 0.0, mouthFunnel: 0.0 }, // K, G sounds
    [VISEMES.CH]: { jawOpen: 0.3, mouthSmile: 0.4, mouthFunnel: 0.1 }, // CH, SH sounds
    [VISEMES.SS]: { jawOpen: 0.15, mouthSmile: 0.6, mouthFunnel: 0.0 }, // S, Z sounds
    [VISEMES.nn]: { jawOpen: 0.25, mouthSmile: 0.1, mouthFunnel: 0.0 }, // N sounds
    [VISEMES.RR]: { jawOpen: 0.35, mouthSmile: 0.2, mouthFunnel: 0.1 }, // R sounds
    [VISEMES.aa]: { jawOpen: 0.9, mouthSmile: 0.1, mouthFunnel: 0.0 }, // AA (father) vowel - wide open
    [VISEMES.E]: { jawOpen: 0.6, mouthSmile: 0.8, mouthFunnel: 0.0 }, // E (bed) vowel
    [VISEMES.I]: { jawOpen: 0.3, mouthSmile: 1.0, mouthFunnel: 0.0 }, // I (bit) vowel - big smile
    [VISEMES.O]: { jawOpen: 0.8, mouthSmile: 0.0, mouthFunnel: 1.0 }, // O (boat) vowel - mouth round
    [VISEMES.U]: { jawOpen: 0.4, mouthSmile: 0.0, mouthFunnel: 1.0 }, // U (book) vowel - small round
    'rest': { jawOpen: 0.0, mouthSmile: 0.0, mouthFunnel: 0.0 }
  }

  constructor(config?: Partial<LipsyncConfig>) {
    this.initializeLipsync()
    
    // Apply custom viseme mapping if provided
    if (config?.visemeToMorphTarget) {
      Object.assign(this.visemeToMorphTarget, config.visemeToMorphTarget)
    }
  }

  /**
   * Initialize the Wawa Lipsync instance
   */
  private async initializeLipsync() {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      console.log('Skipping Wawa Lipsync initialization on server side')
      return
    }
    
    try {
      console.log('Initializing Wawa Lipsync...')
      this.lipsync = new Lipsync({
        fftSize: 1024, // Good balance of accuracy and performance
        historySize: 30 // Smooth out viseme detection
      })
      console.log('Wawa Lipsync initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Wawa Lipsync:', error)
    }
  }

  /**
   * Set callback for viseme updates
   */
  setVisemeCallback(callback: (blendShapes: Partial<BlendShapeTargets>) => void) {
    this.onVisemeCallback = callback
  }

  /**
   * Process audio from Speech Synthesis with enhanced lip-sync
   */
  processSpeechSynthesis(utterance: SpeechSynthesisUtterance) {
    console.log('Setting up TTS lip-sync processing (non-destructive listeners)')

    // Remove previously attached listeners for this utterance if any
    const existing = this.utteranceListeners.get(utterance)
    if (existing) {
      try {
        if (existing.start) utterance.removeEventListener('start', existing.start)
        if (existing.boundary) utterance.removeEventListener('boundary', existing.boundary)
        if (existing.end) utterance.removeEventListener('end', existing.end)
        if (existing.error) utterance.removeEventListener('error', existing.error)
      } catch (e) {
        // ignore
      }
    }

    let speechStartTime = 0

    const onStart = () => {
      console.log('TTS started - beginning lip-sync')
      speechStartTime = Date.now()
      this.isProcessing = true
      this.startContinuousLipSync()
    }

    const onBoundary = (event: Event) => {
      // boundary events may be SpeechSynthesisEvent
      const ev = event as any
      try {
        if (ev.name === 'word' && this.onVisemeCallback) {
          const charIndex = typeof ev.charIndex === 'number' ? ev.charIndex : 0
          const charLength = typeof ev.charLength === 'number' ? ev.charLength : 0
          const word = utterance.text.substring(charIndex, charIndex + charLength)
          const viseme = this.getVisemeForWord(word)
          const morphTargets = this.visemeToMorphTarget[viseme] || this.visemeToMorphTarget['rest']
          console.log(`Word: "${word}" -> Viseme: ${viseme}`)
          this.onVisemeCallback(morphTargets)
        }
      } catch (e) {
        // swallow errors to avoid breaking TTS flow
        console.error('Error handling boundary event for lipsync:', e)
      }
    }

    const onEnd = () => {
      console.log('TTS ended - stopping lip-sync')
      this.stopProcessing()

      // cleanup listeners for this utterance
      const refs = this.utteranceListeners.get(utterance)
      if (refs) {
        try {
          if (refs.start) utterance.removeEventListener('start', refs.start)
          if (refs.boundary) utterance.removeEventListener('boundary', refs.boundary)
          if (refs.end) utterance.removeEventListener('end', refs.end)
          if (refs.error) utterance.removeEventListener('error', refs.error)
        } catch (e) {
          // ignore
        }
        this.utteranceListeners.delete(utterance)
      }
    }

    const onError = (event: any) => {
      console.error('TTS error:', event?.error || event)
      this.stopProcessing()
      // let onEnd handle cleanup if it fires; otherwise remove now
      const refs = this.utteranceListeners.get(utterance)
      if (refs) {
        try {
          if (refs.start) utterance.removeEventListener('start', refs.start)
          if (refs.boundary) utterance.removeEventListener('boundary', refs.boundary)
          if (refs.end) utterance.removeEventListener('end', refs.end)
          if (refs.error) utterance.removeEventListener('error', refs.error)
        } catch (e) {
          // ignore
        }
        this.utteranceListeners.delete(utterance)
      }
    }

    // Attach listeners in a non-destructive way so component-level handlers still work
    try {
      utterance.addEventListener('start', onStart)
      utterance.addEventListener('boundary', onBoundary)
      utterance.addEventListener('end', onEnd)
      utterance.addEventListener('error', onError)
      this.utteranceListeners.set(utterance, { start: onStart, boundary: onBoundary, end: onEnd, error: onError })
    } catch (e) {
      // Some browsers may not support addEventListener on SpeechSynthesisUtterance; fall back to assignment
      // Preserve existing handlers by wrapping them
      const prevOnStart = utterance.onstart
      const prevOnBoundary = (utterance as any).onboundary
      const prevOnEnd = utterance.onend
      const prevOnError = utterance.onerror

      utterance.onstart = (ev: any) => { try { onStart(); prevOnStart && prevOnStart.call(utterance, ev) } catch (e) {} }
      ;(utterance as any).onboundary = (ev: any) => { try { onBoundary(ev); prevOnBoundary && prevOnBoundary.call(utterance, ev) } catch (e) {} }
      utterance.onend = (ev: any) => { try { onEnd(); prevOnEnd && prevOnEnd.call(utterance, ev) } catch (e) {} }
      utterance.onerror = (ev: any) => { try { onError(ev); prevOnError && prevOnError.call(utterance, ev) } catch (e) {} }
    }
  }

  /**
   * Enhanced continuous lip-sync animation for TTS
   */
  private startContinuousLipSync() {
    if (!this.isProcessing || !this.onVisemeCallback) return

    // Generate more realistic mouth movements with weighted probabilities
    const visemeWeights = [
      { viseme: VISEMES.aa, weight: 0.2 }, // Common vowel
      { viseme: VISEMES.E, weight: 0.15 },
      { viseme: VISEMES.I, weight: 0.15 },
      { viseme: VISEMES.O, weight: 0.1 },
      { viseme: VISEMES.U, weight: 0.1 },
      { viseme: VISEMES.PP, weight: 0.05 }, // Less common
      { viseme: VISEMES.DD, weight: 0.1 },
      { viseme: VISEMES.SS, weight: 0.05 },
      { viseme: VISEMES.RR, weight: 0.05 },
      { viseme: VISEMES.nn, weight: 0.05 }
    ]
    
    // Weighted random selection
    let random = Math.random()
    let selectedViseme = VISEMES.aa
    
    for (const { viseme, weight } of visemeWeights) {
      random -= weight
      if (random <= 0) {
        selectedViseme = viseme
        break
      }
    }
    
    const morphTargets = this.visemeToMorphTarget[selectedViseme]
    
    // Add some intensity variation for more natural look
    const intensityMultiplier = 0.7 + Math.random() * 0.3 // 0.7 to 1.0
    const adjustedMorphTargets: Partial<BlendShapeTargets> = {}
    
    Object.entries(morphTargets).forEach(([key, value]) => {
      adjustedMorphTargets[key as keyof BlendShapeTargets] = (value || 0) * intensityMultiplier
    })
    
    // Apply the viseme with debug logging
    console.log(`🗣️ Lipsync: Applying viseme ${selectedViseme} with intensity ${intensityMultiplier.toFixed(2)}:`, adjustedMorphTargets)
    this.onVisemeCallback(adjustedMorphTargets)
    
    // Vary the timing for more natural movement
    const nextDelay = 100 + Math.random() * 150 // 100-250ms between movements
    
    setTimeout(() => {
      if (this.isProcessing && this.onVisemeCallback) {
        // Brief neutral position between visemes
        const neutralIntensity = 0.1 + Math.random() * 0.1 // Small neutral position
        this.onVisemeCallback({
          jawOpen: neutralIntensity,
          mouthSmile: neutralIntensity * 0.5,
          mouthFunnel: 0
        })
        
        setTimeout(() => {
          this.startContinuousLipSync()
        }, 30 + Math.random() * 50) // 30-80ms neutral rest
      }
    }, nextDelay)
  }

  /**
   * Get appropriate viseme for a word using phonetic mapping
   */
  private getVisemeForWord(word: string): VISEMES | 'rest' {
    if (!word || word.length === 0) return 'rest'
    
    const lowerWord = word.toLowerCase()
    const firstChar = lowerWord.charAt(0)
    
    // Phonetic mapping to appropriate visemes
    if (['a', 'ah'].some(sound => lowerWord.includes(sound))) return VISEMES.aa
    if (['e', 'eh'].some(sound => lowerWord.includes(sound))) return VISEMES.E
    if (['i', 'ih'].some(sound => lowerWord.includes(sound))) return VISEMES.I
    if (['o', 'oh'].some(sound => lowerWord.includes(sound))) return VISEMES.O
    if (['u', 'uh', 'oo'].some(sound => lowerWord.includes(sound))) return VISEMES.U
    
    // Consonant mapping
    if (['p', 'b', 'm'].includes(firstChar)) return VISEMES.PP
    if (['f', 'v'].includes(firstChar)) return VISEMES.FF
    if (lowerWord.startsWith('th')) return VISEMES.TH
    if (['d', 't', 'n', 'l'].includes(firstChar)) return VISEMES.DD
    if (['k', 'g', 'c'].includes(firstChar)) return VISEMES.kk
    if (['ch', 'sh', 'j'].some(sound => lowerWord.startsWith(sound))) return VISEMES.CH
    if (['s', 'z'].includes(firstChar)) return VISEMES.SS
    if (firstChar === 'r') return VISEMES.RR
    
    // Default to most common vowel sound
    return VISEMES.aa
  }

  /**
   * Process actual audio file with Wawa Lipsync
   */
  async processAudioFile(audioUrl: string): Promise<void> {
    if (!this.lipsync) {
      console.warn('Lipsync not initialized')
      return
    }

    try {
      console.log('Processing audio file with Wawa Lipsync:', audioUrl)
      
      // Create audio element
      const audio = new Audio(audioUrl)
      this.currentAudio = audio
      
      // Load and process the audio
      await new Promise((resolve, reject) => {
        audio.onloadeddata = resolve
        audio.onerror = reject
        audio.load()
      })
      
      // Connect audio to Wawa Lipsync
      this.lipsync.connectAudio(audio)
      
      // Start lip-sync processing and playback, resolve when finished
      await new Promise<void>((resolve) => {
        audio.onplay = () => {
          this.isProcessing = true
          this.processWithWawaLipsync()
        }
        audio.onended = () => {
          this.stopProcessing()
          resolve()
        }
        audio.onpause = () => {
          this.stopProcessing()
          resolve()
        }
        // Begin playback
        audio.play().catch((e) => {
          console.error('Audio play failed for lipsync:', e)
          resolve()
        })
      })
      
    } catch (error) {
      console.error('Error processing audio file:', error)
    }
  }

  /**
   * Process audio with the actual Wawa Lipsync library
   */
  private processWithWawaLipsync() {
    if (!this.lipsync || !this.isProcessing) return

    try {
      // Process current audio frame
      this.lipsync.processAudio()
      
      // Get current viseme from Wawa Lipsync
      const currentViseme = this.lipsync.viseme
      
      if (currentViseme && this.onVisemeCallback) {
        const morphTargets = this.visemeToMorphTarget[currentViseme] || this.visemeToMorphTarget['rest']
        this.onVisemeCallback(morphTargets)
      }
    } catch (error) {
      console.error('Wawa Lipsync processing error:', error)
    }

    // Continue processing
    if (this.isProcessing) {
      this.animationFrameId = requestAnimationFrame(() => this.processWithWawaLipsync())
    }
  }

  /**
   * Connect microphone for real-time lip-sync
   */
  async connectMicrophone(): Promise<void> {
    if (!this.lipsync) {
      console.warn('Lipsync not initialized')
      return
    }

    try {
      console.log('Connecting microphone for real-time lip-sync')
      await this.lipsync.connectMicrophone()
      
      this.isProcessing = true
      this.processWithWawaLipsync()
      
      console.log('Microphone connected successfully')
    } catch (error) {
      console.error('Error connecting microphone:', error)
    }
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
    
    console.log('Lip-sync processing stopped')
  }

  /**
   * Check if currently processing
   */
  isActive(): boolean {
    return this.isProcessing
  }

  /**
   * Get current viseme
   */
  getCurrentViseme(): VISEMES | 'rest' {
    return this.lipsync?.viseme || 'rest'
  }

  /**
   * Get current audio context
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext
  }

  /**
   * Cleanup resources
   */
  dispose() {
    console.log('Disposing lipsync manager')
    this.stopProcessing()
    
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.lipsync = null
    this.onVisemeCallback = undefined
  }
}

// Global instance for use across components
let globalLipsyncManager: LipsyncManager | null = null

/**
 * Get or create global lipsync manager instance
 */
export function getLipsyncManager(config?: Partial<LipsyncConfig>): ILipsyncManager {
  // Only create on client side
  if (typeof window === 'undefined') {
    // Return a mock manager for server-side rendering
    return {
      setVisemeCallback: () => {},
      processSpeechSynthesis: () => {},
      processAudioFile: async () => {},
      connectMicrophone: async () => {},
      stopProcessing: () => {},
      isActive: () => false,
      getCurrentViseme: () => 'rest' as VISEMES | 'rest',
      getAudioContext: () => null,
      dispose: () => {}
    }
  }
  
  if (!globalLipsyncManager) {
    globalLipsyncManager = new LipsyncManager(config)
  }
  return globalLipsyncManager
}

/**
 * Reset global lipsync manager
 */
export function resetLipsyncManager() {
  if (globalLipsyncManager) {
    globalLipsyncManager.dispose()
    globalLipsyncManager = null
  }
}

export default LipsyncManager