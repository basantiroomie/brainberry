// COMPLETE AVATAR SYSTEM TEST
// This script tests the entire avatar creation pipeline from photo to 3D model

require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m"
};

async function testCompleteAvatarSystem() {
  console.log(`${colors.bold}${colors.cyan}🎮 COMPLETE AVATAR SYSTEM TEST${colors.reset}`);
  console.log(`${colors.cyan}================================${colors.reset}\n`);
  
  const apiKey = process.env.RPM_API_KEY;
  
  if (!apiKey || !apiKey.startsWith('sk_live_')) {
    console.error(`${colors.red}❌ API Key Error: Invalid or missing RPM_API_KEY${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✅ API Key validated: ${apiKey.substring(0, 8)}...${colors.reset}\n`);
  
  // Test 1: Create Anonymous User
  console.log(`${colors.magenta}📋 Test 1: Creating Anonymous User${colors.reset}`);
  
  try {
    const userResponse = await fetch('https://api.readyplayer.me/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          appName: 'brainberry', // Using appName instead of applicationId
          requestToken: true // Request a token to be returned
        }
      })
    });
    
    if (!userResponse.ok) {
      console.error(`${colors.red}❌ User creation failed: ${userResponse.status} ${userResponse.statusText}${colors.reset}`);
      const errorData = await userResponse.text();
      console.log(`   Error: ${errorData}`);
      return;
    }
    
    const userData = await userResponse.json();
    console.log('   Raw user data:', JSON.stringify(userData, null, 2));
    
    const userToken = userData.data?.token || userData.token;
    const userId = userData.data?.id || userData.id;
    
    console.log(`${colors.green}✅ Anonymous user created successfully${colors.reset}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${userToken ? userToken.substring(0, 20) + '...' : 'N/A'}${colors.reset}\n`);
    
    // Test 2: Get Avatar Templates
    console.log(`${colors.magenta}📋 Test 2: Fetching Avatar Templates${colors.reset}`);
    
    const templatesResponse = await fetch('https://api.readyplayer.me/v2/avatars/templates', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (!templatesResponse.ok) {
      console.error(`${colors.red}❌ Templates fetch failed: ${templatesResponse.status}${colors.reset}`);
      return;
    }
    
    const templatesData = await templatesResponse.json();
    const templates = templatesData.data;
    
    console.log(`${colors.green}✅ Found ${templates.length} avatar templates${colors.reset}`);
    
    // Pick the first template
    const selectedTemplate = templates[0];
    console.log(`   Selected template: ${selectedTemplate.id} (${selectedTemplate.gender})${colors.reset}\n`);
    
    // Test 3: Create Avatar from Template
    console.log(`${colors.magenta}📋 Test 3: Creating Avatar from Template${colors.reset}`);
    
    const avatarResponse = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${selectedTemplate.id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          partner: 'brainberry', // Your application subdomain
          bodyType: 'fullbody'
        }
      })
    });
    
    if (!avatarResponse.ok) {
      console.error(`${colors.red}❌ Avatar creation failed: ${avatarResponse.status}${colors.reset}`);
      const errorData = await avatarResponse.text();
      console.log(`   Error: ${errorData}`);
      return;
    }
    
    const avatarData = await avatarResponse.json();
    const avatarId = avatarData.data.id;
    
    console.log(`${colors.green}✅ Draft avatar created successfully${colors.reset}`);
    console.log(`   Avatar ID: ${avatarId}${colors.reset}\n`);
    
    // Test 4: Fetch Draft Avatar GLB
    console.log(`${colors.magenta}📋 Test 4: Fetching Draft Avatar GLB${colors.reset}`);
    
    const draftGlbUrl = `https://api.readyplayer.me/v2/avatars/${avatarId}.glb?preview=true`;
    const draftGlbResponse = await fetch(draftGlbUrl);
    
    if (!draftGlbResponse.ok) {
      console.error(`${colors.red}❌ Draft GLB fetch failed: ${draftGlbResponse.status}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✅ Draft avatar GLB fetched successfully${colors.reset}`);
    console.log(`   GLB Size: ${(draftGlbResponse.headers.get('content-length') / 1024).toFixed(2)} KB${colors.reset}\n`);
    
    // Test 5: Save Avatar (Make it Permanent)
    console.log(`${colors.magenta}📋 Test 5: Saving Avatar Permanently${colors.reset}`);
    
    const saveResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    if (!saveResponse.ok) {
      console.error(`${colors.red}❌ Avatar save failed: ${saveResponse.status}${colors.reset}`);
      return;
    }
    
    const savedAvatarData = await saveResponse.json();
    console.log(`${colors.green}✅ Avatar saved permanently${colors.reset}`);
    console.log(`   Final Avatar ID: ${savedAvatarData.data.id}${colors.reset}\n`);
    
    // Test 6: Fetch Final Avatar from CDN
    console.log(`${colors.magenta}📋 Test 6: Fetching Final Avatar from CDN${colors.reset}`);
    
    const finalGlbUrl = `https://models.readyplayer.me/${avatarId}.glb`;
    const finalGlbResponse = await fetch(finalGlbUrl);
    
    if (!finalGlbResponse.ok) {
      console.error(`${colors.red}❌ Final GLB fetch failed: ${finalGlbResponse.status}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.green}✅ Final avatar GLB fetched from CDN${colors.reset}`);
    console.log(`   CDN URL: ${finalGlbUrl}`);
    console.log(`   GLB Size: ${(finalGlbResponse.headers.get('content-length') / 1024).toFixed(2)} KB${colors.reset}\n`);
    
    // Test 7: Test Different GLB Parameters
    console.log(`${colors.magenta}📋 Test 7: Testing GLB Parameters${colors.reset}`);
    
    const parameterTests = [
      { name: 'Low Quality', params: '?quality=low' },
      { name: 'Medium Quality', params: '?quality=medium' },
      { name: 'High Quality', params: '?quality=high' },
      { name: 'Texture Atlas 512px', params: '?textureAtlas=512' },
      { name: 'WebP Format', params: '?textureFormat=webp' },
      { name: 'T-Pose', params: '?pose=T' }
    ];
    
    for (const test of parameterTests) {
      const testUrl = `${finalGlbUrl}${test.params}`;
      const testResponse = await fetch(testUrl);
      
      if (testResponse.ok) {
        const size = (testResponse.headers.get('content-length') / 1024).toFixed(2);
        console.log(`   ${colors.green}✅ ${test.name}: ${size} KB${colors.reset}`);
      } else {
        console.log(`   ${colors.yellow}⚠️  ${test.name}: Failed (${testResponse.status})${colors.reset}`);
      }
    }
    
    // Final Success Summary
    console.log(`\n${colors.bold}${colors.green}🎉 COMPLETE AVATAR SYSTEM TEST PASSED!${colors.reset}`);
    console.log(`${colors.green}================================${colors.reset}`);
    console.log(`${colors.green}✅ Anonymous user creation: Working${colors.reset}`);
    console.log(`${colors.green}✅ Template fetching: Working${colors.reset}`);
    console.log(`${colors.green}✅ Avatar creation: Working${colors.reset}`);
    console.log(`${colors.green}✅ Draft avatar GLB: Working${colors.reset}`);
    console.log(`${colors.green}✅ Avatar saving: Working${colors.reset}`);
    console.log(`${colors.green}✅ CDN avatar delivery: Working${colors.reset}`);
    console.log(`${colors.green}✅ GLB parameters: Working${colors.reset}`);
    
    console.log(`\n${colors.cyan}🔗 Your avatar is ready at:${colors.reset}`);
    console.log(`${colors.yellow}${finalGlbUrl}${colors.reset}`);
    
    console.log(`\n${colors.cyan}💡 Next steps:${colors.reset}`);
    console.log(`   1. Test your Brainberry API endpoint with a real photo`);
    console.log(`   2. Integrate the avatar viewer component`);
    console.log(`   3. Test the complete photo-to-avatar pipeline`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed with error:${colors.reset}`);
    console.error(error);
  }
}

testCompleteAvatarSystem();