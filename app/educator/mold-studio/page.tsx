"use client"

import { useState, useEffect } from 'react'
import { Plus, Wand2, Save, Eye, AlertTriangle, CheckCircle, Settings, FileText, Gamepad2, ArrowLeft } from 'lucide-react'
import { MoldStudioBuilder } from '@/components/MoldStudioBuilder'
import { MoldPreview } from '@/components/MoldPreview'
import { MoldValidationPanel } from '@/components/MoldValidationPanel'
import { MoldLibrary } from '@/components/MoldLibrary'
import { QuickStartTutorial } from '@/components/QuickStartTutorial'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { normalizeMoldFromApi, type Mold } from '@/lib/mold-normalize'

interface ValidationError {
  type: 'critical' | 'warning' | 'info'
  message: string
  section?: string
  field?: string
  sceneIndex?: number
}

export default function MoldStudioPage() {
  const [activeTab, setActiveTab] = useState<'library' | 'builder' | 'preview' | 'validation'>('library')
  const [currentMold, setCurrentMold] = useState<Mold | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  
  const router = useRouter()

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [hasUnsavedChanges])

  const handleMoldSelect = (mold: any) => {
    const normalized = mold ? normalizeMoldFromApi(mold) : null
    setCurrentMold(normalized)
    setActiveTab('builder')
  }

  const handleCreateNew = () => {
    setCurrentMold(null)
    setActiveTab('builder')
  }

  const handleMoldChange = (mold: Mold) => {
    setCurrentMold(mold)
    setHasUnsavedChanges(true)
    // Debounced auto-validate on changes
    scheduleValidate(mold)
  }

  // Debounce validation to reduce API calls while typing
  let validateTimer: any
  const scheduleValidate = (mold: Mold) => {
    if (validateTimer) clearTimeout(validateTimer)
    validateTimer = setTimeout(() => validateMold(mold), 350)
  }

  const validateMold = async (mold: Mold) => {
    setIsValidating(true)
    try {
      const response = await fetch('/api/molds/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mold)
      })
      if (response.status === 401) {
        setValidationErrors([{ type: 'critical', message: 'You must be signed in as an educator to validate.' }])
        return
      }
      const result = await response.json()
      setValidationErrors(result.errors || [])
    } catch (error) {
      console.error('Validation error:', error)
      setValidationErrors([{ type: 'critical', message: 'Failed to validate mold' }])
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    if (!currentMold) return
    
    const hasCritical = validationErrors.some(e => e.type === 'critical')
    if (hasCritical) {
      toast.error('Cannot save mold with validation errors')
      setActiveTab('validation')
      return
    }

    try {
      const response = await fetch('/api/molds/studio', {
        method: currentMold.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentMold)
      })
      
      if (!response.ok) {
        if (response.status === 400) {
          const body = await response.json()
          if (body?.validationErrors) {
            setValidationErrors(body.validationErrors)
            setActiveTab('validation')
            throw new Error('Validation failed')
          }
        }
        if (response.status === 401) {
          throw new Error('Unauthorized. Please sign in as an educator.')
        }
        throw new Error('Failed to save mold')
      }
      
      const savedMold = await response.json()
      const normalized = normalizeMoldFromApi(savedMold)
      setCurrentMold(normalized)
      setHasUnsavedChanges(false)
      toast.success('Mold saved successfully!')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save mold'
      toast.error(message)
    }
  }

  const tabs = [
    { id: 'library', label: 'Mold Library', icon: FileText },
    { id: 'builder', label: 'Visual Builder', icon: Settings },
    { id: 'preview', label: 'Test & Preview', icon: Eye },
    { id: 'validation', label: 'Validation', icon: validationErrors.length > 0 ? AlertTriangle : CheckCircle }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b-4 border-black shadow-brutal-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/educator')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-bold text-sm">Back to Dashboard</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Wand2 className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-2xl font-black">Mold Studio</h1>
                <p className="text-sm text-gray-600">Create therapeutic game templates with no code</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasUnsavedChanges && (
                <span className="text-xs font-bold text-amber-600 flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                  <span>Unsaved changes</span>
                </span>
              )}
              
              {currentMold && (
                <>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className="px-4 py-2 bg-blue-500 text-white border-2 border-black shadow-brutal font-bold hover:shadow-brutal-hover transition-all"
                  >
                    <Eye className="h-4 w-4 mr-2 inline" />
                    Test Play
                  </button>
                  
                  <button
                    onClick={handleSave}
                    disabled={validationErrors.length > 0}
                    className="px-4 py-2 bg-green-500 text-white border-2 border-black shadow-brutal font-bold hover:shadow-brutal-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="h-4 w-4 mr-2 inline" />
                    Save Mold
                  </button>
                </>
              )}
              
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-purple-500 text-white border-2 border-black shadow-brutal font-bold hover:shadow-brutal-hover transition-all"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                New Mold
              </button>
              
              <button
                onClick={() => setShowTutorial(true)}
                className="px-4 py-2 bg-yellow-500 text-white border-2 border-black shadow-brutal font-bold hover:shadow-brutal-hover transition-all text-sm"
              >
                📚 Tutorial
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const hasErrors = tab.id === 'validation' && validationErrors.length > 0
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 border-r-2 border-black font-bold text-sm transition-all flex items-center space-x-2 ${
                    isActive 
                      ? 'bg-purple-100 text-purple-800 shadow-inset' 
                      : 'bg-white hover:bg-gray-50 text-gray-700'
                  } ${hasErrors ? 'text-red-600' : ''}`}
                >
                  <Icon className={`h-4 w-4 ${hasErrors ? 'text-red-500' : ''}`} />
                  <span>{tab.label}</span>
                  {hasErrors && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {validationErrors.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'library' && (
          <MoldLibrary onMoldSelect={handleMoldSelect} />
        )}
        
        {activeTab === 'builder' && (
          <MoldStudioBuilder
            mold={currentMold}
            onChange={handleMoldChange}
            validationErrors={validationErrors}
          />
        )}
        
        {activeTab === 'preview' && currentMold && (
          <MoldPreview mold={currentMold} />
        )}
        
        {activeTab === 'validation' && (
          <MoldValidationPanel
            mold={currentMold}
            errors={validationErrors}
            isValidating={isValidating}
            onRevalidate={() => currentMold && validateMold(currentMold)}
          />
        )}
      </div>
      
      {/* Tutorial Modal */}
      {showTutorial && (
        <QuickStartTutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  )
}
