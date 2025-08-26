"use client"

import { useState } from 'react'
import { Plus, Trash2, Image, Volume2, FileText, Eye, Upload } from 'lucide-react'

interface Asset {
  id: string
  type: 'image' | 'sound' | 'text'
  label: string
  url: string
  description?: string
}

interface Scene {
  id: string
  title: string
  narrative: string
  instructions: string
  assets: Asset[]
  pacingHints: {
    calmMode?: boolean
    fastMode?: boolean
  }
  reinforcement: string
}

interface SceneBuilderProps {
  scene: Scene
  onChange: (updates: Partial<Scene>) => void
  validationErrors: any[]
}

export function SceneBuilder({ scene, onChange, validationErrors }: SceneBuilderProps) {
  const [assetModalOpen, setAssetModalOpen] = useState(false)
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    type: 'image',
    label: '',
    url: '',
    description: ''
  })

  const updateField = (field: keyof Scene, value: any) => {
    onChange({ [field]: value })
  }

  const addAsset = () => {
    if (!newAsset.label || !newAsset.url) return
    
    const asset: Asset = {
      id: `asset_${Date.now()}`,
      type: newAsset.type as 'image' | 'sound' | 'text',
      label: newAsset.label,
      url: newAsset.url,
      description: newAsset.description || ''
    }
    
    updateField('assets', [...scene.assets, asset])
    setNewAsset({ type: 'image', label: '', url: '', description: '' })
    setAssetModalOpen(false)
  }

  const removeAsset = (assetId: string) => {
    updateField('assets', scene.assets.filter(a => a.id !== assetId))
  }

  const updateAsset = (assetId: string, updates: Partial<Asset>) => {
    const updatedAssets = scene.assets.map(asset =>
      asset.id === assetId ? { ...asset, ...updates } : asset
    )
    updateField('assets', updatedAssets)
  }

  const uploadAsset = async (file: File, type: 'image' | 'sound') => {
    // In a real implementation, this would upload to your storage service
    // For now, we'll create a mock URL
    const mockUrl = `https://storage.brainberry.com/${type}s/${file.name}`
    
    const asset: Asset = {
      id: `asset_${Date.now()}`,
      type,
      label: file.name,
      url: mockUrl,
      description: `Uploaded ${type}: ${file.name}`
    }
    
    updateField('assets', [...scene.assets, asset])
  }

  return (
    <div className="bg-white border-4 border-black shadow-brutal-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Scene Editor</h2>
        <div className="text-sm text-gray-600">
          Scene {scene.title && `"${scene.title}"`}
        </div>
      </div>

      {/* Basic Scene Info */}
      <div className="space-y-4">
        <div>
          <label className="font-bold text-sm mb-1 block">Scene Title *</label>
          <input
            value={scene.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full border-2 border-black p-3 font-bold"
            placeholder="Welcome & Instructions"
          />
        </div>

        <div>
          <label className="font-bold text-sm mb-1 block">Narrative Text</label>
          <textarea
            value={scene.narrative}
            onChange={(e) => updateField('narrative', e.target.value)}
            className="w-full border-2 border-black p-3 h-20"
            placeholder="Welcome to the memory challenge! Today we'll practice remembering where things are hidden..."
          />
        </div>

        <div>
          <label className="font-bold text-sm mb-1 block">Instructions for Child *</label>
          <textarea
            value={scene.instructions}
            onChange={(e) => updateField('instructions', e.target.value)}
            className="w-full border-2 border-black p-3 h-24"
            placeholder="Click on the cards to flip them over. Try to remember where each picture is so you can match the pairs!"
          />
        </div>

        <div>
          <label className="font-bold text-sm mb-1 block">Positive Reinforcement</label>
          <input
            value={scene.reinforcement}
            onChange={(e) => updateField('reinforcement', e.target.value)}
            className="w-full border-2 border-black p-3"
            placeholder="Great job! You're getting better at remembering!"
          />
        </div>
      </div>

      {/* Pacing Hints */}
      <div className="bg-gray-50 border-2 border-gray-200 p-4 rounded">
        <h3 className="font-bold text-sm mb-3">Adaptive Pacing Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={scene.pacingHints.calmMode || false}
              onChange={(e) => updateField('pacingHints', { 
                ...scene.pacingHints, 
                calmMode: e.target.checked 
              })}
              className="border-2 border-black"
            />
            <span className="text-sm font-bold">Enable Calm Mode Support</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={scene.pacingHints.fastMode || false}
              onChange={(e) => updateField('pacingHints', { 
                ...scene.pacingHints, 
                fastMode: e.target.checked 
              })}
              className="border-2 border-black"
            />
            <span className="text-sm font-bold">Enable Fast Mode Support</span>
          </label>
        </div>
      </div>

      {/* Assets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Scene Assets</h3>
          <div className="flex space-x-2">
            <label className="bg-blue-500 text-white px-3 py-1 border-2 border-black shadow-brutal font-bold text-sm cursor-pointer flex items-center space-x-1">
              <Upload className="h-3 w-3" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadAsset(file, 'image')
                }}
              />
            </label>
            
            <label className="bg-green-500 text-white px-3 py-1 border-2 border-black shadow-brutal font-bold text-sm cursor-pointer flex items-center space-x-1">
              <Upload className="h-3 w-3" />
              <span>Upload Sound</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadAsset(file, 'sound')
                }}
              />
            </label>
            
            <button
              onClick={() => setAssetModalOpen(true)}
              className="bg-purple-500 text-white px-3 py-1 border-2 border-black shadow-brutal font-bold text-sm flex items-center space-x-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add URL</span>
            </button>
          </div>
        </div>

        {/* Asset List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scene.assets.map((asset) => (
            <div key={asset.id} className="border-2 border-black p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {asset.type === 'image' && <Image className="h-4 w-4 text-blue-500" />}
                  {asset.type === 'sound' && <Volume2 className="h-4 w-4 text-green-500" />}
                  {asset.type === 'text' && <FileText className="h-4 w-4 text-purple-500" />}
                  <span className="font-bold text-sm">{asset.label}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {asset.type === 'image' && (
                    <button
                      onClick={() => window.open(asset.url, '_blank')}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeAsset(asset.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 truncate">{asset.url}</div>
              {asset.description && (
                <div className="text-xs text-gray-700 mt-1">{asset.description}</div>
              )}
            </div>
          ))}
        </div>

        {scene.assets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets added yet. Upload images, sounds, or add URLs to enhance this scene.</p>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
      {assetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black shadow-brutal-xl p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Add Asset by URL</h3>
            
            <div className="space-y-4">
              <div>
                <label className="font-bold text-sm mb-1 block">Asset Type</label>
                <select
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value as 'image' | 'sound' | 'text' })}
                  className="w-full border-2 border-black p-2 font-bold"
                >
                  <option value="image">Image</option>
                  <option value="sound">Sound</option>
                  <option value="text">Text Content</option>
                </select>
              </div>
              
              <div>
                <label className="font-bold text-sm mb-1 block">Label</label>
                <input
                  value={newAsset.label}
                  onChange={(e) => setNewAsset({ ...newAsset, label: e.target.value })}
                  className="w-full border-2 border-black p-2"
                  placeholder="Happy Face"
                />
              </div>
              
              <div>
                <label className="font-bold text-sm mb-1 block">URL</label>
                <input
                  value={newAsset.url}
                  onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                  className="w-full border-2 border-black p-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div>
                <label className="font-bold text-sm mb-1 block">Description (Optional)</label>
                <input
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  className="w-full border-2 border-black p-2"
                  placeholder="A smiling child's face"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setAssetModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white border-2 border-black shadow-brutal font-bold"
              >
                Cancel
              </button>
              
              <button
                onClick={addAsset}
                disabled={!newAsset.label || !newAsset.url}
                className="px-4 py-2 bg-green-500 text-white border-2 border-black shadow-brutal font-bold disabled:opacity-50"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
