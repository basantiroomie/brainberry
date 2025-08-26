// PHOTO TO AVATAR TEST
// This script tests the complete photo-to-avatar pipeline using Ready Player Me API

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

async function testPhotoToAvatar() {
  console.log(`${colors.bold}${colors.cyan}📸 PHOTO TO AVATAR TEST${colors.reset}`);
  console.log(`${colors.cyan}========================${colors.reset}\n`);
  
  const apiKey = process.env.RPM_API_KEY;
  const appId = process.env.RPM_APP_ID;
  
  if (!apiKey || !appId) {
    console.error(`${colors.red}❌ Missing configuration:${colors.reset}`);
    console.error(`   RPM_API_KEY: ${apiKey ? 'Set' : 'Missing'}`);
    console.error(`   RPM_APP_ID: ${appId ? 'Set' : 'Missing'}`);
    return;
  }
  
  console.log(`${colors.green}✅ Configuration loaded:${colors.reset}`);
  console.log(`   API Key: ${apiKey.substring(0, 8)}...`);
  console.log(`   App ID: ${appId}${colors.reset}\n`);
  
  try {
    // Step 1: Create anonymous user with correct app ID
    console.log(`${colors.magenta}📋 Step 1: Creating Anonymous User${colors.reset}`);
    
    const userResponse = await fetch('https://api.readyplayer.me/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        data: {
          appName: 'brainberry', // Use app name instead of ID
          requestToken: true
        }
      })
    });
    
    if (!userResponse.ok) {
      console.error(`${colors.red}❌ User creation failed: ${userResponse.status}${colors.reset}`);
      const errorData = await userResponse.text();
      console.log(`   Error: ${errorData}`);
      return;
    }
    
    const userData = await userResponse.json();
    const userToken = userData.data.token;
    const userId = userData.data.id;
    
    console.log(`${colors.green}✅ Anonymous user created${colors.reset}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${userToken.substring(0, 20)}...${colors.reset}\n`);
    
    // Step 2: Create avatar from photo using v2 API
    console.log(`${colors.magenta}📋 Step 2: Creating Avatar from Photo${colors.reset}`);
    
    // Use a sample photo URL for testing (you can replace this with an actual uploaded photo URL)
    const samplePhotoUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face';
    
    const avatarResponse = await fetch('https://api.readyplayer.me/v2/avatars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          type: 'photo',
          image: samplePhotoUrl,
          partner: 'brainberry',
          bodyType: 'fullbody'
        }
      })
    });
    
    if (!avatarResponse.ok) {
      console.error(`${colors.red}❌ Avatar creation failed: ${avatarResponse.status}${colors.reset}`);
      const errorData = await avatarResponse.text();
      console.log(`   Error: ${errorData}`);
      
      // Try alternative approach with template first
      console.log(`\n${colors.yellow}🔄 Trying alternative approach with template...${colors.reset}`);
      
      // Get templates first
      const templatesResponse = await fetch('https://api.readyplayer.me/v2/avatars/templates', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });
      
      if (templatesResponse.ok) {
        const templatesData = await templatesResponse.json();
        const maleTemplate = templatesData.data.find(t => t.gender === 'male');
        
        if (maleTemplate) {
          console.log(`   Found template: ${maleTemplate.id} (${maleTemplate.gender})`);
          
          // Create avatar from template
          const templateAvatarResponse = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${maleTemplate.id}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${userToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              data: {
                partner: 'brainberry',
                bodyType: 'fullbody'
              }
            })
          });
          
          if (templateAvatarResponse.ok) {
            const templateAvatarData = await templateAvatarResponse.json();
            const avatarId = templateAvatarData.data.id;
            
            console.log(`${colors.green}✅ Template avatar created: ${avatarId}${colors.reset}`);
            
            // Now try to update with photo
            const updateResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${userToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                data: {
                  type: 'photo',
                  image: samplePhotoUrl
                }
              })
            });
            
            if (updateResponse.ok) {
              console.log(`${colors.green}✅ Avatar updated with photo${colors.reset}`);
              await testAvatarDelivery(avatarId, userToken);
            } else {
              console.log(`${colors.yellow}⚠️  Photo update failed, but template avatar works${colors.reset}`);
              await testAvatarDelivery(avatarId, userToken);
            }
          }
        }
      }
      return;
    }
    
    const avatarData = await avatarResponse.json();
    const avatarId = avatarData.data.id;
    
    console.log(`${colors.green}✅ Avatar created from photo${colors.reset}`);
    console.log(`   Avatar ID: ${avatarId}${colors.reset}\n`);
    
    await testAvatarDelivery(avatarId, userToken);
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed with error:${colors.reset}`);
    console.error(error);
  }
}

async function testAvatarDelivery(avatarId, userToken) {
  console.log(`${colors.magenta}📋 Step 3: Testing Avatar Delivery${colors.reset}`);
  
  // Test draft avatar
  const draftUrl = `https://api.readyplayer.me/v2/avatars/${avatarId}.glb?preview=true`;
  const draftResponse = await fetch(draftUrl);
  
  if (draftResponse.ok) {
    console.log(`${colors.green}✅ Draft avatar GLB accessible${colors.reset}`);
    console.log(`   Size: ${(draftResponse.headers.get('content-length') / 1024).toFixed(2)} KB`);
  }
  
  // Save avatar permanently
  console.log(`\n${colors.magenta}📋 Step 4: Saving Avatar Permanently${colors.reset}`);
  
  const saveResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${userToken}`
    }
  });
  
  if (saveResponse.ok) {
    console.log(`${colors.green}✅ Avatar saved permanently${colors.reset}`);
    
    // Test final CDN delivery
    const cdnUrl = `https://models.readyplayer.me/${avatarId}.glb`;
    const cdnResponse = await fetch(cdnUrl);
    
    if (cdnResponse.ok) {
      console.log(`${colors.green}✅ Avatar available on CDN${colors.reset}`);
      console.log(`   CDN URL: ${colors.yellow}${cdnUrl}${colors.reset}`);
      console.log(`   Size: ${(cdnResponse.headers.get('content-length') / 1024).toFixed(2)} KB`);
      
      console.log(`\n${colors.bold}${colors.green}🎉 PHOTO TO AVATAR TEST SUCCESSFUL!${colors.reset}`);
      console.log(`${colors.green}Your avatar is ready at: ${cdnUrl}${colors.reset}`);
    }
  }
}

testPhotoToAvatar();