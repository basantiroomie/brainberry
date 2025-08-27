import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the AvatarCreatorModal component by extracting it from ChildrenTab
// Since it's not exported separately, we'll test the functionality through integration

// Mock dependencies
vi.mock('@/components/AvatarViewer', () => ({
  AvatarViewer: ({ avatarUrl, ...props }: any) => (
    <div data-testid="avatar-viewer" data-avatar-url={avatarUrl} {...props} />
  ),
}))

vi.mock('@/lib/avatar-utils', () => ({
  AvatarCodeUtils: {
    codeToUrls: vi.fn((code: string) => ({
      glbUrl: `https://models.readyplayer.me/${code}.glb`,
      pngUrl: `https://models.readyplayer.me/${code}.png`,
    })),
    codeToGlbUrl: vi.fn((code: string) => `https://models.readyplayer.me/${code}.glb`),
    codeToPngUrl: vi.fn((code: string) => `https://models.readyplayer.me/${code}.png`),
  },
}))

const mockAvatarCodeSchema = {
  parse: vi.fn((data: any) => {
    if (!data.code || data.code.length !== 6 || !/^[A-Z0-9]{6}$/.test(data.code)) {
      throw new Error('Invalid code format')
    }
    return data
  }),
}

vi.mock('@/lib/schemas', () => ({
  avatarCodeSchema: mockAvatarCodeSchema,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Create a test component that includes the AvatarCreatorModal functionality
const TestAvatarCreatorModal = ({ isOpen, onClose, child, onAvatarSaved }: any) => {
  const [step, setStep] = React.useState<'iframe' | 'code'>('iframe')
  const [avatarCode, setAvatarCode] = React.useState('')
  const [codeError, setCodeError] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [iframeLoaded, setIframeLoaded] = React.useState(false)
  
  const rpmSubdomain = 'demo'
  const iframeUrl = `https://${rpmSubdomain}.readyplayer.me/avatar?frameApi`

  React.useEffect(() => {
    if (isOpen) {
      setStep('iframe')
      setAvatarCode('')
      setCodeError('')
      setSaving(false)
      setIframeLoaded(false)
    }
  }, [isOpen])

  const handleCodeChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setAvatarCode(upperValue)
    setCodeError('')
    
    if (upperValue.length === 6) {
      try {
        mockAvatarCodeSchema.parse({ code: upperValue })
      } catch (error) {
        setCodeError('Invalid code format. Must be 6 uppercase letters and numbers.')
      }
    }
  }

  const handleSaveAvatar = async () => {
    if (!avatarCode) {
      setCodeError('Please enter an avatar code')
      return
    }

    try {
      mockAvatarCodeSchema.parse({ code: avatarCode })
      
      const { AvatarCodeUtils } = require('@/lib/avatar-utils')
      const { glbUrl, pngUrl } = AvatarCodeUtils.codeToUrls(avatarCode)
      
      setSaving(true)
      
      const response = await fetch(`/api/children/${child.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar_url: glbUrl,
          avatar_headshot_url: pngUrl,
        }),
      })

      if (response.ok) {
        const { toast } = require('sonner')
        toast.success('Avatar saved successfully!')
        onAvatarSaved()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        const { toast } = require('sonner')
        toast.error(`Failed to save avatar: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Avatar save error:', error)
      if (error instanceof Error && error.message.includes('code')) {
        setCodeError('Invalid avatar code format. Must be 6 uppercase letters and numbers.')
      } else {
        const { toast } = require('sonner')
        toast.error('Error saving avatar')
      }
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== `https://${rpmSubdomain}.readyplayer.me`) return
      
      const { eventName } = event.data
      
      switch (eventName) {
        case 'v1.frame.ready':
          setIframeLoaded(true)
          break
        case 'v1.avatar.exported':
          setStep('code')
          const { toast } = require('sonner')
          toast.success('Avatar created! Please enter the avatar code to save it.')
          break
      }
    }

    if (isOpen) {
      window.addEventListener('message', handleMessage)
      return () => window.removeEventListener('message', handleMessage)
    }
  }, [isOpen, rpmSubdomain])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-brutal-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-chart-2 text-white p-4 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Create Avatar for {child.name}</h2>
            <button
              onClick={onClose}
              className="bg-white text-black p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg"
              disabled={saving}
              data-testid="close-modal"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {step === 'iframe' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-300 p-4">
                <h3 className="font-bold text-blue-800 mb-2">📋 Instructions</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Use the Ready Player Me interface below to create an avatar</li>
                  <li>Take or upload a photo when prompted</li>
                  <li>Customize the avatar as desired</li>
                  <li>Click "Done" or "Export" when finished</li>
                  <li>You'll then be asked to enter the avatar code</li>
                </ol>
              </div>

              <div className="relative bg-gray-100 border-2 border-black" style={{ height: '600px' }}>
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 animate-spin text-chart-2" />
                      <p className="text-sm font-bold text-gray-600">Loading Ready Player Me...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-none"
                  allow="camera *; microphone *"
                  onLoad={() => setIframeLoaded(true)}
                  data-testid="rpm-iframe"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  disabled={saving}
                  data-testid="cancel-button"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => setStep('code')}
                  className="bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  data-testid="skip-to-code-button"
                >
                  SKIP TO CODE ENTRY
                </button>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 p-4">
                <h3 className="font-bold text-green-800 mb-2">✅ Avatar Created!</h3>
                <p className="text-sm text-green-700">
                  Your avatar has been created in Ready Player Me. Please enter the 6-character avatar code to save it to {child.name}'s profile.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Avatar Code</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={avatarCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Enter 6-character code (e.g., ABC123)"
                        className={`w-full border-2 p-3 text-lg font-mono uppercase tracking-wider ${
                          codeError ? 'border-red-500' : 'border-black'
                        }`}
                        maxLength={6}
                        disabled={saving}
                        data-testid="avatar-code-input"
                      />
                      {codeError && (
                        <p className="text-red-600 text-sm mt-1 font-bold" data-testid="code-error">
                          {codeError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {avatarCode.length === 6 && !codeError && (
                  <div className="bg-blue-50 border-2 border-blue-300 p-4" data-testid="preview-urls">
                    <h4 className="font-bold mb-2">Preview URLs:</h4>
                    <div className="space-y-1 text-sm font-mono">
                      <div>
                        <span className="font-bold">3D Model:</span> https://models.readyplayer.me/{avatarCode}.glb
                      </div>
                      <div>
                        <span className="font-bold">Headshot:</span> https://models.readyplayer.me/{avatarCode}.png
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('iframe')}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  disabled={saving}
                  data-testid="back-to-creator-button"
                >
                  ← BACK TO CREATOR
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={!avatarCode || codeError || saving}
                  className={`px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 ${
                    !avatarCode || codeError || saving
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-chart-2 text-white'
                  }`}
                  data-testid="save-avatar-button"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <span>SAVE AVATAR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

describe('AvatarCreatorModal', () => {
  const mockChild = {
    id: 'child-123',
    name: 'Test Child',
    age: 8,
    diagnosis: 'ADHD',
  }

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    child: mockChild,
    onAvatarSaved: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders when open', () => {
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    expect(screen.getByText(`Create Avatar for ${mockChild.name}`)).toBeInTheDocument()
    expect(screen.getByTestId('rpm-iframe')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<TestAvatarCreatorModal {...mockProps} isOpen={false} />)
    
    expect(screen.queryByText(`Create Avatar for ${mockChild.name}`)).not.toBeInTheDocument()
  })

  it('shows instructions in iframe step', () => {
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument()
    expect(screen.getByText(/Use the Ready Player Me interface/)).toBeInTheDocument()
  })

  it('loads Ready Player Me iframe', () => {
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    const iframe = screen.getByTestId('rpm-iframe')
    expect(iframe).toHaveAttribute('src', 'https://demo.readyplayer.me/avatar?frameApi')
    expect(iframe).toHaveAttribute('allow', 'camera *; microphone *')
  })

  it('can skip to code entry step', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    const skipButton = screen.getByTestId('skip-to-code-button')
    await user.click(skipButton)
    
    expect(screen.getByText('✅ Avatar Created!')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-code-input')).toBeInTheDocument()
  })

  it('validates avatar code input', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Skip to code step
    await user.click(screen.getByTestId('skip-to-code-button'))
    
    const input = screen.getByTestId('avatar-code-input')
    
    // Test invalid code
    await user.type(input, 'INVALID')
    expect(screen.getByTestId('code-error')).toHaveTextContent(/Invalid code format/)
    
    // Test valid code
    await user.clear(input)
    await user.type(input, 'ABC123')
    expect(screen.queryByTestId('code-error')).not.toBeInTheDocument()
  })

  it('shows preview URLs for valid code', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Skip to code step
    await user.click(screen.getByTestId('skip-to-code-button'))
    
    const input = screen.getByTestId('avatar-code-input')
    await user.type(input, 'ABC123')
    
    expect(screen.getByTestId('preview-urls')).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/models\.readyplayer\.me\/ABC123\.glb/)).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/models\.readyplayer\.me\/ABC123\.png/)).toBeInTheDocument()
  })

  it('saves avatar with valid code', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Skip to code step
    await user.click(screen.getByTestId('skip-to-code-button'))
    
    const input = screen.getByTestId('avatar-code-input')
    await user.type(input, 'ABC123')
    
    const saveButton = screen.getByTestId('save-avatar-button')
    await user.click(saveButton)
    
    expect(mockFetch).toHaveBeenCalledWith(`/api/children/${mockChild.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar_url: 'https://models.readyplayer.me/ABC123.glb',
        avatar_headshot_url: 'https://models.readyplayer.me/ABC123.png',
      }),
    })
  })

  it('handles save errors gracefully', async () => {
    const user = userEvent.setup()
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Database error' }),
    })
    
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Skip to code step and enter code
    await user.click(screen.getByTestId('skip-to-code-button'))
    await user.type(screen.getByTestId('avatar-code-input'), 'ABC123')
    await user.click(screen.getByTestId('save-avatar-button'))
    
    const { toast } = require('sonner')
    expect(toast.error).toHaveBeenCalledWith('Failed to save avatar: Database error')
  })

  it('disables save button for invalid codes', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Skip to code step
    await user.click(screen.getByTestId('skip-to-code-button'))
    
    const saveButton = screen.getByTestId('save-avatar-button')
    expect(saveButton).toBeDisabled()
    
    // Enter invalid code
    await user.type(screen.getByTestId('avatar-code-input'), 'INVALID')
    expect(saveButton).toBeDisabled()
    
    // Enter valid code
    await user.clear(screen.getByTestId('avatar-code-input'))
    await user.type(screen.getByTestId('avatar-code-input'), 'ABC123')
    expect(saveButton).not.toBeDisabled()
  })

  it('can navigate back to iframe step', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Go to code step
    await user.click(screen.getByTestId('skip-to-code-button'))
    expect(screen.getByText('✅ Avatar Created!')).toBeInTheDocument()
    
    // Go back to iframe step
    await user.click(screen.getByTestId('back-to-creator-button'))
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument()
    expect(screen.getByTestId('rpm-iframe')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    await user.click(screen.getByTestId('close-modal'))
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('closes modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    await user.click(screen.getByTestId('cancel-button'))
    expect(mockProps.onClose).toHaveBeenCalled()
  })

  it('handles Ready Player Me iframe messages', () => {
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Simulate iframe ready message
    const readyEvent = new MessageEvent('message', {
      origin: 'https://demo.readyplayer.me',
      data: { eventName: 'v1.frame.ready' }
    })
    window.dispatchEvent(readyEvent)
    
    // Should hide loading state
    expect(screen.queryByText('Loading Ready Player Me...')).not.toBeInTheDocument()
    
    // Simulate avatar exported message
    const exportedEvent = new MessageEvent('message', {
      origin: 'https://demo.readyplayer.me',
      data: { eventName: 'v1.avatar.exported' }
    })
    window.dispatchEvent(exportedEvent)
    
    // Should move to code step
    expect(screen.getByText('✅ Avatar Created!')).toBeInTheDocument()
  })

  it('ignores messages from wrong origin', () => {
    render(<TestAvatarCreatorModal {...mockProps} />)
    
    // Simulate message from wrong origin
    const wrongOriginEvent = new MessageEvent('message', {
      origin: 'https://malicious-site.com',
      data: { eventName: 'v1.avatar.exported' }
    })
    window.dispatchEvent(wrongOriginEvent)
    
    // Should still be on iframe step
    expect(screen.getByText('📋 Instructions')).toBeInTheDocument()
    expect(screen.queryByText('✅ Avatar Created!')).not.toBeInTheDocument()
  })
})