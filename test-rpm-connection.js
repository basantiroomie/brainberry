#!/usr/bin/env node

/**
 * Test Ready Player Me API Connection
 * This script tests the RPM API key and basic functionality
 */

const https = require('https');

const RPM_API_KEY = 'sk_live_zQECciqf9cxCcyxRzgf3zMxEhCh6WB3PjhJB';
const MALE_TEMPLATE_ID = '645cd1eff23d0562d3f9d290';

async function testRPMConnection() {
  console.log('🧪 Testing Ready Player Me API Connection...\n');

  try {
    // Test 1: Check API key validity by creating a draft avatar
    console.log('1. Testing API key validity...');
    
    const createDraftResponse = await fetch(`https://api.readyplayer.me/v2/avatars/templates/${MALE_TEMPLATE_ID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RPM_API_KEY}`
      },
      body: JSON.stringify({
        partner: "brainberry",
        data: { bodyType: "fullbody" }
      })
    });

    if (createDraftResponse.ok) {
      const draftData = await createDraftResponse.json();
      console.log('✅ API key is valid');
      console.log('✅ Draft avatar created:', draftData.data.id);
      
      // Test 2: Try to get avatar info
      const avatarId = draftData.data.id;
      const getAvatarResponse = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
        headers: {
          'Authorization': `Bearer ${RPM_API_KEY}`
        }
      });
      
      if (getAvatarResponse.ok) {
        console.log('✅ Avatar info retrieval works');
      } else {
        console.log('❌ Avatar info retrieval failed:', getAvatarResponse.status);
      }
      
    } else {
      const errorData = await createDraftResponse.json();
      console.log('❌ API key test failed:', createDraftResponse.status);
      console.log('Error details:', JSON.stringify(errorData, null, 2));
    }

    // Test 3: Check if we can list available assets (if endpoint exists)
    console.log('\n2. Testing asset listing...');
    const assetsResponse = await fetch('https://api.readyplayer.me/v1/assets', {
      headers: {
        'Authorization': `Bearer ${RPM_API_KEY}`
      }
    });

    if (assetsResponse.ok) {
      console.log('✅ Assets API is accessible');
    } else {
      console.log('⚠️  Assets API not accessible (this might be normal):', assetsResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testRPMConnection();