#!/usr/bin/env node

/**
 * Test script for Avatar Customization System
 * Tests the avatar update API endpoint and customization functionality
 */

// Note: This test focuses on file structure validation
// API testing would require the server to be running

const API_BASE = 'http://localhost:3000';

async function testAvatarCustomization() {
  console.log('🧪 Testing Avatar Customization System...\n');

  try {
    // Test 1: Test avatar update API endpoint file
    console.log('1. Testing avatar update API endpoint file...');
    
    const fs = require('fs');
    const path = require('path');
    
    const apiPath = path.join(__dirname, 'app', 'api', 'avatars', 'update', 'route.ts');
    if (fs.existsSync(apiPath)) {
      console.log('✅ Avatar update API endpoint file exists');
      
      const apiContent = fs.readFileSync(apiPath, 'utf8');
      if (apiContent.includes('PUT') && 
          apiContent.includes('updateAvatarRequestSchema') && 
          apiContent.includes('createSupabaseServerClient')) {
        console.log('✅ Avatar update API endpoint has required functionality');
      } else {
        console.log('❌ Avatar update API endpoint is missing required functionality');
      }
    } else {
      console.log('❌ Avatar update API endpoint file not found');
    }

    // Test 2: Test avatar customization hook functionality
    console.log('\n2. Testing avatar customization hook...');
    
    // This would normally be tested in a React testing environment
    // For now, we'll just verify the hook file exists and is properly structured
    
    const hookPath = path.join(__dirname, 'hooks', 'use-avatar-customization.ts');
    if (fs.existsSync(hookPath)) {
      console.log('✅ Avatar customization hook file exists');
      
      const hookContent = fs.readFileSync(hookPath, 'utf8');
      if (hookContent.includes('useAvatarCustomization') && 
          hookContent.includes('loadAssets') && 
          hookContent.includes('selectAsset')) {
        console.log('✅ Avatar customization hook has required functions');
      } else {
        console.log('❌ Avatar customization hook is missing required functions');
      }
    } else {
      console.log('❌ Avatar customization hook file not found');
    }

    // Test 3: Test MyAvatarTab component
    console.log('\n3. Testing MyAvatarTab component...');
    
    const componentPath = path.join(__dirname, 'app', 'child', 'components', 'MyAvatarTab.tsx');
    if (fs.existsSync(componentPath)) {
      console.log('✅ MyAvatarTab component file exists');
      
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      if (componentContent.includes('MyAvatarTab') && 
          componentContent.includes('AvatarViewer') && 
          componentContent.includes('useAvatarCustomization')) {
        console.log('✅ MyAvatarTab component has required dependencies');
      } else {
        console.log('❌ MyAvatarTab component is missing required dependencies');
      }
    } else {
      console.log('❌ MyAvatarTab component file not found');
    }

    // Test 4: Test environment configuration
    console.log('\n4. Testing environment configuration...');
    
    const envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('RPM_API_KEY') && envContent.includes('NEXT_PUBLIC_RPM_SUBDOMAIN')) {
        console.log('✅ Ready Player Me environment variables are configured');
      } else {
        console.log('⚠️  Ready Player Me environment variables may not be fully configured');
      }
    } else {
      console.log('⚠️  .env.local file not found');
    }

    console.log('\n🎉 Avatar Customization System test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to the child interface');
    console.log('3. Go to "MY STUFF" tab');
    console.log('4. Click "CUSTOMIZE" on the Avatar Creator card');
    console.log('5. Test the avatar customization interface');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    process.exit(1);
  }
}

// Run the test
testAvatarCustomization();