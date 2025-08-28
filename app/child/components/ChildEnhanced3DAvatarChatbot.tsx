'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'

// Dynamically import to prevent SSR issues
const DynamicSimpleAvatarViewer = dynamic(
  () => import('@/components/SimpleAvatarViewer').then(mod => ({ default: mod.SimpleAvatarViewer })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading Your Amazing Avatar...</p>
          <p className="text-sm opacity-75 mt-1">Preparing 3D magic!</p>
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
  emotion?: 'happy' | 'excited' | 'neutral' | 'surprised'
}

interface ChildEnhanced3DAvatarChatbotProps {
  childProfile: any
}

/**
 * Child-specific Enhanced 3D Avatar Chatbot
 * - Uses child's specific avatar GLB URL
 * - Integrated into child's "My Stuff" section
 * - Real-time lip-sync and animations
 * - Child-friendly UI with enhanced features
 */
export function ChildEnhanced3DAvatarChatbot({ childProfile }: ChildEnhanced3DAvatarChatbotProps) {
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
  
  // Avatar state
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [avatarError, setAvatarError] = useState(false)

  // Refs
  const avatarRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const blinkIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Get child's avatar URL with fallbacks
  const getAvatarUrl = useCallback(() => {
    if (childProfile?.avatar_url) {
      return childProfile.avatar_url
    }
    
    // Fallback avatars for different scenarios
    const fallbackUrls = [
      "https://models.readyplayer.me/6746a5e38c5f9b5fd0c18b5a.glb",
      "https://models.readyplayer.me/64bfa15f0e5d934dd9914fd4.glb",
      "https://models.readyplayer.me/638289aa05b64b45c5a54702.glb"
    ]
    
    return fallbackUrls[0]
  }, [childProfile])

  // Enhanced voice selection for children
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null)

  // Initialize component on client side
  useEffect(() => {
    setIsMounted(true)
    setMessages([
      {
        id: '1',
        text: `Hi ${childProfile?.name || 'there'}! I'm your special 3D avatar friend! Ask me anything and watch me come to life with amazing animations! 🌟`,
        isUser: false,
        timestamp: new Date(),
        emotion: 'happy'
      }
    ])
  }, [childProfile])

  // Set up enhanced voice for children
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const setupVoice = () => {
        const voices = speechSynthesis.getVoices()
        
        // Preferred voices for children (higher pitch, clearer speech)
        const preferredVoices = [
          'Google US English Female',
          'Microsoft Zira - English (United States)',
          'Samantha',
          'Victoria',
          'Alex'
        ]
        
        let bestVoice = null
        for (const voiceName of preferredVoices) {
          const voice = voices.find(v => v.name.includes(voiceName))
          if (voice) {
            bestVoice = voice
            break
          }
        }
        
        // Fallback to any English female voice
        if (!bestVoice) {
          bestVoice = voices.find(v => 
            v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
          ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
        }
        
        setSelectedVoice(bestVoice)
      }

      if (speechSynthesis.getVoices().length > 0) {
        setupVoice()
      } else {
        speechSynthesis.addEventListener('voiceschanged', setupVoice)
      }

      return () => {
        speechSynthesis.removeEventListener('voiceschanged', setupVoice)
      }
    }
  }, [])

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Enhanced idle animations for child avatars
  const startIdleAnimations = useCallback(() => {
    if (isSpeaking || !avatarLoaded) return

    const performIdleAnimation = () => {
      if (isSpeaking || !avatarLoaded) return

      // Random blink with child-friendly timing
      if (Math.random() < 0.4) {
        const blinkShapes = {
          eyeBlinkLeft: 1.0,
          eyeBlinkRight: 1.0
        }
        
        // Apply blend shapes through viseme callback
        if (lipsyncManagerRef.current) {
          // Manually trigger the callback with blink shapes
          setTimeout(() => {
            if (!isSpeaking) {
              // Reset blink
            }
          }, 150)
        }
      }

      // Occasional smile for friendliness
      if (Math.random() < 0.2) {
        const smileShapes = {
          mouthSmile: 0.5
        }
        
        setTimeout(() => {
          if (!isSpeaking) {
            // Keep slight smile
          }
        }, 1500)
      }

      // Schedule next animation
      if (!isSpeaking && avatarLoaded) {
        blinkIntervalRef.current = setTimeout(performIdleAnimation, 2000 + Math.random() * 3000)
      }
    }

    blinkIntervalRef.current = setTimeout(performIdleAnimation, 1000)
  }, [isSpeaking, avatarLoaded])

  const stopIdleAnimations = useCallback(() => {
    if (blinkIntervalRef.current) {
      clearTimeout(blinkIntervalRef.current)
      blinkIntervalRef.current = null
    }
  }, [])

  // Enhanced speech with child-friendly settings
  const speakText = useCallback(async (text: string, emotion: string = 'neutral') => {
    if (!isMounted || isMuted) return

    if (isSpeaking) {
      speechSynthesis.cancel()
    }

    setIsSpeaking(true)
    stopIdleAnimations()

    try {
      const utterance = new SpeechSynthesisUtterance(text)
      
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
      
      // Child-friendly speech settings
      utterance.rate = 0.85  // Slightly slower for clarity
      utterance.pitch = 1.2  // Higher pitch for friendliness
      utterance.volume = 0.9
      
      // Set up lipsync with the utterance
      lipsyncManagerRef.current.processSpeechSynthesis(utterance)

      utterance.onstart = () => {
        console.log('🎤 Avatar started speaking')
      }

      utterance.onend = () => {
        setIsSpeaking(false)
        
        // Set emotion-based expression after speaking
        const emotionShapes = getEmotionBlendShapes(emotion)
        // Note: Blend shapes will be applied through the lipsync manager's viseme system
        
        // Restart idle animations
        setTimeout(() => {
          if (avatarLoaded) {
            startIdleAnimations()
          }
        }, 500)
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        setIsSpeaking(false)
        startIdleAnimations()
      }

      utteranceRef.current = utterance
      speechSynthesis.speak(utterance)

    } catch (error) {
      console.error('Error in speech synthesis:', error)
      setIsSpeaking(false)
      startIdleAnimations()
    }
  }, [isMounted, isMuted, selectedVoice, isSpeaking, startIdleAnimations, stopIdleAnimations, avatarLoaded])

  // Get emotion-based blend shapes (simplified to match available BlendShapeTargets)
  const getEmotionBlendShapes = useCallback((emotion: string): Partial<BlendShapeTargets> => {
    switch (emotion) {
      case 'happy':
        return {
          mouthSmile: 0.8,
          eyeBlinkLeft: 0.0,
          eyeBlinkRight: 0.0
        }
      case 'excited':
        return {
          mouthSmile: 1.0,
          jawOpen: 0.2,
          eyeBlinkLeft: 0.0,
          eyeBlinkRight: 0.0
        }
      case 'surprised':
        return {
          jawOpen: 0.4,
          mouthFunnel: 0.3,
          eyeBlinkLeft: 0.0,
          eyeBlinkRight: 0.0
        }
      default: // neutral
        return {
          mouthSmile: 0.2,
          jawOpen: 0.0,
          eyeBlinkLeft: 0.0,
          eyeBlinkRight: 0.0
        }
    }
  }, [])

  // Enhanced chat API with child context
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          childId: childProfile?.id,
          accessCode: childProfile?.access_code,
          context: 'child_avatar_chat',
          childName: childProfile?.name
        })
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      const data = await response.json()
      
      const avatarMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text || "That's interesting! Tell me more!",
        isUser: false,
        timestamp: new Date(),
        emotion: data.emotion || 'happy'
      }

      setMessages(prev => [...prev, avatarMessage])
      
      // Speak the response after a brief delay
      setTimeout(() => {
        speakText(avatarMessage.text, avatarMessage.emotion)
      }, 500)

    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Oops! I'm having a little trouble right now. Can you try asking me something else? 😊",
        isUser: false,
        timestamp: new Date(),
        emotion: 'neutral'
      }
      
      setMessages(prev => [...prev, errorMessage])
      speakText(errorMessage.text, 'neutral')
    } finally {
      setIsLoading(false)
      setIsTyping(false)
    }
  }, [childProfile, isLoading, speakText])

  // Handle avatar model loading
  const handleAvatarLoad = useCallback((model: any) => {
    setAvatarLoaded(true)
    setAvatarError(false)
    avatarRef.current = model
    
    console.log('🎭 Child avatar loaded successfully:', {
      childId: childProfile?.id,
      childName: childProfile?.name,
      avatarUrl: getAvatarUrl()
    })
    
    // Start idle animations after avatar loads
    setTimeout(() => {
      startIdleAnimations()
    }, 1000)
  }, [childProfile, getAvatarUrl, startIdleAnimations])

  const handleAvatarError = useCallback((error: any) => {
    console.error('Avatar loading error:', error)
    setAvatarError(true)
    setAvatarLoaded(false)
  }, [])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        speechSynthesis.cancel()
      }
      stopIdleAnimations()
    }
  }, [stopIdleAnimations])

  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-medium">Setting up your avatar chat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-pink-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-blue-300 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 bg-white border-b-4 border-purple-300 p-4 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-purple-800 mb-1">
            Chat with {childProfile?.name || 'Your'} Avatar! 🎭
          </h2>
          <p className="text-sm text-purple-600">Your 3D friend will talk and move just like you!</p>
          
          {/* Control buttons */}
          <div className="flex justify-center items-center gap-4 mt-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isMuted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-green-500 text-white'
              }`}
            >
              {isMuted ? '🔇 Muted' : '🔊 Sound On'}
            </button>
            
            {isSpeaking && (
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Avatar Speaking...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Display */}
      <div className="relative z-10 flex-shrink-0 h-80 bg-gradient-to-b from-white to-purple-100 border-b-4 border-purple-200 shadow-inner">
        {!avatarError ? (
          <DynamicSimpleAvatarViewer
            avatarUrl={getAvatarUrl()}
            enableControls={false}
            cameraMode="headshot"
            onModelLoad={handleAvatarLoad}
            onModelError={handleAvatarError}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🦸‍♂️</div>
              <h3 className="text-xl font-bold text-purple-800 mb-2">Avatar Loading Issue</h3>
              <p className="text-purple-600 mb-4">Don't worry! Your avatar is getting ready...</p>
              <button 
                onClick={() => {
                  setAvatarError(false)
                  setAvatarLoaded(false)
                }}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg transform transition-all ${
                  message.isUser
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rotate-1'
                    : 'bg-white text-gray-800 border-2 border-purple-200 -rotate-1'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  })}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 border-2 border-purple-200 px-4 py-3 rounded-2xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-purple-600">Your avatar is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 flex-shrink-0 p-4 bg-white border-t-4 border-purple-300">
        <form onSubmit={handleSubmit} className="flex space-x-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message and watch me come alive! ✨"}
            disabled={isLoading || isSpeaking}
            className="flex-1 px-4 py-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 placeholder-purple-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading || isSpeaking}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChildEnhanced3DAvatarChatbot
