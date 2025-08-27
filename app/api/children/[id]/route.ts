import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { childCreateSchema, updateChildAvatarSchema, avatarCodeSchema } from '@/lib/schemas'
import { requireEducator } from '@/lib/supabase-server'
import { AvatarCodeUtils } from '@/lib/avatar-utils'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { data: child, error } = await supabase
      .from('ChildProfile')
      .select(`
        *,
        assignments:MoldAssignment(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(child)
  } catch (error) {
    console.error('GET child error:', error)
    return NextResponse.json({ error: 'Failed to fetch child' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const json = await req.json()
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    // Check if this is an avatar update request
    const isAvatarUpdate = json.avatar_code || json.avatar_url || json.avatar_headshot_url
    
    if (isAvatarUpdate) {
      // Validate avatar update data
      const avatarParsed = updateChildAvatarSchema.safeParse(json)
      if (!avatarParsed.success) {
        return NextResponse.json({ 
          error: 'Invalid avatar data', 
          details: avatarParsed.error.flatten() 
        }, { status: 400 })
      }
      
      const avatarData = avatarParsed.data
      let updateData: { avatar_url?: string; avatar_headshot_url?: string } = {}
      
      // Handle avatar code conversion
      if (avatarData.avatar_code) {
        try {
          const urls = AvatarCodeUtils.codeToUrls(avatarData.avatar_code)
          updateData.avatar_url = urls.glbUrl
          updateData.avatar_headshot_url = urls.pngUrl
        } catch (error) {
          console.error('Avatar code conversion error:', error)
          return NextResponse.json({ 
            error: 'Invalid avatar code format. Must be 6 uppercase alphanumeric characters.' 
          }, { status: 400 })
        }
      } else {
        // Use provided URLs directly
        if (avatarData.avatar_url) updateData.avatar_url = avatarData.avatar_url
        if (avatarData.avatar_headshot_url) updateData.avatar_headshot_url = avatarData.avatar_headshot_url
      }
      
      // Validate avatar URLs if provided
      if (updateData.avatar_url) {
        try {
          new URL(updateData.avatar_url)
          // Validate it's a Ready Player Me URL
          if (!updateData.avatar_url.includes('readyplayer.me') || !updateData.avatar_url.endsWith('.glb')) {
            return NextResponse.json({ 
              error: 'Invalid avatar URL. Must be a Ready Player Me GLB URL.' 
            }, { status: 400 })
          }
        } catch {
          return NextResponse.json({ error: 'Invalid avatar URL format.' }, { status: 400 })
        }
      }
      
      if (updateData.avatar_headshot_url) {
        try {
          new URL(updateData.avatar_headshot_url)
          // Validate it's a Ready Player Me URL
          if (!updateData.avatar_headshot_url.includes('readyplayer.me') || !updateData.avatar_headshot_url.endsWith('.png')) {
            return NextResponse.json({ 
              error: 'Invalid avatar headshot URL. Must be a Ready Player Me PNG URL.' 
            }, { status: 400 })
          }
        } catch {
          return NextResponse.json({ error: 'Invalid avatar headshot URL format.' }, { status: 400 })
        }
      }
      
      // Update avatar data
      const { data: child, error } = await supabase
        .from('ChildProfile')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          assignments:MoldAssignment(*)
        `)
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to update child avatar' }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        child,
        message: 'Avatar updated successfully' 
      })
    } else {
      // Handle regular child profile updates
      const parsed = childCreateSchema.safeParse(json)
      if (!parsed.success) {
        return NextResponse.json({ 
          error: 'Invalid child data', 
          details: parsed.error.flatten() 
        }, { status: 400 })
      }
      
      const data = parsed.data
      
      const { data: child, error } = await supabase
        .from('ChildProfile')
        .update({
          name: data.name,
          age: data.age,
          diagnosis: data.diagnosis,
          notes: data.notes
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
      }
      
      return NextResponse.json(child)
    }
  } catch (error) {
    console.error('PUT child error:', error)
    return NextResponse.json({ error: 'Failed to update child' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const { id } = await params
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('ChildProfile')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE child error:', error)
    return NextResponse.json({ error: 'Failed to delete child' }, { status: 500 })
  }
}
