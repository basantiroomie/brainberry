// React performance optimization hooks and utilities
import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { logger } from '../utils/logger'

// Debounced callback hook
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay, ...deps]
  )
}

// Throttled callback hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number,
  deps: React.DependencyList = []
): T {
  const inThrottle = useRef(false)
  
  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    }) as T,
    [callback, limit, ...deps]
  )
}

// Memoized event handlers
export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef<T>(fn)
  
  useEffect(() => {
    ref.current = fn
  })
  
  return useCallback(
    ((...args: Parameters<T>) => ref.current(...args)) as T,
    []
  )
}

// Performance monitoring hook
export function usePerformanceMonitor(name: string, enabled = true) {
  const startTime = useRef<number | undefined>(undefined)
  const mounted = useRef(false)
  
  useEffect(() => {
    if (!enabled || typeof performance === 'undefined') return
    
    startTime.current = performance.now()
    mounted.current = true
    
    logger.debug(`Performance monitor started: ${name}`, 'PERF')
    
    return () => {
      if (startTime.current && mounted.current) {
        const duration = performance.now() - startTime.current
        logger.debug(`Performance monitor: ${name} took ${duration.toFixed(2)}ms`, 'PERF')
      }
    }
  }, [name, enabled])
  
  const mark = useCallback((label: string) => {
    if (!enabled || typeof performance === 'undefined' || !startTime.current) return
    
    const duration = performance.now() - startTime.current
    logger.debug(`Performance mark: ${name}.${label} at ${duration.toFixed(2)}ms`, 'PERF')
  }, [name, enabled])
  
  return { mark }
}

// Optimized game state management
export function useGameState<T>(initialState: T, gameId?: string) {
  const [state, setState] = useState<T>(initialState)
  const stateRef = useRef<T>(initialState)
  const gameIdRef = useRef(gameId)
  
  // Update ref when state changes for performance
  useEffect(() => {
    stateRef.current = state
  }, [state])
  
  // Optimized state updater
  const updateState = useCallback((updater: Partial<T> | ((prev: T) => T)) => {
    setState(prev => {
      const newState = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      
      // Log significant state changes in development
      if (process.env.NODE_ENV === 'development' && gameIdRef.current) {
        logger.game('State update', gameIdRef.current, { newState })
      }
      
      return newState
    })
  }, [])
  
  // Get current state without re-render
  const getCurrentState = useCallback(() => stateRef.current, [])
  
  return {
    state,
    updateState,
    getCurrentState
  }
}

// Optimized array operations for game data
export function useOptimizedArray<T>(
  initialArray: T[],
  keyExtractor: (item: T) => string | number
) {
  const [array, setArray] = useState<T[]>(initialArray)
  const keyMap = useMemo(() => {
    const map = new Map<string | number, number>()
    array.forEach((item, index) => {
      map.set(keyExtractor(item), index)
    })
    return map
  }, [array, keyExtractor])
  
  const findByKey = useCallback((key: string | number): T | undefined => {
    const index = keyMap.get(key)
    return index !== undefined ? array[index] : undefined
  }, [array, keyMap])
  
  const updateByKey = useCallback((key: string | number, updater: Partial<T> | ((item: T) => T)) => {
    const index = keyMap.get(key)
    if (index === undefined) return
    
    setArray(prev => {
      const newArray = [...prev]
      const item = newArray[index]
      newArray[index] = typeof updater === 'function' 
        ? updater(item) 
        : { ...item, ...updater }
      return newArray
    })
  }, [keyMap])
  
  const addItem = useCallback((item: T) => {
    setArray(prev => [...prev, item])
  }, [])
  
  const removeByKey = useCallback((key: string | number) => {
    const index = keyMap.get(key)
    if (index === undefined) return
    
    setArray(prev => prev.filter((_, i) => i !== index))
  }, [keyMap])
  
  return {
    array,
    setArray,
    findByKey,
    updateByKey,
    addItem,
    removeByKey
  }
}

// Image loading optimization
export function useOptimizedImageLoad(src: string, fallback?: string) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [imageSrc, setImageSrc] = useState<string>(src)
  
  useEffect(() => {
    if (!src) {
      setStatus('error')
      return
    }
    
    setStatus('loading')
    
    const img = new Image()
    
    img.onload = () => {
      setImageSrc(src)
      setStatus('loaded')
      logger.image('load', src)
    }
    
    img.onerror = () => {
      if (fallback && fallback !== src) {
        setImageSrc(fallback)
        setStatus('loaded')
        logger.image('error', src, { fallback })
      } else {
        setStatus('error')
        logger.image('error', src)
      }
    }
    
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src, fallback])
  
  return { status, imageSrc }
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  threshold = 0.1,
  rootMargin = '50px'
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [hasIntersected, setHasIntersected] = useState(false)
  const targetRef = useRef<HTMLElement>(null)
  
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting
        setIsIntersecting(isVisible)
        
        if (isVisible && !hasIntersected) {
          setHasIntersected(true)
        }
      },
      { threshold, rootMargin }
    )
    
    observer.observe(target)
    
    return () => {
      observer.unobserve(target)
    }
  }, [threshold, rootMargin, hasIntersected])
  
  return { ref: targetRef, isIntersecting, hasIntersected }
}

// Virtualization helper for large lists
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    )
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(itemCount - 1, end + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, itemCount, overscan])
  
  const totalHeight = itemCount * itemHeight
  
  const getItemStyle = useCallback((index: number) => ({
    position: 'absolute' as const,
    top: index * itemHeight,
    height: itemHeight,
    width: '100%'
  }), [itemHeight])
  
  return {
    visibleRange,
    totalHeight,
    getItemStyle,
    onScroll: setScrollTop
  }
}

// Game timer optimization
export function useGameTimer(autoStart = false) {
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(autoStart)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | undefined>(undefined)
  
  const start = useCallback(() => {
    if (!isRunning) {
      startTimeRef.current = Date.now() - time * 1000
      setIsRunning(true)
    }
  }, [isRunning, time])
  
  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])
  
  const reset = useCallback(() => {
    setIsRunning(false)
    setTime(0)
    startTimeRef.current = undefined
  }, [])
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          setTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])
  
  return {
    time,
    isRunning,
    start,
    pause,
    reset
  }
}
