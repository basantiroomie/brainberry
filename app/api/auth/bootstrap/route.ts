import { NextResponse } from 'next/server'
import { requireEducator, createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    // Upsert the EducatorAccount
    const { error } = await supabase
      .from('EducatorAccount')
      .upsert({ 
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Educator'
      }, { onConflict: 'id' })
    
    if (error) {
      console.error('Bootstrap error:', error)
      return NextResponse.json({ error: 'Failed to bootstrap account' }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Bootstrap API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
