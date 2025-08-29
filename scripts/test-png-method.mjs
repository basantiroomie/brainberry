import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPNGMethod() {
  console.log('🔍 Testing PNG method for current avatars...\n')
  
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url')
    .not('avatar_url', 'is', null)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  for (const child of children) {
    const avatarId = child.avatar_url.split('/').pop()?.replace('.glb', '') || ''
    const pngUrl = child.avatar_url.replace('.glb', '.png')
    
    console.log(`👤 ${child.name}:`)
    console.log(`   Avatar ID: ${avatarId} (${avatarId.length} chars)`)
    console.log(`   PNG URL: ${pngUrl}`)
    
    if (avatarId.length >= 24) {
      console.log(`   ✅ Long code - PNG method should work`)
      
      // Test the PNG URL
      try {
        const response = await fetch(pngUrl)
        console.log(`   Status: ${response.status} ${response.statusText}`)
        
        if (response.status === 200) {
          console.log(`   🎉 PNG URL works! Updating database...`)
          
          const { error: updateError } = await supabase
            .from('ChildProfile')
            .update({ avatar_headshot_url: pngUrl })
            .eq('id', child.id)
          
          if (!updateError) {
            console.log(`   ✅ Updated ${child.name} with PNG headshot`)
          }
        } else {
          console.log(`   ❌ PNG URL failed`)
        }
      } catch (error) {
        console.log(`   ❌ Error testing PNG: ${error.message}`)
      }
    } else {
      console.log(`   ⚠️  Short code - will use SVG fallback`)
    }
    
    console.log('')
  }
}

testPNGMethod().catch(console.error)