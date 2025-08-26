"use client"

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle, RefreshCw, FileText, Settings, Play, Database } from 'lucide-react'

interface ValidationError {
  type: 'critical' | 'warning' | 'info'
  message: string
  section?: string
  field?: string
  sceneIndex?: number
}

interface MoldValidationPanelProps {
  mold: any
  errors: ValidationError[]
  isValidating: boolean
  onRevalidate: () => void
}

export function MoldValidationPanel({ mold, errors, isValidating, onRevalidate }: MoldValidationPanelProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  if (!mold) {
    return (
      <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
        <Info className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-bold text-gray-700 mb-2">No Mold to Validate</h3>
        <p className="text-sm text-gray-600">Create or select a mold to see validation results</p>
      </div>
    )
  }

  const criticalErrors = errors.filter(e => e.type === 'critical')
  const warnings = errors.filter(e => e.type === 'warning')
  const infos = errors.filter(e => e.type === 'info')
  
  const isValid = criticalErrors.length === 0
  const hasIssues = errors.length > 0

  const getValidationStatus = () => {
    if (isValidating) return { color: 'blue', icon: RefreshCw, message: 'Validating mold...' }
    if (criticalErrors.length > 0) return { color: 'red', icon: XCircle, message: 'Critical errors must be fixed' }
    if (warnings.length > 0) return { color: 'yellow', icon: AlertTriangle, message: 'Warnings should be reviewed' }
    return { color: 'green', icon: CheckCircle, message: 'Mold is valid and ready' }
  }

  const status = getValidationStatus()
  const StatusIcon = status.icon

  const errorsBySection = errors.reduce((acc, error) => {
    const section = error.section || 'general'
    if (!acc[section]) acc[section] = []
    acc[section].push(error)
    return acc
  }, {} as Record<string, ValidationError[]>)

  const sections = [
    { id: 'basic', name: 'Basic Information', icon: FileText },
    { id: 'scenes', name: 'Scenes & Flow', icon: Play },
    { id: 'customization', name: 'Customization Settings', icon: Settings },
    { id: 'metadata', name: 'Learning Goals', icon: Database }
  ]

  return (
    <div className="space-y-6">
      {/* Validation Status Header */}
      <div className={`bg-white border-4 border-black shadow-brutal-xl p-6 ${
        status.color === 'red' ? 'border-red-500' :
        status.color === 'yellow' ? 'border-yellow-500' :
        status.color === 'green' ? 'border-green-500' : ''
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              status.color === 'red' ? 'bg-red-100' :
              status.color === 'yellow' ? 'bg-yellow-100' :
              status.color === 'green' ? 'bg-green-100' : 'bg-blue-100'
            }`}>
              <StatusIcon className={`h-6 w-6 ${
                status.color === 'red' ? 'text-red-600' :
                status.color === 'yellow' ? 'text-yellow-600' :
                status.color === 'green' ? 'text-green-600' : 'text-blue-600'
              } ${isValidating ? 'animate-spin' : ''}`} />
            </div>
            
            <div>
              <h2 className="text-xl font-bold">Mold Validation</h2>
              <p className={`text-sm ${
                status.color === 'red' ? 'text-red-600' :
                status.color === 'yellow' ? 'text-yellow-600' :
                status.color === 'green' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {status.message}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right text-sm">
              <div className="font-bold">{mold.name}</div>
              <div className="text-gray-600">{mold.scenes?.length || 0} scenes</div>
            </div>
            
            <button
              onClick={onRevalidate}
              disabled={isValidating}
              className="px-4 py-2 bg-blue-500 text-white border-2 border-black shadow-brutal font-bold text-sm disabled:opacity-50 flex items-center space-x-1"
            >
              <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
              <span>Revalidate</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 border-2 border-gray-200 p-3 rounded text-center">
            <div className="text-2xl font-bold text-gray-700">{errors.length}</div>
            <div className="text-xs text-gray-600">Total Issues</div>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 p-3 rounded text-center">
            <div className="text-2xl font-bold text-red-700">{criticalErrors.length}</div>
            <div className="text-xs text-red-600">Critical</div>
          </div>
          
          <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded text-center">
            <div className="text-2xl font-bold text-yellow-700">{warnings.length}</div>
            <div className="text-xs text-yellow-600">Warnings</div>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded text-center">
            <div className="text-2xl font-bold text-blue-700">{infos.length}</div>
            <div className="text-xs text-blue-600">Suggestions</div>
          </div>
        </div>
      </div>

      {/* Detailed Validation Results */}
      {hasIssues ? (
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionErrors = errorsBySection[section.id] || []
            if (sectionErrors.length === 0) return null
            
            const SectionIcon = section.icon
            const isExpanded = expandedSection === section.id
            
            return (
              <div key={section.id} className="bg-white border-4 border-black shadow-brutal-xl">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <SectionIcon className="h-5 w-5 text-gray-600" />
                    <span className="font-bold">{section.name}</span>
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {sectionErrors.length}
                    </span>
                  </div>
                  
                  <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t-2 border-black p-4 space-y-3">
                    {sectionErrors.map((error, index) => (
                      <div
                        key={index}
                        className={`p-3 border-2 rounded ${
                          error.type === 'critical' ? 'bg-red-50 border-red-200' :
                          error.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {error.type === 'critical' && <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />}
                          {error.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                          {error.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                          
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              error.type === 'critical' ? 'text-red-700' :
                              error.type === 'warning' ? 'text-yellow-700' :
                              'text-blue-700'
                            }`}>
                              {error.message}
                            </div>
                            
                            {error.field && (
                              <div className="text-xs text-gray-600 mt-1">
                                Field: {error.field}
                              </div>
                            )}
                            
                            {error.sceneIndex !== undefined && (
                              <div className="text-xs text-gray-600 mt-1">
                                Scene: {error.sceneIndex + 1}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white border-4 border-black shadow-brutal-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-bold text-green-700 mb-2">Perfect! Your mold is ready</h3>
          <p className="text-sm text-gray-600 mb-4">
            All validation checks passed. Your therapeutic game mold meets all requirements 
            and is ready for children to personalize and play.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
              <div className="font-bold text-green-800">✓ Structure Valid</div>
              <div className="text-green-600">Game flow and scenes are properly configured</div>
            </div>
            
            <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
              <div className="font-bold text-green-800">✓ Safety Verified</div>
              <div className="text-green-600">Content is appropriate and secure</div>
            </div>
            
            <div className="bg-green-50 border-2 border-green-200 p-3 rounded">
              <div className="font-bold text-green-800">✓ Learning Goals Set</div>
              <div className="text-green-600">Therapeutic objectives are well-defined</div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Guidelines */}
      <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
        <h3 className="text-lg font-bold mb-4">Validation Guidelines</h3>
        
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-bold text-gray-700 mb-3">Critical Requirements</h4>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Game name and objective must be provided</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>At least one scene with instructions</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Age range must be appropriate (3-17 years)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Learning objectives must be specified</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-700 mb-3">Best Practices</h4>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Include positive reinforcement messages</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Set appropriate customization boundaries</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Define executive function targets</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Consider sensory preferences</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
