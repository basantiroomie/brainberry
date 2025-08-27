// Verification script for avatar system setup
const { AvatarCodeUtils } = require('../lib/avatar-service.ts')

console.log('🔍 Verifying Avatar System Setup...\n')

// Test avatar code validation
console.log('✅ Testing avatar code validation:')
const validCodes = ['LMSOND', 'ABCD12', '123456']
const invalidCodes = ['lmsond', 'ABCD1', 'ABCD123', 'ABCD!@', '']

validCodes.forEach(code => {
  const isValid = AvatarCodeUtils.validateAvatarCode(code)
  console.log(`  ${code}: ${isValid ? '✅ Valid' : '❌ Invalid'}`)
})

invalidCodes.forEach(code => {
  const isValid = AvatarCodeUtils.validateAvatarCode(code)
  console.log(`  "${code}": ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'}`)
})

// Test URL conversion
console.log('\n✅ Testing URL conversion:')
const testCode = 'LMSOND'
try {
  const glbUrl = AvatarCodeUtils.codeToGlbUrl(testCode)
  const pngUrl = AvatarCodeUtils.codeToPngUrl(testCode)
  const bothUrls = AvatarCodeUtils.codeToUrls(testCode)
  
  console.log(`  GLB URL: ${glbUrl}`)
  console.log(`  PNG URL: ${pngUrl}`)
  console.log(`  Both URLs: ${JSON.stringify(bothUrls, null, 2)}`)
} catch (error) {
  console.error(`  ❌ Error: ${error.message}`)
}

// Test URL extraction
console.log('\n✅ Testing URL extraction:')
const testGlbUrl = 'https://models.readyplayer.me/LMSOND.glb'
const testPngUrl = 'https://models.readyplayer.me/LMSOND.png'

const extractedFromGlb = AvatarCodeUtils.extractCodeFromGlbUrl(testGlbUrl)
const extractedFromPng = AvatarCodeUtils.extractCodeFromPngUrl(testPngUrl)

console.log(`  From GLB URL: ${extractedFromGlb}`)
console.log(`  From PNG URL: ${extractedFromPng}`)

// Test environment variables
console.log('\n✅ Checking environment variables:')
const requiredEnvVars = [
  'GEMINI_API_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar]
  console.log(`  ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`)
})

console.log('\n🎉 Avatar system setup verification complete!')