// Run this in the browser console while logged into the educator dashboard
// to test the avatar save functionality

async function testAvatarSave() {
  console.log('🧪 Testing avatar save from browser...')
  
  const testChildId = 'b3a5d160-944c-4207-be41-86d8a768fcac' // leo's ID
  const testAvatarUrl = 'https://models.readyplayer.me/BROWSERTEST.glb'
  
  console.log(`Testing avatar update for child: ${testChildId}`)
  console.log(`New avatar URL: ${testAvatarUrl}`)
  
  try {
    const response = await fetch(`/api/children/${testChildId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_url: testAvatarUrl
      }),
    })
    
    console.log(`API Response:`)
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    console.log(`Response: ${responseText}`)
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Avatar save successful!', result)
        return result
      } catch {
        console.log('✅ Request successful but response not JSON')
        return { success: true }
      }
    } else {
      console.log('❌ Avatar save failed!')
      if (response.status === 401) {
        console.log('🔐 Authentication failed - session may have expired')
      }
      return { error: responseText }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { error: error.message }
  }
}

// Run the test
testAvatarSave().then(result => {
  console.log('Test completed:', result)
})