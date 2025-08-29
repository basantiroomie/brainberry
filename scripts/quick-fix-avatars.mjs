import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixAvatars() {
  // Get children with avatars but potentially broken headshots
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
    .not('avatar_url', 'is', null)

  if (error) {
    console.error('Error fetching children:', error)
    return
  }

  console.log(`Found ${children.length} children with avatars`)

  for (const child of children) {
    console.log(`\n${child.name} (${child.id}):`)
    console.log(`Avatar URL: ${child.avatar_url ? 'EXISTS' : 'MISSING'}`)
    console.log(`Headshot URL: ${child.avatar_headshot_url ? 'EXISTS' : 'MISSING'}`)
    
    // If avatar exists but headshot is missing or broken, generate new one
    if (child.avatar_url && (!child.avatar_headshot_url || child.avatar_headshot_url.includes('placeholder'))) {
      console.log(`Fixing headshot for ${child.name}...`)
      
      // Use Ready Player Me's built-in headshot URL
      const avatarId = child.avatar_url.split('/').pop().replace('.glb', '')
      const headshotUrl = `https://models.readyplayer.me/${avatarId}.png`
      
      const { error: updateError } = await supabase
        .from('ChildProfile')
        .update({ avatar_headshot_url: headshotUrl })
        .eq('id', child.id)
      
      if (updateError) {
        console.error(`Error updating ${child.name}:`, updateError)
      } else {
        console.log(`✅ Fixed headshot for ${child.name}`)
      }
    }
  }
}

fixAvatars().catch(console.error)