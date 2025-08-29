import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ixqkqvfqtlpbpkwvgzpn.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ Missing Supabase key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function forceRegenerateProfilePics() {
  console.log('🔄 Force regenerating profile pictures...')
  
  // Get all children with avatars
  const { data: children, error } = await supabase
    .from('child_profiles')
    .select('id, name, avatar_url')
    .not('avatar_url', 'is', null)
  
  if (error) {
    console.error('❌ Error fetching children:', error)
    return
  }
  
  console.log(`📋 Found ${children.length} children with avatars`)
  
  for (const child of children) {
    console.log(`🔄 Processing ${child.name}...`)
    
    try {
      // Call the save-snapshot API to regenerate profile picture
      const response = await fetch('http://localhost:3000/api/avatars/save-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: child.id,
          avatarUrl: child.avatar_url,
          forceRegenerate: true
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${child.name}: Profile picture regenerated`)
      } else {
        console.log(`⚠️ ${child.name}: API call failed - ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${child.name}: Error - ${error.message}`)
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('🎉 Profile picture regeneration complete!')
}

forceRegenerateProfilePics()