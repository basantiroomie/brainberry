import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { accessCode } = await req.json()
    if (!accessCode) return NextResponse.json({ error: 'Access code required' }, { status: 400 })
    
    const supabase = await createSupabaseServerClient()
    
    // Use Supabase directly - much cleaner than Prisma!
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .select('id, name, age, diagnosis')
      .eq('access_code', accessCode)
      .single()
    
    if (error || !child) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 404 })
    }
    
    return NextResponse.json(child)
  } catch (error) {
    console.error('Child auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
