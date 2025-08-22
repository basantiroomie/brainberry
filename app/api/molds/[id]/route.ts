import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    const { data: mold, error } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
      .eq('id', params.id)
      .single()
    
    if (error || !mold) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(mold)
  } catch (error) {
    console.error('Get mold error:', error)
    return NextResponse.json({ error: 'Failed to fetch mold' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check if mold exists
    const { data: existing, error: checkError } = await supabase
      .from('GameMold')
      .select('id, version')
      .eq('id', params.id)
      .single()
    
    if (checkError || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    const data = await req.json()
    
    // Delete existing scenes and assets (cascade should handle assets)
    const { error: deleteError } = await supabase
      .from('Scene')
      .delete()
      .eq('moldId', existing.id)
    
    if (deleteError) {
      console.error('Delete scenes error:', deleteError)
    }
    
    // Update the mold
    const { data: updatedMold, error: updateError } = await supabase
      .from('GameMold')
      .update({
        name: data.name,
        category: data.category,
        structureType: data.structureType,
        experienceType: data.experienceType,
        primaryObjective: data.primaryObjective,
        rules: data.rules,
        lockStructure: !!data.lockStructure,
        allowThemes: !!data.allowThemes,
        allowPacing: !!data.allowPacing,
        allowRewards: !!data.allowRewards,
        allowAvatars: !!data.allowAvatars,
        customizationNotes: data.customizationNotes,
        ageMin: data.ageMin,
        ageMax: data.ageMax,
        difficulty: data.difficulty,
        learnerProfiles: (data.learnerProfiles || []).join(','),
        executiveFunctionTargets: (data.executiveFunctionTargets || []).join(','),
        sensoryPreferences: (data.sensoryPreferences || []).join(','),
        skillTargets: (data.skillTargets || []).join(','),
        version: existing.version + 1
      })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Update mold error:', updateError)
      return NextResponse.json({ error: 'Failed to update mold' }, { status: 500 })
    }
    
    // Create new scenes if any
    if (data.scenes && data.scenes.length > 0) {
      const scenesData = data.scenes.map((s: any, index: number) => ({
        moldId: existing.id,
        index,
        title: s.title,
        narrative: s.narrative,
        instructions: s.instructions,
        pacingCalm: !!s.pacingHints?.calmMode,
        pacingFast: !!s.pacingHints?.fastMode,
        reinforcement: s.reinforcement
      }))
      
      const { data: scenes, error: scenesError } = await supabase
        .from('Scene')
        .insert(scenesData)
        .select()
      
      if (scenesError) {
        console.error('Create scenes error:', scenesError)
      } else if (scenes) {
        // Create assets for each scene
        for (let i = 0; i < scenes.length; i++) {
          const scene = scenes[i]
          const originalScene = data.scenes[i]
          
          if (originalScene.assets && originalScene.assets.length > 0) {
            const assetsData = originalScene.assets.map((a: any) => ({
              sceneId: scene.id,
              type: a.type,
              label: a.label,
              url: a.url
            }))
            
            const { error: assetsError } = await supabase
              .from('Asset')
              .insert(assetsData)
            
            if (assetsError) {
              console.error('Create assets error:', assetsError)
            }
          }
        }
      }
    }
    
    // Return the complete updated mold
    const { data: completeMold, error: fetchError } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
      .eq('id', existing.id)
      .single()
    
    if (fetchError) {
      console.error('Fetch updated mold error:', fetchError)
      return NextResponse.json(updatedMold)
    }
    
    return NextResponse.json(completeMold)
  } catch (error) {
    console.error('Update mold error:', error)
    return NextResponse.json({ error: 'Failed to update mold' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { error } = await supabase
      .from('GameMold')
      .delete()
      .eq('id', params.id)
    
    if (error) {
      console.error('Delete mold error:', error)
      return NextResponse.json({ error: 'Failed to delete mold' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete mold error:', error)
    return NextResponse.json({ error: 'Failed to delete mold' }, { status: 500 })
  }
}
