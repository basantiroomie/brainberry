'use client'

import { useState } from 'react'

export default function TestAvatarPage() {
  const [childId, setChildId] = useState('1cd3e2ec-3796-4854-89ca-3891051ab0ca')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a photo file')
      return
    }

    if (!childId) {
      setError('Please enter a child ID')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('childId', childId)
      formData.append('photo', file)

      const response = await fetch('/api/avatars/test-create', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.message || 'Upload failed')
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(selectedFile.type)) {
        setError('Please select a JPEG or PNG image')
        return
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      
      setFile(selectedFile)
      setError(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Avatar Creation Test</h1>
          <p className="text-gray-600 mt-2">Test the avatar creation API endpoint</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="childId" className="block text-sm font-medium text-gray-700">
              Child ID
            </label>
            <input
              type="text"
              id="childId"
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter child UUID"
              required
            />
          </div>

          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
              Photo (JPEG/PNG, max 10MB)
            </label>
            <input
              type="file"
              id="photo"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Avatar...' : 'Create Avatar'}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>Child:</strong> {result.data?.childName}</p>
                  <p><strong>Avatar URL:</strong></p>
                  <a 
                    href={result.data?.avatarUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-all"
                  >
                    {result.data?.avatarUrl}
                  </a>
                  {result.data?.warning && (
                    <p className="mt-2 text-yellow-700">
                      <strong>Warning:</strong> {result.data.warning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-xs text-gray-500">
          <h4 className="font-medium mb-2">Testing Notes:</h4>
          <ul className="space-y-1">
            <li>• This endpoint requires educator authentication</li>
            <li>• Child ID must belong to the logged-in educator</li>
            <li>• Only JPEG/PNG files up to 10MB are accepted</li>
            <li>• Avatar creation uses Ready Player Me API</li>
            <li>• Database migration may be needed for full functionality</li>
          </ul>
        </div>
      </div>
    </div>
  )
}