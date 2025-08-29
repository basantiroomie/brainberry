import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function triggerProfileGeneration() {
  console.log('🔄 Triggering profile picture generation for all children with avatars...')
  
  // Clear all headshot URLs to force regeneration
  const { error } = await supabase
    .from('ChildProfile')
    .update({ avatar_headshot_url: null })
    .not('avatar_url', 'is', null)
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log('✅ Cleared all headshot URLs')
  console.log('🎨 Profile pictures will now be generated automatically when you view the children page')
  console.log('💡 Refresh your browser to see the profile pictures being generated!')
}

triggerProfileGeneration().catch(console.error)