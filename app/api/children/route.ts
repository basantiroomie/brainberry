import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient, requireEducator } from '@/lib/supabase-server'
import { childCreateSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const { user } = await requireEducator()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('GET /api/children - User authenticated:', user.id)
    
    // Use service client with elevated permissions to get all children
    const supabase = createSupabaseServiceClient()
    
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Database error fetching children:', error)
      return NextResponse.json({ error: 'Failed to fetch children' }, { status: 500 })
    }
    
    console.log('Successfully fetched children:', children?.length || 0)
    
    return NextResponse.json({
      success: true,
      data: children || []
    })
  } catch (error) {
    console.error('GET /api/children error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await req.json()
    const validatedData = childCreateSchema.parse(body)
    
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
        console.error('Error creating educator account:', createError)
        return NextResponse.json({ error: 'Failed to create educator account' }, { status: 500 })
      }
    }
    
    // Create the child profile  
    const { data: newChild, error: childError } = await supabase
      .from('ChildProfile')
      .insert({
        name: validatedData.name,
        age: validatedData.age,
        diagnosis: validatedData.diagnosis,
        notes: validatedData.notes,
        access_code: validatedData.access_code,
        educator_id: user.id
      })
      .select()
      .single()

    if (childError) {
      console.error('Error creating child:', childError)
      return NextResponse.json({ error: 'Failed to create child' }, { status: 500 })
    }
    
    console.log('Child profile created successfully:', newChild.id)
    
    return NextResponse.json({
      success: true,
      data: newChild
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/children error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
