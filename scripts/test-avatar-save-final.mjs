async function testAvatarSave() {
  console.log('🧪 Testing avatar save with main endpoint...\n')
  
  const testChildId = 'b3a5d160-944c-4207-be41-86d8a768fcac' // leo's ID
  const testAvatarUrl = 'https://models.readyplayer.me/TESTFINAL.glb'
  
  console.log(`Testing avatar update for child: ${testChildId}`)
  console.log(`New avatar URL: ${testAvatarUrl}`)
  
  try {
    const response = await fetch(`http://localhost:3000/api/children/${testChildId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        avatar_url: testAvatarUrl,
        avatar_headshot_url: null
      }),
    })
    
    console.log(`\nAPI Response:`)
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    const responseText = await response.text()
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText)
        console.log('✅ Avatar save successful!')
        console.log('Updated child:', {
          id: result.child?.id || result.id,
          name: result.child?.name || result.name,
          avatar_url: result.child?.avatar_url || result.avatar_url
        })
      } catch {
        console.log('✅ Request successful but response parsing failed')
        console.log('Response:', responseText.substring(0, 200))
      }
    } else {
      console.log('❌ Avatar save failed')
      console.log('Response:', responseText.substring(0, 500))
      
      if (response.status === 401) {
        console.log('🔐 Authentication required - this is expected for API test')
        console.log('💡 The endpoint should work when called from authenticated frontend')
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAvatarSave().catch(console.error)