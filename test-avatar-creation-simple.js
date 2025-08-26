#!/usr/bin/env node

/**
 * Simple Avatar Creation Test
 * This script tests the avatar creation process step by step
 */

require('dotenv').config({ path: '.env.local' });

async function testAvatarCreationProcess() {
  console.log('🧪 Testing Avatar Creation Process...\n');

  const rpmApiKey = process.env.RPM_API_KEY;
  if (!rpmApiKey) {
    console.log('❌ RPM_API_KEY not found in environment');
    return;
  }

  console.log('✅ RPM API Key found:', rpmApiKey.substring(0, 8) + '...');

  try {
    // Step 1: Create anonymous user
    console.log('\n1. Creating anonymous user...');
    const userResponse = await fetch('https://api.readyplayer.me/v1/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${rpmApiKey}`
      },
      body: JSON.stringify({
        data: {
          appName: 'brainberry',
          requestToken: true
        }
      })
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.log('❌ User creation failed:', userResponse.status);
      console.log('Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const userData = await userResponse.json();
    const userToken = userData.data.token;
    const userId = userData.data.id;
    console.log('✅ User created:', userId);

    // Step 2: Create template avatar
    console.log('\n2. Creating template avatar...');
    const MALE_TEMPLATE_ID = '645cd1eff23d0562d3f9d290';
    
    const createResponse = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${MALE_TEMPLATE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        data: {
          partner: 'brainberry',
          bodyType: 'fullbody'
        }
      })
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.log('❌ Avatar creation failed:', createResponse.status);
      console.log('Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const avatarData = await createResponse.json();
    const avatarId = avatarData.data.id;
    console.log('✅ Avatar created:', avatarId);

    // Step 3: Save avatar permanently
    console.log('\n3. Saving avatar permanently...');
    const saveResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json();
      console.log('❌ Avatar save failed:', saveResponse.status);
      console.log('Error:', JSON.stringify(errorData, null, 2));
      return;
    }

    const finalAvatarUrl = `https://models.readyplayer.me/${avatarId}.glb`;
    console.log('✅ Avatar saved permanently');
    console.log('✅ Final URL:', finalAvatarUrl);

    // Step 4: Test avatar accessibility
    console.log('\n4. Testing avatar accessibility...');
    const testResponse = await fetch(finalAvatarUrl);
    if (testResponse.ok) {
      const size = testResponse.headers.get('content-length');
      console.log('✅ Avatar is accessible');
      console.log('   Size:', (size / 1024).toFixed(2), 'KB');
    } else {
      console.log('❌ Avatar not accessible:', testResponse.status);
    }

    console.log('\n🎉 Avatar creation process successful!');
    console.log('This confirms that the Ready Player Me API is working correctly.');
    console.log('The issue is likely in the web API endpoint authentication or form parsing.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAvatarCreationProcess();