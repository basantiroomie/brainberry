import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have environment variables set', () => {
    expect(process.env.GEMINI_API_KEY).toBe('test-gemini-key')
    expect(process.env.SUPABASE_URL).toBe('https://test.supabase.co')
  })

  it('should have mocked Web Speech API', () => {
    expect(window.speechSynthesis).toBeDefined()
    expect(window.SpeechSynthesisUtterance).toBeDefined()
  })
})