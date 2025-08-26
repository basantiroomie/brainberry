import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, requireEducator } from '@/lib/supabase-server'

// Enhanced validation for mold studio
export async function POST(req: NextRequest) {
  try {
    const { user } = await requireEducator()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const mold = await req.json()
    const errors: any[] = []

    // Critical validations
    if (!mold.name || typeof mold.name !== 'string' || !mold.name.trim()) {
      errors.push({
        type: 'critical',
        message: 'Game name is required',
        section: 'basic',
        field: 'name'
      })
    }

    if (!mold.primaryObjective || typeof mold.primaryObjective !== 'string' || !mold.primaryObjective.trim()) {
      errors.push({
        type: 'critical',
        message: 'Primary learning objective is required',
        section: 'basic',
        field: 'primaryObjective'
      })
    }

    if (!mold.scenes || mold.scenes.length === 0) {
      errors.push({
        type: 'critical',
        message: 'At least one scene is required',
        section: 'scenes'
      })
    } else {
      // Validate each scene
      mold.scenes.forEach((scene: any, index: number) => {
        if (!scene.title?.trim()) {
          errors.push({
            type: 'critical',
            message: `Scene ${index + 1} must have a title`,
            section: 'scenes',
            sceneIndex: index,
            field: 'title'
          })
        }

        if (!scene.instructions?.trim()) {
          errors.push({
            type: 'critical',
            message: `Scene ${index + 1} must have instructions for the child`,
            section: 'scenes',
            sceneIndex: index,
            field: 'instructions'
          })
        }

        // Warnings for best practices
        if (!scene.narrative?.trim()) {
          errors.push({
            type: 'warning',
            message: `Scene ${index + 1} would benefit from narrative text`,
            section: 'scenes',
            sceneIndex: index,
            field: 'narrative'
          })
        }

        if (!scene.reinforcement?.trim()) {
          errors.push({
            type: 'warning',
            message: `Scene ${index + 1} should include positive reinforcement`,
            section: 'scenes',
            sceneIndex: index,
            field: 'reinforcement'
          })
        }
      })
    }

    // Age range validation
    if (mold.meta?.ageRange) {
      const { min, max } = mold.meta.ageRange
      if (min < 3 || min > 17) {
        errors.push({
          type: 'critical',
          message: 'Minimum age must be between 3 and 17',
          section: 'metadata',
          field: 'ageMin'
        })
      }
      if (max < 3 || max > 17) {
        errors.push({
          type: 'critical',
          message: 'Maximum age must be between 3 and 17',
          section: 'metadata',
          field: 'ageMax'
        })
      }
      if (min >= max) {
        errors.push({
          type: 'critical',
          message: 'Minimum age must be less than maximum age',
          section: 'metadata',
          field: 'ageRange'
        })
      }
    }

    // Learning objectives validation
    if (!mold.meta?.learnerProfiles || mold.meta.learnerProfiles.length === 0) {
      errors.push({
        type: 'warning',
        message: 'Select target learner profiles for better targeting',
        section: 'metadata',
        field: 'learnerProfiles'
      })
    }

    if (!mold.meta?.executiveFunctionTargets || mold.meta.executiveFunctionTargets.length === 0) {
      errors.push({
        type: 'info',
        message: 'Consider specifying executive function targets',
        section: 'metadata',
        field: 'executiveFunctionTargets'
      })
    }

    // Customization validation
    if (mold.customization?.allowThemes === false && 
        mold.customization?.allowPacing === false && 
        mold.customization?.allowRewards === false && 
        mold.customization?.allowAvatars === false) {
      errors.push({
        type: 'warning',
        message: 'No personalization options enabled - children may find this less engaging',
        section: 'customization'
      })
    }

    // Content safety checks
    const textContent = [
      mold.name,
      mold.primaryObjective,
      mold.rules,
      ...mold.scenes.map((s: any) => [s.title, s.narrative, s.instructions, s.reinforcement]).flat()
    ].filter(Boolean).join(' ')

    const inappropriateWords = ['violence', 'scary', 'dangerous', 'inappropriate']
    inappropriateWords.forEach(word => {
      if (textContent.toLowerCase().includes(word)) {
        errors.push({
          type: 'warning',
          message: `Content may contain inappropriate language: "${word}"`,
          section: 'basic'
        })
      }
    })

    return NextResponse.json({ 
      valid: errors.filter(e => e.type === 'critical').length === 0,
      errors 
    })

  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ 
      valid: false, 
      errors: [{ type: 'critical', message: 'Validation failed due to server error' }] 
    }, { status: 500 })
  }
}
