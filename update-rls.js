const { createClient } = require('@supabase/supabase-js')

// Apply the migration SQL directly to the database
const supabaseUrl = 'https://zdlyowgbwooplxzkdfhp.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbHlvd2did29vcGx4emtkZmhwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTg3NzE0NCwiZXhwIjoyMDcxNDUzMTQ0fQ.WHo_mADRlmvDy96glWY137deZxBV0dmA1gLd4cJa7ZQ'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateRLSPolicy() {
  console.log('Updating RLS policy to allow all educators to view all children...')
  
  try {
    // Drop the existing restrictive policy
    console.log('1. Dropping existing policy...')
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP POLICY IF EXISTS "Educators can view their own children" ON public."ChildProfile";'
    })
    
    if (dropError) {
      console.error('Error dropping policy:', dropError)
      return
    }
    
    // Create new policy that allows all authenticated educators to view all children
    console.log('2. Creating new policy...')
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE POLICY "All educators can view all children" ON public."ChildProfile" FOR SELECT USING (auth.uid() IS NOT NULL);'
    })
    
    if (createError) {
      console.error('Error creating policy:', createError)
      return
    }
    
    console.log('✅ RLS policy updated successfully!')
    console.log('All educators can now view all children.')
    
  } catch (error) {
    console.error('Migration error:', error)
  }
}

updateRLSPolicy().catch(console.error)
