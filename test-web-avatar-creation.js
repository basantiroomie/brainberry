#!/usr/bin/env node

/**
 * Test Web Avatar Creation
 * This script simulates the exact request that would be made by the web interface
 */

const fs = require('fs');
const path = require('path');

async function testWebAvatarCreation() {
  console.log('🧪 Testing Web Avatar Creation...\n');

  try {
    // First, let's test if the server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await fetch('http://localhost:3000/api/children');
    
    if (!healthResponse.ok) {
      console.log('❌ Server not accessible. Make sure the dev server is running.');
      console.log('   Run: npm run dev');
      return;
    }
    
    console.log('✅ Server is running');

    // Check if we have a test image
    const testImagePath = path.join(__dirname, 'test-avatar.png');
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found at:', testImagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(testImagePath);
    console.log('✅ Test image loaded:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Create a proper FormData object
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Use the child that belongs to the current educator (leo)
    const childId = 'b3a5d160-944c-4207-be41-86d8a768fcac'; // leo
    
    formData.append('childId', childId);
    formData.append('photo', imageBuffer, {
      filename: 'test-avatar.png',
      contentType: 'image/png'
    });

    console.log('\n2. Making avatar creation request...');
    console.log('   Child ID:', childId);
    console.log('   Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Make the request with proper headers
    const response = await fetch('http://localhost:3000/api/avatars/create-from-photo', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let FormData set it with boundary
        ...formData.getHeaders()
      }
    });

    console.log('\n3. Response received:');
    console.log('   Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ Avatar creation successful!');
        console.log('   Avatar URL:', result.avatarUrl);
        
        // Test if the avatar is accessible
        if (result.avatarUrl) {
          console.log('\n4. Testing avatar accessibility...');
          const avatarResponse = await fetch(result.avatarUrl);
          if (avatarResponse.ok) {
            console.log('✅ Avatar is accessible');
            const size = avatarResponse.headers.get('content-length');
            if (size) {
              console.log('   Size:', (size / 1024).toFixed(2), 'KB');
            }
          } else {
            console.log('⚠️  Avatar URL not yet accessible (might need time to process)');
          }
        }
        
      } catch (parseError) {
        console.log('✅ Request successful but response not JSON:', responseText);
      }
    } else {
      console.log('❌ Avatar creation failed');
      console.log('   Response:', responseText);
      
      // Try to parse as JSON for better error display
      try {
        const errorResult = JSON.parse(responseText);
        console.log('   Error details:', JSON.stringify(errorResult, null, 2));
      } catch (e) {
        // Response is not JSON, probably HTML error page
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log('   Error: Server returned HTML error page (check server logs)');
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testWebAvatarCreation();