import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function finalTest() {
  console.log('🔍 Final Profile Picture Test\n')
  
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
  
  if (error) {
    console.error('❌ Error:', error)
    return
  }
  
  console.log(`📊 Found ${children.length} children\n`)
  
  let allHaveProfiles = true
  
  for (const child of children) {
    const hasAvatar = !!child.avatar_url
    const hasHeadshot = !!child.avatar_headshot_url
    const headshotType = child.avatar_headshot_url?.startsWith('data:image/svg+xml') ? 'SVG' : 
                        child.avatar_headshot_url?.startsWith('data:image/png') ? 'PNG' : 
                        child.avatar_headshot_url?.startsWith('https://') ? 'URL' : 'None'
    
    console.log(`👤 ${child.name}:`)
    console.log(`   Avatar: ${hasAvatar ? '✅' : '❌'}`)
    console.log(`   Profile Pic: ${hasHeadshot ? '✅' : '❌'} (${headshotType})`)
    
    if (!hasHeadshot) {
      allHaveProfiles = false
    }
    
    console.log('')
  }
  
  if (allHaveProfiles) {
    console.log('🎉 SUCCESS! All children have profile pictures!')
    console.log('✅ System is ready - refresh your browser to see the results!')
  } else {
    console.log('⚠️  Some children are missing profile pictures')
  }
}

finalTest().catch(console.error)