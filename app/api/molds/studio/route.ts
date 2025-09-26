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

    // Create the mold (attempt modern schema first; fallback to legacy columns if needed)
    const fullInsert = {
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
    }

    let moldInsertRes = await supabase.from('GameMold').insert(fullInsert as any).select().single()

    // Fallback if columns like created_by/metadata are missing
    if (moldInsertRes.error && moldInsertRes.error.message?.includes('column') && moldInsertRes.error.message?.includes('does not exist')) {
      console.warn('[studio] Falling back to legacy GameMold insert:', moldInsertRes.error.message)
      const legacyInsert = {
        name: fullInsert.name,
        category: fullInsert.category,
        structure_type: fullInsert.structure_type,
        experience_type: fullInsert.experience_type,
        primary_objective: fullInsert.primary_objective,
        rules: fullInsert.rules,
        lock_structure: fullInsert.lock_structure,
        allow_themes: fullInsert.allow_themes,
        allow_pacing: fullInsert.allow_pacing,
        allow_rewards: fullInsert.allow_rewards,
        allow_avatars: fullInsert.allow_avatars,
        customization_notes: fullInsert.customization_notes,
        age_min: fullInsert.age_min,
        age_max: fullInsert.age_max,
        version: 1
      }
      moldInsertRes = await supabase.from('GameMold').insert(legacyInsert as any).select().single()
    }

    // Helpful message when RLS prevents insert (policies not applied)
    if (moldInsertRes.error) {
      const e = moldInsertRes.error
      console.error('Create mold error:', e)
      if ((e.message && e.message.toLowerCase().includes('violates row-level security')) || e.code === '42501') {
        return NextResponse.json({
          error: 'Database policies missing for mold creation. Please apply migration 20250827000000_add_mold_studio_support.sql to enable educator inserts.',
          details: e.message
        }, { status: 403 })
      }
      return NextResponse.json({ error: 'Failed to create mold', details: e.message }, { status: 500 })
    }

    const mold = moldInsertRes.data

    // Create scenes
    if (moldData.scenes && moldData.scenes.length > 0) {
      // Map to current DB schema: scene_index, name, description, config
      const scenesData = moldData.scenes.map((scene: any, index: number) => ({
        mold_id: mold.id,
        scene_index: index + 1,
        name: scene.title,
        description: scene.narrative || scene.instructions || '',
        config: {
          title: scene.title,
          narrative: scene.narrative || '',
          instructions: scene.instructions || '',
          pacing_hints: scene.pacingHints || {},
          reinforcement: scene.reinforcement || ''
        }
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
          // Map asset fields to current DB schema: asset_type, name, url, metadata
          const assetsData = scene.assets.map((asset: any) => ({
            scene_id: sceneRecord.id,
            asset_type: asset.type,
            name: asset.label,
            url: asset.url,
            metadata: { description: asset.description || '' }
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

    // Update the mold (attempt modern schema; fallback to legacy without metadata)
    const fullUpdate = {
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
    }
    let moldUpdateRes = await supabase.from('GameMold').update(fullUpdate as any).eq('id', moldData.id).select().single()
    if (moldUpdateRes.error && moldUpdateRes.error.message?.includes('column') && moldUpdateRes.error.message?.includes('does not exist')) {
      console.warn('[studio] Falling back to legacy GameMold update:', moldUpdateRes.error.message)
      const legacyUpdate = { ...fullUpdate }
      // Remove metadata if not present
      delete (legacyUpdate as any).metadata
      moldUpdateRes = await supabase.from('GameMold').update(legacyUpdate as any).eq('id', moldData.id).select().single()
    }
    if (moldUpdateRes.error) {
      const e = moldUpdateRes.error
      console.error('Update mold error:', e)
      if ((e.message && e.message.toLowerCase().includes('violates row-level security')) || e.code === '42501') {
        return NextResponse.json({
          error: 'Database policies missing for mold updates. Please apply migration 20250827000000_add_mold_studio_support.sql to enable educator edits.',
          details: e.message
        }, { status: 403 })
      }
      return NextResponse.json({ error: 'Failed to update mold', details: e.message }, { status: 500 })
    }

    const mold = moldUpdateRes.data

    // Delete existing scenes and assets
    await supabase.from('Scene').delete().eq('mold_id', moldData.id)

    // Create new scenes (mapped to current DB schema)
    if (moldData.scenes && moldData.scenes.length > 0) {
      const scenesData = moldData.scenes.map((scene: any, index: number) => ({
        mold_id: moldData.id,
        scene_index: index + 1,
        name: scene.title,
        description: scene.narrative || scene.instructions || '',
        config: {
          title: scene.title,
          narrative: scene.narrative || '',
          instructions: scene.instructions || '',
          pacing_hints: scene.pacingHints || {},
          reinforcement: scene.reinforcement || ''
        }
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
            asset_type: asset.type,
            name: asset.label,
            url: asset.url,
            metadata: { description: asset.description || '' }
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
