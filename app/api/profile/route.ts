import { NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    // Get EducatorAccount data
    const { data: educatorAccount, error: educatorError } = await supabase
      .from('EducatorAccount')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (educatorError && educatorError.code !== 'PGRST116') {
      console.error('Get educator account error:', educatorError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }
    
    // Return combined user data
    return NextResponse.json({
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      role: user.user_metadata?.role || '',
      organization: user.user_metadata?.organization || '',
      license: user.user_metadata?.license || '',
      createdAt: educatorAccount?.created_at || user.created_at,
      updatedAt: educatorAccount?.updated_at || user.updated_at
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    const body = await req.json()
    
    // For now, we'll return success without updating metadata
    // since we don't have admin access. This can be extended later.
    console.log('Profile update requested:', body)
    
    // Ensure EducatorAccount exists
    const { error: upsertError } = await supabase
      .from('EducatorAccount')
      .upsert({ id: user.id }, { onConflict: 'id' })
    
    if (upsertError) {
      console.error('Upsert educator account error:', upsertError)
      return NextResponse.json({ error: 'Failed to update educator account' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
