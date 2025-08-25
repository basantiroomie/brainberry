// TTS Utilities for Avatar Chatbot
import { ttsConfig, elevenLabsConfig, getBestVoice } from './tts-config'
import { BlendShapeTargets } from '@/types/avatar'

// Speech synthesis with lip-sync support
export class AvatarTTS {
  private utterance: SpeechSynthesisUtterance | null = null
  private onLipSyncCallback?: (blendShapes: Partial<BlendShapeTargets>) => void
  private isInitialized = false
  private selectedVoice: SpeechSynthesisVoice | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    if (typeof window === 'undefined') return

    // Wait for voices to be loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      await new Promise<void>((resolve) => {
        const checkVoices = () => {
          if (window.speechSynthesis.getVoices().length > 0) {
            resolve()
          } else {
            setTimeout(checkVoices, 100)
          }
        }
        
        window.speechSynthesis.onvoiceschanged = () => {
          resolve()
        }
        
        checkVoices()
      })
    }

    this.selectedVoice = getBestVoice()
    this.isInitialized = true
  }

  // Set callback for lip-sync animations
  setLipSyncCallback(callback: (blendShapes: Partial<BlendShapeTargets>) => void) {
    this.onLipSyncCallback = callback
  }

  // Speak text with lip-sync animation
  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'))
        return
      }

      // Stop any current speech
      this.stop()

      this.utterance = new SpeechSynthesisUtterance(text)
      
      // Configure voice settings
      if (this.selectedVoice) {
        this.utterance.voice = this.selectedVoice
      }
      this.utterance.rate = ttsConfig.rate
      this.utterance.pitch = ttsConfig.pitch
      this.utterance.volume = ttsConfig.volume

      // Set up lip-sync animation
      this.utterance.onboundary = (event) => {
        if (event.name === 'word' && this.onLipSyncCallback) {
          // Trigger mouth movement for word boundaries
          this.triggerMouthMovement()
        }
      }

      // Handle speech events
      this.utterance.onstart = () => {
        this.startIdleAnimations()
      }

      this.utterance.onend = () => {
        this.stopMouthMovement()
        resolve()
      }

      this.utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        this.stopMouthMovement()
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      // Start speaking
      window.speechSynthesis.speak(this.utterance)
    })
  }

  // Stop current speech
  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    this.stopMouthMovement()
  }

  // Check if currently speaking
  isSpeaking(): boolean {
    return window.speechSynthesis?.speaking || false
  }

  // Trigger mouth movement for lip-sync
  private triggerMouthMovement() {
    if (!this.onLipSyncCallback) return

    // Simulate mouth movements with random variations
    const intensity = 0.3 + Math.random() * 0.4 // 0.3 to 0.7
    const blendShapes: Partial<BlendShapeTargets> = {
      jawOpen: intensity,
      mouthSmile: Math.random() * 0.2, // Slight smile variation
      mouthFunnel: Math.random() * 0.1 // Slight mouth shape variation
    }

    this.onLipSyncCallback(blendShapes)

    // Reset mouth after a short delay
    setTimeout(() => {
      if (this.onLipSyncCallback) {
        this.onLipSyncCallback({
          jawOpen: 0,
          mouthSmile: 0,
          mouthFunnel: 0
        })
      }
    }, 100 + Math.random() * 100) // 100-200ms
  }

  // Stop mouth movement
  private stopMouthMovement() {
    if (this.onLipSyncCallback) {
      this.onLipSyncCallback({
        jawOpen: 0,
        mouthSmile: 0,
        mouthFunnel: 0
      })
    }
  }

  // Start idle animations (blinking)
  private startIdleAnimations() {
    this.scheduleNextBlink()
  }

  // Schedule random blinking
  private scheduleNextBlink() {
    if (!this.onLipSyncCallback) return

    const blinkDelay = 2000 + Math.random() * 3000 // 2-5 seconds
    
    setTimeout(() => {
      if (this.onLipSyncCallback) {
        // Trigger blink
        this.onLipSyncCallback({
          eyeBlinkLeft: 1,
          eyeBlinkRight: 1
        })

        // Reset blink after 150ms
        setTimeout(() => {
          if (this.onLipSyncCallback) {
            this.onLipSyncCallback({
              eyeBlinkLeft: 0,
              eyeBlinkRight: 0
            })
          }
        }, 150)

        // Schedule next blink
        this.scheduleNextBlink()
      }
    }, blinkDelay)
  }
}

// ElevenLabs TTS integration (premium option)
export class ElevenLabsTTS {
  private apiKey: string
  private voiceId: string
  private model: string

  constructor() {
    this.apiKey = elevenLabsConfig.apiKey
    this.voiceId = elevenLabsConfig.voiceId
    this.model = elevenLabsConfig.model
  }

  async speak(text: string): Promise<AudioBuffer> {
    if (!this.apiKey) {
      throw new Error('ElevenLabs API key not configured')
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey
      },
      body: JSON.stringify({
        text,
        model_id: this.model,
        voice_settings: {
          stability: elevenLabsConfig.stability,
          similarity_boost: elevenLabsConfig.similarity_boost
        }
      })
    })

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`)
    }

    const audioData = await response.arrayBuffer()
    const audioContext = new AudioContext()
    return await audioContext.decodeAudioData(audioData)
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }
}

// Factory function to create appropriate TTS instance
export function createTTSInstance(): AvatarTTS | ElevenLabsTTS {
  const elevenLabs = new ElevenLabsTTS()
  
  // Use ElevenLabs if available and configured, otherwise use browser TTS
  if (elevenLabs.isAvailable()) {
    console.log('Using ElevenLabs TTS (premium)')
    return elevenLabs
  } else {
    console.log('Using browser Speech Synthesis API (free)')
    return new AvatarTTS()
  }
}