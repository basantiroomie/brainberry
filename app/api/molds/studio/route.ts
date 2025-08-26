import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

// Studio API - allows educators to create and manage molds
export async function GET() {
  try {
    // TODO: Re-enable authentication after testing
    // const { user } = await requireEducator()
    // if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    const supabase = await createSupabaseServerClient()
    
    // Get all available molds for now (until created_by column is available)
    const { data: molds, error } = await supabase
      .from('GameMold')
      .select(`
        *,
        scenes:Scene(
          *,
          assets:Asset(*)
        )
      `)
      .order('updated_at', { ascending: false })
    
    if (error) {
      console.error('Get studio molds error:', error)
      return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
    }
    
    return NextResponse.json(molds || [])
  } catch (error) {
    console.error('Get studio molds error:', error)
    return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const moldData = await req.json()
    const supabase = await createSupabaseServerClient()

    // Validate the mold first
    const validationResponse = await fetch(`${req.nextUrl.origin}/api/molds/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moldData)
    })
    
    const validation = await validationResponse.json()
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Mold validation failed', 
        validationErrors: validation.errors 
      }, { status: 400 })
    }

    // Create the mold
    const { data: mold, error: moldError } = await supabase
      .from('GameMold')
      .insert({
        name: moldData.name,
        category: moldData.category,
        structure_type: moldData.structureType,
        experience_type: moldData.experienceType,
        primary_objective: moldData.primaryObjective,
        rules: moldData.rules ? { description: moldData.rules } : {},
        lock_structure: moldData.customization?.lockStructure || false,
        allow_themes: moldData.customization?.allowThemes !== false,
        allow_pacing: moldData.customization?.allowPacing !== false,
        allow_rewards: moldData.customization?.allowRewards !== false,
        allow_avatars: moldData.customization?.allowAvatars !== false,
        customization_notes: moldData.customization?.notes || '',
        age_min: moldData.meta?.ageRange?.min || 5,
        age_max: moldData.meta?.ageRange?.max || 12,
        version: 1,
        created_by: user.id,
        metadata: {
          difficulty: moldData.meta?.difficulty || 'Medium',
          learnerProfiles: moldData.meta?.learnerProfiles || [],
          executiveFunctionTargets: moldData.meta?.executiveFunctionTargets || [],
          sensoryPreferences: moldData.meta?.sensoryPreferences || [],
          skillTargets: moldData.meta?.skillTargets || []
        }
      })
      .select()
      .single()

    if (moldError) {
      console.error('Create mold error:', moldError)
      return NextResponse.json({ error: 'Failed to create mold' }, { status: 500 })
    }

    // Create scenes
    if (moldData.scenes && moldData.scenes.length > 0) {
      const scenesData = moldData.scenes.map((scene: any, index: number) => ({
        mold_id: mold.id,
        title: scene.title,
        narrative: scene.narrative || '',
        instructions: scene.instructions,
        reinforcement: scene.reinforcement || '',
        order_index: index,
        pacing_hints: scene.pacingHints || {}
      }))

      const { data: scenes, error: scenesError } = await supabase
        .from('Scene')
        .insert(scenesData)
        .select()

      if (scenesError) {
        console.error('Create scenes error:', scenesError)
        // Clean up the mold if scenes failed
        await supabase.from('GameMold').delete().eq('id', mold.id)
        return NextResponse.json({ error: 'Failed to create scenes' }, { status: 500 })
      }

      // Create assets for scenes
      for (let i = 0; i < moldData.scenes.length; i++) {
        const scene = moldData.scenes[i]
        const sceneRecord = scenes[i]
        
        if (scene.assets && scene.assets.length > 0) {
          const assetsData = scene.assets.map((asset: any) => ({
            scene_id: sceneRecord.id,
            type: asset.type,
            label: asset.label,
            url: asset.url,
            description: asset.description || ''
          }))

          await supabase.from('Asset').insert(assetsData)
        }
      }
    }

    return NextResponse.json({ ...mold, message: 'Mold created successfully' })

  } catch (error) {
    console.error('Create mold error:', error)
    return NextResponse.json({ error: 'Failed to create mold' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const moldData = await req.json()
    if (!moldData.id) {
      return NextResponse.json({ error: 'Mold ID is required for updates' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Verify ownership
    const { data: existingMold, error: checkError } = await supabase
      .from('GameMold')
      .select('created_by')
      .eq('id', moldData.id)
      .single()

    if (checkError || !existingMold) {
      return NextResponse.json({ error: 'Mold not found' }, { status: 404 })
    }

    if (existingMold.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to edit this mold' }, { status: 403 })
    }

    // Validate the updated mold
    const validationResponse = await fetch(`${req.nextUrl.origin}/api/molds/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(moldData)
    })
    
    const validation = await validationResponse.json()
    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Mold validation failed', 
        validationErrors: validation.errors 
      }, { status: 400 })
    }

    // Update the mold
    const { data: mold, error: moldError } = await supabase
      .from('GameMold')
      .update({
        name: moldData.name,
        category: moldData.category,
        structure_type: moldData.structureType,
        experience_type: moldData.experienceType,
        primary_objective: moldData.primaryObjective,
        rules: moldData.rules ? { description: moldData.rules } : {},
        lock_structure: moldData.customization?.lockStructure || false,
        allow_themes: moldData.customization?.allowThemes !== false,
        allow_pacing: moldData.customization?.allowPacing !== false,
        allow_rewards: moldData.customization?.allowRewards !== false,
        allow_avatars: moldData.customization?.allowAvatars !== false,
        customization_notes: moldData.customization?.notes || '',
        age_min: moldData.meta?.ageRange?.min || 5,
        age_max: moldData.meta?.ageRange?.max || 12,
        updated_at: new Date().toISOString(),
        metadata: {
          difficulty: moldData.meta?.difficulty || 'Medium',
          learnerProfiles: moldData.meta?.learnerProfiles || [],
          executiveFunctionTargets: moldData.meta?.executiveFunctionTargets || [],
          sensoryPreferences: moldData.meta?.sensoryPreferences || [],
          skillTargets: moldData.meta?.skillTargets || []
        }
      })
      .eq('id', moldData.id)
      .select()
      .single()

    if (moldError) {
      console.error('Update mold error:', moldError)
      return NextResponse.json({ error: 'Failed to update mold' }, { status: 500 })
    }

    // Delete existing scenes and assets
    await supabase.from('Scene').delete().eq('mold_id', moldData.id)

    // Create new scenes
    if (moldData.scenes && moldData.scenes.length > 0) {
      const scenesData = moldData.scenes.map((scene: any, index: number) => ({
        mold_id: moldData.id,
        title: scene.title,
        narrative: scene.narrative || '',
        instructions: scene.instructions,
        reinforcement: scene.reinforcement || '',
        order_index: index,
        pacing_hints: scene.pacingHints || {}
      }))

      const { data: scenes, error: scenesError } = await supabase
        .from('Scene')
        .insert(scenesData)
        .select()

      if (scenesError) {
        console.error('Create scenes error:', scenesError)
        return NextResponse.json({ error: 'Failed to update scenes' }, { status: 500 })
      }

      // Create assets for scenes
      for (let i = 0; i < moldData.scenes.length; i++) {
        const scene = moldData.scenes[i]
        const sceneRecord = scenes[i]
        
        if (scene.assets && scene.assets.length > 0) {
          const assetsData = scene.assets.map((asset: any) => ({
            scene_id: sceneRecord.id,
            type: asset.type,
            label: asset.label,
            url: asset.url,
            description: asset.description || ''
          }))

          await supabase.from('Asset').insert(assetsData)
        }
      }
    }

    return NextResponse.json({ ...mold, message: 'Mold updated successfully' })

  } catch (error) {
    console.error('Update mold error:', error)
    return NextResponse.json({ error: 'Failed to update mold' }, { status: 500 })
  }
}
