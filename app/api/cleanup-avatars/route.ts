import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Use service role for cleanup
    const supabase = await createSupabaseServerClient()
    
    // Get all children with avatar URLs
    const { data: children, error } = await supabase
      .from('ChildProfile')
      .select('id, name, avatar_url')
      .not('avatar_url', 'is', null)
    
    if (error) {
      return NextResponse.json({ error: 'Database error', details: error }, { status: 500 })
    }
    
    const cleanupResults = []
    
    for (const child of children || []) {
      try {
        // Test if avatar URL is accessible (skip for ReadyPlayer.me URLs)
        if (child.avatar_url.includes('readyplayer.me') || child.avatar_url.includes('models.readyplayer.me')) {
          continue // Skip validation for ReadyPlayer.me URLs
        }
        
        const response = await fetch(child.avatar_url, { method: 'HEAD' })
        
        if (!response.ok) {
          console.log(`Cleaning up invalid avatar for ${child.name}: ${child.avatar_url}`)
          
          // Remove invalid avatar URL
          const { error: updateError } = await supabase
            .from('ChildProfile')
            .update({ avatar_url: null })
            .eq('id', child.id)
          
          if (updateError) {
            cleanupResults.push({
              childId: child.id,
              childName: child.name,
              status: 'error',
              error: updateError.message
            })
          } else {
            cleanupResults.push({
              childId: child.id,
              childName: child.name,
              status: 'cleaned',
              oldUrl: child.avatar_url
            })
          }
        } else {
          cleanupResults.push({
            childId: child.id,
            childName: child.name,
            status: 'valid',
            url: child.avatar_url
          })
        }
      } catch (error) {
        console.log(`Error testing avatar for ${child.name}:`, error)
        cleanupResults.push({
          childId: child.id,
          childName: child.name,
          status: 'test_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Avatar cleanup completed',
      results: cleanupResults,
      summary: {
        total: children?.length || 0,
        cleaned: cleanupResults.filter(r => r.status === 'cleaned').length,
        valid: cleanupResults.filter(r => r.status === 'valid').length,
        errors: cleanupResults.filter(r => r.status === 'error').length
      }
    })
  } catch (error) {
    console.error('Avatar cleanup error:', error)
    return NextResponse.json({ error: 'Failed to cleanup avatars', details: error }, { status: 500 })
  }
}