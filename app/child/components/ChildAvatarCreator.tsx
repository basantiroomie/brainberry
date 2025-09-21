"use client"
import { useState, useEffect } from "react"
import { X, Palette, CheckCircle2, Loader2, Code, ArrowLeft } from "lucide-react"
import { toast } from 'sonner'

interface ChildAvatarCreatorProps {
  isOpen: boolean
  onClose: () => void
  childProfile: any
  onAvatarSaved: () => void
}

export default function ChildAvatarCreator({ isOpen, onClose, childProfile, onAvatarSaved }: ChildAvatarCreatorProps) {
  const [step, setStep] = useState<'iframe' | 'code'>('iframe')
  const [avatarCode, setAvatarCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [saving, setSaving] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)

  // Ready Player Me iframe configuration
  const rpmSubdomain = process.env.NEXT_PUBLIC_RPM_SUBDOMAIN || 'demo'
  const iframeUrl = `https://${rpmSubdomain}.readyplayer.me/avatar?frameApi&quickStart=true&bodyType=halfbody`

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('iframe')
      setAvatarCode('')
      setCodeError('')
      setSaving(false)
      setIframeLoaded(false)
    }
  }, [isOpen])

  // Handle avatar code/URL input with improved validation
  const handleCodeChange = (value: string) => {
    setAvatarCode(value.trim())
    setCodeError('')

    if (value.trim().length === 0) return

    const trimmedValue = value.trim()

    // Check if it's a URL
    if (trimmedValue.includes('models.readyplayer.me')) {
      // Extract code from URL if it's a full URL
      const urlMatch = trimmedValue.match(/models\.readyplayer\.me\/([A-Z0-9]{6,})/i)
      if (urlMatch) {
        const extractedCode = urlMatch[1].replace(/\.(glb|png)$/, '')
        if (extractedCode.length >= 6) {
          // Valid URL with code
          return
        }
      }

      if (!trimmedValue.startsWith('https://models.readyplayer.me/')) {
        setCodeError('URL should start with https://models.readyplayer.me/')
        return
      }

      if (!trimmedValue.includes('.glb') && !trimmedValue.includes('.png')) {
        setCodeError('URL should contain .glb or .png extension')
        return
      }
    } else {
      // Check if it's an avatar code (6 or more characters)
      if (trimmedValue.length >= 6) {
        if (!/^[A-Z0-9]{6,}$/i.test(trimmedValue)) {
          setCodeError('Code should contain only letters and numbers')
        }
      } else if (trimmedValue.length > 0) {
        setCodeError('Code should be at least 6 characters, or paste the full URL')
      }
    }
  }

  // Save avatar with improved code/URL handling
  const handleSaveAvatar = async () => {
    if (!avatarCode.trim()) {
      setCodeError('Please enter an avatar code or URL')
      return
    }

    try {
      let glbUrl: string
      let pngUrl: string
      const trimmedInput = avatarCode.trim()

      // Handle URL input (including partial URLs)
      if (trimmedInput.includes('models.readyplayer.me')) {
        // Extract code from URL - support longer codes too
        const urlMatch = trimmedInput.match(/models\.readyplayer\.me\/([A-Z0-9]{6,})/i)
        if (urlMatch) {
          const extractedCode = urlMatch[1].replace(/\.(glb|png)$/, '')
          // Use the full extracted code (don't truncate to 6 characters)
          glbUrl = `https://models.readyplayer.me/${extractedCode}.glb`
          pngUrl = `https://models.readyplayer.me/${extractedCode}.png`
        } else {
          setCodeError('Could not extract avatar code from URL')
          return
        }
      } else {
        // Handle codes (6+ characters)
        const upperCode = trimmedInput.toUpperCase()

        // Validate code format - allow 6 or more characters
        if (!/^[A-Z0-9]{6,}$/.test(upperCode)) {
          setCodeError('Code must be at least 6 characters (letters and numbers only)')
          return
        }

        // Convert code to URLs using the full code
        glbUrl = `https://models.readyplayer.me/${upperCode}.glb`
        pngUrl = `https://models.readyplayer.me/${upperCode}.png`
      }

      setSaving(true)

      // Update child with avatar URLs
      const response = await fetch(`/api/children/${childProfile.id}`, {
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
        toast.success('🎉 Your amazing avatar has been created!')
        onAvatarSaved()
        onClose()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Avatar save failed:', {
          status: response.status,
          statusText: response.statusText,
          childId: childProfile.id,
          errorData
        })

        if (response.status === 404) {
          toast.error('Oops! Something went wrong. Please try again.')
        } else {
          toast.error(`Failed to save avatar: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Avatar save error:', error)
      toast.error('Error saving avatar')
    } finally {
      setSaving(false)
    }
  }

  // Handle iframe messages from Ready Player Me
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== `https://${rpmSubdomain}.readyplayer.me`) return

      const { eventName, data } = event.data

      switch (eventName) {
        case 'v1.frame.ready':
          setIframeLoaded(true)
          break
        case 'v1.avatar.exported':
          // Avatar creation completed, move to code input step
          setStep('code')
          toast.success('🎨 Avatar created! Now let\'s save it to your profile.')
          break
        case 'v1.user.set':
          console.log('User set in Ready Player Me:', data)
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
        {/* Modal Header */}
        <div className="bg-chart-3 text-white p-4 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">🎨 Create Your Amazing Avatar!</h2>
            <button
              onClick={onClose}
              className="bg-white text-black p-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg"
              disabled={saving}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {step === 'iframe' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded">
                <h3 className="font-bold text-blue-800 mb-2">📸 Let's Create Your Avatar!</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li><strong>Take a photo or upload one from your device</strong></li>
                  <li>Watch as your avatar comes to life!</li>
                  <li>Customize how your avatar looks</li>
                  <li>When you're happy, look for the <strong>"Copy the link to share"</strong> button</li>
                  <li>Copy that link and we'll save it to your profile!</li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-xs text-yellow-800 font-bold">
                    💡 Tip: The camera will start automatically to help you create your avatar!
                  </p>
                </div>
              </div>

              {/* Ready Player Me Iframe */}
              <div className="relative bg-gray-100 border-2 border-black rounded" style={{ height: '600px' }}>
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-chart-3" />
                      <p className="text-sm font-bold text-gray-600">Loading Avatar Creator...</p>
                      <p className="text-xs text-gray-500 mt-1">Get ready to create something amazing!</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={iframeUrl}
                  className="w-full h-full border-none rounded"
                  allow="camera *; microphone *; fullscreen *"
                  onLoad={() => setIframeLoaded(true)}
                  data-testid="rpm-iframe"
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={onClose}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                  disabled={saving}
                >
                  CANCEL
                </button>
                <button
                  onClick={() => setStep('code')}
                  className="bg-chart-1 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold"
                >
                  SKIP TO CODE ENTRY
                </button>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-300 p-4 rounded">
                <h3 className="font-bold text-green-800 mb-2">🎉 Your Avatar is Ready!</h3>
                <p className="text-sm text-green-700">
                  Great job! Now let's save your avatar to your profile. You can either:
                </p>
                <ul className="text-sm text-green-700 mt-2 list-disc list-inside space-y-1">
                  <li><strong>Paste the entire link</strong> from the "Copy the link" button</li>
                  <li><strong>Enter just the avatar code</strong> (like "ABC123")</li>
                </ul>
              </div>

              {/* Avatar Code/URL Input */}
              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Avatar Code or Link</label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={avatarCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Paste your avatar link here OR enter the code&#10;&#10;Examples:&#10;• Code: ABC123&#10;• Link: https://models.readyplayer.me/ABC123.glb"
                        className={`w-full border-2 p-3 text-sm resize-none rounded ${codeError ? 'border-red-500' : 'border-black'
                          }`}
                        rows={4}
                        disabled={saving}
                      />
                      {codeError && (
                        <p className="text-red-600 text-sm mt-1 font-bold">{codeError}</p>
                      )}
                    </div>
                    <Code className="h-6 w-6 text-gray-400" />
                  </div>
                </div>

                {/* Input Format Help */}
                <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded">
                  <h4 className="font-bold text-blue-800 mb-2">💡 How to save your avatar:</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-bold text-green-600 mb-1">✅ Easiest way:</h5>
                      <p>Click the <strong>"Copy the link to share"</strong> button in the avatar creator and paste the entire link here.</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <h5 className="font-bold text-blue-600 mb-1">📝 Alternative:</h5>
                      <p>Find the avatar code (letters and numbers like "ABC123") and enter just that code.</p>
                    </div>
                  </div>
                </div>

                {/* Preview URLs */}
                {avatarCode && !codeError && (
                  <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded">
                    <h4 className="font-bold mb-2">Preview:</h4>
                    <div className="space-y-1 text-sm font-mono break-all">
                      {avatarCode.startsWith('https://models.readyplayer.me/') ? (
                        <>
                          <div>
                            <span className="font-bold">3D Model:</span> {avatarCode}
                          </div>
                          <div>
                            <span className="font-bold">Profile Picture:</span> {avatarCode.replace('.glb', '.png')}
                          </div>
                        </>
                      ) : avatarCode.length >= 6 && /^[A-Z0-9]{6,}$/i.test(avatarCode) ? (
                        <>
                          <div>
                            <span className="font-bold">3D Model:</span> https://models.readyplayer.me/{avatarCode.toUpperCase()}.glb
                          </div>
                          <div>
                            <span className="font-bold">Profile Picture:</span> https://models.readyplayer.me/{avatarCode.toUpperCase()}.png
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={() => setStep('iframe')}
                  className="bg-gray-500 text-white px-4 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center"
                  disabled={saving}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  BACK TO CREATOR
                </button>
                <button
                  onClick={handleSaveAvatar}
                  disabled={!avatarCode || !!codeError || saving}
                  className={`px-6 py-2 border-2 border-black shadow-brutal hover:shadow-brutal-lg font-bold flex items-center space-x-2 ${!avatarCode || codeError || saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-chart-3 text-white'
                    }`}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>SAVE MY AVATAR!</span>
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