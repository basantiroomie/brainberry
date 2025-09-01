'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { getEnhancedTTSService } from '@/lib/enhanced-tts-service'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Mic, Volume2, VolumeX, Send, ArrowLeft } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  isAudioPlaying?: boolean
}

interface AvatarTextChatProps {
  avatarUrl: string
  childId?: string
  onBack?: () => void
}

export const AvatarTextChat: React.FC<AvatarTextChatProps> = ({
  avatarUrl,
  childId = "test-child-123",
  onBack
}) => {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [childInfo, setChildInfo] = useState<{ name?: string; age?: number }>({})
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const ttsServiceRef = useRef(getEnhancedTTSService())
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get child information from sessionStorage or API
  useEffect(() => {
    const fetchChildInfo = async () => {
      // First try sessionStorage (for child dashboard)
      const stored = sessionStorage.getItem('childProfile')
      if (stored) {
        try {
          const profile = JSON.parse(stored)
          setChildInfo({
            name: profile.name,
            age: profile.age
          })
          console.log('AvatarTextChat: Child info from sessionStorage:', { name: profile.name, age: profile.age })
          return
        } catch (error) {
          console.error('Failed to parse child profile from sessionStorage:', error)
        }
      }

      // If no sessionStorage and we have a real childId, try API
      if (childId && childId !== "test-child-123") {
        try {
          const response = await fetch(`/api/children/${childId}`)
          if (response.ok) {
            const childData = await response.json()
            setChildInfo({
              name: childData.name,
              age: childData.age
            })
            console.log('AvatarTextChat: Child info from API:', { name: childData.name, age: childData.age })
          }
        } catch (error) {
          console.error('Failed to fetch child info from API:', error)
        }
      }
    }
    
    fetchChildInfo()
  }, [childId])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }

      recognitionRef.current.onerror = () => {
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle avatar model reference and setup lipsync
  const handleAvatarLoad = useCallback((model: Object3D) => {
    avatarModelRef.current = model
    setAvatarLoaded(true)
    
    // Set up lipsync callback for avatar animation
    lipsyncManagerRef.current.setVisemeCallback((blendShapes) => {
      if (avatarModelRef.current) {
        applyBlendShapesToAvatar(blendShapes)
      }
    })
    
    // One-time debug: list available morph target names to ensure correct mapping
    try {
      const names: Set<string> = new Set()
      model.traverse((child: any) => {
        if (child && child.morphTargetDictionary) {
          Object.keys(child.morphTargetDictionary).forEach((k) => names.add(k))
          // Ensure materials support morph targets
          const material = child.material
          if (material) {
            if (Array.isArray(material)) {
              material.forEach((m) => { if (m) { m.morphTargets = true; m.needsUpdate = true } })
            } else {
              material.morphTargets = true
              material.needsUpdate = true
            }
          }
        }
      })
      if (names.size > 0) {
        console.log('🧩 Avatar morph targets detected:', Array.from(names))
      } else {
        console.warn('🧩 No morph targets detected on avatar meshes')
      }
    } catch (e) {
      // ignore
    }
    
    console.log('🤖 Avatar loaded for text chat with lipsync setup')
  }, [])

  // Apply blend shapes to avatar (robust mapping for Ready Player Me morph targets)
  const applyBlendShapesToAvatar = useCallback((blendShapes: Partial<BlendShapeTargets>) => {
    if (!avatarModelRef.current) return

    // Map canonical keys to common Ready Player Me/GLTF morph target variants
    const keyVariants: Record<string, string[]> = {
      jawOpen: [
        'jawOpen', 'JawOpen', 'jaw_Open', 'mouthOpen', 'MouthOpen',
        // RPM viseme open vowel (approx mouth open)
        'viseme_aa', 'viseme_AA', 'viseme_A', 'aa'
      ],
      mouthSmile: [
        'mouthSmile', 'MouthSmile', 'smile', 'Smile',
        'mouthSmileLeft', 'mouthSmileRight',
        // Smiley vowels (E/I)
        'viseme_E', 'viseme_I'
      ],
      mouthFunnel: [
        'mouthFunnel', 'MouthFunnel', 'mouthPucker', 'mouthPuckerLeft', 'mouthPuckerRight',
        // Rounded vowels
        'viseme_O', 'viseme_U'
      ]
    }

    const setMorphInfluence = (mesh: any, canonicalKey: string, value: number) => {
      const dict = mesh.morphTargetDictionary as Record<string, number>
      const infl = mesh.morphTargetInfluences as number[]
      const variants = keyVariants[canonicalKey] || []

      // Try exact canonical key first
      if (typeof dict[canonicalKey] === 'number') {
        infl[dict[canonicalKey]] = value
      }

      // Apply to all available variants
      for (const variant of variants) {
        if (typeof dict[variant] === 'number') {
          infl[dict[variant]] = value
        }
      }
    }

    let applied = false
    avatarModelRef.current.traverse((child) => {
      if (child instanceof Object3D && (child as any).morphTargetDictionary && (child as any).morphTargetInfluences) {
        const mesh = child as any
        const before = (mesh.morphTargetInfluences || []).slice()
        // Ensure materials are configured for morph targets
        const material = mesh.material
        if (material) {
          if (Array.isArray(material)) {
            material.forEach((m: any) => { if (m) { m.morphTargets = true; m.needsUpdate = true } })
          } else {
            material.morphTargets = true
            material.needsUpdate = true
          }
        }
        if (typeof blendShapes.jawOpen === 'number') setMorphInfluence(mesh, 'jawOpen', Math.max(0, Math.min(1, blendShapes.jawOpen)))
        if (typeof blendShapes.mouthSmile === 'number') setMorphInfluence(mesh, 'mouthSmile', Math.max(0, Math.min(1, blendShapes.mouthSmile)))
        if (typeof blendShapes.mouthFunnel === 'number') setMorphInfluence(mesh, 'mouthFunnel', Math.max(0, Math.min(1, blendShapes.mouthFunnel)))
        const after = mesh.morphTargetInfluences || []
        // Detect if anything changed
        for (let i = 0; i < after.length; i++) {
          if (after[i] !== before[i]) { applied = true; break }
        }
        // Hint renderer to update and update matrices
        try { mesh.needsUpdate = true } catch {}
        try { mesh.updateMatrix(); mesh.updateMatrixWorld(true) } catch {}
      }
    })
    if (!applied) {
      // Debug once to reveal available morph names for mapping refinement
      console.warn('🔇 No morph targets applied for this viseme set. Logging available morph target names from avatar...')
      const names: Set<string> = new Set()
      avatarModelRef.current.traverse((child) => {
        const mc = child as any
        if (mc && mc.morphTargetDictionary) {
          Object.keys(mc.morphTargetDictionary).forEach(k => names.add(k))
        }
      })
      console.warn('🧩 Available morph targets:', Array.from(names))
    }
  }, [])

  // Send text message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading || isSpeaking) return

    const messageText = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'child',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      // Get AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          childId: childId,
          childName: childInfo.name,
          childAge: childInfo.age
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Add avatar response
      const avatarMessage: ChatMessage = {
        id: Date.now().toString() + '_avatar',
        text: data.text || 'I heard you!',
        sender: 'avatar',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, avatarMessage])

      // Play audio response if enabled
      if (audioEnabled && data.text) {
        await playAvatarResponse(data.text, avatarMessage.id)
      }

    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '_error',
        text: "Sorry, I'm having trouble right now. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Play avatar audio response with Gemini TTS and lip-sync (single path to avoid double playback)
  const playAvatarResponse = async (text: string, messageId: string) => {
    if (!audioEnabled || !text.trim()) return

    try {
      setIsSpeaking(true)
      console.log('🔊 AvatarTextChat: Starting Gemini TTS for:', text.substring(0, 50))

      // Prefer Gemini TTS
      const ttsResponse = await fetch('/api/tts/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      const contentType = ttsResponse.headers.get('content-type') || ''
      if (ttsResponse.ok && contentType.includes('application/json')) {
        const ttsData = await ttsResponse.json()

        if (ttsData.success && ttsData.audioData && ttsData.isRealAudio) {
          console.log('🔊 AvatarTextChat: Using REAL Gemini TTS audio')
          const audioBlob = base64ToBlob(ttsData.audioData, ttsData.mimeType || 'audio/wav')
          const audioUrl = URL.createObjectURL(audioBlob)
          await playAudioWithLipSync(audioUrl, text)
          URL.revokeObjectURL(audioUrl)
          return
        }

        if (ttsData.success && ttsData.useBrowserTTS && ttsData.optimizedText) {
          console.log('🔊 AvatarTextChat: Using Gemini-optimized browser TTS')
          await enhancedBrowserTTS(ttsData.optimizedText)
          return
        }
      } else {
        // Avoid JSON parsing on HTML error pages (prevents "Unexpected token < ... is not valid JSON")
        const statusText = `${ttsResponse.status} ${ttsResponse.statusText}`
        console.warn('🔊 AvatarTextChat: Gemini TTS API not ok or non-JSON response:', statusText, contentType)
      }

      // Fallback
      console.log('🔊 AvatarTextChat: Using fallback browser TTS')
      await enhancedBrowserTTS(text)

    } catch (error) {
      console.error('❌ TTS Error:', error)
    } finally {
      setIsSpeaking(false)
      // Clear audio playing status
      setMessages(prev => prev.map(msg => ({ ...msg, isAudioPlaying: false })))
    }
  }

  // Toggle speech recognition
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: mimeType })
  }

  // Enhanced browser TTS
  const enhancedBrowserTTS = async (text: string) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.85
      utterance.pitch = 1.2
      utterance.volume = 0.9

      const voices = speechSynthesis.getVoices()
      const preferredVoices = ['Google US English', 'Microsoft Zira', 'Alex', 'Samantha']
      
      for (const preferredName of preferredVoices) {
        const voice = voices.find(v => v.name.includes(preferredName))
        if (voice) {
          utterance.voice = voice
          break
        }
      }

      lipsyncManagerRef.current.processSpeechSynthesis(utterance)
      
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      
      speechSynthesis.speak(utterance)
    })
  }

  // Play audio with lip sync
  const playAudioWithLipSync = async (audioUrl: string, text: string) => {
    return new Promise<void>((resolve) => {
      const audio = new Audio(audioUrl)
      
      audio.onloadeddata = () => {
        lipsyncManagerRef.current.processAudioFile(audioUrl)
      }
      
      audio.onended = () => {
        // Reset mouth to neutral at the end
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
        lipsyncManagerRef.current.stopProcessing()
        resolve()
      }
      audio.onerror = () => resolve()
      
      audio.play()
    })
  }

  return (
    <div className="h-full bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        
        <h1 className="text-xl font-bold text-gray-800">Text Chat</h1>
        
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 rounded-lg transition-colors ${
            audioEnabled 
              ? 'text-blue-600 hover:bg-blue-100' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Avatar Section - Reduced width */}
        <div className="w-2/5 p-4">
          <div className="h-full bg-white rounded-2xl shadow-xl overflow-hidden relative">
            <SimpleAvatarViewer 
              avatarUrl={avatarUrl}
              onModelLoad={handleAvatarLoad}
              enableControls={false}
              className="w-full h-full"
            />
            
            {/* Avatar Status */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                isSpeaking ? 'bg-green-500 animate-pulse' : 
                avatarLoaded ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-600">
                {isSpeaking ? 'Speaking...' : avatarLoaded ? 'Ready' : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Chat Section - Increased width */}
        <div className="w-3/5 p-4 flex flex-col">
          <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <h3 className="text-lg font-medium mb-2">Start a conversation!</h3>
                  <p>Type a message to begin chatting with your avatar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'child' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'child'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        {message.isAudioPlaying && (
                          <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                            <Volume2 className="w-3 h-3" />
                            <span>Playing...</span>
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <form onSubmit={sendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
                    disabled={isSpeaking || isLoading}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  {recognitionRef.current && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      disabled={isSpeaking || isLoading}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                        isListening 
                          ? 'bg-red-100 text-red-600' 
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSpeaking || isLoading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarTextChat
