// Comprehensive error handling for avatar system
import { logger } from '@/utils/logger'

export enum AvatarErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  LOADING_ERROR = 'LOADING_ERROR',
  RENDERING_ERROR = 'RENDERING_ERROR',
  TTS_ERROR = 'TTS_ERROR',
  LIPSYNC_ERROR = 'LIPSYNC_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  WEBGL_ERROR = 'WEBGL_ERROR'
}

export interface AvatarError {
  type: AvatarErrorType
  message: string
  originalError?: Error | unknown
  context?: {
    avatarUrl?: string
    childId?: string
    operation?: string
    timestamp: Date
    userAgent: string
    webglSupported: boolean
    memoryInfo?: any
  }
  recoverable: boolean
  retryCount?: number
}

export class AvatarErrorHandler {
  private static instance: AvatarErrorHandler
  private errorHistory: AvatarError[] = []
  private maxHistorySize = 50
  private retryAttempts = new Map<string, number>()
  private maxRetries = 3

  static getInstance(): AvatarErrorHandler {
    if (!AvatarErrorHandler.instance) {
      AvatarErrorHandler.instance = new AvatarErrorHandler()
    }
    return AvatarErrorHandler.instance
  }

  /**
   * Handle avatar-related errors with context and recovery strategies
   */
  handleError(
    type: AvatarErrorType,
    message: string,
    originalError?: Error | unknown,
    context?: Partial<AvatarError['context']>
  ): AvatarError {
    const avatarError: AvatarError = {
      type,
      message,
      originalError,
      context: {
        timestamp: new Date(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        webglSupported: this.checkWebGLSupport(),
        memoryInfo: this.getMemoryInfo(),
        ...context
      },
      recoverable: this.isRecoverable(type),
      retryCount: this.getRetryCount(this.getErrorKey(type, context))
    }

    // Add to error history
    this.addToHistory(avatarError)

    // Log the error
    logger.error(
      `Avatar Error [${type}]: ${message}`,
      originalError,
      'AVATAR_ERROR'
    )

    // Report to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(avatarError)
    }

    return avatarError
  }

  /**
   * Check if error type is recoverable
   */
  private isRecoverable(type: AvatarErrorType): boolean {
    const recoverableTypes = [
      AvatarErrorType.NETWORK_ERROR,
      AvatarErrorType.LOADING_ERROR,
      AvatarErrorType.TTS_ERROR
    ]
    return recoverableTypes.includes(type)
  }

  /**
   * Get retry count for specific error
   */
  private getRetryCount(errorKey: string): number {
    return this.retryAttempts.get(errorKey) || 0
  }

  /**
   * Increment retry count
   */
  incrementRetryCount(type: AvatarErrorType, context?: Partial<AvatarError['context']>): number {
    const errorKey = this.getErrorKey(type, context)
    const currentCount = this.getRetryCount(errorKey)
    const newCount = currentCount + 1
    this.retryAttempts.set(errorKey, newCount)
    return newCount
  }

  /**
   * Check if should retry error
   */
  shouldRetry(type: AvatarErrorType, context?: Partial<AvatarError['context']>): boolean {
    if (!this.isRecoverable(type)) return false
    const retryCount = this.getRetryCount(this.getErrorKey(type, context))
    return retryCount < this.maxRetries
  }

  /**
   * Reset retry count for specific error
   */
  resetRetryCount(type: AvatarErrorType, context?: Partial<AvatarError['context']>): void {
    const errorKey = this.getErrorKey(type, context)
    this.retryAttempts.delete(errorKey)
  }

  /**
   * Generate error key for retry tracking
   */
  private getErrorKey(type: AvatarErrorType, context?: Partial<AvatarError['context']>): string {
    return `${type}_${context?.avatarUrl || 'unknown'}_${context?.operation || 'unknown'}`
  }

  /**
   * Add error to history
   */
  private addToHistory(error: AvatarError): void {
    this.errorHistory.unshift(error)
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Get error history
   */
  getErrorHistory(): AvatarError[] {
    return [...this.errorHistory]
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number
    errorsByType: Record<AvatarErrorType, number>
    recoverableErrors: number
    recentErrors: AvatarError[]
  } {
    const errorsByType = {} as Record<AvatarErrorType, number>
    let recoverableErrors = 0

    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1
      if (error.recoverable) recoverableErrors++
    })

    const recentErrors = this.errorHistory.slice(0, 10)

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      recoverableErrors,
      recentErrors
    }
  }

  /**
   * Check WebGL support
   */
  private checkWebGLSupport(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      return !!gl
    } catch {
      return false
    }
  }

  /**
   * Get memory information
   */
  private getMemoryInfo(): any {
    if (typeof window === 'undefined') return null
    
    try {
      // @ts-ignore - performance.memory is not in all browsers
      const performanceWithMemory = window.performance as any
      return performanceWithMemory?.memory ? {
        usedJSHeapSize: performanceWithMemory.memory.usedJSHeapSize,
        totalJSHeapSize: performanceWithMemory.memory.totalJSHeapSize,
        jsHeapSizeLimit: performanceWithMemory.memory.jsHeapSizeLimit
      } : null
    } catch {
      return null
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: AvatarError): void {
    // In production, send to error monitoring service
    // Example: Sentry, Bugsnag, etc.
    try {
      // Implementation would depend on your monitoring service
      console.warn('Error reporting not implemented:', error)
    } catch (reportingError) {
      logger.error('Failed to report avatar error', reportingError, 'AVATAR_ERROR')
    }
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = []
    this.retryAttempts.clear()
  }
}

// Convenience functions
export const avatarErrorHandler = AvatarErrorHandler.getInstance()

export const handleAvatarError = (
  type: AvatarErrorType,
  message: string,
  originalError?: Error | unknown,
  context?: Partial<AvatarError['context']>
): AvatarError => {
  return avatarErrorHandler.handleError(type, message, originalError, context)
}

export const shouldRetryAvatarOperation = (
  type: AvatarErrorType,
  context?: Partial<AvatarError['context']>
): boolean => {
  return avatarErrorHandler.shouldRetry(type, context)
}

export const incrementAvatarRetryCount = (
  type: AvatarErrorType,
  context?: Partial<AvatarError['context']>
): number => {
  return avatarErrorHandler.incrementRetryCount(type, context)
}

export const resetAvatarRetryCount = (
  type: AvatarErrorType,
  context?: Partial<AvatarError['context']>
): void => {
  avatarErrorHandler.resetRetryCount(type, context)
}