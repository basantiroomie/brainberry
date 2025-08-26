"use client"

import { useState, useEffect } from 'react'
import { Wand2, Heart, Star, Palette, Play, Clock, CheckCircle } from 'lucide-react'

interface PersonalizationStepProps {
  moldId: string
  childId: string
  onComplete: (personalizedMoldId: string) => void
  onBack?: () => void
}

export default function MoldPersonalizationWizard({ moldId, childId, onComplete, onBack }: PersonalizationStepProps) {
  const [step, setStep] = useState(1)
  const [prompt, setPrompt] = useState('')
  const [requestId, setRequestId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'generating' | 'complete' | 'error'>('idle')
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [personalizedMoldId, setPersonalizedMoldId] = useState<string | null>(null)

  const promptSuggestions = [
    "My favorite animals like cats, dogs, and elephants",
    "My family members - Mom, Dad, and my little sister",
    "My favorite toys like teddy bears, cars, and building blocks",
    "Foods I love like pizza, ice cream, and apples",
    "My favorite cartoon characters and superheroes"
  ]

  async function submitCustomizationRequest() {
    if (!prompt.trim()) return

    setStatus('submitting')
    
    try {
      const response = await fetch('/api/customization-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          mold_id: moldId,
          prompt: prompt.trim(),
          target_elements: {
            card_images: true,
            card_labels: true,
            sounds: true,
            colors: true
          }
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setRequestId(data.request_id)
        setStatus('generating')
        setStep(3)
        
        // Poll for completion
        pollRequestStatus(data.request_id)
      } else {
        setStatus('error')
        console.error('Request failed:', data.error)
      }
    } catch (error) {
      setStatus('error')
      console.error('Request error:', error)
    }
  }

  async function pollRequestStatus(requestId: string) {
    const maxAttempts = 20 // 1 minute max wait
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch(`/api/customization-requests?request_id=${requestId}`)
        const data = await response.json()

        if (data.status === 'complete') {
          setGeneratedContent(data.result)
          setStatus('complete')
          setStep(4)
          
          // Store the personalization_id from the customization request
          if (data.personalization_id) {
            setPersonalizedMoldId(data.personalization_id)
          } else {
            console.error('No personalization_id found in completed request')
            // Log the full response for debugging
            console.log('Full response data:', data)
          }
          
        } else if (data.status === 'failed') {
          setStatus('error')
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 3000) // Poll every 3 seconds
        } else {
          setStatus('error')
        }
      } catch (error) {
        console.error('Polling error:', error)
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 3000)
        } else {
          setStatus('error')
        }
      }
    }

    poll()
  }

  if (step === 1) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="bg-chart-3 text-white p-4 border-4 border-black shadow-brutal-xl inline-block transform -rotate-1 mb-6">
            <Wand2 className="h-8 w-8 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Let's Make This Game Yours!</h2>
          </div>
          <p className="text-lg text-gray-700">
            Tell me what you'd like to see on the cards, and I'll create a special game just for you!
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-lg font-bold mb-3">What would you like your cards to show?</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell me about your favorite things..."
              className="w-full p-4 border-4 border-black shadow-brutal text-lg h-32 resize-none"
              maxLength={200}
            />
            <div className="text-sm text-gray-500 mt-1">{prompt.length}/200 characters</div>
          </div>

          <div>
            <p className="font-bold mb-3">Need ideas? Try these:</p>
            <div className="grid gap-2">
              {promptSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="text-left p-3 border-2 border-gray-300 hover:border-chart-3 hover:bg-chart-3/10 transition-all text-sm"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-black bg-gray-200 hover:bg-gray-300 font-bold"
            >
              Back
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!prompt.trim()}
              className="px-8 py-3 bg-chart-1 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Heart className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Perfect! Here's what you told me:</h2>
          <div className="bg-yellow-100 border-4 border-black p-4 shadow-brutal">
            <p className="text-lg italic">"{prompt}"</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border-4 border-black p-6 shadow-brutal">
            <h3 className="font-bold mb-3 flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              I'm going to create:
            </h3>
            <ul className="space-y-2 text-sm">
              <li>✨ 8 special card pairs with your favorite things</li>
              <li>🎨 Colors and designs that match your style</li>
              <li>🔊 Fun sounds when you make matches</li>
              <li>🎉 A special celebration just for you</li>
            </ul>
          </div>

          <div className="text-center">
            <p className="text-lg mb-6">Ready to create your magical game?</p>
            
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-black bg-gray-200 hover:bg-gray-300 font-bold"
              >
                Change My Ideas
              </button>
              <button
                onClick={submitCustomizationRequest}
                disabled={status === 'submitting'}
                className="px-8 py-3 bg-green-500 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold disabled:opacity-50 flex items-center space-x-2"
              >
                <Wand2 className="h-5 w-5" />
                <span>{status === 'submitting' ? 'Creating...' : 'Create My Game!'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-2xl mx-auto text-center">
        <div className="animate-spin h-16 w-16 border-4 border-chart-3 border-t-transparent rounded-full mx-auto mb-6"></div>
        
        <h2 className="text-2xl font-bold mb-4">✨ Creating Your Magic Game ✨</h2>
        
        <div className="space-y-4 text-lg">
          <div className="flex items-center justify-center space-x-3">
            <Clock className="h-6 w-6 text-blue-500" />
            <span>Drawing your special pictures...</span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Star className="h-6 w-6 text-yellow-500" />
            <span>Picking perfect colors...</span>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <Heart className="h-6 w-6 text-red-500" />
            <span>Adding magical sounds...</span>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-100 border-4 border-black shadow-brutal">
          <p className="text-sm">This usually takes about 30 seconds. Your game will be amazing!</p>
        </div>
      </div>
    )
  }

  if (step === 4 && status === 'complete') {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-2xl mx-auto text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
        
        <h2 className="text-3xl font-bold mb-4">🎉 Your Game is Ready! 🎉</h2>
        
        {generatedContent && (
          <div className="space-y-6">
            <div className="bg-green-50 border-4 border-black p-6 shadow-brutal">
              <h3 className="font-bold mb-3">Your "{generatedContent.theme}" themed game includes:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>🎨 Custom card images</div>
                <div>🎵 Special sounds</div>
                <div>🌈 Your favorite colors</div>
                <div>⭐ Personal celebration</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                // Pass the personalized mold ID to parent component
                if (generatedContent) {
                  onComplete(personalizedMoldId || '')
                }
              }}
              className="px-8 py-4 bg-chart-1 text-white border-4 border-black shadow-brutal-xl hover:shadow-brutal font-bold text-xl flex items-center space-x-3 mx-auto transform hover:scale-105 transition-all"
            >
              <Play className="h-6 w-6" />
              <span>Play My Game!</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 max-w-2xl mx-auto text-center">
        <div className="text-red-500 text-6xl mb-4">😞</div>
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p className="text-lg mb-6">Don't worry, let's try again!</p>
        
        <button
          onClick={() => {
            setStep(1)
            setStatus('idle')
            setPrompt('')
            setRequestId(null)
          }}
          className="px-6 py-3 bg-chart-1 text-white border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
        >
          Try Again
        </button>
      </div>
    )
  }

  return null
}
