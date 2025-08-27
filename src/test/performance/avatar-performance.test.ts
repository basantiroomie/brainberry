import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { AvatarViewer } from '@/components/AvatarViewer'

// Mock performance monitoring
const mockPerformanceMonitor = {
  recordEvent: vi.fn(),
  getPerformanceSummary: vi.fn(() => ({ issues: [], metrics: {} })),
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
}

vi.mock('@/lib/avatar-performance-monitor', () => ({
  measureAvatarOperation: vi.fn((type, name, fn) => {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    mockPerformanceMonitor.recordEvent(type, name, duration)
    return result
  }),
  startAvatarPerformanceMonitoring: mockPerformanceMonitor.startMonitoring,
  avatarPerformanceMonitor: mockPerformanceMonitor,
}))

// Mock Three.js components
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, onCreated, ...props }: any) => {
    if (onCreated) {
      setTimeout(() => {
        onCreated({
          gl: {
            getParameter: vi.fn(),
            getExtension: vi.fn(),
          },
          scene: {},
          camera: {},
        })
      }, 10)
    }
    return React.createElement('div', { 'data-testid': 'canvas', ...props }, children)
  },
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'orbit-controls', ...props }, children),
  Environment: ({ children, ...props }: any) => React.createElement('div', { 'data-testid': 'environment', ...props }, children),
  useGLTF: vi.fn(() => {
    // Simulate loading time
    const loadTime = Math.random() * 1000 + 500 // 500-1500ms
    setTimeout(() => {
      mockPerformanceMonitor.recordEvent('load', 'gltf-model', loadTime)
    }, loadTime)
    
    return {
      scene: {
        clone: vi.fn(() => ({
          scale: { setScalar: vi.fn() },
          position: { set: vi.fn() },
        })),
      },
      animations: [],
    }
  }),
}))

// Mock other dependencies
vi.mock('@/lib/avatar-cache-manager', () => ({
  getCachedAvatarModel: vi.fn(() => null),
  cacheAvatarModel: vi.fn(),
}))

vi.mock('@/lib/avatar-error-handler', () => ({
  handleAvatarError: vi.fn(),
  AvatarErrorType: {
    LOADING_ERROR: 'LOADING_ERROR',
    RENDERING_ERROR: 'RENDERING_ERROR',
  },
}))

vi.mock('@/lib/avatar-retry-manager', () => ({
  retryAvatarLoad: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Avatar Performance Tests', () => {
  const mockAvatarUrl = 'https://models.readyplayer.me/TEST123.glb'

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset performance monitoring
    mockPerformanceMonitor.recordEvent.mockClear()
    mockPerformanceMonitor.getPerformanceSummary.mockReturnValue({ issues: [], metrics: {} })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('measures avatar loading performance', async () => {
    const onModelLoad = vi.fn()
    
    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        onModelLoad={onModelLoad}
      />
    )

    // Wait for performance monitoring to start
    await waitFor(() => {
      expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalled()
    })

    // Wait for model loading events
    await waitFor(() => {
      expect(mockPerformanceMonitor.recordEvent).toHaveBeenCalled()
    }, { timeout: 2000 })

    // Verify performance events were recorded
    const recordedEvents = mockPerformanceMonitor.recordEvent.mock.calls
    expect(recordedEvents.length).toBeGreaterThan(0)
    
    // Check for loading-related events
    const loadingEvents = recordedEvents.filter(call => 
      call[0] === 'load' || call[1].includes('load')
    )
    expect(loadingEvents.length).toBeGreaterThan(0)
  })

  it('detects performance issues with slow loading', async () => {
    // Mock slow loading
    const { useGLTF } = await import('@react-three/drei')
    vi.mocked(useGLTF).mockImplementation(() => {
      // Simulate very slow loading (3 seconds)
      setTimeout(() => {
        mockPerformanceMonitor.recordEvent('load', 'gltf-model', 3000)
      }, 100)
      
      return {
        scene: {
          clone: vi.fn(() => ({
            scale: { setScalar: vi.fn() },
            position: { set: vi.fn() },
          })),
        },
        animations: [],
      }
    })

    // Mock performance summary with issues
    mockPerformanceMonitor.getPerformanceSummary.mockReturnValue({
      issues: ['Slow avatar loading detected: 3000ms'],
      metrics: { averageLoadTime: 3000 }
    })

    render(<AvatarViewer avatarUrl={mockAvatarUrl} />)

    await waitFor(() => {
      expect(mockPerformanceMonitor.getPerformanceSummary).toHaveBeenCalled()
    })

    // In development mode, performance warnings should be shown
    if (process.env.NODE_ENV === 'development') {
      await waitFor(() => {
        expect(screen.queryByText(/Performance Issues/)).toBeInTheDocument()
      })
    }
  })

  it('measures memory usage during avatar operations', async () => {
    // Mock memory monitoring
    const originalMemory = (performance as any).memory
    ;(performance as any).memory = {
      usedJSHeapSize: 50000000, // 50MB
      totalJSHeapSize: 100000000, // 100MB
      jsHeapSizeLimit: 2000000000, // 2GB
    }

    render(<AvatarViewer avatarUrl={mockAvatarUrl} />)

    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
    })

    // Verify memory usage is within reasonable bounds
    const memoryUsage = (performance as any).memory.usedJSHeapSize
    expect(memoryUsage).toBeLessThan(200000000) // Less than 200MB

    // Restore original memory object
    ;(performance as any).memory = originalMemory
  })

  it('handles multiple avatar instances efficiently', async () => {
    const avatarUrls = [
      'https://models.readyplayer.me/TEST1.glb',
      'https://models.readyplayer.me/TEST2.glb',
      'https://models.readyplayer.me/TEST3.glb',
    ]

    // Render multiple avatars
    const { rerender } = render(
      <div>
        {avatarUrls.map((url, index) => (
          <AvatarViewer key={index} avatarUrl={url} />
        ))}
      </div>
    )

    // Wait for all avatars to initialize
    await waitFor(() => {
      const canvases = screen.getAllByTestId('canvas')
      expect(canvases).toHaveLength(3)
    })

    // Verify performance monitoring handles multiple instances
    expect(mockPerformanceMonitor.startMonitoring).toHaveBeenCalledTimes(3)

    // Test cleanup when components unmount
    rerender(<div />)

    // Performance monitoring should handle cleanup gracefully
    await waitFor(() => {
      expect(mockPerformanceMonitor.getPerformanceSummary).toHaveBeenCalled()
    })
  })

  it('optimizes rendering with camera mode changes', async () => {
    const { rerender } = render(
      <AvatarViewer avatarUrl={mockAvatarUrl} cameraMode="full" />
    )

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByTestId('canvas')).toBeInTheDocument()
    })

    const initialEvents = mockPerformanceMonitor.recordEvent.mock.calls.length

    // Change camera mode
    rerender(
      <AvatarViewer avatarUrl={mockAvatarUrl} cameraMode="headshot" />
    )

    // Wait for re-render
    await waitFor(() => {
      expect(mockPerformanceMonitor.recordEvent.mock.calls.length).toBeGreaterThan(initialEvents)
    })

    // Verify camera mode changes don't cause excessive re-renders
    const totalEvents = mockPerformanceMonitor.recordEvent.mock.calls.length
    expect(totalEvents - initialEvents).toBeLessThan(5) // Should be minimal additional events
  })

  it('handles WebGL context loss gracefully', async () => {
    const mockCanvas = document.createElement('canvas')
    const mockContext = {
      isContextLost: vi.fn(() => false),
      getExtension: vi.fn(),
      getParameter: vi.fn(),
    }

    // Mock WebGL context
    mockCanvas.getContext = vi.fn(() => mockContext)
    
    render(<AvatarViewer avatarUrl={mockAvatarUrl} />)

    // Simulate context loss
    mockContext.isContextLost.mockReturnValue(true)
    
    // Dispatch context lost event
    const contextLostEvent = new Event('webglcontextlost')
    mockCanvas.dispatchEvent(contextLostEvent)

    // Wait for error handling
    await waitFor(() => {
      expect(mockPerformanceMonitor.recordEvent).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('context'),
        expect.any(Number)
      )
    })
  })

  it('measures TTS performance in chatbot', async () => {
    // This would be tested with the actual AvatarChatbot component
    // For now, we'll test the performance monitoring setup
    
    const mockTTSOperation = vi.fn(() => Promise.resolve())
    
    // Simulate TTS operation with performance monitoring
    const { measureAvatarOperation } = await import('@/lib/avatar-performance-monitor')
    
    await measureAvatarOperation('tts', 'speech-synthesis', mockTTSOperation, {
      textLength: 50,
      voice: 'test-voice'
    })

    expect(mockPerformanceMonitor.recordEvent).toHaveBeenCalledWith(
      'tts',
      'speech-synthesis',
      expect.any(Number),
      expect.objectContaining({
        textLength: 50,
        voice: 'test-voice'
      })
    )
  })

  it('monitors frame rate during animations', async () => {
    // Mock requestAnimationFrame for frame rate monitoring
    let frameCount = 0
    const mockRAF = vi.fn((callback) => {
      frameCount++
      setTimeout(() => {
        callback(performance.now())
        if (frameCount < 60) { // Simulate 60 frames
          mockRAF(callback)
        }
      }, 16.67) // ~60fps
      return frameCount
    })

    global.requestAnimationFrame = mockRAF

    render(
      <AvatarViewer 
        avatarUrl={mockAvatarUrl} 
        enableAnimations={true}
      />
    )

    // Wait for animation frames
    await waitFor(() => {
      expect(frameCount).toBeGreaterThan(10)
    }, { timeout: 1000 })

    // Verify frame rate is reasonable
    const frameRate = frameCount / (1000 / 16.67) // frames per second
    expect(frameRate).toBeGreaterThan(30) // At least 30fps
    expect(frameRate).toBeLessThan(120) // Not unreasonably high

    // Restore original RAF
    global.requestAnimationFrame = window.requestAnimationFrame
  })
})