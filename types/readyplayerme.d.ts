// Ready Player Me TypeScript definitions
declare module '@readyplayerme/react-avatar-creator' {
  import { ReactNode } from 'react'
  import { Object3D } from 'three'

  export interface AvatarProps {
    modelSrc: string
    cameraTarget?: number
    cameraInitialDistance?: number
    onModelLoad?: (model: Object3D) => void
    style?: React.CSSProperties
    className?: string
  }

  export interface AvatarCreatorConfig {
    subdomain: string
    quickStart?: boolean
    clearCache?: boolean
  }

  export interface AssetCategory {
    id: string
    name: string
    assets: Asset[]
  }

  export interface Asset {
    id: string
    name: string
    thumbnail: string
    url: string
    category: string
  }

  export interface AvatarCreatorHookReturn {
    avatarUrl: string | null
    isLoading: boolean
    error: string | null
    getAssets: () => Promise<AssetCategory[]>
    changeAssets: (assets: Record<string, string>) => Promise<void>
    updateAvatar: (config: any) => Promise<string>
  }

  export const Avatar: React.FC<AvatarProps>
  export function useAvatarCreator(config: AvatarCreatorConfig): AvatarCreatorHookReturn
}

// Ready Player Me API Types
export interface ReadyPlayerMeConfig {
  id: string
  assets: Record<string, string> // category -> asset_id mapping
  morphTargets?: Record<string, number>
  metadata?: {
    created_from_photo: boolean
    last_customized: string
    customization_count: number
  }
}

export interface CreateAvatarFromPhotoRequest {
  type: 'photo'
  image: string // Public URL to the image
  gender?: 'male' | 'female'
  bodyType?: 'fullbody' | 'halfbody'
}

export interface CreateAvatarFromPhotoResponse {
  data: {
    id: string
    renders: Array<{
      url: string
      type: string
    }>
  }
}

export interface RPMApiError {
  error: {
    message: string
    code: string
  }
}