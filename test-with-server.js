// Test avatar API with proper server setup
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testWithRunningServer() {
  console.log('🚀 Avatar API Testing Guide')
  console.log('===========================')
  
  console.log('\n📋 Prerequisites Check:')
  
  // Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/children')
    console.log(`✅ Development server: Running (status: ${healthCheck.status})`)
  } catch (error) {
    console.log('❌ Development server: Not running')
    console.log('💡 Start with: npm run dev')
    console.log('')
  }
  
  // Check database migration
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  const { data: children } = await supabase.from('ChildProfile').select('*').limit(1)
  const hasMigration = children && children.length > 0 && 'avatar_url' in children[0]
  
  console.log(`${hasMigration ? '✅' : '❌'} Database migration: ${hasMigration ? 'Applied' : 'Needed'}`)
  if (!hasMigration) {
    console.log('💡 Apply migration: Run add-avatar-columns.sql in Supabase Dashboard')
  }
  
  // Check RPM API key
  const rpmKey = process.env.RPM_API_KEY
  const hasRpmKey = rpmKey && rpmKey !== 'your_rpm_api_key_here'
  console.log(`${hasRpmKey ? '✅' : '❌'} RPM API Key: ${hasRpmKey ? 'Configured' : 'Needs setup'}`)
  
  console.log('\n🧪 Manual Testing Steps:')
  console.log('========================')
  
  console.log('\n1️⃣ Start Development Server:')
  console.log('   npm run dev')
  
  console.log('\n2️⃣ Apply Database Migration:')
  console.log('   • Go to Supabase Dashboard > SQL Editor')
  console.log('   • Run the SQL from add-avatar-columns.sql')
  console.log('   • Or copy/paste this SQL:')
  console.log(`
   ALTER TABLE public."ChildProfile" 
   ADD COLUMN IF NOT EXISTS avatar_url TEXT,
   ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
   ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
     "can_customize": true,
     "can_chat": true,
     "chat_time_limit_minutes": 30
   }'::jsonb;
   `)
  
  console.log('\n3️⃣ Test with cURL (Command Line):')
  if (children && children.length > 0) {
    const testChild = children[0]
    console.log(`
   # Create a test image file first:
   echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-avatar.png
   
   # Test the API endpoint:
   curl -X POST http://localhost:3000/api/avatars/create-from-photo \\
     -F "childId=${testChild.id}" \\
     -F "photo=@test-avatar.png" \\
     -H "Content-Type: multipart/form-data"
   `)
  }
  
  console.log('\n4️⃣ Test with Postman/Insomnia:')
  console.log('   • Method: POST')
  console.log('   • URL: http://localhost:3000/api/avatars/create-from-photo')
  console.log('   • Body Type: form-data')
  console.log('   • Fields:')
  if (children && children.length > 0) {
    console.log(`     - childId: ${children[0].id}`)
  }
  console.log('     - photo: [Upload a JPEG/PNG file]')
  
  console.log('\n5️⃣ Test with Web Interface (Recommended):')
  console.log('   • Open http://localhost:3000')
  console.log('   • Log in as an educator')
  console.log('   • Navigate to child management')
  console.log('   • Look for avatar upload feature')
  console.log('   • Upload a photo and check the result')
  
  console.log('\n🔍 Expected Results:')
  console.log('===================')
  
  console.log('\n✅ Success Response:')
  console.log(`{
  "success": true,
  "data": {
    "success": true,
    "avatarUrl": "https://models.readyplayer.me/[avatar-id].glb",
    "childId": "[child-uuid]",
    "childName": "[child-name]"
  },
  "timestamp": "[iso-date]"
}`)
  
  console.log('\n❌ Error Responses:')
  console.log('• 401 Unauthorized: Need educator authentication')
  console.log('• 400 Validation Error: Invalid file type/size or missing childId')
  console.log('• 404 Not Found: Child not found or not owned by educator')
  console.log('• 500 Server Error: RPM API issues or database problems')
  
  console.log('\n🛠️ Troubleshooting:')
  console.log('===================')
  
  console.log('\n• "Failed to parse body as FormData":')
  console.log('  → Use proper multipart/form-data with file upload')
  console.log('  → Ensure Content-Type header is set correctly')
  
  console.log('\n• "Unauthorized" errors:')
  console.log('  → The endpoint requires educator authentication')
  console.log('  → Test through the web interface after logging in')
  
  console.log('\n• "Child not found" errors:')
  console.log('  → Use a valid child ID that belongs to the logged-in educator')
  console.log('  → Check the ChildProfile table for valid IDs')
  
  console.log('\n• "RPM API" errors:')
  console.log('  → Verify RPM_API_KEY is set correctly')
  console.log('  → Check Ready Player Me API status')
  console.log('  → Ensure uploaded image is publicly accessible')
  
  console.log('\n📊 Verification Steps:')
  console.log('=====================')
  
  console.log('\n1. Check uploaded photo in Supabase Storage:')
  console.log('   • Go to Supabase Dashboard > Storage > avatar-photos')
  console.log('   • Look for uploaded files')
  
  console.log('\n2. Check database update:')
  console.log('   • Go to Supabase Dashboard > Table Editor > ChildProfile')
  console.log('   • Check if avatar_url column is populated')
  
  console.log('\n3. Verify avatar URL:')
  console.log('   • Copy the avatar_url from database')
  console.log('   • Open in browser - should download .glb file')
  console.log('   • Or use in 3D viewer to see the avatar')
  
  console.log('\n🎯 Ready to Test!')
  console.log('Follow the steps above to fully test the avatar creation API.')
}

testWithRunningServer().catch(console.error)