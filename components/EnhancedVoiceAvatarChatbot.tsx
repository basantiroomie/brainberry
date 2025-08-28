'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D, Mesh, SkinnedMesh } from 'three'
import { Mic, MicOff, Type, Volume2, VolumeX, Send } from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'child' | 'avatar'
  timestamp: Date
  isAudioPlaying?: boolean
  audioUrl?: string
}

interface EnhancedVoiceAvatarChatbotProps {
  avatarUrl: string
  childId: string
  accessCode?: string
  onMessageSent?: (message: string) => void
}

type ChatMode = 'text' | 'voice'

export const EnhancedVoiceAvatarChatbot: React.FC<EnhancedVoiceAvatarChatbotProps> = ({
  avatarUrl,
  childId,
  accessCode,
  onMessageSent
}) => {
  // State management
  const [chatMode, setChatMode] = useState<ChatMode>('text')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [currentBlendShapes, setCurrentBlendShapes] = useState<Partial<BlendShapeTargets>>({})
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recognitionRef = useRef<any>(null) // Using 'any' for cross-browser compatibility
  const idleAnimationRef = useRef<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // TTS Configuration
  const ttsConfig = {
    rate: 0.9,
    pitch: 1.1,
    volume: 0.8,
    preferredVoices: [
      'Google US English',
      'Microsoft Zira - English (United States)',
      'Alex',
      'Samantha'
    ]
  }

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'
        
        recognitionRef.current.onstart = () => {
          setIsListening(true)
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
              sendMessage(transcript.trim())
            }
          }
        }
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }
  }, [])

  // Initialize audio context for voice processing
  useEffect(() => {
    audioContextRef.current = new ((window as any).AudioContext || (window as any).webkitAudioContext)()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize lipsync manager
  useEffect(() => {
    const lipsyncManager = lipsyncManagerRef.current
    
    lipsyncManager.setVisemeCallback((blendShapes: Partial<BlendShapeTargets>) => {
      setCurrentBlendShapes(blendShapes)
      applyBlendShapesToAvatar(blendShapes)
    })

    return () => {
      lipsyncManager.dispose()
    }
  }, [])

  // Apply blend shapes to avatar model
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

  // Handle avatar model load
  const handleAvatarLoad = useCallback((model: Object3D) => {
    avatarModelRef.current = model
    setAvatarLoaded(true)
    console.log('3D Avatar loaded successfully for voice chatbot')
    startIdleAnimations()
  }, [])

  // Start idle animations
  const startIdleAnimations = useCallback(() => {
    if (isSpeaking) return

    const performIdleAnimation = () => {
      if (isSpeaking) return

      if (Math.random() < 0.3) {
        const blinkShapes = {
          eyeBlinkLeft: 1.0,
          eyeBlinkRight: 1.0
        }
        
        applyBlendShapesToAvatar(blinkShapes)
        
        setTimeout(() => {
          if (!isSpeaking) {
            applyBlendShapesToAvatar({
              eyeBlinkLeft: 0.0,
              eyeBlinkRight: 0.0
            })
          }
        }, 150)
      }

      if (!isSpeaking) {
        idleAnimationRef.current = window.setTimeout(performIdleAnimation, 2000 + Math.random() * 3000)
      }
    }

    idleAnimationRef.current = window.setTimeout(performIdleAnimation, 1000)
  }, [isSpeaking, applyBlendShapesToAvatar])

  // Stop idle animations
  const stopIdleAnimations = useCallback(() => {
    if (idleAnimationRef.current) {
      clearTimeout(idleAnimationRef.current)
      idleAnimationRef.current = null
    }
  }, [])

  // Get best available TTS voice
  const getBestTTSVoice = useCallback(() => {
    const voices = speechSynthesis.getVoices()
    
    for (const preferredVoice of ttsConfig.preferredVoices) {
      const voice = voices.find(v => v.name.includes(preferredVoice))
      if (voice) return voice
    }
    
    const englishVoice = voices.find(v => v.lang.startsWith('en'))
    return englishVoice || voices[0]
  }, [])

  // Play audio with lip-sync (for Gemini TTS responses)
  const playAudioWithLipSync = useCallback(async (audioUrl: string, text: string) => {
    if (!audioEnabled || !avatarLoaded) return

    setIsSpeaking(true)
    stopIdleAnimations()

    try {
      const audio = new Audio(audioUrl)
      
      // Create audio context for lip-sync analysis
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audio)
        const analyser = audioContextRef.current.createAnalyser()
        source.connect(analyser)
        analyser.connect(audioContextRef.current.destination)
        
        // Analyze audio for lip-sync
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        const updateLipSync = () => {
          if (audio.paused || audio.ended) {
            setIsSpeaking(false)
            applyBlendShapesToAvatar({
              jawOpen: 0.0,
              mouthSmile: 0.0,
              mouthFunnel: 0.0
            })
            startIdleAnimations()
            return
          }
          
          analyser.getByteFrequencyData(dataArray)
          const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          
          // Convert volume to mouth movements
          const intensity = Math.min(volume / 50, 1.0)
          applyBlendShapesToAvatar({
            jawOpen: intensity * 0.7,
            mouthSmile: intensity * 0.3,
            mouthFunnel: intensity * 0.4
          })
          
          requestAnimationFrame(updateLipSync)
        }
        
        audio.onplay = () => updateLipSync()
      }
      
      await audio.play()
      
    } catch (error) {
      console.error('Audio playback error:', error)
      setIsSpeaking(false)
      startIdleAnimations()
    }
  }, [audioEnabled, avatarLoaded, applyBlendShapesToAvatar, startIdleAnimations, stopIdleAnimations])

  // Speak text using browser TTS with lip-sync
  const speakText = useCallback(async (text: string, facialExpression?: string) => {
    if (!audioEnabled || isSpeaking) {
      if (isSpeaking) speechSynthesis.cancel()
    }

    setIsSpeaking(true)
    stopIdleAnimations()

    return new Promise<void>((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        const voice = getBestTTSVoice()
        
        if (voice) {
          utterance.voice = voice
        }
        
        utterance.rate = ttsConfig.rate
        utterance.pitch = ttsConfig.pitch
        utterance.volume = ttsConfig.volume

        lipsyncManagerRef.current.processSpeechSynthesis(utterance)

        utterance.onstart = () => {
          console.log('Avatar started speaking:', text.substring(0, 50))
        }

        utterance.onend = () => {
          setIsSpeaking(false)
          
          const neutralShapes = {
            jawOpen: 0.0,
            mouthSmile: facialExpression === 'smile' ? 0.3 : 0.0,
            mouthFunnel: 0.0
          }
          applyBlendShapesToAvatar(neutralShapes)
          startIdleAnimations()
          resolve()
        }

        utterance.onerror = (event) => {
          console.error('TTS error:', event.error)
          setIsSpeaking(false)
          startIdleAnimations()
          reject(new Error(`TTS error: ${event.error}`))
        }

        speechSynthesisRef.current = utterance
        speechSynthesis.speak(utterance)

      } catch (error) {
        console.error('Failed to initialize TTS:', error)
        setIsSpeaking(false)
        startIdleAnimations()
        reject(error)
      }
    })
  }, [audioEnabled, isSpeaking, getBestTTSVoice, applyBlendShapesToAvatar, startIdleAnimations, stopIdleAnimations])

  // Start voice recording
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
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }, [])

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  // Send voice message to API
  const sendVoiceMessage = useCallback(async (audioBlob: Blob) => {
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('childId', childId)
      if (accessCode) formData.append('accessCode', accessCode)

      const response = await fetch('/api/chat/voice', {
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
        timestamp: new Date(),
        isAudioPlaying: true,
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, userMessage, avatarMessage])
      
      if (avatarLoaded && audioEnabled) {
        if (data.audioUrl) {
          await playAudioWithLipSync(data.audioUrl, data.text)
        } else {
          await speakText(data.text, data.facialExpression)
        }
      }

    } catch (error) {
      console.error('Voice chat error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble with voice chat right now. Try typing your message instead!",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      if (avatarLoaded && audioEnabled) {
        await speakText(errorMessage.text, 'neutral')
      }
    } finally {
      setIsLoading(false)
    }
  }, [childId, accessCode, avatarLoaded, audioEnabled, playAudioWithLipSync, speakText])

  // Send text message
  const sendMessage = useCallback(async (message: string) => {
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
    onMessageSent?.(message.trim())

    try {
      const endpoint = chatMode === 'voice' ? '/api/chat/voice-text' : '/api/chat'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          childId,
          accessCode,
          mode: chatMode
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
        timestamp: new Date(),
        isAudioPlaying: true,
        audioUrl: data.audioUrl
      }

      setMessages(prev => [...prev, avatarMessage])
      
      if (avatarLoaded && audioEnabled) {
        if (chatMode === 'voice' && data.audioUrl) {
          await playAudioWithLipSync(data.audioUrl, data.text)
        } else {
          await speakText(data.text, data.facialExpression)
        }
      }

    } catch (error) {
      console.error('Chat API error:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Can you try again?",
        sender: 'avatar',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      
      if (avatarLoaded && audioEnabled) {
        await speakText(errorMessage.text, 'neutral')
      }
    } finally {
      setIsLoading(false)
    }
  }, [chatMode, childId, accessCode, isLoading, onMessageSent, avatarLoaded, audioEnabled, playAudioWithLipSync, speakText])

  // Start voice recognition
  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start()
    }
  }, [isListening])

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (chatMode === 'text') {
      sendMessage(inputMessage)
    } else if (chatMode === 'voice' && !isRecording && !isListening) {
      startVoiceRecognition()
    }
  }

  // Toggle chat mode
  const toggleChatMode = () => {
    setChatMode(prev => prev === 'text' ? 'voice' : 'text')
    setInputMessage('')
  }

  // Toggle audio
  const toggleAudio = () => {
    setAudioEnabled(prev => !prev)
    if (isSpeaking) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
      startIdleAnimations()
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesis.cancel()
      }
      stopIdleAnimations()
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
    }
  }, [stopIdleAnimations, isRecording])

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Header with mode toggle */}
      <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">
            🎭 Enhanced Avatar Chat
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${
                audioEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}
              title={audioEnabled ? 'Audio enabled' : 'Audio disabled'}
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
        <p className="text-sm text-gray-600">
          {chatMode === 'voice' 
            ? 'Your avatar uses Gemini Live AI and responds with natural voice & lip sync!'
            : 'Your avatar responds with voice and lip sync to your text messages!'
          }
        </p>
        {!avatarLoaded && (
          <p className="text-xs text-orange-600 mt-1">Loading 3D avatar...</p>
        )}
      </div>

      {/* 3D Avatar Display */}
      <div className="flex-shrink-0 h-80 bg-white shadow-sm m-4 rounded-lg overflow-hidden border-2 border-gray-200 relative">
        {avatarUrl ? (
          <SimpleAvatarViewer
            avatarUrl={avatarUrl}
            enableControls={false}
            cameraMode="headshot"
            onModelLoad={handleAvatarLoad}
            onModelError={(error) => {
              console.error('3D Avatar loading error:', error)
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">No 3D avatar available</p>
              <p className="text-xs text-gray-500 mt-1">Ask your educator to create one!</p>
            </div>
          </div>
        )}
        
        {/* Status indicators */}
        {(isSpeaking || isRecording || isListening) && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-2 animate-pulse">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <span>
              {isSpeaking ? 'Speaking...' : isRecording ? 'Recording...' : 'Listening...'}
            </span>
          </div>
        )}

        <div className="absolute top-4 left-4">
          {avatarLoaded ? (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>3D Ready</span>
            </div>
          ) : (
            <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>

        {/* Chat mode indicator */}
        <div className="absolute bottom-4 left-4">
          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
            chatMode === 'voice' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            {chatMode === 'voice' ? <Mic size={12} /> : <Type size={12} />}
            <span>{chatMode === 'voice' ? 'Voice Mode' : 'Text Mode'}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">Hi there! 👋</p>
              <p className="text-sm text-gray-500 mt-1">
                {chatMode === 'voice' 
                  ? 'Try voice chat with advanced Gemini Live AI!'
                  : 'Start chatting with your 3D avatar!'
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
                    : 'bg-white text-gray-800 shadow-sm border'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.sender === 'avatar' && message.isAudioPlaying && (
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600">
                        {message.audioUrl ? '🎵' : '🎤'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 shadow-sm border px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {chatMode === 'voice' ? 'AI processing...' : 'Avatar thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 bg-white border-t">
        {chatMode === 'text' ? (
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isSpeaking ? "Avatar is speaking..." : "Type your message..."}
              disabled={isLoading || isSpeaking}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading || isSpeaking}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
              placeholder="Tap microphone to speak or type here..."
              disabled={isRecording || isListening || isLoading || isSpeaking}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={inputMessage.trim() ? () => sendMessage(inputMessage) : startVoiceRecognition}
              disabled={isLoading || isSpeaking || isListening}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {inputMessage.trim() ? <Send size={16} /> : <Mic size={16} />}
            </button>
          </div>
        )}
        
        {(isSpeaking || isRecording || isListening) && (
          <div className="mt-2 flex items-center justify-center text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>
                {isSpeaking && '🎭 Avatar speaking with lip sync...'}
                {isRecording && '🎤 Recording your voice...'}
                {isListening && '👂 Listening for your speech...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedVoiceAvatarChatbot
