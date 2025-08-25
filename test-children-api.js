// Test the /api/children endpoint directly using service role
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

async function testChildrenAPI() {
  console.log('Testing children API with service role...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Test direct database access
    console.log('\n1. Direct database query (should work):')
    const { data: allChildren, error: directError } = await supabase
      .from('ChildProfile')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (directError) {
      console.error('Direct query error:', directError)
    } else {
      console.log(`Found ${allChildren?.length || 0} children directly:`)
      allChildren?.forEach(child => {
        console.log(`- ${child.name} (${child.access_code}) - educator: ${child.educator_id}`)
      })
    }

    // Test API endpoint
    console.log('\n2. Testing API endpoint:')
    const response = await fetch('http://localhost:3001/api/children')
    console.log('API Status:', response.status)
    
    if (response.ok) {
      const apiData = await response.json()
      console.log('API Response:', apiData)
    } else {
      const errorText = await response.text()
      console.log('API Error:', errorText)
    }

  } catch (error) {
    console.error('Test error:', error)
  }
}

testChildrenAPI().catch(console.error)
