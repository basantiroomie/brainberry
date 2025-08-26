// Simple script to run the avatar migration
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function runMigration() {
  console.log('Running avatar migration...')
  
  try {
    // First, let's check if the columns exist
    const { data: testData, error: testError } = await supabase
      .from('ChildProfile')
      .select('id, avatar_url')
      .limit(1)
    
    // Let's try to add the missing columns one by one
    console.log('Checking and adding missing columns...')
    
    // Try to add avatar_headshot_url
    try {
      const { error: headshotError } = await supabase
        .from('ChildProfile')
        .select('avatar_headshot_url')
        .limit(1)
      
      if (headshotError && headshotError.message.includes('does not exist')) {
        console.log('avatar_headshot_url column missing, need to add it manually')
      }
    } catch (e) {
      console.log('Error checking avatar_headshot_url:', e.message)
    }
    
    // Try to add avatar_permissions
    try {
      const { error: permissionsError } = await supabase
        .from('ChildProfile')
        .select('avatar_permissions')
        .limit(1)
      
      if (permissionsError && permissionsError.message.includes('does not exist')) {
        console.log('avatar_permissions column missing, need to add it manually')
      }
    } catch (e) {
      console.log('Error checking avatar_permissions:', e.message)
    }
    
    console.log('Column check completed. You may need to add missing columns manually in Supabase SQL editor.')
    
    // Test the columns
    const { data: children, error: childrenError } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url, avatar_headshot_url')
      .limit(3)
    
    if (childrenError) {
      console.error('Error testing columns:', childrenError)
    } else {
      console.log('Test successful! Sample children:', children)
    }
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

runMigration()