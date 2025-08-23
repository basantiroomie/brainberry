import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('Testing fresh database schema...')
    
    // Use service role key for admin access  
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Test our new EducatorAccount table
    const { data: educatorData, error: educatorError } = await supabase
      .from('EducatorAccount')
      .select('id, email, name')
      .limit(1)
      
    console.log('EducatorAccount test:', { educatorData, educatorError })
    
    // Test our new ChildProfile table
    const { data: childData, error: childError } = await supabase
      .from('ChildProfile')
      .select('id, name, educator_id')
      .limit(1)
      
    console.log('ChildProfile test:', { childData, childError })
    
    // Test GameMold table with seed data (public read access)
    const { data: moldData, error: moldError } = await supabase
      .from('GameMold')
      .select('id, name, category, structure_type, primary_objective')
      .limit(5)
      
    console.log('GameMold test:', { moldData, moldError })
    
    return NextResponse.json({ 
      success: true,
      message: 'Fresh database schema working!',
      tests: {
        educatorTable: {
          accessible: !educatorError,
          recordCount: educatorData?.length || 0,
          error: educatorError ? {
            message: educatorError.message,
            code: educatorError.code
          } : null
        },
        childTable: {
          accessible: !childError,
          recordCount: childData?.length || 0,
          error: childError ? {
            message: childError.message,
            code: childError.code
          } : null
        },
        gameMolds: {
          accessible: !moldError,
          recordCount: moldData?.length || 0,
          sampleMolds: moldData?.map(m => ({ id: m.id, name: m.name, category: m.category })) || [],
          error: moldError ? {
            message: moldError.message,
            code: moldError.code
          } : null
        }
      }
    })
  } catch (err: any) {
    console.error('Unexpected test error:', err)
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: err.message 
    }, { status: 500 })
  }
}
