import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { requireEducator } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    // Create supabase client without requiring educator auth
    // This endpoint can be used by both educators and children
    const supabase = await createSupabaseServerClient()
    
    // Get the current user (could be educator or child)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { childId, headshotDataUrl } = await req.json()

    // Validate inputs
    if (!childId || !headshotDataUrl) {
      return NextResponse.json({ 
        error: 'Child ID and headshot data URL are required' 
      }, { status: 400 })
    }

    // Validate data URL format
    if (!headshotDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ 
        error: 'Invalid headshot data URL format' 
      }, { status: 400 })
    }

    // For now, we'll store the data URL directly in the database
    // In production, you might want to upload to a file storage service
    const { data: child, error: updateError } = await supabase
      .from('ChildProfile')
      .update({ avatar_headshot_url: headshotDataUrl })
      .eq('id', childId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to save headshot URL:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save headshot URL' 
      }, { status: 500 })
    }

    console.log('Headshot saved successfully for child:', childId)

    return NextResponse.json({
      success: true,
      headshotUrl: headshotDataUrl,
      child
    })

  } catch (error) {
    console.error('Save headshot API error:', error)
    return NextResponse.json({ 
      error: 'Failed to save headshot' 
    }, { status: 500 })
  }
}