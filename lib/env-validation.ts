/**
 * Environment Variables Validation
 * This file validates all required environment variables are present
 */

interface EnvConfig {
  GEMINI_API_KEY: string
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  RPM_API_KEY?: string
  NEXT_PUBLIC_RPM_SUBDOMAIN?: string
  NODE_ENV: string
}

interface ValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
  config: Partial<EnvConfig>
}

export function validateEnvironment(): ValidationResult {
  const required = [
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const optional = [
    'RPM_API_KEY',
    'NEXT_PUBLIC_RPM_SUBDOMAIN'
  ]

  const missing: string[] = []
  const warnings: string[] = []
  const config: Partial<EnvConfig> = {}

  // Check required variables
  for (const key of required) {
    const value = process.env[key]
    if (!value) {
      missing.push(key)
    } else if (value.trim().length === 0) {
      missing.push(`${key} (empty)`)
    } else {
      // Store the value
      config[key as keyof EnvConfig] = value.trim()
      
      // Validate specific formats
      if (key === 'GEMINI_API_KEY') {
        if (!value.startsWith('AIza') && !value.startsWith('AI')) {
          warnings.push(`${key} may have invalid format (should start with 'AIza' or 'AI')`)
        }
        if (value.length < 30) {
          warnings.push(`${key} seems too short (expected 39+ characters)`)
        }
      }
      
      if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
        if (!value.includes('supabase.co')) {
          warnings.push(`${key} doesn't appear to be a valid Supabase URL`)
        }
      }
    }
  }

  // Check optional variables
  for (const key of optional) {
    const value = process.env[key]
    if (value) {
      config[key as keyof EnvConfig] = value.trim()
    } else {
      warnings.push(`${key} is not set (optional but recommended)`)
    }
  }

  // Add NODE_ENV
  config.NODE_ENV = process.env.NODE_ENV || 'development'

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    config
  }
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironment()
  
  console.log('🌍 Environment Validation Report')
  console.log('================================')
  console.log(`Environment: ${validation.config.NODE_ENV}`)
  console.log(`Status: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`)
  
  if (validation.missing.length > 0) {
    console.log('\n❌ Missing Required Variables:')
    validation.missing.forEach(key => console.log(`  - ${key}`))
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️ Warnings:')
    validation.warnings.forEach(warning => console.log(`  - ${warning}`))
  }
  
  console.log('\n🔑 Available Variables:')
  Object.entries(validation.config).forEach(([key, value]) => {
    if (key.includes('KEY') || key.includes('SECRET')) {
      console.log(`  - ${key}: ${value ? value.substring(0, 8) + '...' : 'NOT SET'}`)
    } else {
      console.log(`  - ${key}: ${value || 'NOT SET'}`)
    }
  })
  
  if (!validation.isValid) {
    console.log('\n🚨 Action Required:')
    console.log('Set missing environment variables in:')
    console.log('- Vercel Dashboard → Project → Settings → Environment Variables')
    console.log('- Or use: vercel env add VARIABLE_NAME')
    console.log('- Then redeploy: vercel --prod')
  }
}

// Auto-run validation in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logEnvironmentStatus()
}
