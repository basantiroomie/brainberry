// Apply avatar migration using direct SQL execution
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function applyMigration() {
  console.log('🔧 Applying avatar migration...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Execute the migration SQL directly
    const migrationSQL = `
      -- Add avatar columns to existing ChildProfile table
      ALTER TABLE public."ChildProfile" 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT,
      ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
        "can_customize": true,
        "can_chat": true,
        "chat_time_limit_minutes": 30
      }'::jsonb;

      -- Add indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_url ON public."ChildProfile"(avatar_url);
      CREATE INDEX IF NOT EXISTS idx_child_profile_avatar_headshot_url ON public."ChildProfile"(avatar_headshot_url);
    `

    console.log('Executing migration SQL...')
    
    // Use the REST API to execute SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({ sql: migrationSQL })
    })

    if (!response.ok) {
      // Try alternative approach - direct table query to test connection
      console.log('Direct SQL execution not available, checking if columns exist...')
      
      const { data: testChild, error } = await supabase
        .from('ChildProfile')
        .select('*')
        .limit(1)
      
      if (error) {
        console.error('❌ Database connection failed:', error)
        return
      }
      
      if (testChild && testChild.length > 0) {
        const hasAvatarColumns = 'avatar_url' in testChild[0]
        if (hasAvatarColumns) {
          console.log('✅ Avatar columns already exist!')
        } else {
          console.log('⚠️ Avatar columns need to be added manually')
          console.log('📝 Please run the SQL from add-avatar-columns.sql in Supabase Dashboard')
        }
      }
    } else {
      console.log('✅ Migration executed successfully!')
    }

    // Verify the migration worked
    console.log('\n🔍 Verifying migration...')
    const { data: children, error: verifyError } = await supabase
      .from('ChildProfile')
      .select('*')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      return
    }
    
    if (children && children.length > 0) {
      const child = children[0]
      const avatarColumns = ['avatar_url', 'avatar_headshot_url', 'avatar_permissions']
      
      console.log('Column verification:')
      avatarColumns.forEach(col => {
        const exists = col in child
        console.log(`${exists ? '✅' : '❌'} ${col}: ${exists ? 'exists' : 'missing'}`)
      })
      
      const allExist = avatarColumns.every(col => col in child)
      if (allExist) {
        console.log('\n🎉 Migration completed successfully!')
        console.log('Ready to test avatar creation API!')
      } else {
        console.log('\n⚠️ Some columns are missing. Please run add-avatar-columns.sql manually in Supabase Dashboard.')
      }
    }

  } catch (error) {
    console.error('❌ Migration error:', error)
  }
}

applyMigration().catch(console.error)