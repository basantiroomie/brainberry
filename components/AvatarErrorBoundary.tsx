'use client'

import React, { Component, ReactNode } from 'react'
import { 
  AvatarErrorType, 
  handleAvatarError, 
  shouldRetryAvatarOperation,
  incrementAvatarRetryCount,
  resetAvatarRetryCount
} from '@/lib/avatar-error-handler'
import { logger } from '@/utils/logger'

interface AvatarErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  context?: {
    avatarUrl?: string
    childId?: string
    operation?: string
  }
}

interface AvatarErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  retryCount: number
  isRetrying: boolean
}

export class AvatarErrorBoundary extends Component<
  AvatarErrorBoundaryProps,
  AvatarErrorBoundaryState
> {
  private retryTimeoutId?: NodeJS.Timeout

  constructor(props: AvatarErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      isRetrying: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<AvatarErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })

    // Determine error type based on error message and context
    const errorType = this.determineErrorType(error)
    
    // Handle the error through our error handler
    handleAvatarError(
      errorType,
      error.message,
      error,
      {
        ...this.props.context,
        operation: this.props.context?.operation || 'component-render'
      }
    )

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    logger.error(
      'Avatar component error caught by boundary',
      error,
      'AVATAR_ERROR_BOUNDARY'
    )
  }

  private determineErrorType(error: Error): AvatarErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return AvatarErrorType.NETWORK_ERROR
    }
    
    if (message.includes('webgl') || message.includes('context')) {
      return AvatarErrorType.WEBGL_ERROR
    }
    
    if (message.includes('memory') || message.includes('heap')) {
      return AvatarErrorType.MEMORY_ERROR
    }
    
    if (message.includes('load') || message.includes('gltf')) {
      return AvatarErrorType.LOADING_ERROR
    }
    
    return AvatarErrorType.RENDERING_ERROR
  }

  private handleRetry = () => {
    if (!this.props.enableRetry) return

    const errorType = this.determineErrorType(this.state.error!)
    const maxRetries = this.props.maxRetries || 3

    // Check if we should retry
    if (this.state.retryCount >= maxRetries) {
      logger.warn(
        `Max retries (${maxRetries}) exceeded for avatar error`,
        'AVATAR_ERROR_BOUNDARY'
      )
      return
    }

    // Check if error type is retryable
    if (!shouldRetryAvatarOperation(errorType, this.props.context)) {
      logger.warn(
        `Error type ${errorType} is not retryable`,
        'AVATAR_ERROR_BOUNDARY'
      )
      return
    }

    this.setState({ isRetrying: true })

    // Increment retry count
    incrementAvatarRetryCount(errorType, this.props.context)

    logger.info(
      `Retrying avatar operation (attempt ${this.state.retryCount + 1}/${maxRetries})`,
      'AVATAR_ERROR_BOUNDARY'
    )

    // Retry with exponential backoff
    const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1,
        isRetrying: false
      })
    }, retryDelay)
  }

  private handleReset = () => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRetrying: false
    })

    // Reset retry count in error handler
    if (this.state.error) {
      const errorType = this.determineErrorType(this.state.error)
      resetAvatarRetryCount(errorType, this.props.context)
    }

    logger.info('Avatar error boundary reset', 'AVATAR_ERROR_BOUNDARY')
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <div className="text-center p-6 max-w-md">
            {/* Error Icon */}
            <div className="text-red-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>

            {/* Error Message */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Avatar Loading Error
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {this.state.isRetrying
                ? 'Retrying...'
                : 'There was a problem loading the 3D avatar. This might be due to network issues or browser compatibility.'}
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left mb-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Message:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 text-gray-600">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.props.context && (
                    <div>
                      <strong>Context:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 text-gray-600">
                        {JSON.stringify(this.props.context, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {this.props.enableRetry && !this.state.isRetrying && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.retryCount >= (this.props.maxRetries || 3)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  {this.state.retryCount > 0 
                    ? `Retry (${this.state.retryCount}/${this.props.maxRetries || 3})`
                    : 'Retry'
                  }
                </button>
              )}
              
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
              >
                Reset
              </button>
            </div>

            {/* Loading State */}
            {this.state.isRetrying && (
              <div className="mt-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-600">Retrying...</span>
              </div>
            )}

            {/* Retry Count Display */}
            {this.state.retryCount > 0 && !this.state.isRetrying && (
              <p className="text-xs text-gray-500 mt-2">
                Retry attempts: {this.state.retryCount}/{this.props.maxRetries || 3}
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries for different avatar components

export const AvatarViewerErrorBoundary: React.FC<{
  children: ReactNode
  avatarUrl?: string
  childId?: string
}> = ({ children, avatarUrl, childId }) => (
  <AvatarErrorBoundary
    enableRetry={true}
    maxRetries={3}
    context={{
      avatarUrl,
      childId,
      operation: 'avatar-viewer'
    }}
    fallback={
      <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
        <div className="text-center p-4">
          <div className="text-gray-500 mb-2">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <p className="text-sm text-gray-600">Avatar unavailable</p>
          <p className="text-xs text-gray-500 mt-1">
            Using fallback display
          </p>
        </div>
      </div>
    }
  >
    {children}
  </AvatarErrorBoundary>
)

export const AvatarChatbotErrorBoundary: React.FC<{
  children: ReactNode
  avatarUrl?: string
  childId?: string
}> = ({ children, avatarUrl, childId }) => (
  <AvatarErrorBoundary
    enableRetry={true}
    maxRetries={2}
    context={{
      avatarUrl,
      childId,
      operation: 'avatar-chatbot'
    }}
    fallback={
      <div className="flex flex-col items-center justify-center w-full h-full bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-center p-6">
          <div className="text-yellow-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Chat Temporarily Unavailable
          </h3>
          <p className="text-sm text-gray-600">
            The avatar chat feature is having technical difficulties. Please try again later.
          </p>
        </div>
      </div>
    }
  >
    {children}
  </AvatarErrorBoundary>
)

export default AvatarErrorBoundary