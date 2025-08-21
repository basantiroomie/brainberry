import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const mold = await prisma.gameMold.findUnique({ where: { id: params.id }, include: { scenes: { include: { assets: true } } } })
  if (!mold) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(mold)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.gameMold.findUnique({ where: { id: params.id }, include: { scenes: { include: { assets: true } } } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const data = await req.json()

  // Simplistic update: delete & recreate scenes (OK for prototype)
  await prisma.scene.deleteMany({ where: { moldId: existing.id } })

  const mold = await prisma.gameMold.update({
    where: { id: existing.id },
    data: {
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
      version: existing.version + 1,
      scenes: {
        create: (data.scenes || []).map((s: any, index: number) => ({
          index,
          title: s.title,
          narrative: s.narrative,
          instructions: s.instructions,
          pacingCalm: !!s.pacingHints?.calmMode,
          pacingFast: !!s.pacingHints?.fastMode,
          reinforcement: s.reinforcement,
          assets: { create: (s.assets || []).map((a: any) => ({ type: a.type, label: a.label, url: a.url })) }
        }))
      }
    },
    include: { scenes: { include: { assets: true } } }
  })
  return NextResponse.json(mold)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.gameMold.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
