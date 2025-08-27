// Retry mechanism for avatar operations
import { logger } from '@/utils/logger'
import { AvatarErrorType } from './avatar-error-handler'

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  retryableErrors: AvatarErrorType[]
  onRetry?: (attempt: number, error: Error) => void
  onMaxRetriesReached?: (error: Error) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTime: number
}

export class AvatarRetryManager {
  private static instance: AvatarRetryManager
  private activeRetries = new Map<string, AbortController>()

  static getInstance(): AvatarRetryManager {
    if (!AvatarRetryManager.instance) {
      AvatarRetryManager.instance = new AvatarRetryManager()
    }
    return AvatarRetryManager.instance
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationId?: string
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      retryableErrors: [
        AvatarErrorType.NETWORK_ERROR,
        AvatarErrorType.LOADING_ERROR,
        AvatarErrorType.TTS_ERROR
      ],
      ...config
    }

    const startTime = Date.now()
    let lastError: Error | null = null
    let attempts = 0

    // Create abort controller for this operation
    const abortController = new AbortController()
    if (operationId) {
      this.activeRetries.set(operationId, abortController)
    }

    try {
      for (attempts = 1; attempts <= finalConfig.maxAttempts; attempts++) {
        // Check if operation was aborted
        if (abortController.signal.aborted) {
          throw new Error('Operation aborted')
        }

        try {
          logger.debug(
            `Avatar operation attempt ${attempts}/${finalConfig.maxAttempts}`,
            'AVATAR_RETRY',
            { operationId }
          )

          const result = await operation()
          
          // Success - clean up and return
          if (operationId) {
            this.activeRetries.delete(operationId)
          }

          const totalTime = Date.now() - startTime
          
          logger.info(
            `Avatar operation succeeded on attempt ${attempts}`,
            'AVATAR_RETRY',
            { operationId, totalTime, attempts }
          )

          return {
            success: true,
            data: result,
            attempts,
            totalTime
          }

        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
          
          logger.warn(
            `Avatar operation failed on attempt ${attempts}: ${lastError.message}`,
            'AVATAR_RETRY',
            { operationId, error: lastError }
          )

          // Check if error is retryable
          const errorType = this.determineErrorType(lastError)
          if (!finalConfig.retryableErrors.includes(errorType)) {
            logger.info(
              `Error type ${errorType} is not retryable, aborting`,
              'AVATAR_RETRY'
            )
            break
          }

          // Don't wait after the last attempt
          if (attempts < finalConfig.maxAttempts) {
            // Call retry callback
            if (finalConfig.onRetry) {
              finalConfig.onRetry(attempts, lastError)
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(
              finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempts - 1),
              finalConfig.maxDelay
            )

            logger.debug(
              `Waiting ${delay}ms before retry attempt ${attempts + 1}`,
              'AVATAR_RETRY'
            )

            // Wait with abort support
            await this.delay(delay, abortController.signal)
          }
        }
      }

      // All attempts failed
      if (operationId) {
        this.activeRetries.delete(operationId)
      }

      const totalTime = Date.now() - startTime
      
      if (finalConfig.onMaxRetriesReached && lastError) {
        finalConfig.onMaxRetriesReached(lastError)
      }

      logger.error(
        `Avatar operation failed after ${attempts} attempts`,
        lastError,
        'AVATAR_RETRY'
      )

      return {
        success: false,
        error: lastError || new Error('Unknown error'),
        attempts,
        totalTime
      }

    } catch (error) {
      // Handle abort or other unexpected errors
      if (operationId) {
        this.activeRetries.delete(operationId)
      }

      const totalTime = Date.now() - startTime
      const finalError = error instanceof Error ? error : new Error(String(error))

      return {
        success: false,
        error: finalError,
        attempts,
        totalTime
      }
    }
  }

  /**
   * Abort active retry operation
   */
  abortRetry(operationId: string): boolean {
    const controller = this.activeRetries.get(operationId)
    if (controller) {
      controller.abort()
      this.activeRetries.delete(operationId)
      logger.info(`Aborted retry operation: ${operationId}`, 'AVATAR_RETRY')
      return true
    }
    return false
  }

  /**
   * Abort all active retry operations
   */
  abortAllRetries(): number {
    let aborted = 0
    this.activeRetries.forEach((controller, operationId) => {
      controller.abort()
      aborted++
    })
    this.activeRetries.clear()
    
    if (aborted > 0) {
      logger.info(`Aborted ${aborted} retry operations`, 'AVATAR_RETRY')
    }
    
    return aborted
  }

  /**
   * Get active retry operations
   */
  getActiveRetries(): string[] {
    return Array.from(this.activeRetries.keys())
  }

  /**
   * Determine error type from error message
   */
  private determineErrorType(error: Error): AvatarErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return AvatarErrorType.NETWORK_ERROR
    }
    
    if (message.includes('load') || message.includes('gltf') || message.includes('404')) {
      return AvatarErrorType.LOADING_ERROR
    }
    
    if (message.includes('webgl') || message.includes('context')) {
      return AvatarErrorType.WEBGL_ERROR
    }
    
    if (message.includes('memory') || message.includes('heap')) {
      return AvatarErrorType.MEMORY_ERROR
    }
    
    if (message.includes('speech') || message.includes('tts')) {
      return AvatarErrorType.TTS_ERROR
    }
    
    if (message.includes('lipsync') || message.includes('viseme')) {
      return AvatarErrorType.LIPSYNC_ERROR
    }
    
    return AvatarErrorType.RENDERING_ERROR
  }

  /**
   * Delay with abort signal support
   */
  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('Aborted'))
        return
      }

      const timeoutId = setTimeout(() => {
        resolve()
      }, ms)

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeoutId)
          reject(new Error('Aborted'))
        })
      }
    })
  }
}

// Convenience functions for common avatar operations

export const avatarRetryManager = AvatarRetryManager.getInstance()

/**
 * Retry avatar model loading
 */
export const retryAvatarLoad = async (
  loadFn: () => Promise<any>,
  avatarUrl: string
): Promise<RetryResult<any>> => {
  return avatarRetryManager.executeWithRetry(
    loadFn,
    {
      maxAttempts: 3,
      baseDelay: 1000,
      retryableErrors: [
        AvatarErrorType.NETWORK_ERROR,
        AvatarErrorType.LOADING_ERROR
      ],
      onRetry: (attempt, error) => {
        logger.info(
          `Retrying avatar load for ${avatarUrl} (attempt ${attempt})`,
          'AVATAR_RETRY'
        )
      }
    },
    `avatar-load-${avatarUrl}`
  )
}

/**
 * Retry TTS operation
 */
export const retryTTSOperation = async (
  ttsFn: () => Promise<any>,
  text: string
): Promise<RetryResult<any>> => {
  return avatarRetryManager.executeWithRetry(
    ttsFn,
    {
      maxAttempts: 2,
      baseDelay: 500,
      retryableErrors: [AvatarErrorType.TTS_ERROR],
      onRetry: (attempt, error) => {
        logger.info(
          `Retrying TTS operation (attempt ${attempt})`,
          'AVATAR_RETRY'
        )
      }
    },
    `tts-${text.substring(0, 20)}`
  )
}

/**
 * Retry API call
 */
export const retryApiCall = async <T>(
  apiFn: () => Promise<T>,
  endpoint: string
): Promise<RetryResult<T>> => {
  return avatarRetryManager.executeWithRetry(
    apiFn,
    {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      retryableErrors: [AvatarErrorType.NETWORK_ERROR],
      onRetry: (attempt, error) => {
        logger.info(
          `Retrying API call to ${endpoint} (attempt ${attempt})`,
          'AVATAR_RETRY'
        )
      }
    },
    `api-${endpoint}`
  )
}

/**
 * Abort specific retry operation
 */
export const abortAvatarRetry = (operationId: string): boolean => {
  return avatarRetryManager.abortRetry(operationId)
}

/**
 * Abort all avatar retry operations
 */
export const abortAllAvatarRetries = (): number => {
  return avatarRetryManager.abortAllRetries()
}