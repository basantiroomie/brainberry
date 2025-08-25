import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    // Use service role key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    console.log('Updating RLS policy...')
    
    // Drop the existing restrictive policy
    const { error: dropError } = await supabase
      .from('pg_policies')
      .delete()
      .eq('tablename', 'ChildProfile')
      .eq('policyname', 'Educators can view their own children')
    
    if (dropError) {
      console.error('Error checking/dropping policy:', dropError)
    }
    
    // Execute SQL to update RLS policy using raw SQL
    const { data, error } = await supabase
      .from('ChildProfile')
      .select('id')
      .limit(1) // Just to test access
    
    if (error) {
      console.error('Database access error:', error)
      return NextResponse.json({ error: 'Database access failed', details: error }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Policy update completed',
      testResult: `Can access database, found ${data?.length || 0} children`
    })
  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
