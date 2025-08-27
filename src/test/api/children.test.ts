import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/children/[id]/route'

// Mock dependencies
vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'child-123',
              name: 'Test Child',
              age: 8,
              diagnosis: 'ADHD',
              avatar_url: null,
              avatar_headshot_url: null,
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'child-123',
                name: 'Test Child',
                age: 8,
                diagnosis: 'ADHD',
                avatar_url: 'https://models.readyplayer.me/ABC123.glb',
                avatar_headshot_url: 'https://models.readyplayer.me/ABC123.png',
              },
              error: null,
            })),
          })),
        })),
      })),
    })),
  })),
  requireEducator: vi.fn(() => Promise.resolve({
    user: { id: 'educator-123', role: 'educator' },
  })),
}))

vi.mock('@/lib/schemas', () => ({
  updateChildAvatarSchema: {
    safeParse: vi.fn((data) => ({
      success: true,
      data,
    })),
  },
  childCreateSchema: {
    safeParse: vi.fn((data) => ({
      success: true,
      data,
    })),
  },
}))

vi.mock('@/lib/avatar-utils', () => ({
  AvatarCodeUtils: {
    codeToUrls: vi.fn((code: string) => ({
      glbUrl: `https://models.readyplayer.me/${code}.glb`,
      pngUrl: `https://models.readyplayer.me/${code}.png`,
    })),
  },
}))

describe('/api/children/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET', () => {
    it('returns child data for valid ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/children/child-123')
      const params = Promise.resolve({ id: 'child-123' })

      const response = await GET(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('child-123')
      expect(data.name).toBe('Test Child')
    })
  })

  describe('PUT', () => {
    it('updates child avatar with avatar code', async () => {
      const request = new NextRequest('http://localhost:3000/api/children/child-123', {
        method: 'PUT',
        body: JSON.stringify({
          avatar_code: 'ABC123',
        }),
      })
      const params = Promise.resolve({ id: 'child-123' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.child.avatar_url).toBe('https://models.readyplayer.me/ABC123.glb')
      expect(data.child.avatar_headshot_url).toBe('https://models.readyplayer.me/ABC123.png')
    })

    it('updates child avatar with direct URLs', async () => {
      const request = new NextRequest('http://localhost:3000/api/children/child-123', {
        method: 'PUT',
        body: JSON.stringify({
          avatar_url: 'https://models.readyplayer.me/XYZ789.glb',
          avatar_headshot_url: 'https://models.readyplayer.me/XYZ789.png',
        }),
      })
      const params = Promise.resolve({ id: 'child-123' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('validates avatar URLs', async () => {
      const { updateChildAvatarSchema } = await import('@/lib/schemas')
      vi.mocked(updateChildAvatarSchema.safeParse).mockReturnValue({
        success: false,
        error: {
          flatten: () => ({ fieldErrors: { avatar_url: ['Invalid URL'] } }),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/children/child-123', {
        method: 'PUT',
        body: JSON.stringify({
          avatar_url: 'invalid-url',
        }),
      })
      const params = Promise.resolve({ id: 'child-123' })

      const response = await PUT(request, { params })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid avatar data')
    })
  })
})