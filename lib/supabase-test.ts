// Supabase Connection Test Utility
// Run this in browser console to test Supabase connectivity

async function testSupabaseConnection() {
  console.log('🔗 Testing Supabase Connection...')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Environment Check:')
  console.log('- URL configured:', !!supabaseUrl)
  console.log('- Key configured:', !!supabaseKey)
  console.log('- URL format:', supabaseUrl?.slice(0, 30) + '...')
  console.log('- Key format:', supabaseKey?.slice(0, 10) + '...')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    return false
  }
  
  try {
    // Test 1: Basic REST API connectivity
    console.log('🔗 Testing REST API connectivity...')
    const restResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (!restResponse.ok) {
      throw new Error(`REST API failed: ${restResponse.status} ${restResponse.statusText}`)
    }
    
    console.log('✅ REST API connectivity successful')
    
    // Test 2: Auth API connectivity
    console.log('🔗 Testing Auth API connectivity...')
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    })
    
    if (!authResponse.ok) {
      throw new Error(`Auth API failed: ${authResponse.status} ${authResponse.statusText}`)
    }
    
    const authSettings = await authResponse.json()
    console.log('✅ Auth API connectivity successful')
    console.log('- Auth settings:', authSettings)
    
    // Test 3: Supabase client initialization
    console.log('🔗 Testing Supabase client...')
    const { createBrowserClient } = await import('@supabase/ssr')
    const supabase = createBrowserClient(supabaseUrl, supabaseKey)
    
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      throw new Error(`Client test failed: ${error.message}`)
    }
    
    console.log('✅ Supabase client test successful')
    console.log('- Session data:', data)
    
    return true
    
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

// Export for use
if (typeof window !== 'undefined') {
  // @ts-ignore - Adding to window for debugging
  window.testSupabaseConnection = testSupabaseConnection
}

export { testSupabaseConnection }