"use client"

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'

interface BreathingBuddyProps {
  onBack: () => void
}

type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'rest'

interface BreathingPattern {
  name: string
  color: string
  phases: { phase: BreathingPhase; duration: number; instruction: string }[]
}

const breathingPatterns: BreathingPattern[] = [
  {
    name: 'Calm Breathing',
    color: 'bg-blue-400',
    phases: [
      { phase: 'inhale', duration: 4, instruction: 'Breathe in slowly...' },
      { phase: 'exhale', duration: 4, instruction: 'Breathe out gently...' },
    ]
  },
  {
    name: 'Box Breathing',
    color: 'bg-green-400',
    phases: [
      { phase: 'inhale', duration: 4, instruction: 'Breathe in...' },
      { phase: 'hold', duration: 4, instruction: 'Hold your breath...' },
      { phase: 'exhale', duration: 4, instruction: 'Breathe out...' },
      { phase: 'rest', duration: 4, instruction: 'Rest and relax...' },
    ]
  },
  {
    name: 'Quick Calm',
    color: 'bg-purple-400',
    phases: [
      { phase: 'inhale', duration: 3, instruction: 'Quick breath in...' },
      { phase: 'exhale', duration: 6, instruction: 'Long breath out...' },
    ]
  }
]

export default function BreathingBuddy({ onBack }: BreathingBuddyProps) {
  const [selectedPattern, setSelectedPattern] = useState(breathingPatterns[0])
  const [isActive, setIsActive] = useState(false)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [completedRounds, setCompletedRounds] = useState(0)
  const [breathingScore, setBreathingScore] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<HTMLDivElement>(null)

  const currentPhase = selectedPattern.phases[currentPhaseIndex]

  useEffect(() => {
    if (isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next phase
            setCurrentPhaseIndex(prevIndex => {
              const nextIndex = (prevIndex + 1) % selectedPattern.phases.length
              if (nextIndex === 0) {
                // Completed a full round
                setCompletedRounds(prev => {
                  const newCompleted = prev + 1
                  setBreathingScore(prevScore => prevScore + 10)
                  
                  if (newCompleted >= totalRounds && totalRounds > 0) {
                    // Session complete
                    setIsActive(false)
                    return newCompleted
                  }
                  return newCompleted
                })
              }
              return nextIndex
            })
            return selectedPattern.phases[(currentPhaseIndex + 1) % selectedPattern.phases.length].duration
          }
          return prev - 1
        })
      }, 1000)
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive, timeRemaining, currentPhaseIndex, selectedPattern, totalRounds])

  const startBreathing = (rounds: number = 0) => {
    setIsActive(true)
    setCurrentPhaseIndex(0)
    setTimeRemaining(selectedPattern.phases[0].duration)
    setCompletedRounds(0)
    setTotalRounds(rounds)
    setBreathingScore(0)
  }

  const stopBreathing = () => {
    setIsActive(false)
    setCurrentPhaseIndex(0)
    setTimeRemaining(0)
  }

  const resetSession = () => {
    setIsActive(false)
    setCurrentPhaseIndex(0)
    setTimeRemaining(0)
    setCompletedRounds(0)
    setTotalRounds(0)
    setBreathingScore(0)
  }

  const getCircleScale = () => {
    if (!isActive) return 'scale-100'
    
    switch (currentPhase?.phase) {
      case 'inhale':
        return 'scale-150'
      case 'exhale':
        return 'scale-75'
      case 'hold':
        return 'scale-150'
      case 'rest':
        return 'scale-100'
      default:
        return 'scale-100'
    }
  }

  const getCircleColor = () => {
    if (!isActive) return 'bg-gray-300'
    
    switch (currentPhase?.phase) {
      case 'inhale':
        return 'bg-blue-400'
      case 'exhale':
        return 'bg-green-400'
      case 'hold':
        return 'bg-purple-400'
      case 'rest':
        return 'bg-yellow-400'
      default:
        return 'bg-gray-300'
    }
  }

  const getPhaseEmoji = (phase: BreathingPhase) => {
    switch (phase) {
      case 'inhale': return '🌬️'
      case 'exhale': return '😮‍💨'
      case 'hold': return '🫁'
      case 'rest': return '😌'
      default: return '💨'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6">
      <div className="max-w-4xl mx-auto">
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
            <div className="bg-green-500 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              BREATHING BUDDY
            </div>
          </div>
        </div>

        {/* Stats */}
        {(completedRounds > 0 || breathingScore > 0) && (
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-blue-100 border-2 border-black p-4">
                <div className="text-2xl font-bold text-blue-600">{completedRounds}</div>
                <div className="text-sm font-medium">Rounds Completed</div>
              </div>
              <div className="bg-green-100 border-2 border-black p-4">
                <div className="text-2xl font-bold text-green-600">{breathingScore}</div>
                <div className="text-sm font-medium">Calm Points</div>
              </div>
              <div className="bg-purple-100 border-2 border-black p-4">
                <div className="text-2xl font-bold text-purple-600">{selectedPattern.name}</div>
                <div className="text-sm font-medium">Current Pattern</div>
              </div>
            </div>
          </div>
        )}

        {/* Breathing Circle */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="relative mx-auto w-64 h-64 flex items-center justify-center">
              <div
                ref={animationRef}
                className={`w-48 h-48 rounded-full border-4 border-black transition-all duration-1000 ease-in-out ${getCircleColor()} ${getCircleScale()}`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">
                      {isActive ? getPhaseEmoji(currentPhase.phase) : '😊'}
                    </div>
                    <div className="text-2xl font-bold">
                      {isActive ? timeRemaining : 'Ready'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {isActive && (
              <div className="mt-6">
                <h3 className="text-xl font-bold mb-2 capitalize">
                  {currentPhase.phase}
                </h3>
                <p className="text-gray-600 text-lg">
                  {currentPhase.instruction}
                </p>
                {totalRounds > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Round {completedRounds + 1} of {totalRounds}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pattern Selection */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Pattern</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {breathingPatterns.map((pattern) => (
              <button
                key={pattern.name}
                onClick={() => setSelectedPattern(pattern)}
                className={`p-4 border-4 border-black shadow-brutal hover:shadow-brutal-lg transition-all ${
                  selectedPattern.name === pattern.name ? pattern.color : 'bg-gray-100'
                }`}
              >
                <h3 className="font-bold mb-2">{pattern.name}</h3>
                <div className="text-sm space-y-1">
                  {pattern.phases.map((phase, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="capitalize">{phase.phase}:</span>
                      <span>{phase.duration}s</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">Breathing Session</h2>
            
            {!isActive ? (
              <div className="space-y-4">
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => startBreathing()}
                    className="bg-blue-500 text-white px-8 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    FREE BREATHING
                  </button>
                  <button
                    onClick={() => startBreathing(5)}
                    className="bg-green-500 text-white px-8 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                  >
                    5 ROUNDS
                  </button>
                  <button
                    onClick={() => startBreathing(10)}
                    className="bg-purple-500 text-white px-8 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
                  >
                    10 ROUNDS
                  </button>
                </div>
                
                {(completedRounds > 0 || breathingScore > 0) && (
                  <button
                    onClick={resetSession}
                    className="bg-gray-500 text-white px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center mx-auto"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    RESET
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={stopBreathing}
                className="bg-red-500 text-white px-8 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold flex items-center mx-auto"
              >
                <Pause className="h-5 w-5 mr-2" />
                STOP
              </button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-100 border-4 border-black shadow-brutal-xl p-6 mt-6">
          <h3 className="text-xl font-bold mb-2">How to Use Breathing Buddy:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Choose a breathing pattern that feels good for you</li>
            <li>Select free breathing or set a specific number of rounds</li>
            <li>Follow the circle as it grows and shrinks with your breathing</li>
            <li>Read the instructions and breathe at your own comfortable pace</li>
            <li>Earn calm points for each round you complete!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
