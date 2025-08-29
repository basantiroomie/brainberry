'use client'

import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Camera, Upload, ArrowLeft, User, Loader2, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'

interface Child {
  id: string
  name: string
  age: number
  avatar_url?: string | null
}

function AvatarPhotoPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const childId = searchParams.get('childId')
  const action = searchParams.get('action') // 'create' or 'replace'
  
  const [child, setChild] = useState<Child | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch child data
  useEffect(() => {
    if (!childId) {
      toast.error('No child ID provided')
      router.push('/educator')
      return
    }

    const fetchChild = async () => {
      try {
        const response = await fetch(`/api/children/${childId}`)
        if (response.ok) {
          const childData = await response.json()
          setChild(childData)
        } else {
          toast.error('Child not found')
          router.push('/educator')
        }
      } catch (error) {
        console.error('Error fetching child:', error)
        toast.error('Error loading child data')
        router.push('/educator')
      }
    }

    fetchChild()
  }, [childId, router])

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be smaller than 10MB')
      return
    }

    setSelectedFile(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile || !childId) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('photo', selectedFile)
      formData.append('childId', childId)

      const response = await fetch('/api/avatars/create-from-photo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        toast.success('Avatar created successfully!')
        
        // Redirect back to educator dashboard with success message
        router.push('/educator?tab=children&success=avatar-created')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to create avatar')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error uploading photo')
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/educator?tab=children')}
                className="bg-gray-500 text-white p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">
                  {action === 'replace' ? 'Replace' : 'Create'} Avatar for {child.name}
                </h1>
                <p className="text-gray-600">Upload a photo to create a personalized 3D avatar</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-100 border-2 border-blue-300 p-3 inline-block">
                <User className="h-8 w-8 text-blue-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-blue-800">{child.name}</p>
                <p className="text-xs text-blue-600">{child.age} years old</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white border-4 border-black shadow-brutal-xl p-6">
          <h2 className="text-xl font-bold mb-6">Upload Photo</h2>
          
          {!selectedFile ? (
            <div
              className={`border-4 border-dashed p-12 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="space-y-4">
                <div className="text-gray-400">
                  <Camera className="w-16 h-16 mx-auto mb-4" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    Drop a photo here or click to browse
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Best results with clear face photos, good lighting, and neutral background
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold inline-flex items-center space-x-2"
                  >
                    <Upload className="h-5 w-5" />
                    <span>SELECT PHOTO</span>
                  </button>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">Selected Photo</h3>
                  <div className="bg-gray-100 border-2 border-black p-4">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>File:</strong> {selectedFile.name}</p>
                    <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold mb-3">What happens next?</h3>
                  <div className="bg-blue-50 border-2 border-blue-300 p-4 space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                      <p className="text-sm text-blue-800">Photo is uploaded securely</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                      <p className="text-sm text-blue-800">3D avatar is generated using Ready Player Me</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                      <p className="text-sm text-blue-800">Profile picture is automatically created</p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                      <p className="text-sm text-blue-800">Avatar is saved to {child.name}'s profile</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <button
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>CLEAR</span>
                </button>
                
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-green-500 text-white px-6 py-3 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>CREATING AVATAR...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>CREATE AVATAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border-4 border-yellow-300 shadow-brutal-xl p-6 mt-6">
          <h3 className="font-bold text-yellow-800 mb-3">📸 Photo Tips for Best Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
            <div>
              <h4 className="font-bold mb-2">✅ Good Photos:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Clear, well-lit face</li>
                <li>Looking directly at camera</li>
                <li>Neutral or simple background</li>
                <li>No sunglasses or face coverings</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-2">❌ Avoid:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Blurry or dark photos</li>
                <li>Multiple people in frame</li>
                <li>Extreme angles or poses</li>
                <li>Heavy shadows on face</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AvatarPhotoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AvatarPhotoPageContent />
    </Suspense>
  )
}