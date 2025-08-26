"use client"

import { Info } from 'lucide-react'

interface CustomizationBoundaries {
  lockStructure: boolean
  allowThemes: boolean
  allowPacing: boolean
  allowRewards: boolean
  allowAvatars: boolean
  notes: string
}

interface CustomizationSettingsProps {
  customization: CustomizationBoundaries
  onChange: (customization: CustomizationBoundaries) => void
  validationErrors: any[]
}

export function CustomizationSettings({ customization, onChange, validationErrors }: CustomizationSettingsProps) {
  const updateSetting = (key: keyof CustomizationBoundaries, value: any) => {
    onChange({ ...customization, [key]: value })
  }

  const customizationOptions = [
    {
      key: 'lockStructure' as const,
      label: 'Lock Game Structure',
      description: 'Prevent AI from changing core game mechanics, rules, and flow',
      recommendation: 'Recommended for therapeutic precision'
    },
    {
      key: 'allowThemes' as const,
      label: 'Allow Theme Customization',
      description: 'Let children personalize visual themes, colors, and decorative elements',
      recommendation: 'Safe for engagement'
    },
    {
      key: 'allowPacing' as const,
      label: 'Allow Pacing Adjustments',
      description: 'Enable AI to adjust timing, speed, and difficulty based on child needs',
      recommendation: 'Good for accessibility'
    },
    {
      key: 'allowRewards' as const,
      label: 'Allow Reward Customization',
      description: 'Permit changes to celebration sounds, animations, and positive reinforcements',
      recommendation: 'Motivates engagement'
    },
    {
      key: 'allowAvatars' as const,
      label: 'Allow Avatar Integration',
      description: 'Include child avatars and personalized character interactions',
      recommendation: 'Enhances connection'
    }
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h2 className="text-xl font-bold mb-4">Personalization Boundaries</h2>
        <p className="text-sm text-gray-600 mb-6">
          Define what aspects of your mold can be safely customized by AI when children create personalized versions.
        </p>

        <div className="space-y-6">
          {customizationOptions.map((option) => (
            <div key={option.key} className="border-2 border-gray-200 p-4 rounded">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={option.key}
                  checked={customization[option.key]}
                  onChange={(e) => updateSetting(option.key, e.target.checked)}
                  className="mt-1 border-2 border-black"
                />
                
                <div className="flex-1">
                  <label htmlFor={option.key} className="font-bold text-sm cursor-pointer">
                    {option.label}
                  </label>
                  
                  <p className="text-xs text-gray-600 mt-1">
                    {option.description}
                  </p>
                  
                  <div className="flex items-center space-x-1 mt-2">
                    <Info className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">
                      {option.recommendation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customization Guidelines */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h3 className="text-lg font-bold mb-4">Personalization Guidelines</h3>
        
        <div className="space-y-4">
          <div className="bg-green-50 border-2 border-green-200 p-4 rounded">
            <h4 className="font-bold text-sm text-green-800 mb-2">✅ Safe to Customize</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Visual themes and color schemes</li>
              <li>• Character names and appearances</li>
              <li>• Sound effects and music styles</li>
              <li>• Decorative elements and backgrounds</li>
              <li>• Reward animations and celebrations</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 p-4 rounded">
            <h4 className="font-bold text-sm text-red-800 mb-2">❌ Keep Protected</h4>
            <ul className="text-xs text-red-700 space-y-1">
              <li>• Core therapeutic objectives</li>
              <li>• Game mechanics and rules</li>
              <li>• Scoring and progress systems</li>
              <li>• Essential learning sequences</li>
              <li>• Safety and privacy settings</li>
            </ul>
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded">
            <h4 className="font-bold text-sm text-amber-800 mb-2">⚠️ Consider Carefully</h4>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Difficulty adjustments (may affect learning goals)</li>
              <li>• Timing changes (could impact therapeutic value)</li>
              <li>• Content complexity (ensure age-appropriateness)</li>
              <li>• Avatar integration (privacy considerations)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Custom Guidelines */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h3 className="text-lg font-bold mb-4">Custom Guidelines for AI</h3>
        <p className="text-sm text-gray-600 mb-4">
          Provide specific instructions to guide AI personalization of this mold:
        </p>
        
        <textarea
          value={customization.notes}
          onChange={(e) => updateSetting('notes', e.target.value)}
          className="w-full border-2 border-black p-3 h-32"
          placeholder="Example: Always maintain exactly 8 card pairs. Images should be child-friendly and relate to the child's stated interests. Keep instructions simple and use encouraging language. Avoid scary or complex imagery."
        />
        
        <div className="mt-3 text-xs text-gray-500">
          <strong>Tip:</strong> Be specific about what content is appropriate, how difficulty should be adjusted, 
          and any therapeutic considerations the AI should maintain.
        </div>
      </div>

      {/* Preview Impact */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h3 className="text-lg font-bold mb-4">Personalization Impact Preview</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-bold text-sm mb-2">Enabled Customizations:</h4>
            <ul className="text-xs space-y-1">
              {customization.allowThemes && <li className="text-green-600">✓ Visual themes & colors</li>}
              {customization.allowPacing && <li className="text-green-600">✓ Adaptive pacing</li>}
              {customization.allowRewards && <li className="text-green-600">✓ Custom rewards</li>}
              {customization.allowAvatars && <li className="text-green-600">✓ Avatar integration</li>}
              {!customization.allowThemes && !customization.allowPacing && !customization.allowRewards && !customization.allowAvatars && (
                <li className="text-gray-500">No customizations enabled</li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-sm mb-2">Protected Elements:</h4>
            <ul className="text-xs space-y-1">
              {customization.lockStructure && <li className="text-blue-600">🔒 Game structure locked</li>}
              <li className="text-blue-600">🔒 Learning objectives preserved</li>
              <li className="text-blue-600">🔒 Core mechanics protected</li>
              <li className="text-blue-600">🔒 Safety measures maintained</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
