import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { gameMoldBaseSchema } from '@/lib/schemas'

// List & Create
export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/molds called')
    
    // For now, return all molds since they're global
    // In the future, you might want to add user-specific molds
    const molds = await prisma.gameMold.findMany({ 
      include: { 
        scenes: { 
          include: { 
            assets: true 
          } 
        } 
      } 
    })
    
    console.log(`Found ${molds.length} molds`)
    return NextResponse.json(molds)
  } catch (error) {
    console.error('Error fetching molds:', error)
    return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const json = await req.json()
  const parsed = gameMoldBaseSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  const data = parsed.data
  const mold = await prisma.gameMold.create({
    data: {
      name: data.name,
      category: data.category,
      structureType: data.structureType,
      experienceType: data.experienceType,
      primaryObjective: data.primaryObjective,
      rules: data.rules,
      lockStructure: data.lockStructure,
      allowThemes: data.allowThemes,
      allowPacing: data.allowPacing,
      allowRewards: data.allowRewards,
      allowAvatars: data.allowAvatars,
      customizationNotes: data.customizationNotes,
      ageMin: data.ageMin,
      ageMax: data.ageMax,
      difficulty: data.difficulty,
      learnerProfiles: data.learnerProfiles.join(','),
      executiveFunctionTargets: (data.executiveFunctionTargets||[]).join(','),
      sensoryPreferences: (data.sensoryPreferences||[]).join(','),
      skillTargets: (data.skillTargets||[]).join(','),
      scenes: {
        create: data.scenes.map((s, index) => ({
          index,
          title: s.title,
          narrative: s.narrative,
          instructions: s.instructions,
          pacingCalm: !!s.pacingHints?.calmMode,
          pacingFast: !!s.pacingHints?.fastMode,
          reinforcement: s.reinforcement,
          assets: { create: s.assets.map(a => ({ type: a.type, label: a.label, url: a.url })) }
        }))
      }
    },
    include: { scenes: { include: { assets: true } } }
  })
  return NextResponse.json(mold)
}
