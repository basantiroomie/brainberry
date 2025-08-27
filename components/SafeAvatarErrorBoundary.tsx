'use client'

import React from 'react'

interface SafeAvatarErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface SafeAvatarErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class SafeAvatarErrorBoundary extends React.Component<
  SafeAvatarErrorBoundaryProps,
  SafeAvatarErrorBoundaryState
> {
  constructor(props: SafeAvatarErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SafeAvatarErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Only log meaningful errors
    if (error && (error.message || error.stack)) {
      console.error('SafeAvatarErrorBoundary caught error:', {
        error: error.message || error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    }

    this.setState({
      hasError: true,
      error,
      errorInfo
    })

    // Call the error callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">⚠️</div>
            <p className="text-sm text-gray-600">Avatar temporarily unavailable</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}