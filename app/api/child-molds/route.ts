import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { EXPRESSION_GAME_MOLD } from '@/lib/molds'

// Public endpoint for children to fetch available game molds
// No authentication required as molds are public templates
export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    
    const { data: molds, error } = await supabase
      .from('GameMold')
      .select(`
        id,
        name,
        category,
        experience_type,
        primary_objective,
        age_min,
        age_max,
        customization_notes
      `)
      .order('name')
    
    if (error) {
      console.error('Get child molds error:', error)
      return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
    }
    
    // Always include the local Expression Game mold
    const expressionGameLite = {
      id: EXPRESSION_GAME_MOLD.id,
      name: EXPRESSION_GAME_MOLD.name,
      category: EXPRESSION_GAME_MOLD.category,
      experience_type: EXPRESSION_GAME_MOLD.experienceType,
      primary_objective: EXPRESSION_GAME_MOLD.primaryObjective,
      age_min: EXPRESSION_GAME_MOLD.meta?.ageRange.min ?? 3,
      age_max: EXPRESSION_GAME_MOLD.meta?.ageRange.max ?? 12,
      customization_notes: EXPRESSION_GAME_MOLD.customization.notes ?? '',
      personalizationComponent: EXPRESSION_GAME_MOLD.personalizationComponent ?? 'MoldPersonalizationWizard'
    }
    // Add personalizationComponent and normalize experience_type for all molds
    const allMolds = Array.isArray(molds)
      ? molds.map(m => ({
          ...m,
          personalizationComponent: (m as any).personalizationComponent || (m.id === 'expression_game' ? 'ExpressionGame' : 'MoldPersonalizationWizard'),
          experience_type: m.experience_type || (m as any).experienceType || 'interactive',
        }))
      : []
    const hasExpressionGame = allMolds.some(m => m.id === expressionGameLite.id)
    const mergedMolds = hasExpressionGame ? allMolds : [...allMolds, expressionGameLite]
    return NextResponse.json(mergedMolds)
  } catch (error) {
    console.error('Get child molds error:', error)
    return NextResponse.json({ error: 'Failed to fetch molds' }, { status: 500 })
  }
}
