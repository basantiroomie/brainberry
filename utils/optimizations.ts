// React component optimization utilities and higher-order components
import React, { memo, forwardRef, ComponentType, ReactElement } from 'react'
import { logger } from '../utils/logger'

// Performance monitoring HOC
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  displayName?: string
) {
  const componentName = displayName || Component.displayName || Component.name || 'Component'
  
  const WrappedComponent = memo(
    forwardRef<any, P>((props, ref) => {
      const renderStart = React.useRef<number>()
      
      // Track render start
      renderStart.current = performance.now()
      
      React.useEffect(() => {
        if (renderStart.current) {
          const renderTime = performance.now() - renderStart.current
          logger.debug(`${componentName} render time: ${renderTime.toFixed(2)}ms`, 'PERF')
        }
      })
      
      return <Component {...props} ref={ref} />
    })
  )
  
  WrappedComponent.displayName = `withPerformanceMonitoring(${componentName})`
  return WrappedComponent
}

// Memoization utilities
export const createMemoComponent = <P extends object>(
  Component: ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  const MemoComponent = memo(Component, propsAreEqual)
  MemoComponent.displayName = `Memo(${Component.displayName || Component.name})`
  return MemoComponent
}

// Common prop comparison functions
export const shallowEqual = <T extends Record<string, any>>(
  prev: T,
  next: T
): boolean => {
  const prevKeys = Object.keys(prev)
  const nextKeys = Object.keys(next)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  for (const key of prevKeys) {
    if (prev[key] !== next[key]) return false
  }
  
  return true
}

export const deepEqual = <T>(prev: T, next: T): boolean => {
  if (prev === next) return true
  
  if (typeof prev !== typeof next) return false
  
  if (typeof prev !== 'object' || prev === null || next === null) {
    return prev === next
  }
  
  if (Array.isArray(prev) !== Array.isArray(next)) return false
  
  if (Array.isArray(prev)) {
    const prevArray = prev as unknown[]
    const nextArray = next as unknown[]
    
    if (prevArray.length !== nextArray.length) return false
    
    return prevArray.every((item, index) => deepEqual(item, nextArray[index]))
  }
  
  const prevObj = prev as Record<string, any>
  const nextObj = next as Record<string, any>
  
  const prevKeys = Object.keys(prevObj)
  const nextKeys = Object.keys(nextObj)
  
  if (prevKeys.length !== nextKeys.length) return false
  
  return prevKeys.every(key => deepEqual(prevObj[key], nextObj[key]))
}

// Game-specific prop comparisons
export const gameConfigEqual = (
  prev: { gameConfig: any },
  next: { gameConfig: any }
): boolean => {
  return deepEqual(prev.gameConfig, next.gameConfig)
}

export const cardArrayEqual = (
  prev: { cards: any[] },
  next: { cards: any[] }
): boolean => {
  if (prev.cards.length !== next.cards.length) return false
  
  return prev.cards.every((card, index) => {
    const nextCard = next.cards[index]
    return card.id === nextCard.id && 
           card.isFlipped === nextCard.isFlipped && 
           card.isMatched === nextCard.isMatched
  })
}

// Optimized game components
export const OptimizedGameCard = memo<{
  card: any
  onClick: () => void
  disabled?: boolean
}>(({ card, onClick, disabled }) => {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        game-card 
        ${card.isFlipped ? 'flipped' : ''} 
        ${card.isMatched ? 'matched' : ''}
        ${disabled ? 'disabled' : 'interactive'}
      `}
    >
      {/* Card content */}
    </div>
  )
}, (prev, next) => {
  return prev.card.id === next.card.id &&
         prev.card.isFlipped === next.card.isFlipped &&
         prev.card.isMatched === next.card.isMatched &&
         prev.disabled === next.disabled
})

OptimizedGameCard.displayName = 'OptimizedGameCard'

// Lazy loading wrapper
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback: ReactElement = <div>Loading...</div>
) {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: Component }))
  
  return (props: P) => (
    <React.Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </React.Suspense>
  )
}

// Error boundary HOC
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  fallback?: (error: Error) => ReactElement
) {
  return class ErrorBoundary extends React.Component<P, ErrorBoundaryState> {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false }
    }
    
    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
      return { hasError: true, error }
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      logger.error('Component error boundary caught error', error, 'ERROR_BOUNDARY')
      logger.debug('Error info', 'ERROR_BOUNDARY', errorInfo)
    }
    
    render() {
      if (this.state.hasError) {
        if (fallback && this.state.error) {
          return fallback(this.state.error)
        }
        
        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>An error occurred while rendering this component.</p>
            <button onClick={() => this.setState({ hasError: false, error: undefined })}>
              Try Again
            </button>
          </div>
        )
      }
      
      return <Component {...this.props} />
    }
  }
}

// Viewport optimization
export function withViewportOptimization<P extends object>(
  Component: ComponentType<P>,
  options: {
    threshold?: number
    rootMargin?: string
    unloadWhenNotVisible?: boolean
  } = {}
) {
  const { threshold = 0.1, rootMargin = '50px', unloadWhenNotVisible = false } = options
  
  return (props: P) => {
    const [isVisible, setIsVisible] = React.useState(!unloadWhenNotVisible)
    const [hasBeenVisible, setHasBeenVisible] = React.useState(!unloadWhenNotVisible)
    const ref = React.useRef<HTMLDivElement>(null)
    
    React.useEffect(() => {
      const element = ref.current
      if (!element) return
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          const visible = entry.isIntersecting
          setIsVisible(visible)
          
          if (visible && !hasBeenVisible) {
            setHasBeenVisible(true)
          }
        },
        { threshold, rootMargin }
      )
      
      observer.observe(element)
      
      return () => observer.unobserve(element)
    }, [threshold, rootMargin, hasBeenVisible])
    
    return (
      <div ref={ref}>
        {(isVisible || hasBeenVisible) && <Component {...props} />}
      </div>
    )
  }
}

// Composite optimization HOC
export function withOptimizations<P extends object>(
  Component: ComponentType<P>,
  options: {
    memo?: boolean | ((prev: P, next: P) => boolean)
    performanceMonitoring?: boolean
    errorBoundary?: boolean
    viewport?: {
      threshold?: number
      rootMargin?: string
      unloadWhenNotVisible?: boolean
    }
  } = {}
) {
  let OptimizedComponent = Component
  
  // Apply memoization
  if (options.memo) {
    const areEqual = typeof options.memo === 'function' ? options.memo : undefined
    OptimizedComponent = memo(OptimizedComponent, areEqual)
  }
  
  // Apply performance monitoring
  if (options.performanceMonitoring) {
    OptimizedComponent = withPerformanceMonitoring(OptimizedComponent)
  }
  
  // Apply error boundary
  if (options.errorBoundary) {
    OptimizedComponent = withErrorBoundary(OptimizedComponent)
  }
  
  // Apply viewport optimization
  if (options.viewport) {
    OptimizedComponent = withViewportOptimization(OptimizedComponent, options.viewport)
  }
  
  return OptimizedComponent
}

// Game-specific optimized components
export const OptimizedGamePlayer = withOptimizations<{
  gameConfig: any
  onComplete?: () => void
  onBack?: () => void
}>(({ gameConfig, onComplete, onBack }) => {
  // Game player implementation would go here
  return <div>Game Player</div>
}, {
  memo: gameConfigEqual,
  performanceMonitoring: process.env.NODE_ENV === 'development',
  errorBoundary: true
})

export const OptimizedCardGrid = withOptimizations<{
  cards: any[]
  onCardClick: (cardId: number) => void
  disabled?: boolean
}>(({ cards, onCardClick, disabled }) => {
  return (
    <div className="card-grid">
      {cards.map(card => (
        <OptimizedGameCard
          key={card.id}
          card={card}
          onClick={() => onCardClick(card.id)}
          disabled={disabled}
        />
      ))}
    </div>
  )
}, {
  memo: (prev, next) => 
    cardArrayEqual({ cards: prev.cards }, { cards: next.cards }) &&
    prev.disabled === next.disabled,
  performanceMonitoring: process.env.NODE_ENV === 'development'
})
