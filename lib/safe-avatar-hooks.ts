/**
 * Safe Avatar Hooks
 * 
 * This module provides React hooks that prevent common React rendering errors
 * when working with avatar components and 3D models.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Object3D } from 'three'

/**
 * Safe callback hook that prevents state updates during render
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T>()
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...deps])

  return useCallback((...args: any[]) => {
    if (callbackRef.current) {
      // Use setTimeout to ensure we're not calling during render
      setTimeout(() => {
        callbackRef.current?.(...args)
      }, 0)
    }
  }, []) as T
}

/**
 * Safe model loading hook that prevents rendering errors
 */
export function useSafeModelLoader(
  onLoaded?: (model: Object3D) => void,
  onError?: (error: any) => void
) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [model, setModel] = useState<Object3D | null>(null)

  const safeOnLoaded = useSafeCallback(onLoaded, [onLoaded])
  const safeOnError = useSafeCallback(onError, [onError])

  const handleModelLoaded = useCallback((loadedModel: Object3D) => {
    setModel(loadedModel)
    setIsLoading(false)
    setHasError(false)
    safeOnLoaded(loadedModel)
  }, [safeOnLoaded])

  const handleModelError = useCallback((error: any) => {
    setModel(null)
    setIsLoading(false)
    setHasError(true)
    safeOnError(error)
  }, [safeOnError])

  const resetState = useCallback(() => {
    setIsLoading(true)
    setHasError(false)
    setModel(null)
  }, [])

  return {
    isLoading,
    hasError,
    model,
    handleModelLoaded,
    handleModelError,
    resetState
  }
}

/**
 * Safe URL validation hook
 */
export function useSafeUrlValidation(url: string | null | undefined) {
  const [isValid, setIsValid] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (!url || typeof url !== 'string') {
      setIsValid(false)
      setIsValidating(false)
      setValidationError('Invalid URL format')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    const validateUrl = async () => {
      try {
        // Basic URL format validation
        new URL(url)
        
        // For HTTP URLs, try a HEAD request
        if (url.startsWith('http')) {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 3000)
          
          const response = await fetch(url, {
            method: 'HEAD',
            mode: 'cors',
            cache: 'no-cache',
            signal: controller.signal
          })
          
          clearTimeout(timeoutId)
          
          if (response.ok) {
            setIsValid(true)
            setValidationError(null)
          } else {
            setIsValid(false)
            setValidationError(`HTTP ${response.status}: ${response.statusText}`)
          }
        } else {
          // For relative URLs, assume they're valid
          setIsValid(true)
          setValidationError(null)
        }
      } catch (error) {
        setIsValid(false)
        setValidationError(error instanceof Error ? error.message : 'Validation failed')
      } finally {
        setIsValidating(false)
      }
    }

    validateUrl()
  }, [url])

  return { isValid, isValidating, validationError }
}