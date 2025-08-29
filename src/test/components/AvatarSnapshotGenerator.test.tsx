import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AvatarSnapshotGenerator } from '@/components/AvatarSnapshotGenerator'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: vi.fn()
}))

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  Environment: () => <div data-testid="environment" />,
  useGLTF: vi.fn(() => ({
    scene: {
      clone: vi.fn(() => ({
        scale: { setScalar: vi.fn() },
        position: { set: vi.fn() }
      }))
    }
  }))
}))

// Mock HTMLCanvasElement methods
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => ({
    drawImage: vi.fn(),
  }))
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: vi.fn(() => 'data:image/png;base64,mock-image-data')
})

describe('AvatarSnapshotGenerator', () => {
  const mockProps = {
    avatarUrl: 'https://models.readyplayer.me/test123.glb',
    onSnapshotGenerated: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    render(<AvatarSnapshotGenerator {...mockProps} />)
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<AvatarSnapshotGenerator {...mockProps} />)
    expect(screen.getByText('Loading avatar...')).toBeInTheDocument()
  })

  it('calls onSnapshotGenerated when snapshot is created', async () => {
    const onSnapshotGenerated = vi.fn()
    
    render(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        onSnapshotGenerated={onSnapshotGenerated}
        autoGenerate={true}
      />
    )

    // Wait for the component to process
    await waitFor(() => {
      expect(onSnapshotGenerated).toHaveBeenCalledWith(
        expect.stringContaining('data:image/png;base64,')
      )
    }, { timeout: 5000 })
  })

  it('handles manual snapshot generation', () => {
    render(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        autoGenerate={false}
      />
    )

    // Should show manual generate button when not auto-generating
    // Note: This would require the model to be loaded first
    expect(screen.getByTestId('canvas')).toBeInTheDocument()
  })

  it('handles errors gracefully', async () => {
    const onError = vi.fn()
    
    // Mock canvas methods to throw error
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null)
    
    render(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        onError={onError}
        autoGenerate={true}
      />
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate profile picture')
      )
    }, { timeout: 5000 })
  })

  it('saves snapshot to server when childId is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        snapshotUrl: 'https://example.com/snapshot.png'
      })
    })
    
    global.fetch = mockFetch
    
    const onSnapshotGenerated = vi.fn()
    
    render(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        onSnapshotGenerated={onSnapshotGenerated}
        childId="test-child-123"
        autoGenerate={true}
      />
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/avatars/save-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childId: 'test-child-123',
          snapshotDataUrl: expect.stringContaining('data:image/png;base64,')
        })
      })
    }, { timeout: 5000 })
  })

  it('uses correct canvas size based on size prop', () => {
    const { rerender } = render(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        size={128}
      />
    )

    // Check that the canvas container has the correct size
    const container = screen.getByTestId('canvas').parentElement
    expect(container).toHaveStyle({ width: '128px', height: '128px' })

    // Test different size
    rerender(
      <AvatarSnapshotGenerator 
        {...mockProps} 
        size={256}
      />
    )

    expect(container).toHaveStyle({ width: '256px', height: '256px' })
  })
})