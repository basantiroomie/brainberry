'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Mic, Type, Volume2, VolumeX, Send } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  audioUrl?: string
}

interface CleanVoiceAvatarChatProps {
  avatarUrl?: string
  childId?: string
  accessCode?: string
  onMessageSent?: (message: string) => void
}

type ChatMode = 'text' | 'voice'

export const CleanVoiceAvatarChat: React.FC<CleanVoiceAvatarChatProps> = ({
  avatarUrl = "https://models.readyplayer.me/JNAOTI.glb",
  childId = "test-child-123",
  accessCode,
  onMessageSent
}) => {
  // Core state
  const [chatMode, setChatMode] = useState<ChatMode>('text')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onstart = () => setIsListening(true)
        recognitionRef.current.onend = () => setIsListening(false)
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('')
          
          if (event.results[0].isFinal) {
            setInputMessage(transcript)
            setIsListening(false)
            if (transcript.trim()) {
              // Directly call sendMessage with current mode
              sendMessage(transcript.trim())
            }
          }
        }
      }
    }
  }, []) // Only initialize once

  // Apply blend shapes to avatar
  const applyBlendShapesToAvatar = useCallback((blendShapes: Partial<BlendShapeTargets>) => {
    if (!avatarModelRef.current) return

    avatarModelRef.current.traverse((child: any) => {
      if (child instanceof Mesh || child instanceof SkinnedMesh) {
        const mesh = child as Mesh | SkinnedMesh
        
        if (mesh.morphTargetInfluences && mesh.morphTargetDictionary) {
          Object.entries(blendShapes).forEach(([targetName, value]) => {
            const index = mesh.morphTargetDictionary![targetName]
            if (index !== undefined && typeof value === 'number' && mesh.morphTargetInfluences) {
              mesh.morphTargetInfluences[index] = value
            }
          })
        }
      }
    })
  }, [])

  // Handle avatar load
  const handleAvatarLoad = useCallback((model: Object3D) => {
    avatarModelRef.current = model
    setAvatarLoaded(true)
    console.log('✅ Avatar loaded successfully')
  }, [])

  const handleAvatarError = useCallback((error: any) => {
    console.error('❌ Avatar loading error:', error)
    setAvatarLoaded(false)
  }, [])

  // Browser TTS with lip sync
  const speakText = useCallback(async (text: string) => {
    if (isSpeaking) speechSynthesis.cancel()

    setIsSpeaking(true)

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = 0.8

      // Set up lip sync
      lipsyncManagerRef.current.processSpeechSynthesis(utterance)

      utterance.onstart = () => {
        console.log('🔊 TTS Started:', text.substring(0, 50))
      }

      utterance.onend = () => {
        console.log('🔊 TTS Finished')
        setIsSpeaking(false)
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('🔊 TTS Error:', event.error)
        setIsSpeaking(false)
        resolve()
      }

      speechSynthesis.speak(utterance)
    })
  }, [isSpeaking, applyBlendShapesToAvatar])

  // Audio playback with lip sync
  const playAudioWithLipSync = useCallback(async (audioUrl: string, text: string) => {
    if (!audioEnabled || !avatarLoaded) return

    setIsSpeaking(true)

    try {
      const audio = new Audio(audioUrl)
      
      audio.onplay = () => {
        console.log('🎵 Playing Gemini audio with lip sync')
        // Simple lip sync animation
        const animateToAudio = () => {
          if (audio.paused || audio.ended) {
            setIsSpeaking(false)
            applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
            return
          }
          
          const time = audio.currentTime
          const intensity = Math.sin(time * 10) * 0.5 + 0.5
          
          applyBlendShapesToAvatar({
            jawOpen: intensity * 0.7,
            mouthSmile: intensity * 0.3,
            mouthFunnel: intensity * 0.4
          })
          
          requestAnimationFrame(animateToAudio)
        }
        animateToAudio()
      }
      
      audio.onended = () => {
        setIsSpeaking(false)
        applyBlendShapesToAvatar({ jawOpen: 0, mouthSmile: 0, mouthFunnel: 0 })
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('🎵 Audio playback error:', error)
      setIsSpeaking(false)
      // Fallback to TTS
      await speakText(text)
    }
  }, [audioEnabled, avatarLoaded, applyBlendShapesToAvatar, speakText])

  // CLEAN MESSAGE SENDER - handles both modes properly
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    console.log(`📝 SENDING MESSAGE in ${chatMode} mode:`, message.substring(0, 50))

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'child',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    onMessageSent?.(message.trim())

    try {
      // Clear endpoint selection
      const endpoint = chatMode === 'voice' ? '/api/chat/voice-live' : '/api/chat'
      const logPrefix = chatMode === 'voice' ? '🎤 VOICE' : '💬 TEXT'
      
      console.log(`${logPrefix}: Sending to ${endpoint}`)
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          childId,
          accessCode,
          mode: chatMode
        })
      })

      if (!response.ok) {
        throw new Error(`${endpoint} error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data?.text) {
        throw new Error('Invalid response')
      }
      
      console.log(`${logPrefix}: Response from ${data.model || 'API'}`)
      
      const avatarMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'avatar',
        timestamp: new Date(),
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, avatarMessage])
      
      // Audio playback
      if (avatarLoaded && audioEnabled && data.text) {
        if (data.audioUrl) {
          console.log(`${logPrefix}: Using Gemini audio`)
          await playAudioWithLipSync(data.audioUrl, data.text)
        } else {
          console.log(`${logPrefix}: Using browser TTS`)
          await speakText(data.text)
        }
      }

    } catch (error) {
      console.error(`${chatMode} error:`, error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      if (avatarLoaded && audioEnabled) {
        await speakText(errorMessage.text)
      }
    } finally {
      setIsLoading(false)
    }
  }, [chatMode, childId, accessCode, isLoading, onMessageSent, avatarLoaded, audioEnabled, playAudioWithLipSync, speakText])

  // Start voice recognition
  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      console.log('🎤 Starting voice recognition')
      recognitionRef.current.start()
    }
  }, [isListening])

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      sendMessage(inputMessage.trim())
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">🎭 Clean Voice Avatar Chat</h2>
            <p className="text-sm text-gray-600">
              {chatMode === 'voice' ? 'Using Gemini Live AI' : 'Using Gemini + TTS'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`p-2 rounded-full ${audioEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
            >
              {audioEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChatMode('text')}
                className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                  chatMode === 'text' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                <Type size={16} />
                <span className="text-sm">Text</span>
              </button>
              <button
                onClick={() => setChatMode('voice')}
                className={`flex items-center space-x-2 px-3 py-1 rounded transition-colors ${
                  chatMode === 'voice' ? 'bg-white shadow-sm' : 'text-gray-600'
                }`}
              >
                <Mic size={16} />
                <span className="text-sm">Voice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Avatar */}
        <div className="w-1/2 bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center">
          <div className="w-full h-full max-w-md">
            <SimpleAvatarViewer
              avatarUrl={avatarUrl}
              onModelLoad={handleAvatarLoad}
              onModelError={handleAvatarError}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Chat */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-lg font-medium text-gray-700">Hi there!</p>
                <p className="text-sm text-gray-500">
                  {chatMode === 'voice' ? 'Click the mic to start talking!' : 'Type a message to start chatting!'}
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'child' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.sender === 'child'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-800 shadow-sm border'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 shadow-sm border px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {chatMode === 'voice' ? 'Gemini Live...' : 'Gemini AI...'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 bg-white border-t">
            {chatMode === 'text' ? (
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
                  disabled={isLoading || isSpeaking}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || isSpeaking}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
                >
                  <Send size={16} />
                </button>
              </form>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={isListening ? 'Listening...' : inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Click mic to speak or type here..."
                  disabled={isListening || isLoading || isSpeaking}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
                {inputMessage.trim() ? (
                  <button
                    onClick={() => sendMessage(inputMessage)}
                    disabled={isLoading || isSpeaking}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                ) : (
                  <button
                    onClick={startVoiceRecognition}
                    disabled={isLoading || isSpeaking || isListening}
                    className={`px-4 py-2 text-white rounded-lg disabled:bg-gray-300 transition-colors ${
                      isListening ? 'bg-red-500 animate-pulse' : 'bg-purple-500 hover:bg-purple-600'
                    }`}
                  >
                    <Mic size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
