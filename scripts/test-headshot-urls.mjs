import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUrls() {
  const { data: children } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url, avatar_headshot_url')
    .not('avatar_url', 'is', null)

  console.log('Testing headshot URLs...\n')

  for (const child of children) {
    console.log(`${child.name}:`)
    console.log(`  Headshot URL: ${child.avatar_headshot_url}`)
    
    try {
      const response = await fetch(child.avatar_headshot_url)
      console.log(`  Status: ${response.status} ${response.statusText}`)
      console.log(`  Content-Type: ${response.headers.get('content-type')}`)
      console.log(`  ✅ URL is accessible\n`)
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`)
    }
  }
}

testUrls().catch(console.error)