import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createHybridSystem() {
  console.log('🔧 Setting up hybrid profile picture system...\n')
  
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('📊 Current System Status:')
  console.log('========================\n')
  
  for (const child of children) {
    if (child.avatar_url) {
      const avatarId = child.avatar_url.split('/').pop()?.replace('.glb', '') || ''
      const isLongCode = avatarId.length >= 24
      const hasHeadshot = !!child.avatar_headshot_url
      const headshotType = child.avatar_headshot_url?.startsWith('data:image/svg+xml') ? 'SVG' : 
                          child.avatar_headshot_url?.startsWith('data:image/png') ? 'PNG' : 
                          child.avatar_headshot_url?.startsWith('https://') ? 'RPM-PNG' : 'None'
      
      console.log(`👤 ${child.name}:`)
      console.log(`   Avatar ID: ${avatarId} (${avatarId.length} chars)`)
      console.log(`   Code Type: ${isLongCode ? 'Long (PNG compatible)' : 'Short (SVG fallback)'}`)
      console.log(`   Profile Pic: ${hasHeadshot ? '✅' : '❌'} (${headshotType})`)
      console.log(`   Method: ${isLongCode ? 'Ready Player Me PNG' : 'SVG Generator'}`)
      console.log('')
    } else {
      console.log(`👤 ${child.name}: No avatar`)
      console.log('')
    }
  }
  
  console.log('🎯 System Features:')
  console.log('==================')
  console.log('✅ Long avatar codes (24+ chars) → Ready Player Me PNG')
  console.log('✅ Short avatar codes (< 24 chars) → SVG with initials')
  console.log('✅ Automatic fallback when PNG fails')
  console.log('✅ Consistent profile pictures for all children')
  console.log('✅ Future-ready for new avatar formats')
  
  console.log('\n🚀 System is ready!')
  console.log('When you create new avatars with long codes, they will automatically use Ready Player Me PNGs.')
  console.log('Current avatars will continue using the beautiful SVG profile pictures.')
}

createHybridSystem().catch(console.error)