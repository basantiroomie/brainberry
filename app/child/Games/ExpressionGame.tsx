"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Play, RotateCcw, Trophy } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import face-api to avoid SSR issues
const loadFaceApi = () => import('face-api.js')

interface ExpressionGameProps {
  onBack: () => void
}

type GamePhase = 'loading' | 'expression' | 'quiz' | 'complete'
type Expression = 'happy' | 'sad' | 'angry' | 'surprised'

interface ExpressionImage {
  emotion: Expression
  imageUrl: string
  detected?: boolean
}

interface QuizQuestion {
  imageUrl: string
  correctEmotion: Expression
  selectedEmotion?: Expression
}

export default function ExpressionGame({ onBack }: ExpressionGameProps) {
  const [phase, setPhase] = useState<GamePhase>('loading')
  const [expressions, setExpressions] = useState<ExpressionImage[]>([])
  const [currentExpressionIndex, setCurrentExpressionIndex] = useState(0)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Preparing your expression game...')
  const [neutralBaseline, setNeutralBaseline] = useState<any>(null)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [faceApiLoaded, setFaceApiLoaded] = useState(false)
  const [currentDetectedExpression, setCurrentDetectedExpression] = useState<string>('neutral')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [faceapi, setFaceapi] = useState<any>(null)

  // Initialize face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceApiModule = await loadFaceApi()
        setFaceapi(faceApiModule)
        
        const MODEL_URL = '/models'
        
        await Promise.all([
          faceApiModule.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceApiModule.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          faceApiModule.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ])
        
        setFaceApiLoaded(true)
      } catch (error) {
        console.error('Error loading face-api models:', error)
        setFaceApiLoaded(false)
      }
    }

    loadModels()
  }, [])

  // Start webcam
  const startWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing webcam:', error)
    }
  }, [])

  // Stop webcam
  const stopWebcam = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  // Establish neutral facial expression baseline
  const establishNeutralBaseline = useCallback(async () => {
    if (!faceApiLoaded || !videoRef.current || !faceapi) return

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceExpressions()

      if (detections) {
        setNeutralBaseline(detections.expressions)
      }
    } catch (error) {
      console.error('Error establishing neutral baseline:', error)
    }
  }, [faceApiLoaded, faceapi])

  // Load static expression images
  const loadExpressionImages = async () => {
    try {
      setLoadingMessage('Loading expression images...')
      setLoadingProgress(50)

      const response = await fetch('/api/generate-expression-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          emotions: ['happy', 'sad', 'angry', 'surprised']
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to load images: ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success || !data.images) {
        throw new Error('Invalid response from server')
      }

      const expressionImages: ExpressionImage[] = data.images.map((img: any) => ({
        emotion: img.expression,
        imageUrl: img.imageUrl,
        detected: false
      }))

      setExpressions(expressionImages)
      setQuizQuestions(expressionImages.map(img => ({
        imageUrl: img.imageUrl,
        correctEmotion: img.emotion
      })))

      setLoadingProgress(100)
      setLoadingMessage('Ready to play!')

      setTimeout(() => {
        setPhase('expression')
        startWebcam()
      }, 1000)

    } catch (error) {
      console.error('Error loading expression images:', error)
      setLoadingMessage(`Error: ${error instanceof Error ? error.message : 'Failed to load images'}`)
    }
  }

  // Detect facial expressions in real-time
  const detectExpression = useCallback(async () => {
    if (!videoRef.current || !isDetecting || !faceApiLoaded || !faceapi) return

    try {
      const detections = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceExpressions()

      if (detections) {
        const currentExpressions = detections.expressions
        const targetEmotion = expressions[currentExpressionIndex]?.emotion

        // Find the strongest expression for display
        const strongestExpression = Object.entries(currentExpressions)
          .reduce((max, [emotion, value]) => 
            (typeof value === 'number' && value > max.value) ? { emotion, value } : max, 
            { emotion: 'neutral', value: 0 }
          )
        
        setCurrentDetectedExpression(strongestExpression.emotion)

        if (neutralBaseline) {
          const expressionIntensity = calculateExpressionIntensity(
            currentExpressions, 
            neutralBaseline, 
            targetEmotion
          )

          if (expressionIntensity > 0.4) {
            handleExpressionDetected()
          }
        } else {
          const emotionMap: Record<Expression, string> = {
            happy: 'happy',
            sad: 'sad', 
            angry: 'angry',
            surprised: 'surprised'
          }
          const targetKey = emotionMap[targetEmotion] as keyof typeof currentExpressions
          const currentValue = typeof currentExpressions[targetKey] === 'number' ? currentExpressions[targetKey] : 0
          
          if (typeof currentValue === 'number' && currentValue > 0.5) {
            handleExpressionDetected()
          }
        }
      } else {
        setCurrentDetectedExpression('no face detected')
      }
    } catch (error) {
      console.error('Error detecting expression:', error)
      setCurrentDetectedExpression('detection error')
    }
  }, [faceApiLoaded, faceapi, isDetecting, expressions, currentExpressionIndex, neutralBaseline])

  // Calculate expression intensity relative to baseline
  const calculateExpressionIntensity = (
    current: any, 
    baseline: any, 
    targetEmotion: Expression
  ): number => {
    const emotionMap: Record<Expression, string> = {
      happy: 'happy',
      sad: 'sad', 
      angry: 'angry',
      surprised: 'surprised'
    }

    const targetKey = emotionMap[targetEmotion]
    const currentValue = current[targetKey] || 0
    const baselineValue = baseline[targetKey] || 0

    return Math.max(0, currentValue - baselineValue - 0.2)
  }

  // Handle expression detection
  const handleExpressionDetected = () => {
    setIsDetecting(false)
    
    // Mark current expression as detected
    setExpressions(prev => prev.map((exp, index) => 
      index === currentExpressionIndex 
        ? { ...exp, detected: true }
        : exp
    ))

    // Show success message
    setTimeout(() => {
      if (currentExpressionIndex < expressions.length - 1) {
        setCurrentExpressionIndex(prev => prev + 1)
        setTimeout(() => setIsDetecting(true), 1000)
      } else {
        // All expressions detected, move to quiz
        stopWebcam()
        setPhase('quiz')
      }
    }, 2000)
  }

  // Start expression detection phase
  useEffect(() => {
    if (phase === 'expression' && expressions.length > 0) {
      // Wait a moment then start detecting
      setTimeout(() => {
        setIsDetecting(true)
      }, 2000)
    }
  }, [phase, expressions])

  // Run expression detection
  useEffect(() => {
    if (isDetecting && faceApiLoaded) {
      detectionIntervalRef.current = setInterval(detectExpression, 100)
    } else {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [isDetecting, detectExpression, faceApiLoaded])

  // Handle quiz answer selection
  const handleQuizAnswer = (selectedEmotion: Expression) => {
    const currentQuestion = quizQuestions[currentQuizIndex]
    const isCorrect = selectedEmotion === currentQuestion.correctEmotion

    if (isCorrect) {
      setScore(prev => prev + 1)
    }

    setQuizQuestions(prev => prev.map((q, index) => 
      index === currentQuizIndex 
        ? { ...q, selectedEmotion }
        : q
    ))

    setTimeout(() => {
      if (currentQuizIndex < quizQuestions.length - 1) {
        setCurrentQuizIndex(prev => prev + 1)
      } else {
        setPhase('complete')
      }
    }, 1000)
  }

  // Restart game
  const restartGame = () => {
    setExpressions([])
    setCurrentExpressionIndex(0)
    setQuizQuestions([])
    setCurrentQuizIndex(0)
    setScore(0)
    setNeutralBaseline(null)
    setIsDetecting(false)
    setCurrentDetectedExpression('neutral')
    setLoadingProgress(0)
    setPhase('loading')
  }

  // Start the game immediately when component mounts
  useEffect(() => {
    if (phase === 'loading' && expressions.length === 0) {
      loadExpressionImages()
    }
  }, [phase])

  // Start webcam when in expression phase
  useEffect(() => {
    if (phase === 'expression') {
      startWebcam()
    }

    return () => {
      if (phase !== 'expression') {
        stopWebcam()
      }
    }
  }, [phase, startWebcam, stopWebcam])

  const renderLoadingPhase = () => (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-3xl font-bold text-chart-3 text-center">
        Creating Your Game
      </h2>
      
      <div className="w-80">
        <div className="bg-gray-200 border-2 border-black h-6 overflow-hidden">
          <div 
            className="bg-chart-1 h-full transition-all duration-500"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <p className="text-center mt-4 text-gray-600 font-bold">{loadingMessage}</p>
      </div>

      <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-chart-3 rounded-full" />
    </div>
  )

  const renderExpressionPhase = () => {
    const currentExpression = expressions[currentExpressionIndex]
    if (!currentExpression) return null

    if (!faceApiLoaded) {
      return (
        <div className="flex flex-col items-center space-y-6">
          <h2 className="text-3xl font-bold text-red-600 text-center">
            Face Detection Error
          </h2>
          <p className="text-lg text-gray-600 text-center">
            Failed to load face detection models. Please refresh the page and try again.
          </p>
          <button
            onClick={restartGame}
            className="bg-red-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            TRY AGAIN
          </button>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center space-y-6">
        <h2 className="text-3xl font-bold text-chart-3 text-center">
          Make This Expression!
        </h2>
        
        {/* Side by side layout for photo and camera */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Expression Photo */}
          <div className="text-center">
            <div className="w-80 h-80 mx-auto mb-4 bg-gray-100 border-4 border-black shadow-brutal-xl overflow-hidden">
              <img
                src={currentExpression.imageUrl}
                alt={`${currentExpression.emotion} expression`}
                className="w-full h-full object-contain"
              />
            </div>
            <h3 className="text-2xl font-bold capitalize text-chart-2">
              {currentExpression.emotion}
            </h3>
            <p className="text-lg text-gray-600 font-bold mt-2">
              Copy this expression!
            </p>
          </div>

          {/* Camera Feed */}
          <div className="text-center">
            <div className="relative mx-auto w-80 h-60">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full bg-gray-200 border-4 border-black shadow-brutal object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
            <p className="text-md text-gray-600 font-bold mt-2">
              You are making <span className="font-bold text-chart-3 capitalize">{currentDetectedExpression}</span> expression
            </p>
          </div>
        </div>

        {expressions[currentExpressionIndex]?.detected && (
          <div className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-2xl font-bold text-chart-1">Great job!</p>
          </div>
        )}

        {!expressions[currentExpressionIndex]?.detected && (
          <div className="text-center">
            <p className="text-lg text-gray-600 font-bold">
              Make the expression and hold it!
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          {expressions.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 border-2 border-black ${
                index === currentExpressionIndex
                  ? 'bg-chart-3'
                  : expressions[index]?.detected
                  ? 'bg-chart-1'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderQuizPhase = () => {
    const currentQuestion = quizQuestions[currentQuizIndex]
    if (!currentQuestion) return null

    const emotions: Expression[] = ['happy', 'sad', 'angry', 'surprised']

    return (
      <div className="flex flex-col items-center space-y-6">
        <h2 className="text-3xl font-bold text-chart-3 text-center">
          What Expression Is This?
        </h2>
        
        <div className="w-80 h-80 mx-auto bg-gray-100 border-4 border-black shadow-brutal-xl overflow-hidden">
          <img
            src={currentQuestion.imageUrl}
            alt="Expression to identify"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {emotions.map((emotion) => (
            <button
              key={emotion}
              onClick={() => handleQuizAnswer(emotion)}
              disabled={currentQuestion.selectedEmotion !== undefined}
              className={`px-6 py-4 border-2 border-black shadow-brutal font-bold text-lg transition-all ${
                currentQuestion.selectedEmotion === emotion
                  ? emotion === currentQuestion.correctEmotion
                    ? 'bg-chart-1 text-white'
                    : 'bg-red-500 text-white'
                  : 'bg-white hover:shadow-brutal-lg text-gray-800'
              }`}
            >
              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex space-x-2">
          {quizQuestions.map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 border-2 border-black ${
                index === currentQuizIndex
                  ? 'bg-chart-3'
                  : index < currentQuizIndex
                  ? 'bg-chart-1'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    )
  }

  const renderCompletePhase = () => (
    <div className="flex flex-col items-center space-y-6">
      <div className="bg-chart-5 text-white rounded-full w-20 h-20 flex items-center justify-center border-4 border-black shadow-brutal-xl">
        <Trophy size={40} />
      </div>
      <h2 className="text-4xl font-bold text-chart-3 text-center">
        Congratulations!
      </h2>
      
      <div className="text-center">
        <p className="text-2xl font-bold text-chart-2 mb-2">
          You scored {score} out of {quizQuestions.length}!
        </p>
        <p className="text-lg text-gray-600 font-bold">
          {score === quizQuestions.length 
            ? "Perfect! You're an expression expert!" 
            : score >= quizQuestions.length / 2
            ? "Great job! You did really well!"
            : "Good try! Practice makes perfect!"}
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={restartGame}
          className="bg-chart-3 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
        >
          🔄 PLAY AGAIN
        </button>
        
        <button
          onClick={onBack}
          className="bg-gray-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
        >
          ← BACK TO GAMES
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all font-bold"
          >
            ← BACK
          </button>
          
          <div className="inline-block transform -rotate-1">
            <div className="bg-chart-3 text-white px-8 py-4 border-4 border-black shadow-brutal-xl font-bold text-3xl">
              😊 EXPRESSION GAME! 😊
            </div>
          </div>
        </div>

        {/* Game Content */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8">
          {phase === 'loading' && renderLoadingPhase()}
          {phase === 'expression' && renderExpressionPhase()}
          {phase === 'quiz' && renderQuizPhase()}
          {phase === 'complete' && renderCompletePhase()}
        </div>
      </div>
    </div>
  )
}
