"use client"

import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

interface ValidationError {
  type: 'critical' | 'warning' | 'info'
  message: string
  section?: string
  field?: string
  sceneIndex?: number
}

interface MoldValidationIndicatorProps {
  errors: ValidationError[]
}

export function MoldValidationIndicator({ errors }: MoldValidationIndicatorProps) {
  const criticalErrors = errors.filter(e => e.type === 'critical')
  const warnings = errors.filter(e => e.type === 'warning')
  const infos = errors.filter(e => e.type === 'info')

  if (errors.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 border-2 border-green-200 rounded">
        <CheckCircle className="h-4 w-4" />
        <span className="font-bold text-sm">Mold is valid and ready to save</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {criticalErrors.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-3 rounded">
          <div className="flex items-center space-x-2 text-red-600 mb-2">
            <XCircle className="h-4 w-4" />
            <span className="font-bold text-sm">{criticalErrors.length} Critical Error(s)</span>
          </div>
          <ul className="text-xs space-y-1">
            {criticalErrors.map((error, i) => (
              <li key={i} className="text-red-700">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {warnings.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 p-3 rounded">
          <div className="flex items-center space-x-2 text-amber-600 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-bold text-sm">{warnings.length} Warning(s)</span>
          </div>
          <ul className="text-xs space-y-1">
            {warnings.map((error, i) => (
              <li key={i} className="text-amber-700">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {infos.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded">
          <div className="flex items-center space-x-2 text-blue-600 mb-2">
            <Info className="h-4 w-4" />
            <span className="font-bold text-sm">{infos.length} Suggestion(s)</span>
          </div>
          <ul className="text-xs space-y-1">
            {infos.map((error, i) => (
              <li key={i} className="text-blue-700">
                • {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
