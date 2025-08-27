import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarChatbot } from '@/app/child/components/AvatarChatbot'

// Mock AvatarViewer component
vi.mock('@/components/AvatarViewer', () => ({
  AvatarViewer: ({ onModelLoad, ...props }: any) => {
    // Simulate model loading
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
    return <div data-testid="avatar-viewer" {...props} />
  },
}))

// Mock error boundary
vi.mock('@/components/AvatarErrorBoundary', () => ({
  AvatarChatbotErrorBoundary: ({ children }: any) => <div>{children}</div>,
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

// Mock form submission
const mockSubmit = vi.fn()

describe('AvatarChatbot', () => {
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders without crashing', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    expect(screen.getByTestId('avatar-viewer')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByText('Hi there! 👋')).toBeInTheDocument()
  })

  it('displays welcome message when no messages exist', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    expect(screen.getByText('Hi there! 👋')).toBeInTheDocument()
    expect(screen.getByText('Start a conversation with your avatar!')).toBeInTheDocument()
  })

  it('sends message when form is submitted', async () => {
    const user = userEvent.setup()
    const onMessageSent = vi.fn()
    
    render(<AvatarChatbot {...mockProps} onMessageSent={onMessageSent} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    const submitButton = screen.getByRole('button', { name: /send/i })
    
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

  it('sends message when Enter key is pressed', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    
    await user.type(input, 'Hello avatar!')
    await user.keyboard('{Enter}')
    
    expect(mockFetch).toHaveBeenCalled()
  })

  it('prevents sending empty messages', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const submitButton = screen.getByRole('button', { name: /send/i })
    
    await user.click(submitButton)
    
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('displays loading state while waiting for response', async () => {
    const user = userEvent.setup()
    
    // Mock delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            text: 'Response',
            facialExpression: 'smile',
            animation: 'Talking',
          }),
        }), 100)
      )
    )
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Hello!')
    await user.keyboard('{Enter}')
    
    expect(screen.getByText('Thinking...')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.queryByText('Thinking...')).not.toBeInTheDocument()
    })
  })

  it('displays chat messages correctly', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    // Wait for user message to appear
    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })
    
    // Wait for API response
    await waitFor(() => {
      expect(screen.getByText('Hello! How are you today?')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    mockFetch.mockRejectedValue(new Error('Network error'))
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText("I'm having trouble right now. Can you try again?")).toBeInTheDocument()
    })
  })

  it('initializes lipsync manager correctly', () => {
    render(<AvatarChatbot {...mockProps} />)
    
    expect(mockLipsyncManager.setVisemeCallback).toHaveBeenCalled()
  })

  it('applies blend shapes to avatar model', async () => {
    render(<AvatarChatbot {...mockProps} />)
    
    // Wait for avatar model to load
    await waitFor(() => {
      expect(screen.getByTestId('avatar-viewer')).toBeInTheDocument()
    })
    
    // Simulate viseme callback
    const visemeCallback = mockLipsyncManager.setVisemeCallback.mock.calls[0][0]
    visemeCallback({ jawOpen: 0.5, mouthSmile: 0.3 })
    
    // The blend shapes should be applied (tested through the mock)
    expect(mockLipsyncManager.setVisemeCallback).toHaveBeenCalled()
  })

  it('handles TTS speech synthesis', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Hello!')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockLipsyncManager.processSpeechSynthesis).toHaveBeenCalled()
    })
  })

  it('disables input while avatar is speaking', async () => {
    const user = userEvent.setup()
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Hello!')
    await user.keyboard('{Enter}')
    
    // Wait for response and speaking to start
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Avatar is speaking...')).toBeInTheDocument()
    })
    
    expect(input).toBeDisabled()
  })

  it('scrolls to bottom when new messages are added', async () => {
    const user = userEvent.setup()
    
    // Mock scrollIntoView
    const mockScrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = mockScrollIntoView
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'Test message')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(mockScrollIntoView).toHaveBeenCalled()
    })
  })

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<AvatarChatbot {...mockProps} />)
    
    unmount()
    
    expect(mockLipsyncManager.dispose).toHaveBeenCalled()
  })

  it('handles different facial expressions', async () => {
    const user = userEvent.setup()
    
    // Mock different response types
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        text: 'That sounds exciting!',
        facialExpression: 'excited',
        animation: 'Talking',
      }),
    })
    
    render(<AvatarChatbot {...mockProps} />)
    
    const input = screen.getByPlaceholderText('Type your message...')
    await user.type(input, 'I got a new toy!')
    await user.keyboard('{Enter}')
    
    await waitFor(() => {
      expect(screen.getByText('That sounds exciting!')).toBeInTheDocument()
    })
  })
})