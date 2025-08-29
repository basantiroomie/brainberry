async function quickTest() {
  console.log('🧪 Quick avatar endpoint test...')
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch('http://localhost:3000/api/children/b3a5d160-944c-4207-be41-86d8a768fcac/avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_url: 'https://models.readyplayer.me/TEST.glb' }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    
    console.log(`Status: ${response.status}`)
    const text = await response.text()
    console.log(`Response: ${text.substring(0, 200)}...`)
    
    if (response.status === 401) {
      console.log('✅ Endpoint working - returns proper 401 for unauthenticated requests')
    } else {
      console.log('📝 Unexpected response')
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Request timed out - server might be slow')
    } else {
      console.error('❌ Error:', error.message)
    }
  }
}

quickTest()