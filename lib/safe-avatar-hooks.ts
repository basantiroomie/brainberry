/**
 * Safe Avatar Hooks
 * 
 * This module provides React hooks that prevent common React rendering errors
 * when working with avatar components and 3D models.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Object3D } from 'three'
import { validateAvatarUrl, getValidAvatarUrl } from './avatar-url-utils'

/**
 * Safe callback hook that prevents state updates during render
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T | undefined,
  deps: React.DependencyList
): T {
  const callbackRef = useRef<T | undefined>(undefined)
  
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
    const validUrl = getValidAvatarUrl(url)
    
    if (!validUrl) {
      setIsValid(false)
      setIsValidating(false)
      setValidationError('Invalid URL format')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    const performValidation = async () => {
      try {
        const validation = await validateAvatarUrl(validUrl)
        
        if (validation.isValid) {
          setIsValid(true)
          setValidationError(null)
        } else {
          setIsValid(false)
          setValidationError(validation.error || 'Validation failed')
        }
      } catch (error) {
        setIsValid(false)
        setValidationError(error instanceof Error ? error.message : 'Validation failed')
      } finally {
        setIsValidating(false)
      }
    }

    performValidation()
  }, [url])

  return { isValid, isValidating, validationError }
}