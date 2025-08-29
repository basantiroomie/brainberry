import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRPMHeadshots() {
  const { data: children } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url')
    .not('avatar_url', 'is', null)

  console.log('Fixing Ready Player Me headshot URLs using correct API format...\n')

  for (const child of children) {
    if (child.avatar_url && child.avatar_url.includes('readyplayer.me')) {
      // Extract avatar ID from .glb URL
      const avatarId = child.avatar_url.split('/').pop().replace('.glb', '')
      
      // Use the correct Ready Player Me API format from documentation
      const headshotUrl = `https://models.readyplayer.me/${avatarId}.png?camera=portrait&size=256`
      
      console.log(`${child.name}: Setting headshot to ${headshotUrl}`)
      
      // Test the URL first
      try {
        const response = await fetch(headshotUrl)
        console.log(`  Status: ${response.status}`)
        
        if (response.status === 200) {
          const { error } = await supabase
            .from('ChildProfile')
            .update({ avatar_headshot_url: headshotUrl })
            .eq('id', child.id)
          
          if (error) {
            console.log(`  ❌ Error updating: ${error.message}`)
          } else {
            console.log(`  ✅ Updated ${child.name}`)
          }
        } else {
          console.log(`  ❌ URL not accessible for ${child.name}`)
        }
      } catch (error) {
        console.log(`  ❌ Error testing URL: ${error.message}`)
      }
      
      console.log('')
    }
  }
}

fixRPMHeadshots().catch(console.error)