const { Pool } = require('pg')

async function updateRLSPolicies() {
  // Use the DATABASE_URL from .env
  const connectionString = 'postgresql://postgres:pQ4xmjHOpNk7TqZU@db.zdlyowgbwooplxzkdfhp.supabase.co:5432/postgres'
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  })

  try {
    console.log('Connecting to database...')
    
    // Drop the existing restrictive policy
    console.log('1. Dropping existing policy...')
    await pool.query('DROP POLICY IF EXISTS "Educators can view their own children" ON public."ChildProfile";')
    
    // Create new policy that allows all authenticated educators to view all children
    console.log('2. Creating new policy...')
    await pool.query('CREATE POLICY "All educators can view all children" ON public."ChildProfile" FOR SELECT USING (auth.uid() IS NOT NULL);')
    
    console.log('✅ RLS policy updated successfully!')
    console.log('All educators can now view all children.')
    
    // Test the new access
    console.log('\n3. Testing access...')
    const result = await pool.query('SELECT id, name, access_code, educator_id FROM public."ChildProfile" ORDER BY created_at DESC;')
    console.log(`Found ${result.rows.length} children:`)
    result.rows.forEach(child => {
      console.log(`- ${child.name} (${child.access_code}) - educator: ${child.educator_id}`)
    })
    
  } catch (error) {
    console.error('Error updating RLS policies:', error)
  } finally {
    await pool.end()
  }
}

updateRLSPolicies().catch(console.error)
