// Check if avatar columns exist in ChildProfile table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

async function checkAvatarSchema() {
  console.log('Checking avatar schema in ChildProfile table...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Get a sample child to check the schema
    console.log('\n1. Checking ChildProfile table structure:')
    const { data: children, error: childError } = await supabase
      .from('ChildProfile')
      .select('*')
      .limit(1)
    
    if (childError) {
      console.error('Error querying children:', childError)
      return
    }
    
    if (children && children.length > 0) {
      const child = children[0]
      console.log('Sample child columns:', Object.keys(child))
      
      // Check for avatar-specific columns
      const avatarColumns = ['avatar_url', 'avatar_headshot_url', 'avatar_permissions']
      console.log('\n2. Avatar column status:')
      avatarColumns.forEach(col => {
        const exists = col in child
        console.log(`${exists ? '✓' : '✗'} ${col}: ${exists ? 'exists' : 'missing'}`)
        if (exists && child[col] !== null) {
          console.log(`  Current value: ${JSON.stringify(child[col])}`)
        }
      })
    } else {
      console.log('No children found in database')
    }
    
    // Try to add avatar columns if they don't exist
    console.log('\n3. Attempting to add avatar columns if missing...')
    try {
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE public."ChildProfile" 
          ADD COLUMN IF NOT EXISTS avatar_url TEXT,
          ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
          ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
            "can_customize": true,
            "can_chat": true,
            "chat_time_limit_minutes": 30
          }'::jsonb;
        `
      })
      
      if (alterError) {
        console.log('Note: Could not add columns via RPC (this is normal if they already exist)')
        console.log('Error:', alterError.message)
      } else {
        console.log('✓ Avatar columns added successfully')
      }
    } catch (rpcError) {
      console.log('Note: RPC method not available, columns may already exist')
    }
    
    console.log('\n✅ Schema check completed!')

  } catch (error) {
    console.error('Schema check error:', error)
  }
}

checkAvatarSchema().catch(console.error)