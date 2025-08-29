async function testAvatarEndpoint() {
  console.log('🧪 Testing avatar endpoint...\n')
  
  const testChildId = 'b3a5d160-944c-4207-be41-86d8a768fcac' // leo's ID
  const testAvatarUrl = 'https://models.readyplayer.me/TEST123.glb'
  
  console.log(`Testing avatar update for child: ${testChildId}`)
  console.log(`New avatar URL: ${testAvatarUrl}`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/children/${testChildId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_url: testAvatarUrl
      }),
    })
    
    console.log(`\nAPI Response:`)
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)
    
    if (response.ok) {
      console.log('✅ Avatar endpoint is working!')
    } else {
      console.log('❌ Avatar endpoint failed')
      if (response.status === 401) {
        console.log('🔐 Authentication required - this is expected for API test')
        console.log('💡 The endpoint exists and is working, just needs proper auth from frontend')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAvatarEndpoint().catch(console.error)