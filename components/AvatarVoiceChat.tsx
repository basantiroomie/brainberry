'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { SimpleAvatarViewer } from '@/components/SimpleAvatarViewer'
import { getLipsyncManager } from '@/lib/lipsync-manager'
import { BlendShapeTargets } from '@/types/avatar'
import { Object3D } from 'three'
import { Mic, MicOff, Volume2, VolumeX, ArrowLeft, Phone, PhoneOff } from 'lucide-react'

interface AvatarVoiceChatProps {
  avatarUrl: string
  childId?: string
  onBack?: () => void
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'speaking' | 'listening'

export const AvatarVoiceChat: React.FC<AvatarVoiceChatProps> = ({
  avatarUrl,
  childId = "test-child-123",
  onBack
}) => {
  // State management
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [isProcessing, setIsProcessing] = useState(false)
  const [avatarLoaded, setAvatarLoaded] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null)
  
  // Refs
  const avatarModelRef = useRef<Object3D | null>(null)
  const lipsyncManagerRef = useRef(getLipsyncManager())
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize audio context and analyzer for voice activity detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    return () => {
      cleanup()
    }
  }, [])

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
    
    console.log('🤖 Avatar loaded for voice chat with lipsync setup')
  }, [])

  // Apply blend shapes to avatar
  const applyBlendShapesToAvatar = useCallback((blendShapes: Partial<BlendShapeTargets>) => {
    if (!avatarModelRef.current) return

    avatarModelRef.current.traverse((child) => {
      if (child instanceof Object3D && (child as any).morphTargetDictionary && (child as any).morphTargetInfluences) {
        const mesh = child as any
        Object.entries(blendShapes).forEach(([key, value]) => {
          const index = mesh.morphTargetDictionary[key]
          if (typeof index === 'number' && typeof value === 'number') {
            mesh.morphTargetInfluences[index] = value
          }
        })
      }
    })
  }, [])

  // Cleanup function
  const cleanup = async () => {
    // End the session on the server
    try {
      const endFormData = new FormData()
      endFormData.append('childId', childId)
      endFormData.append('action', 'end')

      await fetch('/api/chat/voice-livekit', {
        method: 'POST',
        body: endFormData,
      })
      console.log('🎤 Voice session ended')
    } catch (error) {
      console.warn('🎤 Failed to end session:', error)
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    lipsyncManagerRef.current.stopProcessing()
  }

  // Start voice conversation
  const startVoiceConversation = async () => {
    try {
      setConnectionState('connecting')
      setError(null)
      
      console.log('🎤 Starting voice conversation...')

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording')
      }

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('Your browser does not support MediaRecorder')
      }

      console.log('🎤 Requesting microphone access...')

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      })
      
      console.log('🎤 Microphone access granted')
      streamRef.current = stream

      // Initialize session with the server
      const sessionFormData = new FormData()
      sessionFormData.append('audio', new Blob([], { type: 'audio/webm' })) // Empty blob for session start
      sessionFormData.append('childId', childId)
      sessionFormData.append('action', 'start')

      try {
        const sessionResponse = await fetch('/api/chat/voice-livekit', {
          method: 'POST',
          body: sessionFormData,
        })

        if (!sessionResponse.ok) {
          throw new Error('Failed to start voice session')
        }

        const sessionData = await sessionResponse.json()
        console.log('🎤 Voice session started:', sessionData.message || 'Ready')
      } catch (sessionError) {
        console.warn('🎤 Session initialization failed, continuing with fallback:', sessionError)
      }
      
      // Set up audio analysis for voice activity detection
      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        source.connect(analyserRef.current)
        
        console.log('🎤 Audio analysis setup complete')
        
        // Start voice activity detection
        startVoiceActivityDetection()
      }

      // Check MediaRecorder support with different mime types
      let mimeType = 'audio/webm'
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/wav')) {
          mimeType = 'audio/wav'
        } else {
          console.warn('🎤 No supported audio mime type found, using default')
          mimeType = ''
        }
      }

      console.log('🎤 Using mime type:', mimeType)

      // Set up MediaRecorder for continuous recording
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log('🎤 Audio data available, size:', event.data.size)
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('🎤 MediaRecorder stopped, processing chunks:', audioChunksRef.current.length)
        if (audioChunksRef.current.length > 0) {
          await processAudioChunk()
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('🎤 MediaRecorder error:', event)
        setError('Recording error occurred')
      }

      // Start continuous recording in chunks
      console.log('🎤 Starting continuous recording...')
      startContinuousRecording()
      
      setConnectionState('connected')
      setSessionStartTime(new Date())
      
      console.log('🎤 Voice conversation started successfully')

    } catch (error) {
      console.error('❌ Failed to start voice conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to access microphone: ${errorMessage}`)
      setConnectionState('disconnected')
    }
  }

  // Start continuous recording in time-based chunks
  const startContinuousRecording = () => {
    if (!mediaRecorderRef.current) return

    const recordChunk = () => {
      // Check if we should continue recording (not disconnected and mediaRecorder exists)
      if (mediaRecorderRef.current && streamRef.current && streamRef.current.active) {
        audioChunksRef.current = [] // Clear previous chunks
        
        try {
          mediaRecorderRef.current.start()
          console.log('🎤 Starting new audio chunk recording')
          
          // Record for 3 seconds, then process
          setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop()
              console.log('🎤 Stopping audio chunk recording')
              
              // Start next chunk after a brief pause (only if still connected)
              setTimeout(() => {
                if (streamRef.current && streamRef.current.active) {
                  recordChunk()
                }
              }, 100)
            }
          }, 3000)
        } catch (error) {
          console.error('❌ Error starting MediaRecorder:', error)
          setError('Recording failed. Please try again.')
          setConnectionState('disconnected')
        }
      }
    }

    recordChunk()
  }

  // Voice activity detection
  const startVoiceActivityDetection = () => {
    if (!analyserRef.current) return

    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const detectVoiceActivity = () => {
      // Only continue if we have an active analyser and stream
      if (!analyserRef.current || !streamRef.current || !streamRef.current.active) return

      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average amplitude
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
      
      // Update connection state based on voice activity (only if connected or listening)
      if (average > 20 && connectionState === 'connected') {
        setConnectionState('listening')
      } else if (average <= 20 && connectionState === 'listening') {
        setConnectionState('connected')
      }

      animationFrameRef.current = requestAnimationFrame(detectVoiceActivity)
    }

    detectVoiceActivity()
  }

  // Process audio chunk and send to Gemini Live
  const processAudioChunk = async () => {
    if (audioChunksRef.current.length === 0 || !audioEnabled) {
      console.log('🎤 Skipping audio processing: no chunks or audio disabled')
      return
    }

    try {
      setIsProcessing(true)
      setConnectionState('speaking')

      // Create audio blob from chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })

      // Skip if audio is too small (likely silence)
      if (audioBlob.size < 1000) {
        console.log('🎤 Skipping small audio chunk:', audioBlob.size, 'bytes')
        setConnectionState('connected')
        setIsProcessing(false)
        return
      }

      console.log('🎤 Processing audio chunk, size:', audioBlob.size, 'bytes')

      // Send to Gemini Live Continuous API
      const formData = new FormData()
      formData.append('audio', audioBlob)
      formData.append('childId', childId)

      console.log('🎤 Sending audio to API...')
      const response = await fetch('/api/chat/voice-livekit', {
        method: 'POST',
        body: formData
      })

      console.log('🎤 API Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('🎤 API Error response:', errorText)
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      console.log('🎤 API Response data:', data)

      if (data.success && data.text) {
        console.log('🤖 Avatar response:', data.text.substring(0, 50) + '...')
        
        // Check if we have audio data from Gemini Live
        if (data.hasAudio && data.audioData && data.audioMimeType) {
          console.log('🔊 Playing Gemini Live audio response')
          await playGeminiAudioResponse(data.audioData, data.audioMimeType)
        } else {
          console.log('🔊 No audio from Gemini Live, using browser TTS fallback')
          // Fallback to browser TTS if no audio from Gemini Live
          if (audioEnabled && avatarModelRef.current) {
            await playAvatarVoiceResponse(data.text)
          }
        }
      } else {
        console.warn('🎤 No valid response from API:', data)
      }

    } catch (error) {
      console.error('❌ Error processing audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to process voice input: ${errorMessage}`)
    } finally {
      setIsProcessing(false)
      if (streamRef.current && streamRef.current.active) {
        setConnectionState('connected')
      } else {
        setConnectionState('disconnected')
      }
    }
  }

  // Play Gemini Live audio response with lip-sync
  const playGeminiAudioResponse = async (audioData: string, mimeType: string) => {
    try {
      console.log('🔊 Processing Gemini Live audio response')
      
      // Convert base64 audio data to blob
      const audioBytes = atob(audioData)
      const audioArray = new Uint8Array(audioBytes.length)
      for (let i = 0; i < audioBytes.length; i++) {
        audioArray[i] = audioBytes.charCodeAt(i)
      }
      const audioBlob = new Blob([audioArray], { type: mimeType })
      const audioUrl = URL.createObjectURL(audioBlob)
      
      // Create audio element and play
      const audio = new Audio(audioUrl)
      
      // Set up lip-sync with the audio
      if (avatarModelRef.current) {
        audio.onplay = () => {
          console.log('🎵 Starting Gemini Live audio playback with lip-sync')
          // Start lip-sync animation with the audio file
          lipsyncManagerRef.current.processAudioFile(audioUrl)
        }
        
        audio.onended = () => {
          console.log('🎵 Gemini Live audio playback completed')
          lipsyncManagerRef.current.stopProcessing()
          // Clean up the blob URL
          URL.revokeObjectURL(audioUrl)
        }
        
        audio.onerror = (error) => {
          console.error('🔊 Gemini Live audio playback error:', error)
          lipsyncManagerRef.current.stopProcessing()
          URL.revokeObjectURL(audioUrl)
        }
      }
      
      // Play the audio
      await audio.play()
      
      // Return a promise that resolves when audio ends
      return new Promise<void>((resolve) => {
        audio.onended = () => {
          lipsyncManagerRef.current.stopProcessing()
          URL.revokeObjectURL(audioUrl)
          resolve()
        }
      })
      
    } catch (error) {
      console.error('❌ Error playing Gemini Live audio:', error)
      throw error
    }
  }

  // Play avatar voice response with lip-sync (Browser TTS fallback)
  const playAvatarVoiceResponse = async (text: string) => {
    try {
      console.log('🔊 Playing avatar voice response with browser TTS')
      
      // Use browser speech synthesis for immediate feedback
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.1
      utterance.volume = audioEnabled ? 1.0 : 0.0

      // Start lip-sync animation
      lipsyncManagerRef.current.processSpeechSynthesis(utterance)
      
      // Speak the response
      speechSynthesis.speak(utterance)

      return new Promise<void>((resolve) => {
        utterance.onend = () => {
          lipsyncManagerRef.current.stopProcessing()
          resolve()
        }
      })

    } catch (error) {
      console.error('❌ Error playing avatar response:', error)
    }
  }

  // End voice conversation
  const endVoiceConversation = () => {
    console.log('🎤 Ending voice conversation')
    
    cleanup()
    setConnectionState('disconnected')
    setSessionStartTime(null)
    setError(null)
  }

  // Format session duration
  const getSessionDuration = (): string => {
    if (!sessionStartTime) return '00:00'
    
    const now = new Date()
    const diff = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // Update session timer
  useEffect(() => {
    if (sessionStartTime) {
      const interval = setInterval(() => {
        // Force re-render to update timer
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [sessionStartTime])

  return (
    <div className="h-full bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">Voice Chat</h1>
          {sessionStartTime && (
            <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              {getSessionDuration()}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 rounded-lg transition-colors ${
            audioEnabled 
              ? 'text-purple-600 hover:bg-purple-100' 
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
                connectionState === 'speaking' ? 'bg-green-500 animate-pulse' :
                connectionState === 'listening' ? 'bg-blue-500 animate-pulse' :
                connectionState === 'connected' ? 'bg-purple-500' :
                connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                avatarLoaded ? 'bg-gray-400' : 'bg-gray-300'
              }`} />
              <span className="text-sm text-gray-600 capitalize">
                {connectionState === 'speaking' ? 'Speaking...' :
                 connectionState === 'listening' ? 'Listening...' :
                 connectionState === 'connected' ? 'Ready' :
                 connectionState === 'connecting' ? 'Connecting...' :
                 avatarLoaded ? 'Ready to start' : 'Loading...'}
              </span>
            </div>

            {/* Voice Activity Indicator */}
            {connectionState === 'listening' && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls Section - Increased width */}
        <div className="w-3/5 p-4 flex flex-col">
          <div className="bg-white rounded-2xl shadow-xl flex flex-col h-full">
            {/* Status Display */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center">
              {error ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MicOff className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-red-600 mb-2">Connection Error</h3>
                  <p className="text-sm text-red-500 mb-4">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ) : connectionState === 'disconnected' ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Ready to Chat</h3>
                  <p className="text-gray-600 mb-6 max-w-sm text-sm">
                    Start a continuous voice conversation with your avatar. 
                    Speak naturally and the avatar will respond in real-time.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    connectionState === 'speaking' ? 'bg-green-100' :
                    connectionState === 'listening' ? 'bg-blue-100' :
                    'bg-purple-100'
                  }`}>
                    <Mic className={`w-10 h-10 ${
                      connectionState === 'speaking' ? 'text-green-600' :
                      connectionState === 'listening' ? 'text-blue-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    {connectionState === 'speaking' ? 'Avatar Speaking' :
                     connectionState === 'listening' ? 'Listening to You' :
                     connectionState === 'connecting' ? 'Connecting...' :
                     'Voice Chat Active'}
                  </h3>
                  <p className="text-gray-600 max-w-sm text-sm">
                    {connectionState === 'speaking' ? 'The avatar is responding to your message...' :
                     connectionState === 'listening' ? 'Speak naturally, your avatar is listening...' :
                     connectionState === 'connecting' ? 'Setting up voice connection...' :
                     'Speak naturally to continue the conversation'}
                  </p>
                  {isProcessing && (
                    <div className="mt-4 text-sm text-gray-500">
                      Processing your voice...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Control Buttons */}
            <div className="p-4 border-t border-gray-100 flex-shrink-0">
              <div className="flex justify-center">
                {connectionState === 'disconnected' ? (
                  <button
                    onClick={startVoiceConversation}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <Phone className="w-5 h-5" />
                    Start Voice Chat
                  </button>
                ) : (
                  <button
                    onClick={endVoiceConversation}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Voice Chat
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarVoiceChat
