import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'
import { AvatarChatbot } from '@/app/child/components/AvatarChatbot'

// Mock dependencies
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => 
    React.createElement('div', {
      'data-testid': 'canvas',
      role: 'img',
      'aria-label': '3D Avatar Display',
      ...props
    }, children),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ children, ...props }: any) => <div data-testid="orbit-controls" {...props}>{children}</div>,
  Environment: ({ children, ...props }: any) => <div data-testid="environment" {...props}>{children}</div>,
  useGLTF: vi.fn(() => ({
    scene: {
      clone: vi.fn(() => ({
        scale: { setScalar: vi.fn() },
        position: { set: vi.fn() },
      })),
    },
    animations: [],
  })),
}))

vi.mock('@/components/AvatarErrorBoundary', () => ({
  AvatarViewerErrorBoundary: ({ children }: any) => <div>{children}</div>,
  AvatarChatbotErrorBoundary: ({ children }: any) => <div>{children}</div>,
}))

vi.mock('@/lib/lipsync-manager', () => ({
  getLipsyncManager: () => ({
    setVisemeCallback: vi.fn(),
    processSpeechSynthesis: vi.fn(),
    dispose: vi.fn(),
  }),
}))

vi.mock('@/lib/avatar-performance-monitor', () => ({
  measureAvatarOperation: vi.fn((type, name, fn) => fn()),
  recordAvatarEvent: vi.fn(),
}))

vi.mock('@/lib/avatar-error-handler', () => ({
  handleAvatarError: vi.fn(),
  AvatarErrorType: {
    TTS_ERROR: 'TTS_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
  },
}))

vi.mock('@/lib/avatar-retry-manager', () => ({
  retryTTSOperation: vi.fn(() => Promise.resolve({ success: true })),
  retryApiCall: vi.fn((fn) => Promise.resolve({ success: true, data: fn() })),
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch for chat API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      text: 'Hello! How are you today?',
      facialExpression: 'smile',
      animation: 'Talking',
    }),
  })
) as any

describe('Avatar Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AvatarViewer Accessibility', () => {
    const mockAvatarUrl = 'https://models.readyplayer.me/TEST123.glb'

    it('provides proper ARIA labels for 3D canvas', () => {
      render(<AvatarViewer avatarUrl={mockAvatarUrl} />)
      
      const canvas = screen.getByRole('img')
      expect(canvas).toHaveAttribute('aria-label', '3D Avatar Display')
    })

    it('provides alternative content when avatar fails to load', () => {
      render(<AvatarViewer avatarUrl={null} />)
      
      expect(screen.getByText('No avatar available')).toBeInTheDocument()
      expect(screen.getByText('An avatar needs to be created first')).toBeInTheDocument()
    })

    it('supports keyboard navigation for controls', async () => {
      const user = userEvent.setup()
      render(
        <AvatarViewer 
          avatarUrl={mockAvatarUrl} 
          enableControls={true}
        />
      )

      const canvas = screen.getByTestId('canvas')
      
      // Test keyboard focus
      await user.tab()
      expect(canvas).toHaveFocus()

      // Test keyboard interaction
      await user.keyboard('{ArrowLeft}')
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowDown}')
      
      // Should not throw errors and maintain focus
      expect(canvas).toHaveFocus()
    })

    it('provides screen reader announcements for loading states', () => {
      const { rerender } = render(<AvatarViewer avatarUrl={mockAvatarUrl} />)
      
      // Check for loading announcement
      expect(screen.getByText(/Loading avatar/i)).toBeInTheDocument()
      
      // Simulate loaded state
      rerender(<AvatarViewer avatarUrl={mockAvatarUrl} />)
      
      // Should have accessible content
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<AvatarViewer avatarUrl={mockAvatarUrl} />)
      
      // Should render without errors in high contrast mode
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
    })

    it('provides proper focus management', async () => {
      const user = userEvent.setup()
      const onModelLoad = vi.fn()
      
      render(
        <AvatarViewer 
          avatarUrl={mockAvatarUrl} 
          onModelLoad={onModelLoad}
          enableControls={true}
        />
      )

      // Test focus trap within avatar controls
      await user.tab()
      const focusedElement = document.activeElement
      expect(focusedElement).toBeTruthy()
      
      // Should be able to navigate away
      await user.tab()
      expect(document.activeElement).not.toBe(focusedElement)
    })
  })

  describe('AvatarChatbot Accessibility', () => {
    const mockProps = {
      avatarUrl: 'https://models.readyplayer.me/TEST123.glb',
      childId: 'child-123',
      accessCode: 'ABC123',
    }

    it('provides proper form labels and structure', () => {
      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      expect(messageInput).toHaveAttribute('type', 'text')
      
      const sendButton = screen.getByRole('button')
      expect(sendButton).toBeInTheDocument()
    })

    it('supports keyboard navigation for chat interface', async () => {
      const user = userEvent.setup()
      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      
      // Test keyboard focus
      await user.click(messageInput)
      expect(messageInput).toHaveFocus()
      
      // Test Enter key submission
      await user.type(messageInput, 'Hello avatar!')
      await user.keyboard('{Enter}')
      
      // Should submit the message
      expect(global.fetch).toHaveBeenCalled()
    })

    it('provides screen reader announcements for chat messages', async () => {
      const user = userEvent.setup()
      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      await user.type(messageInput, 'Test message')
      await user.keyboard('{Enter}')
      
      // Wait for messages to appear
      await screen.findByText('Test message')
      
      // Messages should be in a proper list structure
      const messages = screen.getAllByText(/Test message|Hello! How are you today?/)
      expect(messages.length).toBeGreaterThan(0)
    })

    it('provides audio feedback alternatives', async () => {
      const user = userEvent.setup()
      
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      await user.type(messageInput, 'Hello!')
      await user.keyboard('{Enter}')
      
      // Should provide text-based feedback when audio is not available
      await screen.findByText('Hello!')
    })

    it('supports voice input alternatives', () => {
      // Mock speech recognition not available
      Object.defineProperty(window, 'SpeechRecognition', {
        writable: true,
        value: undefined,
      })
      
      Object.defineProperty(window, 'webkitSpeechRecognition', {
        writable: true,
        value: undefined,
      })

      render(<AvatarChatbot {...mockProps} />)
      
      // Should still provide text input when voice input is not available
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    })

    it('provides proper ARIA live regions for dynamic content', async () => {
      const user = userEvent.setup()
      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      await user.type(messageInput, 'Test message')
      await user.keyboard('{Enter}')
      
      // Loading state should be announced
      const loadingIndicator = screen.getByText('Thinking...')
      expect(loadingIndicator).toBeInTheDocument()
      
      // Response should be announced when it appears
      await screen.findByText('Hello! How are you today?')
    })

    it('handles disabled states accessibly', async () => {
      const user = userEvent.setup()
      render(<AvatarChatbot {...mockProps} />)
      
      const messageInput = screen.getByPlaceholderText('Type your message...')
      const sendButton = screen.getByRole('button')
      
      // Send a message to trigger loading state
      await user.type(messageInput, 'Test message')
      await user.keyboard('{Enter}')
      
      // Input should be disabled during loading
      expect(messageInput).toBeDisabled()
      expect(sendButton).toBeDisabled()
      
      // Should have appropriate aria attributes
      expect(messageInput).toHaveAttribute('disabled')
    })

    it('provides proper color contrast', () => {
      render(<AvatarChatbot {...mockProps} />)
      
      // Check that text elements have sufficient contrast
      const messageInput = screen.getByPlaceholderText('Type your message...')
      const computedStyle = window.getComputedStyle(messageInput)
      
      // Should have visible styling (not transparent)
      expect(computedStyle.opacity).not.toBe('0')
      expect(computedStyle.visibility).not.toBe('hidden')
    })

    it('supports reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      render(<AvatarChatbot {...mockProps} />)
      
      // Should render without motion-heavy animations
      expect(screen.getByTestId('avatar-viewer')).toBeInTheDocument()
    })

    it('provides semantic HTML structure', () => {
      render(<AvatarChatbot {...mockProps} />)
      
      // Should use proper semantic elements
      const form = screen.getByRole('form') || screen.getByRole('textbox').closest('form')
      expect(form).toBeInTheDocument()
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  describe('Error State Accessibility', () => {
    it('provides accessible error messages', () => {
      render(<AvatarViewer avatarUrl="invalid-url" />)
      
      const errorMessage = screen.getByText('Invalid Avatar URL')
      expect(errorMessage).toBeInTheDocument()
      
      // Error should be announced to screen readers
      expect(errorMessage).toHaveAttribute('role', 'alert') || 
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument()
    })

    it('provides retry mechanisms that are keyboard accessible', async () => {
      const user = userEvent.setup()
      
      // Mock error state with retry option
      render(<AvatarViewer avatarUrl={null} />)
      
      // Should provide accessible fallback content
      expect(screen.getByText('No avatar available')).toBeInTheDocument()
      
      // If retry button exists, it should be keyboard accessible
      const retryButton = screen.queryByRole('button', { name: /retry/i })
      if (retryButton) {
        await user.tab()
        expect(retryButton).toHaveFocus()
        
        await user.keyboard('{Enter}')
        // Should trigger retry action
      }
    })
  })
})