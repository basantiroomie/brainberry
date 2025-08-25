// Avatar Environment Configuration
export const avatarEnvConfig = {
  // Ready Player Me Configuration
  rpm: {
    apiKey: process.env.RPM_API_KEY || '',
    baseUrl: 'https://api.readyplayer.me/v2',
    subdomain: process.env.RPM_SUBDOMAIN || 'brainberry', // Default subdomain
    endpoints: {
      createFromPhoto: '/avatars',
      getAssets: '/assets',
      updateAvatar: '/avatars'
    }
  },

  // ElevenLabs Configuration (Optional)
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    baseUrl: 'https://api.elevenlabs.io/v1',
    freeCharacterLimit: 10000 // Free tier limit per month
  },

  // Supabase Storage Configuration
  storage: {
    buckets: {
      avatarPhotos: 'avatar-photos',
      avatarHeadshots: 'avatar-headshots'
    },
    policies: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
    }
  },

  // Avatar System Configuration
  avatar: {
    defaultCameraDistance: 1.5,
    headshotCameraDistance: 0.8,
    animationFrameRate: 60,
    blendShapeUpdateRate: 30, // Updates per second for facial animations
    idleAnimationInterval: {
      min: 2000, // Minimum 2 seconds between blinks
      max: 5000  // Maximum 5 seconds between blinks
    }
  }
}

// Validation functions
export function validateRPMConfig(): boolean {
  if (!avatarEnvConfig.rpm.apiKey) {
    console.warn('Ready Player Me API key not configured. Avatar creation will not work.')
    return false
  }
  return true
}

export function validateElevenLabsConfig(): boolean {
  if (!avatarEnvConfig.elevenLabs.apiKey) {
    console.info('ElevenLabs API key not configured. Using browser TTS instead.')
    return false
  }
  return true
}

export function validateStorageConfig(): boolean {
  // Check if required environment variables are present
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`)
      return false
    }
  }
  return true
}

// Initialize and validate all configurations
export function initializeAvatarConfig(): {
  rpm: boolean
  elevenLabs: boolean
  storage: boolean
} {
  return {
    rpm: validateRPMConfig(),
    elevenLabs: validateElevenLabsConfig(),
    storage: validateStorageConfig()
  }
}

// Get configuration status for debugging
export function getConfigStatus() {
  const status = initializeAvatarConfig()
  
  console.log('Avatar System Configuration Status:')
  console.log('- Ready Player Me:', status.rpm ? '✅ Configured' : '❌ Missing API key')
  console.log('- ElevenLabs TTS:', status.elevenLabs ? '✅ Configured' : '⚠️ Using browser TTS')
  console.log('- Supabase Storage:', status.storage ? '✅ Configured' : '❌ Missing configuration')
  
  return status
}