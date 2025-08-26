"use client"

import { useState } from 'react'
import { Play, ArrowRight, CheckCircle, Lightbulb, Target, Palette } from 'lucide-react'

interface QuickStartTutorialProps {
  onComplete: () => void
}

export function QuickStartTutorial({ onComplete }: QuickStartTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: "Welcome to Mold Studio!",
      description: "Create therapeutic games without any coding. We'll guide you through the process.",
      icon: Play,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The Mold Studio empowers educators to design custom therapeutic games 
            that children can personalize with AI. Every mold you create is validated 
            for safety and educational effectiveness.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded">
            <h4 className="font-bold text-blue-800 mb-2">What you'll create:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• Game structure and flow</li>
              <li>• Learning objectives and targets</li>
              <li>• Customization boundaries for AI</li>
              <li>• Age-appropriate content and interactions</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Define Your Learning Goals",
      description: "Start with clear therapeutic objectives and target audience.",
      icon: Target,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Every great therapeutic game starts with specific learning goals. 
            Consider what skills you want to develop and which learners you're targeting.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border-2 border-green-200 p-4 rounded">
              <h4 className="font-bold text-green-800 mb-2">Example Objectives:</h4>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Improve working memory</li>
                <li>• Practice emotion recognition</li>
                <li>• Develop turn-taking skills</li>
                <li>• Enhance attention span</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded">
              <h4 className="font-bold text-purple-800 mb-2">Target Learners:</h4>
              <ul className="text-purple-700 text-sm space-y-1">
                <li>• Children with ASD</li>
                <li>• ADHD support needs</li>
                <li>• Neurotypical development</li>
                <li>• Mixed ability groups</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Design Game Scenes",
      description: "Create engaging scenes with clear instructions and positive reinforcement.",
      icon: Palette,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Each scene is a step in your game's journey. Design them with therapeutic 
            precision while keeping them engaging for children.
          </p>
          
          <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded">
            <h4 className="font-bold text-yellow-800 mb-2">Scene Essentials:</h4>
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <strong className="text-yellow-700">Instructions</strong>
                <p className="text-yellow-600">Clear, age-appropriate directions</p>
              </div>
              <div>
                <strong className="text-yellow-700">Assets</strong>
                <p className="text-yellow-600">Images, sounds, and content</p>
              </div>
              <div>
                <strong className="text-yellow-700">Reinforcement</strong>
                <p className="text-yellow-600">Positive feedback messages</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded">
            <h4 className="font-bold text-gray-700 mb-2">💡 Pro Tip:</h4>
            <p className="text-gray-600 text-sm">
              Start simple with 2-3 scenes and build complexity gradually. 
              The validation system will guide you to ensure therapeutic value.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Set Personalization Boundaries",
      description: "Control what AI can customize while preserving therapeutic integrity.",
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            When children personalize your mold, AI will respect the boundaries you set. 
            This ensures therapeutic objectives remain intact while allowing creative expression.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-bold text-green-700 mb-2">✅ Safe to Customize:</h4>
              <ul className="text-sm text-green-600 space-y-1">
                <li>• Visual themes and colors</li>
                <li>• Character appearances</li>
                <li>• Sound effects and music</li>
                <li>• Reward animations</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-red-700 mb-2">🔒 Keep Protected:</h4>
              <ul className="text-sm text-red-600 space-y-1">
                <li>• Game mechanics and rules</li>
                <li>• Learning sequences</li>
                <li>• Therapeutic objectives</li>
                <li>• Safety measures</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded">
            <p className="text-blue-700 text-sm">
              <strong>Remember:</strong> You can provide specific guidelines to help AI 
              make appropriate choices during personalization.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Test and Validate",
      description: "Preview your game and ensure it meets all safety and quality standards.",
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Before saving, your mold goes through comprehensive validation to ensure 
            it's safe, effective, and ready for children to personalize.
          </p>
          
          <div className="space-y-3">
            <div className="bg-red-50 border-2 border-red-200 p-3 rounded">
              <h4 className="font-bold text-red-700 text-sm">Critical Checks</h4>
              <p className="text-red-600 text-xs">Must be fixed before saving</p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded">
              <h4 className="font-bold text-yellow-700 text-sm">Warnings</h4>
              <p className="text-yellow-600 text-xs">Should be reviewed for best results</p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded">
              <h4 className="font-bold text-blue-700 text-sm">Suggestions</h4>
              <p className="text-blue-600 text-xs">Tips to improve engagement and effectiveness</p>
            </div>
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded">
            <h4 className="font-bold text-green-800 mb-2">Ready to Start!</h4>
            <p className="text-green-700 text-sm">
              You now have everything you need to create professional therapeutic games. 
              The studio will guide you through each step with real-time validation and feedback.
            </p>
          </div>
        </div>
      )
    }
  ]

  const currentStepData = steps[currentStep]
  const StepIcon = currentStepData.icon

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-brutal-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-white rounded-full">
              <StepIcon className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
              <p className="text-purple-100 text-sm">{currentStepData.description}</p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="flex space-x-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? 'bg-white' : 'bg-purple-300'
                }`}
              />
            ))}
          </div>
          
          <div className="text-right text-sm text-purple-100 mt-2">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black p-6 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-500 text-white border-2 border-black shadow-brutal font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <button
            onClick={nextStep}
            className="px-6 py-2 bg-purple-500 text-white border-2 border-black shadow-brutal font-bold flex items-center space-x-2"
          >
            <span>{currentStep === steps.length - 1 ? 'Start Creating!' : 'Next'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
