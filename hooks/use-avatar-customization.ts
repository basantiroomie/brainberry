import { useState, useCallback, useEffect } from 'react'

export interface Asset {
  id: string
  name: string
  thumbnail: string
  url: string
  category: string
}

export interface AssetCategory {
  id: string
  name: string
  assets: Asset[]
}

export interface UseAvatarCustomizationReturn {
  assets: AssetCategory[]
  selectedAssets: Record<string, string>
  isLoading: boolean
  error: string | null
  loadAssets: () => Promise<void>
  selectAsset: (categoryId: string, assetId: string) => void
  resetSelection: () => void
}

// Mock asset data for development/testing
const mockAssets: AssetCategory[] = [
  {
    id: 'hair',
    name: 'Hair',
    assets: [
      {
        id: 'hair_1',
        name: 'Short Hair',
        thumbnail: 'https://api.readyplayer.me/v1/assets/hair_1/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/hair_1.glb',
        category: 'hair'
      },
      {
        id: 'hair_2',
        name: 'Long Hair',
        thumbnail: 'https://api.readyplayer.me/v1/assets/hair_2/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/hair_2.glb',
        category: 'hair'
      },
      {
        id: 'hair_3',
        name: 'Curly Hair',
        thumbnail: 'https://api.readyplayer.me/v1/assets/hair_3/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/hair_3.glb',
        category: 'hair'
      }
    ]
  },
  {
    id: 'outfit',
    name: 'Outfit',
    assets: [
      {
        id: 'outfit_1',
        name: 'Casual Shirt',
        thumbnail: 'https://api.readyplayer.me/v1/assets/outfit_1/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/outfit_1.glb',
        category: 'outfit'
      },
      {
        id: 'outfit_2',
        name: 'Hoodie',
        thumbnail: 'https://api.readyplayer.me/v1/assets/outfit_2/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/outfit_2.glb',
        category: 'outfit'
      },
      {
        id: 'outfit_3',
        name: 'Dress',
        thumbnail: 'https://api.readyplayer.me/v1/assets/outfit_3/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/outfit_3.glb',
        category: 'outfit'
      }
    ]
  },
  {
    id: 'glasses',
    name: 'Glasses',
    assets: [
      {
        id: 'glasses_none',
        name: 'No Glasses',
        thumbnail: 'https://api.readyplayer.me/v1/assets/glasses_none/thumbnail.png',
        url: '',
        category: 'glasses'
      },
      {
        id: 'glasses_1',
        name: 'Round Glasses',
        thumbnail: 'https://api.readyplayer.me/v1/assets/glasses_1/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/glasses_1.glb',
        category: 'glasses'
      },
      {
        id: 'glasses_2',
        name: 'Square Glasses',
        thumbnail: 'https://api.readyplayer.me/v1/assets/glasses_2/thumbnail.png',
        url: 'https://api.readyplayer.me/v1/assets/glasses_2.glb',
        category: 'glasses'
      }
    ]
  }
]

export function useAvatarCustomization(): UseAvatarCustomizationReturn {
  const [assets, setAssets] = useState<AssetCategory[]>([])
  const [selectedAssets, setSelectedAssets] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAssets = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would call the Ready Player Me API
      // For now, we'll use mock data
      const rpmApiKey = process.env.NEXT_PUBLIC_RPM_API_KEY
      
      if (rpmApiKey) {
        // Try to fetch real assets from Ready Player Me API
        try {
          const response = await fetch('https://api.readyplayer.me/v1/assets', {
            headers: {
              'Authorization': `Bearer ${rpmApiKey}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            // Transform the API response to match our interface
            const transformedAssets = transformRPMAssets(data)
            setAssets(transformedAssets)
          } else {
            throw new Error('Failed to fetch assets from Ready Player Me')
          }
        } catch (apiError) {
          console.warn('Failed to fetch real assets, using mock data:', apiError)
          setAssets(mockAssets)
        }
      } else {
        // Use mock data if no API key is configured
        console.log('Using mock avatar assets for development')
        setAssets(mockAssets)
      }
    } catch (error) {
      console.error('Failed to load avatar assets:', error)
      setError('Failed to load customization options')
      setAssets(mockAssets) // Fallback to mock data
    } finally {
      setIsLoading(false)
    }
  }, [])

  const selectAsset = useCallback((categoryId: string, assetId: string) => {
    setSelectedAssets(prev => ({
      ...prev,
      [categoryId]: assetId
    }))
  }, [])

  const resetSelection = useCallback(() => {
    setSelectedAssets({})
  }, [])

  return {
    assets,
    selectedAssets,
    isLoading,
    error,
    loadAssets,
    selectAsset,
    resetSelection
  }
}

// Transform Ready Player Me API response to our interface
function transformRPMAssets(apiResponse: any): AssetCategory[] {
  // This would transform the actual Ready Player Me API response
  // For now, return mock data
  return mockAssets
}