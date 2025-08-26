#!/usr/bin/env node

/**
 * Test Avatar Creation API Endpoint
 * This script tests the /api/avatars/create-from-photo endpoint
 */

const fs = require('fs');
const path = require('path');

async function testAvatarAPIEndpoint() {
  console.log('🧪 Testing Avatar Creation API Endpoint...\n');

  try {
    // Check if we have a test image
    const testImagePath = path.join(__dirname, 'test-avatar.png');
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found. Please add a test-avatar.png file to test with.');
      return;
    }

    // Read the test image
    const imageBuffer = fs.readFileSync(testImagePath);
    
    // Create form data
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('childId', '1cd3e2ec-3796-4854-89ca-3891051ab0ca'); // Use the child ID from the logs
    formData.append('photo', imageBuffer, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });

    console.log('📤 Sending avatar creation request...');
    console.log('   Child ID: 1cd3e2ec-3796-4854-89ca-3891051ab0ca');
    console.log('   Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Make the API request
    const response = await fetch('http://localhost:3000/api/avatars/create-from-photo', {
      method: 'POST',
      body: formData,
      headers: {
        // Note: Don't set Content-Type header when using FormData
        // The browser/fetch will set it automatically with the boundary
        ...formData.getHeaders()
      }
    });

    console.log('\n📥 Response received:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);

    const responseText = await response.text();
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ Avatar creation successful!');
      console.log('   Avatar URL:', result.avatarUrl);
    } else {
      console.log('❌ Avatar creation failed');
      console.log('   Error:', responseText);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testAvatarAPIEndpoint();