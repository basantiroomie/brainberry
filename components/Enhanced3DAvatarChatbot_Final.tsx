'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'

// Dynamically import to prevent SSR issues
const DynamicSimpleAvatarViewer = dynamic(
  () => import('@/components/SimpleAvatarViewer').then(mod => ({ default: mod.SimpleAvatarViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Loading Avatar...</p>
        </div>
      </div>
    )
  }
)

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

interface AvatarAnimationState {
  isBlinking: boolean
  isBreathing: boolean
  isIdle: boolean
  currentEmotion: 'neutral' | 'happy' | 'surprised' | 'confused'
}

/**
 * Enhanced 3D Avatar Chatbot with Advanced Features
 * - Real-time lip-sync using Wawa Lipsync
 * - Typing indicators and message timestamps
 * - Idle animations (blinking, breathing)
 * - Emotional expressions
 * - Polished UI with animations
 */
export function Enhanced3DAvatarChatbot() {
  // Client-side mounting state to prevent hydration issues
  const [isMounted, setIsMounted] = useState(false)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  // Audio and speech state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Avatar animation state
  const [avatarState, setAvatarState] = useState<AvatarAnimationState>({
    isBlinking: true,
    isBreathing: true,
    isIdle: true,
    currentEmotion: 'neutral'
  })

  // Refs
  const avatarRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const breatheIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Avatar URL with fallback
  const [avatarUrl, setAvatarUrl] = useState("https://models.readyplayer.me/6746a5e38c5f9b5fd0c18b5a.glb")
  const fallbackAvatarUrl = "https://models.readyplayer.me/64bfa15f0e5d934dd9914fd4.glb"

  // Enhanced voice selection for better quality
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  // Initialize component on client side
  useEffect(() => {
    setIsMounted(true)
    setMessages([
      {
        id: '1',
        text: "Hi there! I'm your 3D avatar assistant. Ask me anything and watch me respond with realistic animations!",
        isUser: false,
        timestamp: new Date()
      }
    ])
  }, [])

  useEffect(() => {
    // Set up better voice selection
    const setupVoice = () => {
      const voices = speechSynthesis.getVoices()
      // Prefer female voices that sound more natural
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') ||
        voice.name.includes('Tessa') ||
        voice.name.includes('Google UK English Female') ||
        voice.name.includes('Microsoft Zira') ||
        (voice.lang.includes('en') && voice.name.toLowerCase().includes('female'))
      ) || voices.find(voice => voice.lang.includes('en')) || voices[0]
      
      setSelectedVoice(preferredVoice)
      console.log('Selected voice:', preferredVoice?.name)
    }

    setupVoice()
    speechSynthesis.onvoiceschanged = setupVoice

    return () => {
      speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Set up lipsync callback
  useEffect(() => {
    const lipsyncManager = lipsyncManagerRef.current
    
    lipsyncManager.setVisemeCallback((blendShapes: Partial<BlendShapeTargets>) => {
      if (avatarRef.current && avatarRef.current.updateMorphTargets) {
        avatarRef.current.updateMorphTargets(blendShapes)
      }
    })

    return () => {
      lipsyncManager.dispose()
    }
  }, [])

  // Enhanced idle animations
  useEffect(() => {
    if (!avatarState.isIdle) return

    // Blinking animation
    const startBlinking = () => {
      const blink = () => {
        if (avatarRef.current && avatarRef.current.updateMorphTargets && !isSpeaking) {
          // Quick blink
          avatarRef.current.updateMorphTargets({ eyeBlinkLeft: 1.0, eyeBlinkRight: 1.0 })
          setTimeout(() => {
            if (avatarRef.current && !isSpeaking) {
              avatarRef.current.updateMorphTargets({ eyeBlinkLeft: 0.0, eyeBlinkRight: 0.0 })
            }
          }, 120)
        }
      }

      // Random blinking every 2-5 seconds
      const scheduleNextBlink = () => {
        const delay = 2000 + Math.random() * 3000
        blinkIntervalRef.current = setTimeout(() => {
          blink()
          scheduleNextBlink()
        }, delay)
      }

      scheduleNextBlink()
    }

    // Breathing animation
    const startBreathing = () => {
      let breathPhase = 0
      const breathe = () => {
        if (avatarRef.current && avatarRef.current.updateMorphTargets && !isSpeaking) {
          breathPhase += 0.03
          const breathIntensity = Math.sin(breathPhase) * 0.1 + 0.05
          
          // Subtle mouth and nose movements for breathing
          avatarRef.current.updateMorphTargets({ 
            mouthSmile: breathIntensity * 0.2,
            jawOpen: breathIntensity * 0.1
          })
        }

        breatheIntervalRef.current = setTimeout(breathe, 100)
      }

      breathe()
    }

    if (avatarState.isBlinking) {
      startBlinking()
    }

    if (avatarState.isBreathing) {
      startBreathing()
    }

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current)
      }
      if (breatheIntervalRef.current) {
        clearTimeout(breatheIntervalRef.current)
      }
    }
  }, [avatarState.isIdle, avatarState.isBlinking, avatarState.isBreathing, isSpeaking])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Apply emotional expressions
  const applyEmotion = useCallback((emotion: 'neutral' | 'happy' | 'surprised' | 'confused') => {
    if (!avatarRef.current || !avatarRef.current.updateMorphTargets) return

    const emotionMorphs: Record<string, Partial<BlendShapeTargets>> = {
      neutral: { mouthSmile: 0.0, jawOpen: 0.0 },
      happy: { mouthSmile: 0.7 },
      surprised: { jawOpen: 0.3, mouthSmile: 0.2 },
      confused: { mouthSmile: -0.3, jawOpen: 0.1 }
    }

    avatarRef.current.updateMorphTargets(emotionMorphs[emotion])
    setAvatarState(prev => ({ ...prev, currentEmotion: emotion }))

    // Reset to neutral after a delay if not speaking
    setTimeout(() => {
      if (!isSpeaking && avatarRef.current && avatarRef.current.updateMorphTargets) {
        avatarRef.current.updateMorphTargets(emotionMorphs.neutral)
      }
    }, 2000)
  }, [isSpeaking])

  // Enhanced speak function with better emotional analysis
  const speak = useCallback(async (text: string) => {
    if (!selectedVoice || isMuted) return

    setIsSpeaking(true)
    setAvatarState(prev => ({ ...prev, isIdle: false }))

    // Analyze text for emotional context
    const lowerText = text.toLowerCase()
    let emotion: 'neutral' | 'happy' | 'surprised' | 'confused' = 'neutral'
    
    if (lowerText.includes('!') || lowerText.includes('wow') || lowerText.includes('amazing')) {
      emotion = 'surprised'
    } else if (lowerText.includes('happy') || lowerText.includes('great') || lowerText.includes('wonderful') || lowerText.includes('good')) {
      emotion = 'happy'
    } else if (lowerText.includes('?') || lowerText.includes('confused') || lowerText.includes('hmm')) {
      emotion = 'confused'
    }

    // Apply emotion briefly before speaking
    applyEmotion(emotion)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = selectedVoice
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.volume = 1.0

    utteranceRef.current = utterance

    // Set up enhanced lipsync
    const lipsyncManager = lipsyncManagerRef.current
    lipsyncManager.processSpeechSynthesis(utterance)

    utterance.onend = () => {
      setIsSpeaking(false)
      setAvatarState(prev => ({ ...prev, isIdle: true }))
      
      // Reset to neutral expression
      setTimeout(() => {
        if (avatarRef.current && avatarRef.current.updateMorphTargets) {
          avatarRef.current.updateMorphTargets({ 
            jawOpen: 0.0, 
            mouthSmile: 0.0, 
            mouthFunnel: 0.0 
          })
        }
      }, 500)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsSpeaking(false)
      setAvatarState(prev => ({ ...prev, isIdle: true }))
    }

    speechSynthesis.speak(utterance)
  }, [selectedVoice, isMuted, applyEmotion])

  // Enhanced message sending with typing indicator
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setIsTyping(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText.trim() })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Simulate typing delay for realism
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
      
      setIsTyping(false)

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      
      // Speak the response after a brief delay
      setTimeout(() => {
        speak(data.response)
      }, 300)

    } catch (error) {
      setIsTyping(false)
      console.error('Error sending message:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again!",
        isUser: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, speak])

  // Pause/Resume speech
  const togglePauseSpeech = () => {
    if (speechSynthesis.speaking) {
      if (speechSynthesis.paused) {
        speechSynthesis.resume()
        setIsPaused(false)
      } else {
        speechSynthesis.pause()
        setIsPaused(true)
      }
    }
  }

  // Stop current speech
  const stopSpeech = () => {
    speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
    setAvatarState(prev => ({ ...prev, isIdle: true }))
    
    if (avatarRef.current && avatarRef.current.updateMorphTargets) {
      avatarRef.current.updateMorphTargets({ 
        jawOpen: 0.0, 
        mouthSmile: 0.0, 
        mouthFunnel: 0.0 
      })
    }
  }

  // Enhanced time formatting - consistent server/client rendering
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false // Use 24-hour format to avoid AM/PM differences
    })
  }

  // Don't render until mounted on client
  if (!isMounted) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Enhanced Avatar Chat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Enhanced 3D Avatar Chat</h1>
            <p className="text-sm text-gray-600">
              {isSpeaking ? '🎤 Speaking...' : 
               isTyping ? '💭 Thinking...' : 
               '💬 Ready to chat'}
            </p>
          </div>
          
          {/* Audio Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
              }`}
            >
              {isMuted ? '🔇 Muted' : '🔊 Audio On'}
            </button>
            
            {isSpeaking && (
              <button
                onClick={togglePauseSpeech}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-600"
              >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
            )}
            
            {isSpeaking && (
              <button
                onClick={stopSpeech}
                className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-600"
              >
                ⏹️ Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Avatar Section */}
        <div className="w-1/2 bg-gradient-to-b from-gray-900 to-gray-700 relative overflow-hidden">
          <div className="absolute inset-0">
            <DynamicSimpleAvatarViewer
              avatarUrl={avatarUrl}
              className="w-full h-full"
              onModelLoad={(model) => {
                avatarRef.current = model
                console.log('Avatar loaded successfully')
              }}
              onModelError={(error) => {
                console.error('Avatar load error:', error)
                if (avatarUrl !== fallbackAvatarUrl) {
                  console.log('Trying fallback avatar URL...')
                  setAvatarUrl(fallbackAvatarUrl)
                }
              }}
            />
          </div>
          
          {/* Avatar Status Overlay */}
          <div className="absolute top-4 left-4 bg-black/20 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="text-sm font-medium">Avatar Status</div>
            <div className="text-xs space-y-1 mt-2">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span>Speaking: {isSpeaking ? 'Active' : 'Idle'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${avatarState.isBlinking ? 'bg-blue-400' : 'bg-gray-400'}`}></div>
                <span>Blinking: {avatarState.isBlinking ? 'On' : 'Off'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${avatarState.isBreathing ? 'bg-purple-400' : 'bg-gray-400'}`}></div>
                <span>Breathing: {avatarState.isBreathing ? 'On' : 'Off'}</span>
              </div>
              <div className="text-xs mt-1">
                Emotion: {avatarState.currentEmotion}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.isUser
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.isUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">Assistant is typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex space-x-3">
              <textarea
                value={inputText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 resize-none border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:ring-0 bg-white p-3"
                rows={2}
                onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-xl px-6 self-end transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  '📤'
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>Press Enter to send, Shift+Enter for new line</span>
              <span>{inputText.length}/500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
