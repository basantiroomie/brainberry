import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixHeadshots() {
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
    .not('avatar_url', 'is', null)

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Processing ${children.length} children...`)

  for (const child of children) {
    if (child.avatar_url && child.avatar_url.includes('readyplayer.me')) {
      // Extract avatar ID from .glb URL
      const avatarId = child.avatar_url.split('/').pop().replace('.glb', '')
      const correctHeadshotUrl = `https://models.readyplayer.me/${avatarId}.png`
      
      console.log(`${child.name}: Updating headshot to ${correctHeadshotUrl}`)
      
      const { error: updateError } = await supabase
        .from('ChildProfile')
        .update({ avatar_headshot_url: correctHeadshotUrl })
        .eq('id', child.id)
      
      if (updateError) {
        console.error(`Error updating ${child.name}:`, updateError)
      } else {
        console.log(`✅ Updated ${child.name}`)
      }
    }
  }
  
  console.log('✅ All headshots updated!')
}

fixHeadshots().catch(console.error)