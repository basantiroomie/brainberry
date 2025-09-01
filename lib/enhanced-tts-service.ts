/**
 * Enhanced TTS Service with Multiple Fallbacks
 * 1. Gemini TTS (gemini-2.5-flash-preview-tts)
 * 2. Puter.js TTS (puter.ai.txt2speech)
 * 3. Browser Speech Synthesis API
 */

export interface TTSResult {
  success: boolean
  audioUrl?: string
  audioBuffer?: AudioBuffer
  provider: 'gemini' | 'puter' | 'browser'
  error?: string
  optimizedText?: string
  useBrowserTTS?: boolean
}

export class EnhancedTTSService {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  /**
   * Generate speech with fallback chain
   */
  async generateSpeech(text: string): Promise<TTSResult> {
    console.log('🔊 TTS: Starting speech generation for:', text.substring(0, 50))

    // Try Gemini TTS first
    try {
      const geminiResult = await this.generateGeminiTTS(text)
      if (geminiResult.success) {
        console.log('🔊 TTS: Gemini TTS successful')
        return geminiResult
      }
    } catch (error) {
      console.warn('🔊 TTS: Gemini TTS failed:', error)
    }

    // Fallback to Puter.js
    try {
      const puterResult = await this.generatePuterTTS(text)
      if (puterResult.success) {
        console.log('🔊 TTS: Puter.js TTS successful')
        return puterResult
      }
    } catch (error) {
      console.warn('🔊 TTS: Puter.js TTS failed:', error)
    }

    // Final fallback to browser TTS
    try {
      const browserResult = await this.generateBrowserTTS(text)
      console.log('🔊 TTS: Browser TTS used as final fallback')
      return browserResult
    } catch (error) {
      console.error('🔊 TTS: All TTS methods failed:', error)
      return {
        success: false,
        provider: 'browser',
        error: 'All TTS services failed'
      }
    }
  }

  /**
   * Gemini TTS (Premium)
   */
  private async generateGeminiTTS(text: string): Promise<TTSResult> {
    try {
      const response = await fetch('/api/tts/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.warn('🔊 Gemini TTS API error:', response.status, errorData)
        throw new Error(`Gemini TTS API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        if (data.audioData && data.isRealAudio) {
          // REAL Gemini TTS audio from speech generation API
          console.log('🔊 Gemini TTS: Using REAL Gemini audio from', data.provider, 'model:', data.model)
          const audioBlob = this.base64ToBlob(data.audioData, data.mimeType || 'audio/wav')
          const audioUrl = URL.createObjectURL(audioBlob)
          
          return {
            success: true,
            audioUrl,
            provider: 'gemini'
          }
        } else if (data.audioData) {
          // Fallback audio data
          console.log('🔊 Gemini TTS: Using fallback audio data from', data.provider)
          const audioBlob = this.base64ToBlob(data.audioData, data.mimeType || 'audio/wav')
          const audioUrl = URL.createObjectURL(audioBlob)
          
          return {
            success: true,
            audioUrl,
            provider: 'gemini'
          }
        } else if (data.useBrowserTTS && data.optimizedText) {
          // Gemini-optimized text for enhanced browser TTS
          console.log('🔊 Gemini TTS: Using Gemini-optimized text for browser TTS')
          return {
            success: true,
            optimizedText: data.optimizedText,
            provider: 'gemini',
            useBrowserTTS: true
          }
        } else if (data.audioUrl) {
          return {
            success: true,
            audioUrl: data.audioUrl,
            provider: 'gemini'
          }
        }
      }

      throw new Error('No audio data in Gemini response')
    } catch (error) {
      console.warn('🔊 Gemini TTS failed:', error)
      throw error
    }
  }

  /**
   * Puter.js TTS (Free Fallback)
   */
  private async generatePuterTTS(text: string): Promise<TTSResult> {
    // Check if Puter is available
    if (typeof window === 'undefined' || !(window as any).puter) {
      throw new Error('Puter.js not loaded')
    }

    try {
      const puter = (window as any).puter
      const audioBlob = await puter.ai.txt2speech(text, {
        voice: 'en-US-Aria', // Child-friendly voice
        rate: 0.9,
        pitch: 1.1
      })

      // Convert blob to URL
      const audioUrl = URL.createObjectURL(audioBlob)
      
      return {
        success: true,
        audioUrl,
        provider: 'puter'
      }
    } catch (error) {
      throw new Error(`Puter TTS failed: ${error}`)
    }
  }

  /**
   * Browser Speech Synthesis (Final Fallback)
   */
  private async generateBrowserTTS(text: string): Promise<TTSResult> {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        resolve({
          success: false,
          provider: 'browser',
          error: 'Speech Synthesis not supported'
        })
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      
      // Configure for child-friendly speech
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      // Try to get a good voice
      const voices = speechSynthesis.getVoices()
      const preferredVoices = [
        'Google US English',
        'Microsoft Zira - English (United States)',
        'Alex',
        'Samantha'
      ]

      for (const preferredName of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferredName))
        if (voice) {
          utterance.voice = voice
          break
        }
      }

      utterance.onend = () => {
        resolve({
          success: true,
          provider: 'browser'
        })
      }

      utterance.onerror = (event) => {
        resolve({
          success: false,
          provider: 'browser',
          error: `Browser TTS error: ${event.error}`
        })
      }

      speechSynthesis.speak(utterance)
    })
  }

  /**
   * Play audio from URL or buffer
   */
  async playAudio(result: TTSResult): Promise<void> {
    if (!result.success) {
      throw new Error('Cannot play failed TTS result')
    }

    if (result.audioUrl) {
      const audio = new Audio(result.audioUrl)
      await audio.play()
    } else if (result.audioBuffer && this.audioContext) {
      const source = this.audioContext.createBufferSource()
      source.buffer = result.audioBuffer
      source.connect(this.audioContext.destination)
      source.start()
    } else if (result.provider === 'browser') {
      // Browser TTS already played during generation
      return
    } else {
      throw new Error('No audio data to play')
    }
  }

  /**
   * Convert base64 audio to Blob
   */
  private base64ToBlob(base64: string, mimeType: string): Blob {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  /**
   * Convert base64 audio to AudioBuffer
   */
  private async base64ToAudioBuffer(base64: string): Promise<AudioBuffer> {
    if (!this.audioContext) {
      throw new Error('AudioContext not available')
    }

    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return await this.audioContext.decodeAudioData(bytes.buffer)
  }

  /**
   * Cleanup resources
   */
  dispose() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Singleton instance
let ttsService: EnhancedTTSService | null = null

export function getEnhancedTTSService(): EnhancedTTSService {
  if (!ttsService) {
    ttsService = new EnhancedTTSService()
  }
  return ttsService
}
