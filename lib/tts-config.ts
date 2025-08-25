// TTS Configuration for Avatar Chatbot
import { TTSConfig, ElevenLabsConfig, TTSVoice } from '@/types/avatar'

// High-quality free system voices configuration
export const ttsConfig: TTSConfig = {
  engine: 'speechSynthesis', // Browser Web Speech API with enhanced voices
  preferredVoices: [
    'Google US English', // High-quality neural voice (free)
    'Microsoft Zira - English (United States)', // Natural sounding
    'Alex', // macOS high-quality voice
    'Samantha', // macOS natural voice
    'Google UK English Female',
    'Microsoft David - English (United States)',
    'Karen', // macOS voice
    'Daniel' // macOS voice
  ],
  fallbackVoice: 'default',
  rate: 0.9, // Slightly slower for better comprehension
  pitch: 1.1, // Slightly higher for child appeal
  volume: 0.8,
  voiceFilters: {
    excludeRobotic: true,
    preferNeural: true,
    preferLocal: true // Avoid network-dependent voices
  }
}

// ElevenLabs configuration for premium TTS (free tier: 10k chars/month)
export const elevenLabsConfig: ElevenLabsConfig = {
  apiKey: process.env.ELEVENLABS_API_KEY || '',
  voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - natural male voice
  model: 'eleven_monolingual_v1', // Free model
  stability: 0.5,
  similarity_boost: 0.5
}

// Platform-specific voice recommendations
export const platformVoices = {
  macOS: [
    'Alex', 'Samantha', 'Karen', 'Daniel', 'Fiona', 'Moira'
  ],
  windows: [
    'Microsoft Zira - English (United States)',
    'Microsoft David - English (United States)',
    'Microsoft Mark - English (United States)'
  ],
  chrome: [
    'Google US English',
    'Google UK English Female',
    'Google UK English Male'
  ],
  firefox: [
    'Microsoft Zira - English (United States)',
    'eSpeak NG'
  ]
}

// Voice quality scoring for automatic selection
export function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0
  
  // Prefer voices with "Google" or "Microsoft" in the name (usually higher quality)
  if (voice.name.includes('Google')) score += 10
  if (voice.name.includes('Microsoft')) score += 8
  
  // Prefer local voices (faster, more reliable)
  if (voice.localService) score += 5
  
  // Prefer English voices
  if (voice.lang.startsWith('en')) score += 3
  
  // Avoid robotic-sounding voices
  if (voice.name.toLowerCase().includes('espeak')) score -= 5
  if (voice.name.toLowerCase().includes('festival')) score -= 5
  
  // Prefer neural/natural voices
  if (voice.name.toLowerCase().includes('neural')) score += 7
  if (voice.name.toLowerCase().includes('natural')) score += 6
  
  return score
}

// Get the best available voice for the current platform
export function getBestVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null
  }
  
  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  
  // Score all voices and sort by quality
  const scoredVoices = voices
    .map(voice => ({ voice, score: scoreVoice(voice) }))
    .sort((a, b) => b.score - a.score)
  
  // Try to find preferred voices first
  for (const preferredName of ttsConfig.preferredVoices) {
    const found = voices.find(v => v.name === preferredName)
    if (found) return found
  }
  
  // Return the highest scored voice
  return scoredVoices[0]?.voice || voices[0]
}

// Document available voices for debugging/configuration
export function documentAvailableVoices(): TTSVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return []
  }
  
  const voices = window.speechSynthesis.getVoices()
  return voices.map(voice => ({
    name: voice.name,
    lang: voice.lang,
    localService: voice.localService,
    default: voice.default,
    voiceURI: voice.voiceURI
  }))
}