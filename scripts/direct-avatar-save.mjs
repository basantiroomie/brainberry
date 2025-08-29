import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function directAvatarSave() {
  console.log('🔧 Testing direct avatar save via Supabase...\n')
  
  // Get a child to test with
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
    .limit(1)
  
  if (error || !children || children.length === 0) {
    console.error('No children found for testing')
    return
  }
  
  const child = children[0]
  console.log(`Testing with child: ${child.name} (${child.id})`)
  console.log(`Current avatar: ${child.avatar_url || 'None'}`)
  console.log(`Current headshot: ${child.avatar_headshot_url ? 'Yes' : 'None'}`)
  
  // Test avatar save
  const testCode = 'NEWAV1'
  const newGlbUrl = `https://models.readyplayer.me/${testCode}.glb`
  
  console.log(`\nSaving new avatar: ${newGlbUrl}`)
  
  try {
    const { data: updatedChild, error: updateError } = await supabase
      .from('ChildProfile')
      .update({
        avatar_url: newGlbUrl,
        avatar_headshot_url: null // Clear to trigger regeneration
      })
      .eq('id', child.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('❌ Direct save failed:', updateError)
    } else {
      console.log('✅ Direct save successful!')
      console.log('Updated child:', {
        id: updatedChild.id,
        name: updatedChild.name,
        avatar_url: updatedChild.avatar_url,
        avatar_headshot_url: updatedChild.avatar_headshot_url
      })
      
      // Restore original avatar
      console.log('\nRestoring original avatar...')
      await supabase
        .from('ChildProfile')
        .update({
          avatar_url: child.avatar_url,
          avatar_headshot_url: child.avatar_headshot_url
        })
        .eq('id', child.id)
      
      console.log('✅ Original avatar restored')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

directAvatarSave().catch(console.error)