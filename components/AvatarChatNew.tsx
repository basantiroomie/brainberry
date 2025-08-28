'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { getEnhancedTTSService } from '@/lib/enhanced-tts-service'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Mic, Type, Volume2, VolumeX, Send, ArrowLeft, MicOff } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  isAudioPlaying?: boolean
}

interface AvatarChatNewProps {
  avatarUrl: string
  childId?: string
  onBack?: () => void
}

type ChatMode = 'text' | 'voice'

export const AvatarChatNew: React.FC<AvatarChatNewProps> = ({
  avatarUrl,
  childId = "test-child-123",
  onBack
}) => {
  // State management
  const [chatMode, setChatMode] = useState<ChatMode>('text')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const ttsServiceRef = useRef(getEnhancedTTSService())
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const idleAnimationRef = useRef<number | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize speech recognition for text mode
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onstart = () => {
          setIsListening(true)
          console.log('🎤 Speech recognition started')
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
          console.log('🎤 Speech recognition ended')
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('🎤 Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join('')
          
          if (event.results[0].isFinal && transcript.trim()) {
            setInputMessage(transcript)
            setIsListening(false)
          }
        }
      }
    }
  }, [])

  // Setup lipsync manager
  useEffect(() => {
    const lipsyncManager = lipsyncManagerRef.current
    
    lipsyncManager.setVisemeCallback((blendShapes: Partial<BlendShapeTargets>) => {
      applyBlendShapesToAvatar(blendShapes)
    })

    return () => {
      lipsyncManager.dispose()
    }
  }, [])

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
    startIdleAnimations()
  }, [])

  // Start idle animations
  const startIdleAnimations = useCallback(() => {
    if (isSpeaking) return

    const performBlink = () => {
      if (isSpeaking) return

      applyBlendShapesToAvatar({
        eyeBlinkLeft: 1.0,
        eyeBlinkRight: 1.0
      })

      setTimeout(() => {
        if (!isSpeaking) {
          applyBlendShapesToAvatar({
            eyeBlinkLeft: 0.0,
            eyeBlinkRight: 0.0
          })
        }
      }, 150)

      if (!isSpeaking) {
        idleAnimationRef.current = window.setTimeout(performBlink, 2000 + Math.random() * 3000)
      }
    }

    idleAnimationRef.current = window.setTimeout(performBlink, 1000)
  }, [isSpeaking, applyBlendShapesToAvatar])

  // Stop idle animations
  const stopIdleAnimations = useCallback(() => {
    if (idleAnimationRef.current) {
      clearTimeout(idleAnimationRef.current)
      idleAnimationRef.current = null
    }
  }, [])

  // Enhanced TTS with fallback system
  const speakText = useCallback(async (text: string) => {
    if (!audioEnabled || isSpeaking) return

    setIsSpeaking(true)
    stopIdleAnimations()

    try {
      console.log('🔊 Starting TTS for:', text.substring(0, 50))
      
      const ttsResult = await ttsServiceRef.current.generateSpeech(text)
      
      if (ttsResult.success) {
        console.log('🔊 TTS successful with provider:', ttsResult.provider)
        
        // Setup lip-sync for non-browser TTS
        if (ttsResult.provider !== 'browser') {
          // Create a fake utterance for lip-sync timing
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.pitch = 1.1
          utterance.volume = 0
          
          lipsyncManagerRef.current.processSpeechSynthesis(utterance)
        }
        
        // Play the audio if needed
        if (ttsResult.audioUrl || ttsResult.audioBuffer) {
          await ttsServiceRef.current.playAudio(ttsResult)
        }
      } else {
        console.error('🔊 All TTS methods failed:', ttsResult.error)
      }
    } catch (error) {
      console.error('🔊 TTS error:', error)
    } finally {
      setIsSpeaking(false)
      applyBlendShapesToAvatar({
        jawOpen: 0,
        mouthSmile: 0,
        mouthFunnel: 0
      })
      startIdleAnimations()
    }
  }, [audioEnabled, isSpeaking, applyBlendShapesToAvatar, startIdleAnimations, stopIdleAnimations])

  // Send text message
  const sendTextMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'child',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          childId
        })
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      const data = await response.json()
      
      const avatarMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'avatar',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, avatarMessage])
      
      // Speak the response
      await speakText(data.text)

    } catch (error) {
      console.error('Chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      await speakText(errorMessage.text)
    } finally {
      setIsLoading(false)
    }
  }, [childId, isLoading, speakText])

  // Start voice recording for voice mode
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await sendVoiceMessage(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      console.log('🎤 Voice recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [])

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      console.log('🎤 Voice recording stopped')
    }
  }, [isRecording])

  // Send voice message
  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('childId', childId)

      const response = await fetch('/api/chat/voice-live', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Voice chat API error: ${response.status}`)
      }

      const data = await response.json()
      
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: data.transcription || '[Voice message]',
        sender: 'child',
        timestamp: new Date()
      }

      const avatarMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        sender: 'avatar',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage, avatarMessage])
      
      // Speak the response
      await speakText(data.text)

    } catch (error) {
      console.error('Voice chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble understanding. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      await speakText(errorMessage.text)
    } finally {
      setIsLoading(false)
    }
  }, [childId, speakText])

  // Handle form submission for text mode
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatMode === 'text') {
      sendTextMessage(inputMessage)
    }
  }

  // Toggle speech recognition for text mode
  const toggleSpeechRecognition = () => {
    if (isListening) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800">Chat with Your Avatar</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChatMode('text')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                chatMode === 'text' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setChatMode('voice')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                chatMode === 'voice' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Voice</span>
            </button>
          </div>
          
          {/* Audio Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-full transition-colors ${
              audioEnabled 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Avatar Panel */}
        <div className="w-1/2 bg-gradient-to-b from-purple-100 to-blue-100 p-6">
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-80 h-80 rounded-2xl overflow-hidden bg-white shadow-lg">
              <SimpleAvatarViewer
                avatarUrl={avatarUrl}
                onModelLoad={handleAvatarLoad}
                onModelError={(error: any) => console.error('Avatar load error:', error)}
                className="w-full h-full"
                cameraMode="headshot"
              />
            </div>
            
            {isSpeaking && (
              <div className="mt-4 flex items-center space-x-2 text-purple-600">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Avatar is speaking...</span>
              </div>
            )}
            
            {isListening && (
              <div className="mt-4 flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening...</span>
              </div>
            )}
            
            {isRecording && (
              <div className="mt-4 flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording...</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-20">
                <h3 className="text-lg font-medium mb-2">
                  Start a conversation with your avatar!
                </h3>
                <p className="text-sm">
                  {chatMode === 'text' 
                    ? 'Type a message or use the microphone button to speak.'
                    : 'Press and hold the record button to speak.'
                  }
                </p>
              </div>
            )}
            
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
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-gray-50 p-4">
            {chatMode === 'text' ? (
              /* Text Mode Input */
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
                    disabled={isSpeaking || isLoading}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
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
                </div>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isSpeaking || isLoading}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Voice Mode Input */
              <div className="flex justify-center">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isSpeaking || isLoading}
                  className={`p-6 rounded-full transition-all duration-200 ${
                    isRecording
                      ? 'bg-red-500 text-white scale-110 shadow-lg'
                      : 'bg-blue-500 text-white hover:bg-blue-600 hover:scale-105 shadow-md'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarChatNew
