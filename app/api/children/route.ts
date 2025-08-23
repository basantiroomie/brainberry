import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'
import { childCreateSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('*')
      .eq('educator_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Fetch children error:', error)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }
    
    return NextResponse.json(children || [])
  } catch (error) {
    console.error('Get children error:', error)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const json = await req.json()
    const parsed = childCreateSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    
    const supabase = await createSupabaseServerClient()

    // Ensure EducatorAccount exists
    const { error: educatorError } = await supabase
      .from('EducatorAccount')
      .select('id')
      .eq('id', user.id)
      .single()
    
    if (educatorError && educatorError.code === 'PGRST116') {
      // EducatorAccount doesn't exist, create it
      const { error: createError } = await supabase
        .from('EducatorAccount')
        .insert({ 
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0]
        })
      
      if (createError) {
        console.error('Create educator account error:', createError)
        return NextResponse.json({ error: 'Failed to create educator account' }, { status: 500 })
      }
    }
    
    // Create the child profile  
    const { data: newChild, error: childError } = await supabase
      .from('ChildProfile')
      .insert({
        name: parsed.data.name,
        age: parsed.data.age,
        diagnosis: parsed.data.diagnosis,
        notes: parsed.data.notes,
        access_code: parsed.data.access_code,
        educator_id: user.id
      })
      .select()
      .single()

    if (childError) {
      console.error('Create child error:', childError)
      return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
    }
    
    return NextResponse.json(newChild)
  } catch (error) {
    console.error('Create child error:', error)
    return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
  }
}
