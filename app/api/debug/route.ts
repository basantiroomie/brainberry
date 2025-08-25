import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      urlPrefix: supabaseUrl?.slice(0, 30),
      hasServiceKey: !!serviceRoleKey,
      serviceKeyPrefix: serviceRoleKey?.slice(0, 10)
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Environment variables not configured',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!serviceRoleKey
        }
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Get all children
    const { data: children, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, educator_id, access_code')
    
    if (childError) {
      console.error('Children query error:', childError)
      return NextResponse.json({ error: 'Failed to fetch children', details: childError }, { status: 500 })
    }
    
    // Get all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('Users query error:', usersError)
      return NextResponse.json({ error: 'Failed to fetch users', details: usersError }, { status: 500 })
    }
    
    // Get all educator accounts
    const { data: educators, error: educatorError } = await supabase
      .from('EducatorAccount')
      .select('*')
    
    if (educatorError) {
      console.error('Educators query error:', educatorError)
      return NextResponse.json({ error: 'Failed to fetch educators', details: educatorError }, { status: 500 })
    }
    
    return NextResponse.json({
      children: children || [],
      authUsers: users || [],
      educators: educators || [],
      summary: {
        totalChildren: children?.length || 0,
        totalAuthUsers: users?.length || 0,
        totalEducators: educators?.length || 0,
        orphanedChildren: children?.filter(child => 
          !users?.find(user => user.id === child.educator_id)
        ) || []
      }
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
