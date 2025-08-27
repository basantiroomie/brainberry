import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AvatarChatbot } from '@/app/child/components/AvatarChatbot'

// Mock AvatarViewer component
vi.mock('@/components/AvatarViewer', () => ({
  AvatarViewer: ({ onModelLoad, ...props }: any) => {
    // Simulate model loading
    React.useEffect(() => {
      if (onModelLoad) {
        setTimeout(() => {
          onModelLoad({
            traverse: vi.fn((callback) => {
              // Mock mesh with morph targets
              callback({
                morphTargetInfluences: [0, 0, 0],
                morphTargetDictionary: {
                  jawOpen: 0,
                  mouthSmile: 1,
                  eyeBlinkLeft: 2,
                },
              })
            }),
          })
        }, 100)
      }
    }, [onModelLoad])
    
    return React.createElement('div', { 'data-testid': 'avatar-viewer', ...props })
  },
}))

// Mock error boundary
vi.mock('@/components/AvatarErrorBoundary', () => ({
  AvatarChatbotErrorBoundary: ({ children }: any) => React.createElement('div', {}, children),
}))

// Mock lipsync manager
const mockLipsyncManager = {
  setVisemeCallback: vi.fn(),
  processSpeechSynthesis: vi.fn(),
  dispose: vi.fn(),
}

vi.mock('@/lib/lipsync-manager', () => ({
  getLipsyncManager: () => mockLipsyncManager,
}))

// Mock avatar utilities
vi.mock('@/lib/avatar-performance-monitor', () => ({
  measureAvatarOperation: vi.fn((type, name, fn) => fn()),
  recordAvatarEvent: vi.fn(),
}))

vi.mock('@/lib/avatar-error-handler', () => ({
  handleAvatarError: vi.fn(),
  AvatarErrorType: {
    TTS_ERROR: 'TTS_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    RENDERING_ERROR: 'RENDERING_ERROR',
  },
}))

vi.mock('@/lib/avatar-retry-manager', () => ({
  retryTTSOperation: vi.fn(() => Promise.resolve({ success: true })),
  retryApiCall: vi.fn((fn) => Promise.resolve({ success: true, data: fn() })),
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch for chat API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('AvatarChatbot Basic Tests', () => {
  const mockProps = {
    avatarUrl: 'https://models.readyplayer.me/TEST123.glb',
    childId: 'child-123',
    accessCode: 'ABC123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock successful chat API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        text: 'Hello! How are you today?',
        facialExpression: 'smile',
        animation: 'Talking',
      }),
    })
  })

  it('renders without crashing', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    // The avatar viewer is now embedded in a canvas, so check for the canvas instead
    expect(screen.getByRole('img', { hidden: true }) || screen.getByText('Chat with Your Avatar!')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('displays welcome message when no messages exist', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    expect(screen.getByText('Hi there! 👋')).toBeInTheDocument()
    expect(screen.getByText('Start a conversation with your 3D avatar!')).toBeInTheDocument()
  })

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup()
    const onMessageSent = vi.fn()
    
    render(<AvatarChatbot {...mockProps} onMessageSent={onMessageSent} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const submitButton = screen.getByRole('button')
    
    await user.type(input, 'Hello avatar!')
    await user.click(submitButton)
    
    expect(onMessageSent).toHaveBeenCalledWith('Hello avatar!')
    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello avatar!',
        childId: 'child-123',
        accessCode: 'ABC123',
      }),
    })
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const submitButton = screen.getByRole('button')
    
    await user.click(submitButton)
    
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('displays user message after sending', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    // Wait for user message to appear
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
  })

  it('initializes lipsync manager correctly', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    expect(mockLipsyncManager.setVisemeCallback).toHaveBeenCalled()
  })

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<AvatarChatbot {...mockProps} />)
    
    unmount()
    
    expect(mockLipsyncManager.dispose).toHaveBeenCalled()
  })
})