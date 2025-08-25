// READY PLAYER ME API KEY TESTER
// This script prevents the common GET/POST method confusion
// and validates your API key properly

require('dotenv').config({ path: '.env.local' });

// ANSI colors for better terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

async function testApiKey() {
  console.log(`${colors.bold}${colors.cyan}🔑 READY PLAYER ME API KEY VALIDATOR${colors.reset}`);
  console.log(`${colors.cyan}======================================${colors.reset}`);
  console.log(`${colors.yellow}⚠️  IMPORTANT: This script uses POST method (not GET) to prevent common errors${colors.reset}\n`);
  
  const apiKey = process.env.RPM_API_KEY;
  
  // Validate API key exists and format
  if (!apiKey) {
    console.error(`${colors.red}❌ API Key Error: RPM_API_KEY not found in your .env.local file.${colors.reset}`);
    console.log(`${colors.yellow}   Add this line to .env.local: RPM_API_KEY=sk_live_your_key_here${colors.reset}`);
    return;
  }
  
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    console.error(`${colors.red}❌ API Key Error: Invalid format. Must start with 'sk_live_' or 'sk_test_'${colors.reset}`);
    console.log(`${colors.yellow}   Current key: ${apiKey.substring(0, 10)}...${colors.reset}`);
    return;
  }
  
  if (apiKey.length !== 44) {
    console.error(`${colors.red}❌ API Key Error: Invalid length. Should be 44 characters, got ${apiKey.length}${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}✅ API Key format valid: ${apiKey.substring(0, 8)}... (${apiKey.length} chars)${colors.reset}`);
  console.log(`${colors.green}✅ Key type: ${apiKey.startsWith('sk_live_') ? 'Production' : 'Test'}${colors.reset}\n`);
  
  console.log(`${colors.cyan}🌐 Testing API connection with POST method...${colors.reset}`);
  
  const url = 'https://api.readyplayer.me/v2/avatars';
  
  // CRITICAL: This is the correct request structure for creating a basic avatar
  // NEVER use GET method - it will fail with "Cannot GET /v2/avatars"
  const requestBody = {
    type: 'fullbody',
    data: {
      gender: 'masculine',
      bodyType: 'fullbody-average',
    },
  };
  
  console.log(`${colors.cyan}📤 Request details:${colors.reset}`);
  console.log(`   Method: POST (NEVER use GET)`);
  console.log(`   URL: ${url}`);
  console.log(`   Headers: Authorization: Bearer ${apiKey.substring(0, 8)}...`);
  console.log(`   Body: ${JSON.stringify(requestBody, null, 2)}\n`);
  
  try {
    const response = await fetch(url, {
      method: 'POST', // ⚠️ CRITICAL: The method MUST be POST, never GET
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log(`📡 Response Status: ${response.ok ? colors.green : colors.red}${response.status} ${response.statusText}${colors.reset}`);
    
    const responseBody = await response.json();
    
    if (response.ok) {
      console.log(`\n${colors.bold}${colors.green}🎉 SUCCESS! Your API key is valid and working perfectly!${colors.reset}`);
      console.log(`${colors.green}✅ Avatar created successfully${colors.reset}`);
      console.log(`   - Avatar ID: ${responseBody.data?.id || 'N/A'}`);
      console.log(`   - Avatar URL: ${colors.yellow}${responseBody.data?.renders?.[0]?.url || 'N/A'}${colors.reset}`);
      console.log(`\n${colors.cyan}🚀 Your backend API will now work correctly with this key.${colors.reset}`);
      console.log(`${colors.cyan}📖 Remember: Always use POST method for avatar creation!${colors.reset}`);
    } else {
      console.error(`\n${colors.bold}${colors.red}❌ AUTHENTICATION FAILED${colors.reset}`);
      
      if (response.status === 401) {
        console.error(`${colors.red}🔐 Unauthorized Error (401)${colors.reset}`);
        console.error(`${colors.yellow}   This means your API key is invalid, expired, or doesn't have permission.${colors.reset}`);
        console.error(`${colors.yellow}   Solutions:${colors.reset}`);
        console.error(`${colors.yellow}   1. Check your Ready Player Me Studio dashboard${colors.reset}`);
        console.error(`${colors.yellow}   2. Verify the API key is active and not expired${colors.reset}`);
        console.error(`${colors.yellow}   3. Generate a new API key if needed${colors.reset}`);
        console.error(`${colors.yellow}   4. Ensure your account has API access enabled${colors.reset}`);
      } else if (response.status === 400) {
        console.error(`${colors.red}📝 Bad Request Error (400)${colors.reset}`);
        console.error(`${colors.yellow}   The request format is incorrect (this shouldn't happen with this script)${colors.reset}`);
      } else if (response.status === 429) {
        console.error(`${colors.red}⏰ Rate Limit Error (429)${colors.reset}`);
        console.error(`${colors.yellow}   Too many requests. Wait a moment and try again.${colors.reset}`);
      } else {
        console.error(`${colors.red}🌐 Server Error (${response.status})${colors.reset}`);
        console.error(`${colors.yellow}   An unexpected error occurred on Ready Player Me's servers.${colors.reset}`);
      }
      
      console.log(`\n${colors.cyan}📋 Full API Response:${colors.reset}`);
      console.log(JSON.stringify(responseBody, null, 2));
    }
  } catch (error) {
    console.error(`\n${colors.bold}${colors.red}❌ NETWORK ERROR${colors.reset}`);
    console.error(`${colors.red}🌐 Failed to connect to Ready Player Me API${colors.reset}`);
    console.error(`${colors.yellow}   Check your internet connection and try again.${colors.reset}`);
    console.error(`   Error details: ${error.message}`);
  }
  
  console.log(`\n${colors.cyan}📚 Need help? Check AVATAR_API_TROUBLESHOOTING.md for detailed guidance.${colors.reset}`);
}

testApiKey();