import React, { memo, useMemo } from 'react'
import { SmartImage } from '@/components/ImagePreloader'
import { imageCache } from '@/lib/image-cache'

interface OptimizedCardProps {
  card: {
    id: number
    image_url: string
    label: string
    isFlipped: boolean
    isMatched: boolean
    ai_generation?: {
      fallback_emoji?: string
    }
  }
  theme: string
  primaryColor: string
  onClick: () => void
}

// Memoized card component to prevent unnecessary re-renders
const OptimizedCard = memo(({ card, theme, primaryColor, onClick }: OptimizedCardProps) => {
  // Pre-cache the image URL - this will be instant if already cached
  const cachedImageUrl = useMemo(() => {
    return imageCache.getCachedImage(card.image_url) || card.image_url
  }, [card.image_url])

  // Memoize fallback emoji calculation
  const fallbackEmoji = useMemo(() => {
    return card.ai_generation?.fallback_emoji || 
           (theme === 'animals' ? '🐾' : 
            theme === 'family' ? '👨‍👩‍👧‍👦' :
            theme === 'toys' ? '🧸' :
            theme === 'food' ? '🍎' :
            theme === 'characters' ? '🦸' : '⭐')
  }, [card.ai_generation?.fallback_emoji, theme])

  // Memoize card styling
  const cardClassName = useMemo(() => {
    return `
      aspect-square bg-white rounded-lg border-4 shadow-lg cursor-pointer transform transition-all duration-200
      ${card.isMatched 
        ? 'border-green-500 scale-105 bg-green-100' 
        : card.isFlipped 
          ? 'border-blue-500 scale-105' 
          : 'border-gray-300 hover:scale-105 hover:border-blue-400'
      }
    `
  }, [card.isMatched, card.isFlipped])

  return (
    <div
      className={cardClassName}
      onClick={onClick}
    >
      <div className="w-full h-full flex items-center justify-center p-2">
        {card.isFlipped || card.isMatched ? (
          <div className="text-center">
            {/* Enhanced card display with cached AI-generated content */}
            <div 
              className="w-16 h-16 rounded-lg mb-2 relative overflow-hidden"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <SmartImage
                src={cachedImageUrl}
                alt={card.label}
                className="w-full h-full rounded-lg"
                fallbackEmoji={fallbackEmoji}
              />
            </div>
            <div className="text-xs font-bold text-gray-800 px-1 text-center leading-tight">
              {card.label}
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-full rounded-lg flex items-center justify-center text-4xl relative"
            style={{ backgroundColor: primaryColor + '60' }}
          >
            {/* Enhanced card back design */}
            <div className="absolute inset-0 rounded-lg border-2 border-white opacity-30"></div>
            <div className="relative">❓</div>
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.isFlipped === nextProps.card.isFlipped &&
    prevProps.card.isMatched === nextProps.card.isMatched &&
    prevProps.card.image_url === nextProps.card.image_url &&
    prevProps.card.label === nextProps.card.label &&
    prevProps.theme === nextProps.theme &&
    prevProps.primaryColor === nextProps.primaryColor
  )
})

OptimizedCard.displayName = 'OptimizedCard'

export default OptimizedCard
