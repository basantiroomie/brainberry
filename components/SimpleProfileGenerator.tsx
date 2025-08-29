'use client'

import React, { useRef, useCallback, useEffect } from 'react'

interface SimpleProfileGeneratorProps {
  childName: string
  childId: string
  onProfileGenerated: (dataUrl: string) => void
  size?: number
  backgroundColor?: string
  textColor?: string
}

export const SimpleProfileGenerator: React.FC<SimpleProfileGeneratorProps> = ({
  childName,
  childId,
  onProfileGenerated,
  size = 256,
  backgroundColor,
  textColor = '#ffffff'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate a consistent color based on the child's name
  const generateColor = useCallback((name: string) => {
    if (backgroundColor) return backgroundColor
    
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }, [backgroundColor])

  // Get initials from name
  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }, [])

  const generateProfile = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = size
    canvas.height = size

    // Generate background color
    const bgColor = generateColor(childName)
    
    // Draw background circle
    ctx.fillStyle = bgColor
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
    ctx.fill()

    // Draw initials
    const initials = getInitials(childName)
    ctx.fillStyle = textColor
    ctx.font = `bold ${size * 0.4}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(initials, size / 2, size / 2)

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png', 0.9)
    
    // Save to server
    try {
      const response = await fetch('/api/avatars/save-snapshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          childId,
          snapshotDataUrl: dataUrl
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`Generated profile picture for ${childName}`)
        onProfileGenerated(result.snapshotUrl || dataUrl)
      } else {
        console.warn('Failed to save profile picture to server')
        onProfileGenerated(dataUrl)
      }
    } catch (error) {
      console.warn('Error saving profile picture:', error)
      onProfileGenerated(dataUrl)
    }
  }, [childName, childId, size, generateColor, getInitials, textColor, onProfileGenerated])

  useEffect(() => {
    generateProfile()
  }, [generateProfile])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'none' }}
      width={size}
      height={size}
    />
  )
}

export default SimpleProfileGenerator