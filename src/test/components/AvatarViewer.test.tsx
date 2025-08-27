import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AvatarViewer } from '@/components/AvatarViewer'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, onCreated, ...props }: any) => {
    // Simulate canvas creation
    if (onCreated) {
      onCreated({
        gl: {
          getParameter: vi.fn(),
          getExtension: vi.fn(),
        },
        scene: {},
        camera: {},
      })
    }
    return <div data-testid="canvas" {...props}>{children}</div>
  },
  useFrame: vi.fn(),
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

// Mock avatar utilities and managers
vi.mock('@/lib/avatar-performance-monitor', () => ({
  measureAvatarOperation: vi.fn((type, name, fn) => fn()),
  startAvatarPerformanceMonitoring: vi.fn(),
  avatarPerformanceMonitor: {
    recordEvent: vi.fn(),
    getPerformanceSummary: vi.fn(() => ({ issues: [], metrics: {} })),
  },
}))

vi.mock('@/lib/avatar-cache-manager', () => ({
  avatarCacheManager: {},
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

describe('AvatarViewer', () => {
  const mockAvatarUrl = 'https://models.readyplayer.me/TEST123.glb'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
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

  it('shows error message for invalid avatar URL', () => {
    render(<AvatarViewer avatarUrl="" />)
    expect(screen.getByText('No avatar available')).toBeInTheDocument()
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

  it('calls onModelLoad callback when model loads', async () => {
    const onModelLoad = vi.fn()
    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        onModelLoad={onModelLoad}
      />
    )

    // Wait for model to load
    await waitFor(() => {
      expect(onModelLoad).toHaveBeenCalled()
    }, { timeout: 1000 })
  })

  it('calls onModelError callback when model fails to load', async () => {
    const onModelError = vi.fn()
    const { useGLTF } = await import('@react-three/drei')
    
    // Mock GLTF loading error
    vi.mocked(useGLTF).mockImplementation(() => {
      throw new Error('Failed to load model')
    })

    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        onModelError={onModelError}
      />
    )

    await waitFor(() => {
      expect(onModelError).toHaveBeenCalled()
    }, { timeout: 1000 })
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

  it('handles headshot capture functionality', () => {
    const onHeadshotCapture = vi.fn()
    
    // Mock canvas toDataURL
    const mockCanvas = document.createElement('canvas')
    mockCanvas.toDataURL = vi.fn(() => 'data:image/png;base64,test')
    
    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        onHeadshotCapture={onHeadshotCapture}
      />
    )

    // The component should be ready to capture headshots
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('validates avatar URL format', () => {
    const invalidUrls = [
      'not-a-url',
      'http://invalid-domain.com/model.glb',
      'https://models.readyplayer.me/invalid',
      123 as any,
      null,
      undefined,
    ]

    invalidUrls.forEach((url) => {
      const { unmount } = render(<AvatarViewer avatarUrl={url} />)
      
      if (url === null || url === undefined) {
        expect(screen.getByText('No avatar available')).toBeInTheDocument()
      } else {
        // For invalid URLs, the component still renders but may show fallback content
        expect(screen.getByTestId('canvas')).toBeInTheDocument()
      }
      unmount()
    })
  })

  it('handles performance monitoring', async () => {
    const { startAvatarPerformanceMonitoring } = await import('@/lib/avatar-performance-monitor')
    
    render(<AvatarViewer avatarUrl={mockAvatarUrl} />)
    
    expect(startAvatarPerformanceMonitoring).toHaveBeenCalled()
  })

  it('handles WebGL context creation', () => {
    const onCreated = vi.fn()
    
    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl}
        onModelLoad={onCreated}
      />
    )

    // Canvas should be created with WebGL context
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })
})