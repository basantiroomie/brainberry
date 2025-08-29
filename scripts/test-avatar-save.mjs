import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAvatarSave() {
  console.log('🧪 Testing avatar save functionality...\n')
  
  // Get a child to test with
  const { data: children, error } = await supabase
    .from('ChildProfile')
    .select('id, name, avatar_url')
    .limit(1)
  
  if (error || !children || children.length === 0) {
    console.error('No children found for testing')
    return
  }
  
  const child = children[0]
  console.log(`Testing with child: ${child.name} (${child.id})`)
  
  // Test avatar code conversion
  const testCode = 'TEST01'
  console.log(`\nTesting avatar code: ${testCode}`)
  
  try {
    // Simulate what the frontend does
    const glbUrl = `https://models.readyplayer.me/${testCode}.glb`
    console.log(`Generated GLB URL: ${glbUrl}`)
    
    // Test the API call
    const response = await fetch(`http://localhost:3000/api/children/${child.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_url: glbUrl,
      }),
    })
    
    console.log(`\nAPI Response:`)
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Avatar save successful!')
      console.log('Response:', result)
    } else {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.log('❌ Avatar save failed!')
      console.log('Error:', errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAvatarSave().catch(console.error)