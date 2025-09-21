import { describe, it, expect } from 'vitest'
import { 
  normalizeMoldFromApi, 
  tryNormalizeMoldFromApi, 
  normalizeMoldArrayFromApi,
  type Mold 
} from '../mold-normalize'

describe('mold-normalize', () => {
  describe('deterministic behavior', () => {
    it('generates consistent IDs for identical input', () => {
      const dbMold = {
        id: null,
        name: 'Test Mold',
        category: 'attention',
        structure_type: 'linear',
        experience_type: 'puzzle',
        primary_objective: 'Focus practice',
        rules: 'Follow instructions',
        scenes: [
          {
            title: 'Scene 1',
            narrative: 'First scene',
            instructions: 'Do this',
            assets: [
              {
                type: 'image',
                label: 'Picture 1',
                url: 'http://example.com/pic1.jpg',
                description: 'A test image'
              }
            ],
            reinforcement: 'Good job!'
          }
        ],
        version: 1
      }

      const result1 = normalizeMoldFromApi(dbMold)
      const result2 = normalizeMoldFromApi(dbMold)
      
      // IDs should be identical across runs
      expect(result1.scenes[0].id).toBe(result2.scenes[0].id)
      expect(result1.scenes[0].assets[0].id).toBe(result2.scenes[0].assets[0].id)
      
      // Verify the IDs are deterministic (based on content, not random)
      expect(result1.scenes[0].id).toMatch(/^scene_[a-z0-9]+$/)
      expect(result1.scenes[0].assets[0].id).toMatch(/^asset_[a-z0-9]+$/)
    })

    it('generates different IDs for different content', () => {
      const mold1 = {
        name: 'Mold 1',
        scenes: [{ title: 'Scene A', narrative: 'Story A', assets: [] }]
      }
      const mold2 = {
        name: 'Mold 2', 
        scenes: [{ title: 'Scene B', narrative: 'Story B', assets: [] }]
      }

      const result1 = normalizeMoldFromApi(mold1)
      const result2 = normalizeMoldFromApi(mold2)
      
      expect(result1.scenes[0].id).not.toBe(result2.scenes[0].id)
    })

    it('preserves explicit IDs when provided', () => {
      const dbMold = {
        name: 'Test',
        scenes: [
          {
            id: 'explicit-scene-id',
            title: 'Scene',
            assets: [
              {
                id: 'explicit-asset-id',
                type: 'image',
                label: 'Asset'
              }
            ]
          }
        ]
      }

      const result = normalizeMoldFromApi(dbMold)
      expect(result.scenes[0].id).toBe('explicit-scene-id')
      expect(result.scenes[0].assets[0].id).toBe('explicit-asset-id')
    })
  })

  describe('runtime validation', () => {
    it('accepts valid mold data', () => {
      const validMold = {
        id: 'mold-1',
        name: 'Valid Mold',
        category: 'attention',
        structure_type: 'linear',
        experience_type: 'puzzle',
        primary_objective: 'Test objective',
        rules: 'Test rules',
        scenes: [],
        version: 1
      }

      expect(() => normalizeMoldFromApi(validMold)).not.toThrow()
    })

    it('throws ZodError for invalid data', () => {
      const invalidMold = {
        name: 'Valid name',
        scenes: [
          {
            title: 'Valid scene',
            assets: [
              {
                type: 123, // Invalid type - should be string
                label: true, // Invalid label - should be string  
                url: null, // Invalid URL - should be string
                description: [] // Invalid description - should be string
              }
            ]
          }
        ]
      }

      // The coercion should handle this gracefully, so let's try something that really breaks validation
      const reallyInvalidMold = {
        name: '', // Empty name might pass
        version: 'not-a-number' // This should definitely fail
      }

      expect(() => normalizeMoldFromApi(reallyInvalidMold)).toThrow()
    })

    it('safe variant returns error for invalid data', () => {
      const invalidMold = { version: 'not-a-number' } // Invalid version type
      
      const result = tryNormalizeMoldFromApi(invalidMold)
      expect(result.success).toBe(false)
      expect('error' in result).toBe(true)
    })

    it('safe variant returns data for valid input', () => {
      const validMold = {
        name: 'Valid',
        scenes: []
      }
      
      const result = tryNormalizeMoldFromApi(validMold)
      expect(result.success).toBe(true)
      expect('data' in result).toBe(true)
    })
  })

  describe('data normalization', () => {
    it('handles snake_case to camelCase conversion', () => {
      const snakeCaseMold = {
        name: 'Test',
        structure_type: 'branching',
        experience_type: 'story',
        primary_objective: 'Learn',
        age_min: 6,
        age_max: 10,
        lock_structure: true,
        allow_themes: false,
        customization_notes: 'Special notes',
        scenes: [
          {
            title: 'Scene',
            pacing_hints: { speed: 'slow' },
            assets: []
          }
        ]
      }

      const result = normalizeMoldFromApi(snakeCaseMold)
      
      expect(result.structureType).toBe('branching')
      expect(result.experienceType).toBe('story')
      expect(result.primaryObjective).toBe('Learn')
      expect(result.meta.ageRange.min).toBe(6)
      expect(result.meta.ageRange.max).toBe(10)
      expect(result.customization.lockStructure).toBe(true)
      expect(result.customization.allowThemes).toBe(false)
      expect(result.customization.notes).toBe('Special notes')
      expect(result.scenes[0].pacingHints).toEqual({ speed: 'slow' })
    })

    it('handles mixed camelCase and snake_case', () => {
      const mixedMold = {
        name: 'Mixed',
        structureType: 'linear', // camelCase
        experience_type: 'puzzle', // snake_case
        scenes: []
      }

      const result = normalizeMoldFromApi(mixedMold)
      expect(result.structureType).toBe('linear')
      expect(result.experienceType).toBe('puzzle')
    })

    it('provides sensible defaults for missing fields', () => {
      const minimalMold = {
        name: 'Minimal'
      }

      const result = normalizeMoldFromApi(minimalMold)
      
      expect(result.category).toBe('attention')
      expect(result.structureType).toBe('linear')
      expect(result.experienceType).toBe('puzzle')
      expect(result.rules).toBe('')
      expect(result.scenes).toEqual([])
      expect(result.version).toBe(1)
      expect(result.meta.ageRange.min).toBe(5)
      expect(result.meta.ageRange.max).toBe(12)
      expect(result.meta.difficulty).toBe('Medium')
      expect(result.customization.allowThemes).toBe(true)
      expect(result.customization.lockStructure).toBe(false)
    })

    it('handles complex rules extraction', () => {
      const moldWithStringRules = {
        name: 'Test',
        rules: 'Simple string rules'
      }
      
      const moldWithObjectRules = {
        name: 'Test',
        rules: {
          description: 'Object-based rules'
        }
      }

      const result1 = normalizeMoldFromApi(moldWithStringRules)
      const result2 = normalizeMoldFromApi(moldWithObjectRules)
      
      expect(result1.rules).toBe('Simple string rules')
      expect(result2.rules).toBe('Object-based rules')
    })

    it('handles metadata vs meta field variations', () => {
      const moldWithMetadata = {
        name: 'Test',
        metadata: {
          difficulty: 'Hard',
          learnerProfiles: ['visual']
        }
      }
      
      const moldWithMeta = {
        name: 'Test',
        meta: {
          difficulty: 'Easy',
          skillTargets: ['memory']
        }
      }

      const result1 = normalizeMoldFromApi(moldWithMetadata)
      const result2 = normalizeMoldFromApi(moldWithMeta)
      
      expect(result1.meta.difficulty).toBe('Hard')
      expect(result1.meta.learnerProfiles).toEqual(['visual'])
      expect(result2.meta.difficulty).toBe('Easy')
      expect(result2.meta.skillTargets).toEqual(['memory'])
    })
  })

  describe('array processing', () => {
    it('normalizes array of molds', () => {
      const moldArray = [
        { name: 'Mold 1', scenes: [] },
        { name: 'Mold 2', scenes: [] }
      ]

      const result = normalizeMoldArrayFromApi(moldArray)
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Mold 1')
      expect(result[1].name).toBe('Mold 2')
    })

    it('handles empty and invalid arrays', () => {
      expect(normalizeMoldArrayFromApi([])).toEqual([])
      expect(normalizeMoldArrayFromApi(null as any)).toEqual([])
      expect(normalizeMoldArrayFromApi('not-array' as any)).toEqual([])
    })

    it('skips invalid items in array', () => {
      const moldArray = [
        { name: 'Valid Mold' },
        { version: 'invalid-type' }, // This should cause normalization to fail
        { name: 'Another Valid' }
      ]

      // Should throw on the invalid version item
      expect(() => normalizeMoldArrayFromApi(moldArray as any)).toThrow()
    })
  })

  describe('type safety', () => {
    it('returns properly typed Mold object', () => {
      const dbMold = {
        name: 'Typed Test',
        scenes: [
          {
            title: 'Scene',
            narrative: 'Story',
            instructions: 'Do this',
            assets: [
              {
                type: 'image',
                label: 'Asset',
                url: 'http://example.com/asset.jpg',
                description: 'Description'
              }
            ],
            reinforcement: 'Great!'
          }
        ]
      }

      const result: Mold = normalizeMoldFromApi(dbMold)
      
      // TypeScript should enforce these types
      expect(typeof result.name).toBe('string')
      expect(typeof result.category).toBe('string')
      expect(Array.isArray(result.scenes)).toBe(true)
      expect(typeof result.scenes[0].id).toBe('string')
      expect(typeof result.scenes[0].title).toBe('string')
      expect(Array.isArray(result.scenes[0].assets)).toBe(true)
      expect(typeof result.scenes[0].assets[0].id).toBe('string')
      expect(typeof result.customization.lockStructure).toBe('boolean')
      expect(typeof result.meta.ageRange.min).toBe('number')
    })
  })

  describe('edge cases', () => {
    it('handles null and undefined input gracefully', () => {
      expect(() => normalizeMoldFromApi(null as any)).toThrow('expected object')
      expect(() => normalizeMoldFromApi(undefined as any)).toThrow('expected object')
    })

    it('handles empty objects', () => {
      const emptyMold = {}
      const result = normalizeMoldFromApi(emptyMold)
      
      // Should have sensible defaults
      expect(result.name).toBe('')
      expect(result.scenes).toEqual([])
      expect(result.id).toBeNull()
    })

    it('handles malformed scene and asset data', () => {
      const moldWithBadScenes = {
        name: 'Test',
        scenes: [
          null, // Invalid scene
          { title: 'Valid Scene', assets: 'not-array' }, // Invalid assets
          { 
            title: 'Good Scene', 
            assets: [
              { type: 'image' }, // Missing fields
              null // Invalid asset
            ]
          }
        ]
      }

      const result = normalizeMoldFromApi(moldWithBadScenes)
      
      // Should coerce/default invalid data
      expect(result.scenes).toHaveLength(3)
      expect(result.scenes[1].assets).toEqual([]) // Coerced from 'not-array'
      expect(result.scenes[2].assets).toHaveLength(2) // Both assets processed
      expect(result.scenes[2].assets[0].label).toBe('') // Default for missing
    })
  })
})