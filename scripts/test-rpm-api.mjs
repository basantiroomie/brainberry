import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testRPMAPI() {
  const { data: children } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url')
    .not('avatar_url', 'is', null)
    .limit(1)

  if (!children || children.length === 0) {
    console.log('No children with avatars found')
    return
  }

  const child = children[0]
  const avatarId = child.avatar_url.split('/').pop()?.replace('.glb', '') || ''
  
  console.log(`Testing Ready Player Me API for ${child.name} (${avatarId})...`)
  
  // Test different URL formats
  const testUrls = [
    `https://models.readyplayer.me/${avatarId}.png`,
    `https://models.readyplayer.me/${avatarId}.png?camera=portrait`,
    `https://models.readyplayer.me/${avatarId}.png?camera=portrait&size=256`,
    `https://models.readyplayer.me/${avatarId}.png?camera=fullbody&size=256`,
    `https://api.readyplayer.me/v1/avatars/${avatarId}.png`,
    `https://api.readyplayer.me/v1/avatars/${avatarId}.png?camera=portrait&size=256`
  ]
  
  for (const url of testUrls) {
    try {
      console.log(`\nTesting: ${url}`)
      const response = await fetch(url)
      console.log(`Status: ${response.status} ${response.statusText}`)
      console.log(`Content-Type: ${response.headers.get('content-type')}`)
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! This URL works')
        
        // Update the child with working URL
        const { error } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: url })
          .eq('id', child.id)
        
        if (!error) {
          console.log(`✅ Updated ${child.name} with working headshot URL`)
        }
        break
      } else {
        console.log('❌ Failed')
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
    }
  }
}

testRPMAPI().catch(console.error)