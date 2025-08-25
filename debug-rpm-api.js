// Debug script for Ready Player Me API
require('dotenv').config({ path: '.env.local' });

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function debugRPMApi() {
  console.log(`${colors.cyan}🔍 Debugging Ready Player Me API Integration${colors.reset}`);
  console.log('===========================================');
  
  const apiKey = process.env.RPM_API_KEY;
  
  if (!apiKey) {
    console.error(`${colors.red}❌ No API key found${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✅ API Key: ${apiKey}${colors.reset}\n`);
  
  // Test 1: Check API status/health
  console.log(`${colors.cyan}Test 1: Checking API health...${colors.reset}`);
  try {
    const healthResponse = await fetch('https://api.readyplayer.me/v2/avatars', {
      method: 'OPTIONS'
    });
    console.log(`   Health check: ${healthResponse.status} ${healthResponse.statusText}`);
  } catch (error) {
    console.log(`   Health check failed: ${error.message}`);
  }
  
  // Test 2: Try with minimal avatar creation
  console.log(`\n${colors.cyan}Test 2: Minimal avatar creation...${colors.reset}`);
  try {
    const response = await fetch('https://api.readyplayer.me/v2/avatars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'fullbody'
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`   Response: ${responseText}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 3: Try v1 API for comparison
  console.log(`\n${colors.cyan}Test 3: Trying v1 API...${colors.reset}`);
  try {
    const response = await fetch('https://api.readyplayer.me/v1/avatars', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          type: 'fullbody'
        }
      })
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log(`   Response: ${responseText}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
  
  // Test 4: Check if it's a sandbox vs production key issue
  console.log(`\n${colors.cyan}Test 4: Key analysis...${colors.reset}`);
  if (apiKey.startsWith('sk_live_')) {
    console.log(`   ✅ Production key detected (sk_live_)`);
  } else if (apiKey.startsWith('sk_test_')) {
    console.log(`   ⚠️  Test key detected (sk_test_) - might need different endpoint`);
  } else {
    console.log(`   ❌ Unknown key format`);
  }
  
  console.log(`\n${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
  console.log(`   1. Verify the API key is active in your Ready Player Me Studio dashboard`);
  console.log(`   2. Check if your account has API access enabled`);
  console.log(`   3. Ensure the key hasn't expired`);
  console.log(`   4. Try generating a new API key from the dashboard`);
}

debugRPMApi();