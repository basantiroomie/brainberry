import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'

// Mock Three.js components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: any) => 
    React.createElement('div', {
      'data-testid': 'canvas',
      ...props
    }, children),
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ children, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'orbit-controls', ...props }, children),
  Environment: ({ children, ...props }: any) => 
    React.createElement('div', { 'data-testid': 'environment', ...props }, children),
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

// Mock avatar utilities
vi.mock('@/lib/avatar-performance-monitor', () => ({
  measureAvatarOperation: vi.fn((type, name, fn) => fn()),
  startAvatarPerformanceMonitoring: vi.fn(),
  avatarPerformanceMonitor: {
    recordEvent: vi.fn(),
    getPerformanceSummary: vi.fn(() => ({ issues: [], metrics: {} })),
  },
}))

vi.mock('@/lib/avatar-cache-manager', () => ({
  getCachedAvatarModel: vi.fn(() => null),
  cacheAvatarModel: vi.fn(),
}))

vi.mock('@/lib/avatar-error-handler', () => ({
  handleAvatarError: vi.fn(),
  AvatarErrorType: {
    LOADING_ERROR: 'LOADING_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    RENDERING_ERROR: 'RENDERING_ERROR',
  },
}))

vi.mock('@/lib/avatar-retry-manager', () => ({
  retryAvatarLoad: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AvatarViewer Basic Tests', () => {
  const mockAvatarUrl = 'https://models.readyplayer.me/TEST123.glb'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing with valid avatar URL', () => {
    render(<AvatarViewer avatarUrl={mockAvatarUrl} />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('shows fallback when no avatar URL is provided', () => {
    render(<AvatarViewer avatarUrl={null} />)
    expect(screen.getByText('No avatar available')).toBeInTheDocument()
    expect(screen.getByText('An avatar needs to be created first')).toBeInTheDocument()
  })

  it('renders with different camera modes', () => {
    const { rerender } = render(
      <AvatarViewer avatarUrl={mockAvatarUrl} cameraMode="full" />
    )
    expect(screen.getByTestId('canvas')).toBeInTheDocument()

    rerender(<AvatarViewer avatarUrl={mockAvatarUrl} cameraMode="headshot" />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()

    rerender(<AvatarViewer avatarUrl={mockAvatarUrl} cameraMode="profile" />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('enables/disables controls based on prop', () => {
    const { rerender } = render(
      <AvatarViewer avatarUrl={mockAvatarUrl} enableControls={true} />
    )
    expect(screen.getByTestId('orbit-controls')).toBeInTheDocument()

    rerender(<AvatarViewer avatarUrl={mockAvatarUrl} enableControls={false} />)
    expect(screen.queryByTestId('orbit-controls')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        className="custom-avatar-class"
      />
    )
    
    expect(container.firstChild).toHaveClass('custom-avatar-class')
  })

  it('handles empty string URL as no avatar', () => {
    render(<AvatarViewer avatarUrl="" />)
    expect(screen.getByText('No avatar available')).toBeInTheDocument()
  })

  it('handles undefined URL as no avatar', () => {
    render(<AvatarViewer avatarUrl={undefined} />)
    expect(screen.getByText('No avatar available')).toBeInTheDocument()
  })
})