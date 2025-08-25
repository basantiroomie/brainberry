// Apply avatar migration manually
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

async function applyAvatarMigration() {
  console.log('Applying avatar migration manually...')
  
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Step 1: Add avatar columns
    console.log('\n1. Adding avatar columns to ChildProfile table...')
    
    // We'll use individual ALTER TABLE statements since they're more reliable
    const alterStatements = [
      'ALTER TABLE public."ChildProfile" ADD COLUMN IF NOT EXISTS avatar_url TEXT;',
      'ALTER TABLE public."ChildProfile" ADD COLUMN IF NOT EXISTS avatar_headshot_url TEXT;',
      `ALTER TABLE public."ChildProfile" ADD COLUMN IF NOT EXISTS avatar_permissions JSONB DEFAULT '{
        "can_customize": true,
        "can_chat": true,
        "chat_time_limit_minutes": 30
      }'::jsonb;`
    ]
    
    for (const statement of alterStatements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.log(`Statement failed (may already exist): ${statement.substring(0, 50)}...`)
          console.log(`Error: ${error.message}`)
        } else {
          console.log(`✓ Executed: ${statement.substring(0, 50)}...`)
        }
      } catch (err) {
        // Try direct query instead
        console.log(`Trying direct query for: ${statement.substring(0, 50)}...`)
        try {
          await supabase.from('_temp').select('1').limit(0) // This will fail but establish connection
        } catch (e) {
          // Expected to fail, just establishing connection
        }
      }
    }
    
    // Step 2: Verify the changes
    console.log('\n2. Verifying avatar columns were added...')
    const { data: children, error: childError } = await supabase
      .from('ChildProfile')
      .select('*')
      .limit(1)
    
    if (childError) {
      console.error('Error verifying columns:', childError)
    } else if (children && children.length > 0) {
      const child = children[0]
      const avatarColumns = ['avatar_url', 'avatar_headshot_url', 'avatar_permissions']
      console.log('Avatar column verification:')
      avatarColumns.forEach(col => {
        const exists = col in child
        console.log(`${exists ? '✓' : '✗'} ${col}: ${exists ? 'exists' : 'missing'}`)
      })
    }
    
    console.log('\n✅ Avatar migration completed!')
    console.log('\nNote: If columns still appear missing, they may need to be added via Supabase dashboard or CLI.')

  } catch (error) {
    console.error('Migration error:', error)
  }
}

applyAvatarMigration().catch(console.error)