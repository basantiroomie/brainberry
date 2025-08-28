"use client"

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface MusicMakerProps {
  onBack: () => void
}

interface Sound {
  id: string
  name: string
  color: string
  frequency: number
  type: 'sine' | 'square' | 'triangle' | 'sawtooth'
}

const sounds: Sound[] = [
  { id: 'c', name: 'C', color: 'bg-red-400', frequency: 261.63, type: 'sine' },
  { id: 'd', name: 'D', color: 'bg-orange-400', frequency: 293.66, type: 'sine' },
  { id: 'e', name: 'E', color: 'bg-yellow-400', frequency: 329.63, type: 'sine' },
  { id: 'f', name: 'F', color: 'bg-green-400', frequency: 349.23, type: 'sine' },
  { id: 'g', name: 'G', color: 'bg-blue-400', frequency: 392.00, type: 'sine' },
  { id: 'a', name: 'A', color: 'bg-indigo-400', frequency: 440.00, type: 'sine' },
  { id: 'b', name: 'B', color: 'bg-purple-400', frequency: 493.88, type: 'sine' },
  { id: 'c2', name: 'C2', color: 'bg-pink-400', frequency: 523.25, type: 'sine' },
]

const drumSounds: Sound[] = [
  { id: 'kick', name: 'Kick', color: 'bg-gray-600', frequency: 60, type: 'sine' },
  { id: 'snare', name: 'Snare', color: 'bg-gray-500', frequency: 200, type: 'square' },
  { id: 'hihat', name: 'Hi-Hat', color: 'bg-gray-400', frequency: 800, type: 'triangle' },
  { id: 'cymbal', name: 'Cymbal', color: 'bg-gray-300', frequency: 1200, type: 'sawtooth' },
]

export default function MusicMaker({ onBack }: MusicMakerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPattern, setCurrentPattern] = useState<string[]>([])
  const [volume, setVolume] = useState(0.5)
  const [isMuted, setIsMuted] = useState(false)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const playbackRef = useRef<NodeJS.Timeout | null>(null)
  const [patternIndex, setPatternIndex] = useState(0)

  useEffect(() => {
    // Initialize Web Audio API
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playSound = (sound: Sound, duration: number = 0.3) => {
    if (!audioContextRef.current || isMuted) return

    const context = audioContextRef.current
    const oscillator = context.createOscillator()
    const gainNode = context.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(context.destination)

    oscillator.frequency.setValueAtTime(sound.frequency, context.currentTime)
    oscillator.type = sound.type

    gainNode.gain.setValueAtTime(0, context.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume * 0.3, context.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)

    oscillator.start(context.currentTime)
    oscillator.stop(context.currentTime + duration)

    setActiveKey(sound.id)
    setTimeout(() => setActiveKey(null), 200)
  }

  const addToPattern = (soundId: string) => {
    setCurrentPattern(prev => [...prev, soundId])
  }

  const clearPattern = () => {
    setCurrentPattern([])
    setIsPlaying(false)
    if (playbackRef.current) {
      clearInterval(playbackRef.current)
    }
  }

  const playPattern = () => {
    if (currentPattern.length === 0) return

    setIsPlaying(true)
    setPatternIndex(0)

    playbackRef.current = setInterval(() => {
      setPatternIndex(prev => {
        const nextIndex = prev + 1
        if (nextIndex >= currentPattern.length) {
          setIsPlaying(false)
          if (playbackRef.current) {
            clearInterval(playbackRef.current)
          }
          return 0
        }
        
        // Play the sound at the current index
        const soundId = currentPattern[nextIndex]
        const sound = [...sounds, ...drumSounds].find(s => s.id === soundId)
        if (sound) {
          playSound(sound, 0.2)
        }
        
        return nextIndex
      })
    }, 400)

    // Play first sound immediately
    const sound = [...sounds, ...drumSounds].find(s => s.id === currentPattern[0])
    if (sound) {
      playSound(sound, 0.2)
    }
  }

  const stopPattern = () => {
    setIsPlaying(false)
    if (playbackRef.current) {
      clearInterval(playbackRef.current)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={onBack}
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            BACK
          </button>
          <div className="inline-block transform -rotate-1">
            <div className="bg-purple-500 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              MUSIC MAKER
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <button
              onClick={isPlaying ? stopPattern : playPattern}
              disabled={currentPattern.length === 0}
              className={`flex items-center px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold ${
                currentPattern.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
              {isPlaying ? 'STOP' : 'PLAY'}
            </button>
            
            <button
              onClick={clearPattern}
              className="bg-red-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
            >
              CLEAR
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-24"
                disabled={isMuted}
              />
            </div>
          </div>

          {/* Pattern Display */}
          <div className="bg-gray-100 border-2 border-black p-4 min-h-16">
            <h3 className="font-bold mb-2">Your Pattern:</h3>
            <div className="flex flex-wrap gap-2">
              {currentPattern.map((soundId, index) => {
                const sound = [...sounds, ...drumSounds].find(s => s.id === soundId)
                return (
                  <div
                    key={index}
                    className={`px-3 py-1 border-2 border-black text-sm font-bold ${
                      sound?.color || 'bg-gray-300'
                    } ${index === patternIndex && isPlaying ? 'ring-4 ring-yellow-400' : ''}`}
                  >
                    {sound?.name || soundId}
                  </div>
                )
              })}
              {currentPattern.length === 0 && (
                <p className="text-gray-500 italic">Click the keys below to create your pattern!</p>
              )}
            </div>
          </div>
        </div>

        {/* Piano Keys */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Piano Keys</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {sounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => {
                  playSound(sound)
                  addToPattern(sound.id)
                }}
                className={`h-20 border-4 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-white text-lg ${
                  sound.color
                } ${activeKey === sound.id ? 'transform scale-95' : ''}`}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>

        {/* Drum Pads */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Drum Pads</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {drumSounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => {
                  playSound(sound, 0.1)
                  addToPattern(sound.id)
                }}
                className={`h-24 border-4 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold text-white text-lg ${
                  sound.color
                } ${activeKey === sound.id ? 'transform scale-95' : ''}`}
              >
                {sound.name}
              </button>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-100 border-4 border-black shadow-brutal-xl p-6 mt-6">
          <h3 className="text-xl font-bold mb-2">How to Play:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Click piano keys or drum pads to hear sounds and add them to your pattern</li>
            <li>Watch your pattern grow in the display above</li>
            <li>Press PLAY to hear your pattern played back</li>
            <li>Use CLEAR to start over with a new pattern</li>
            <li>Adjust volume or mute with the controls</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
