// Performance monitoring for avatar system
import { logger } from '@/utils/logger'

export interface PerformanceMetrics {
  renderTime: number
  loadTime: number
  memoryUsage: number
  frameRate: number
  webglContexts: number
  textureMemory: number
}

export interface AvatarPerformanceEvent {
  type: 'load' | 'render' | 'tts' | 'lipsync' | 'memory'
  operation: string
  duration: number
  timestamp: Date
  metadata?: any
}

export class AvatarPerformanceMonitor {
  private static instance: AvatarPerformanceMonitor
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    loadTime: 0,
    memoryUsage: 0,
    frameRate: 0,
    webglContexts: 0,
    textureMemory: 0
  }
  private events: AvatarPerformanceEvent[] = []
  private maxEvents = 100
  private frameRateHistory: number[] = []
  private maxFrameHistory = 60
  private performanceObserver?: PerformanceObserver
  private isMonitoring = false

  static getInstance(): AvatarPerformanceMonitor {
    if (!AvatarPerformanceMonitor.instance) {
      AvatarPerformanceMonitor.instance = new AvatarPerformanceMonitor()
    }
    return AvatarPerformanceMonitor.instance
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.setupPerformanceObserver()
    this.startFrameRateMonitoring()
    this.startMemoryMonitoring()
    
    logger.info('Avatar performance monitoring started', 'AVATAR_PERF')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = undefined
    }
    
    logger.info('Avatar performance monitoring stopped', 'AVATAR_PERF')
  }

  /**
   * Record performance event
   */
  recordEvent(
    type: AvatarPerformanceEvent['type'],
    operation: string,
    duration: number,
    metadata?: any
  ): void {
    const event: AvatarPerformanceEvent = {
      type,
      operation,
      duration,
      timestamp: new Date(),
      metadata
    }

    this.events.unshift(event)
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents)
    }

    // Update metrics based on event type
    this.updateMetrics(event)

    // Log performance issues
    this.checkPerformanceThresholds(event)
  }

  /**
   * Measure operation performance
   */
  measureOperation<T>(
    type: AvatarPerformanceEvent['type'],
    operation: string,
    fn: () => T | Promise<T>,
    metadata?: any
  ): T | Promise<T> {
    const startTime = performance.now()
    
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - startTime
        this.recordEvent(type, operation, duration, metadata)
      })
    } else {
      const duration = performance.now() - startTime
      this.recordEvent(type, operation, duration, metadata)
      return result
    }
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(event: AvatarPerformanceEvent): void {
    switch (event.type) {
      case 'load':
        this.metrics.loadTime = event.duration
        break
      case 'render':
        this.metrics.renderTime = event.duration
        break
      case 'memory':
        if (event.metadata?.memoryUsage) {
          this.metrics.memoryUsage = event.metadata.memoryUsage
        }
        break
    }
  }

  /**
   * Check performance thresholds and log warnings
   */
  private checkPerformanceThresholds(event: AvatarPerformanceEvent): void {
    const thresholds = {
      load: 5000, // 5 seconds
      render: 16.67, // 60fps = 16.67ms per frame
      tts: 1000, // 1 second
      lipsync: 16.67, // 60fps
      memory: 100 * 1024 * 1024 // 100MB
    }

    const threshold = thresholds[event.type]
    if (threshold && event.duration > threshold) {
      logger.warn(
        `Avatar performance threshold exceeded: ${event.operation} took ${event.duration.toFixed(2)}ms (threshold: ${threshold}ms)`,
        'AVATAR_PERF',
        { event }
      )
    }
  }

  /**
   * Setup performance observer for navigation and resource timing
   */
  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === 'undefined') return

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.name.includes('avatar') || entry.name.includes('.glb')) {
            this.recordEvent('load', entry.name, entry.duration, {
              entryType: entry.entryType,
              startTime: entry.startTime
            })
          }
        })
      })

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'measure'] 
      })
    } catch (error) {
      logger.warn('Failed to setup performance observer', 'AVATAR_PERF', error)
    }
  }

  /**
   * Start frame rate monitoring
   */
  private startFrameRateMonitoring(): void {
    let lastTime = performance.now()
    let frameCount = 0

    const measureFrameRate = () => {
      if (!this.isMonitoring) return

      const currentTime = performance.now()
      frameCount++

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
        
        this.frameRateHistory.unshift(fps)
        if (this.frameRateHistory.length > this.maxFrameHistory) {
          this.frameRateHistory = this.frameRateHistory.slice(0, this.maxFrameHistory)
        }

        this.metrics.frameRate = fps
        
        // Log low frame rate
        if (fps < 30) {
          logger.warn(`Low frame rate detected: ${fps} FPS`, 'AVATAR_PERF')
        }

        lastTime = currentTime
        frameCount = 0
      }

      requestAnimationFrame(measureFrameRate)
    }

    requestAnimationFrame(measureFrameRate)
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    const monitorMemory = () => {
      if (!this.isMonitoring) return

      try {
        // @ts-ignore - performance.memory is not in all browsers
        const memory = window.performance?.memory
        if (memory) {
          const memoryUsage = memory.usedJSHeapSize
          this.recordEvent('memory', 'heap-usage', memoryUsage, {
            memoryUsage,
            totalHeapSize: memory.totalJSHeapSize,
            heapSizeLimit: memory.jsHeapSizeLimit
          })

          // Check for memory leaks
          if (memoryUsage > memory.jsHeapSizeLimit * 0.8) {
            logger.warn('High memory usage detected', 'AVATAR_PERF', {
              used: memoryUsage,
              limit: memory.jsHeapSizeLimit,
              percentage: (memoryUsage / memory.jsHeapSizeLimit * 100).toFixed(2)
            })
          }
        }
      } catch (error) {
        logger.warn('Failed to monitor memory', 'AVATAR_PERF', error)
      }

      setTimeout(monitorMemory, 5000) // Check every 5 seconds
    }

    setTimeout(monitorMemory, 1000) // Start after 1 second
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance events
   */
  getEvents(): AvatarPerformanceEvent[] {
    return [...this.events]
  }

  /**
   * Get frame rate statistics
   */
  getFrameRateStats(): {
    current: number
    average: number
    min: number
    max: number
    history: number[]
  } {
    if (this.frameRateHistory.length === 0) {
      return { current: 0, average: 0, min: 0, max: 0, history: [] }
    }

    const current = this.frameRateHistory[0] || 0
    const average = Math.round(
      this.frameRateHistory.reduce((sum, fps) => sum + fps, 0) / this.frameRateHistory.length
    )
    const min = Math.min(...this.frameRateHistory)
    const max = Math.max(...this.frameRateHistory)

    return {
      current,
      average,
      min,
      max,
      history: [...this.frameRateHistory]
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    metrics: PerformanceMetrics
    frameRateStats: ReturnType<AvatarPerformanceMonitor['getFrameRateStats']>
    recentEvents: AvatarPerformanceEvent[]
    issues: string[]
  } {
    const frameRateStats = this.getFrameRateStats()
    const recentEvents = this.events.slice(0, 10)
    const issues: string[] = []

    // Identify performance issues
    if (frameRateStats.average < 30) {
      issues.push(`Low average frame rate: ${frameRateStats.average} FPS`)
    }

    if (this.metrics.loadTime > 5000) {
      issues.push(`Slow avatar loading: ${this.metrics.loadTime.toFixed(0)}ms`)
    }

    if (this.metrics.memoryUsage > 100 * 1024 * 1024) {
      issues.push(`High memory usage: ${(this.metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`)
    }

    return {
      metrics: this.getMetrics(),
      frameRateStats,
      recentEvents,
      issues
    }
  }

  /**
   * Clear performance data
   */
  clearData(): void {
    this.events = []
    this.frameRateHistory = []
    this.metrics = {
      renderTime: 0,
      loadTime: 0,
      memoryUsage: 0,
      frameRate: 0,
      webglContexts: 0,
      textureMemory: 0
    }
  }
}

// Convenience functions
export const avatarPerformanceMonitor = AvatarPerformanceMonitor.getInstance()

export const measureAvatarOperation = <T>(
  type: AvatarPerformanceEvent['type'],
  operation: string,
  fn: () => T | Promise<T>,
  metadata?: any
): T | Promise<T> => {
  return avatarPerformanceMonitor.measureOperation(type, operation, fn, metadata)
}

export const recordAvatarEvent = (
  type: AvatarPerformanceEvent['type'],
  operation: string,
  duration: number,
  metadata?: any
): void => {
  avatarPerformanceMonitor.recordEvent(type, operation, duration, metadata)
}

export const startAvatarPerformanceMonitoring = (): void => {
  avatarPerformanceMonitor.startMonitoring()
}

export const stopAvatarPerformanceMonitoring = (): void => {
  avatarPerformanceMonitor.stopMonitoring()
}