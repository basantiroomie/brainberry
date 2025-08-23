// Production-safe logging utility to replace console.log statements

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel
  private isDevelopment = process.env.NODE_ENV === 'development'

  constructor() {
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.ERROR
  }

  private formatMessage(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString()
    const prefix = context ? `[${context}]` : ''
    return `${timestamp} [${level}] ${prefix} ${message}`
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  debug(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, context), ...args)
    }
  }

  info(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context), ...args)
    }
  }

  warn(message: string, context?: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context), ...args)
    }
  }

  error(message: string, error?: Error | unknown, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('ERROR', message, context)
      
      if (error instanceof Error) {
        console.error(formattedMessage, {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
      } else if (error) {
        console.error(formattedMessage, error)
      } else {
        console.error(formattedMessage)
      }
      
      // In production, you might want to send errors to a monitoring service
      if (!this.isDevelopment && error instanceof Error) {
        this.reportError(error, message, context)
      }
    }
  }

  // Performance logging for development
  performance(name: string, fn: () => void | Promise<void>): void | Promise<void> {
    if (!this.isDevelopment) {
      return fn()
    }

    const startMark = `${name}-start`
    const endMark = `${name}-end`
    
    if (typeof performance !== 'undefined') {
      performance.mark(startMark)
    }
    
    const result = fn()
    
    if (result instanceof Promise) {
      return result.finally(() => {
        if (typeof performance !== 'undefined') {
          performance.mark(endMark)
          performance.measure(name, startMark, endMark)
          const measure = performance.getEntriesByName(name)[0]
          this.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`, 'PERF')
        }
      })
    } else {
      if (typeof performance !== 'undefined') {
        performance.mark(endMark)
        performance.measure(name, startMark, endMark)
        const measure = performance.getEntriesByName(name)[0]
        this.debug(`Performance: ${name} took ${measure.duration.toFixed(2)}ms`, 'PERF')
      }
    }
  }

  // Cache logging for debugging
  cache(operation: 'hit' | 'miss' | 'set' | 'clear', key: string, details?: any): void {
    this.debug(`Cache ${operation}: ${key}`, 'CACHE', details)
  }

  // Image loading tracking
  image(operation: 'load' | 'cache' | 'error', url: string, details?: any): void {
    this.debug(`Image ${operation}: ${url.substring(0, 50)}...`, 'IMAGE', details)
  }

  // Game event logging
  game(event: string, gameId?: string, details?: any): void {
    const context = gameId ? `GAME:${gameId}` : 'GAME'
    this.info(event, context, details)
  }

  // API request logging
  api(method: string, endpoint: string, status: number, duration?: number): void {
    const message = `${method} ${endpoint} -> ${status}`
    const details = duration ? { duration: `${duration}ms` } : undefined
    
    if (status >= 400) {
      this.error(message, undefined, 'API')
    } else {
      this.debug(message, 'API', details)
    }
  }

  private reportError(error: Error, message: string, context?: string): void {
    // In a real application, you would send this to your error monitoring service
    // Example: Sentry, Bugsnag, LogRocket, etc.
    try {
      // Example implementation:
      // await errorReportingService.captureException(error, {
      //   message,
      //   context,
      //   timestamp: new Date().toISOString(),
      //   userAgent: navigator.userAgent,
      //   url: window.location.href
      // })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  // Set log level dynamically
  setLevel(level: LogLevel): void {
    this.level = level
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level
  }
}

// Create singleton instance
export const logger = new Logger()

// Convenience functions for common logging patterns
export const logGameEvent = (event: string, gameId?: string, details?: any) => 
  logger.game(event, gameId, details)

export const logPerformance = (name: string, fn: () => void | Promise<void>) => 
  logger.performance(name, fn)

export const logImageLoad = (url: string, cached = false) => 
  logger.image(cached ? 'cache' : 'load', url)

export const logApiCall = (method: string, endpoint: string, status: number, duration?: number) => 
  logger.api(method, endpoint, status, duration)

export const logError = (message: string, error?: Error | unknown, context?: string) => 
  logger.error(message, error, context)

// Development-only helpers
export const debugLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, 'DEBUG', ...args)
  }
}

export const devOnly = (fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    fn()
  }
}
