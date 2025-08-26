#!/usr/bin/env node

/**
 * Test JSON Avatar Creation
 * This script tests avatar creation using JSON with base64 image data
 */

const fs = require('fs');
const path = require('path');

async function testJSONAvatarCreation() {
  console.log('🧪 Testing JSON Avatar Creation...\n');

  try {
    // Check if we have a test image
    const testImagePath = path.join(__dirname, 'test-avatar.png');
    if (!fs.existsSync(testImagePath)) {
      console.log('❌ Test image not found at:', testImagePath);
      return;
    }

    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    const imageDataUrl = `data:image/png;base64,${base64Image}`;
    
    console.log('✅ Test image loaded:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Use the child that belongs to the current educator (leo)
    const childId = 'b3a5d160-944c-4207-be41-86d8a768fcac'; // leo
    
    const requestBody = {
      childId: childId,
      imageData: imageDataUrl
    };

    console.log('\n2. Making JSON avatar creation request...');
    console.log('   Child ID:', childId);
    console.log('   Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB');

    // Make the request with JSON
    const response = await fetch('http://localhost:3000/api/avatars/create-from-photo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
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
      
      // Try to parse as JSON for better error display
      try {
        const errorResult = JSON.parse(responseText);
        console.log('   Error details:', JSON.stringify(errorResult, null, 2));
      } catch (e) {
        // Response is not JSON, probably HTML error page
        if (responseText.includes('<!DOCTYPE html>')) {
          console.log('   Error: Server returned HTML error page (check server logs)');
          
          // Extract error message from HTML if possible
          const errorMatch = responseText.match(/"message":"([^"]+)"/);
          if (errorMatch) {
            console.log('   Error message:', errorMatch[1]);
          }
        } else {
          console.log('   Response:', responseText);
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Polyfill fetch for Node.js if needed
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testJSONAvatarCreation();