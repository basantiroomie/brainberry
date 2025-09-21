import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const resolvedParams = await params
    const moldId = resolvedParams.id
    const supabase = await createSupabaseServerClient()

    // Verify ownership
    const { data: existingMold, error: checkError } = await supabase
      .from('GameMold')
      .select('created_by, name')
      .eq('id', moldId)
      .single()

    if (checkError || !existingMold) {
      return NextResponse.json({ error: 'Mold not found' }, { status: 404 })
    }

    if (existingMold.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this mold' }, { status: 403 })
    }

    // Check if mold is being used in personalized versions
    const { data: personalizedMolds, error: personalizedError } = await supabase
      .from('PersonalizedMold')
      .select('id')
      .eq('mold_id', moldId)
      .limit(1)

    if (personalizedError) {
      console.error('Check personalized molds error:', personalizedError)
      return NextResponse.json({ error: 'Failed to check mold usage' }, { status: 500 })
    }

    if (personalizedMolds && personalizedMolds.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete mold that is being used by children in personalized games' 
      }, { status: 400 })
    }

    // Delete the mold (cascading will handle scenes and assets)
    const { error: deleteError } = await supabase
      .from('GameMold')
      .delete()
      .eq('id', moldId)

    if (deleteError) {
      console.error('Delete mold error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete mold' }, { status: 500 })
    }

    return NextResponse.json({ message: `Mold "${existingMold.name}" deleted successfully` })

  } catch (error) {
    console.error('Delete mold error:', error)
    return NextResponse.json({ error: 'Failed to delete mold' }, { status: 500 })
  }
}
