import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixHeadshots() {
  const { data: children } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
    .not('avatar_url', 'is', null)

  console.log('Fixing Ready Player Me headshot URLs...\n')

  for (const child of children) {
    if (child.avatar_url && child.avatar_url.includes('readyplayer.me')) {
      // Extract avatar ID from .glb URL
      const avatarId = child.avatar_url.split('/').pop().replace('.glb', '')
      
      // Try different Ready Player Me headshot URL formats
      const possibleUrls = [
        `https://models.readyplayer.me/${avatarId}.png?morphTargets=ARKit&textureAtlas=1024`,
        `https://api.readyplayer.me/v1/avatars/${avatarId}.png`,
        `https://render.readyplayer.me/render/${avatarId}.png`,
        child.avatar_url.replace('.glb', '.png') // Original attempt
      ]
      
      console.log(`Testing URLs for ${child.name} (${avatarId})...`)
      
      let workingUrl = null
      for (const url of possibleUrls) {
        try {
          const response = await fetch(url)
          console.log(`  ${url} -> ${response.status}`)
          if (response.status === 200) {
            workingUrl = url
            break
          }
        } catch (error) {
          console.log(`  ${url} -> Error: ${error.message}`)
        }
      }
      
      if (workingUrl) {
        console.log(`  ✅ Found working URL: ${workingUrl}`)
        
        const { error } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: workingUrl })
          .eq('id', child.id)
        
        if (error) {
          console.log(`  ❌ Error updating: ${error.message}`)
        } else {
          console.log(`  ✅ Updated ${child.name}`)
        }
      } else {
        console.log(`  ❌ No working URL found for ${child.name}`)
        // Fall back to using the GLB URL directly
        const { error } = await supabase
          .from('ChildProfile')
          .update({ avatar_headshot_url: child.avatar_url })
          .eq('id', child.id)
        
        if (!error) {
          console.log(`  ✅ Set to use GLB URL for ${child.name}`)
        }
      }
      
      console.log('')
    }
  }
}

fixHeadshots().catch(console.error)